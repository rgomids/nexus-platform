import { Test } from "@nestjs/testing";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Pool } from "pg";

import { AppConfigModule } from "../../../../src/bootstrap/config/app-config.module";
import { LoggingModule } from "../../../../src/bootstrap/logging/logging.module";
import { DATABASE_POOL } from "../../../../src/bootstrap/persistence/database.constants";
import { DatabaseModule } from "../../../../src/bootstrap/persistence/database.module";
import { ListAuditLogsUseCase } from "../../../../src/modules/audit-logs/application/use-cases/list-audit-logs.use-case";
import { AuditLogsModule } from "../../../../src/modules/audit-logs/audit-logs.module";
import { CreateRoleUseCase } from "../../../../src/modules/access-control/application/use-cases/create-role.use-case";
import { AccessControlModule } from "../../../../src/modules/access-control/access-control.module";
import { CreateUserAccountUseCase } from "../../../../src/modules/identity/application/use-cases/create-user-account.use-case";
import { IdentityModule } from "../../../../src/modules/identity/identity.module";
import { CreateOrganizationUseCase } from "../../../../src/modules/organizations/application/use-cases/create-organization.use-case";
import { OrganizationsModule } from "../../../../src/modules/organizations/organizations.module";
import { InternalEventBus } from "../../../../src/shared/events/internal-event-bus";
import { RequestCorrelationContext } from "../../../../src/shared/request-correlation/request-correlation.context";
import { SecurityModule } from "../../../../src/shared/security.module";
import { UsersModule } from "../../../../src/modules/users/users.module";
import { isDockerAvailable } from "../../../support/docker-availability";

const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

describeIfDocker("Audit logs integration", () => {
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
  });

  afterAll(async () => {
    await container.stop();
  });

  it("persists append-only audit rows for tenant activity and rejects updates or deletes", async () => {
    configureDatabaseEnvironment(container);
    const application = await createTestingApplication();
    const createUserAccount = application.get(CreateUserAccountUseCase);
    const createOrganization = application.get(CreateOrganizationUseCase);
    const createRole = application.get(CreateRoleUseCase);
    const pool = application.get<Pool>(DATABASE_POOL);

    const owner = await createUserAccount.execute({
      email: "owner-audit@example.com",
      fullName: "Owner Audit",
      password: "Password123",
    });
    const organization = await createOrganization.execute({
      createdByUserId: owner.userId,
      name: "Audit Corp",
    });

    await createRole.execute({
      actorUserId: owner.userId,
      name: "member_manager",
      organizationId: organization.organizationId,
    });

    const auditRows = await pool.query<{
      action: string;
      id: string;
      tenant_id: string | null;
    }>(
      `
        SELECT id, action, tenant_id
        FROM audit_logs
        WHERE tenant_id = $1
        ORDER BY timestamp ASC, id ASC
      `,
      [organization.organizationId],
    );

    expect(auditRows.rows.map((row) => row.action)).toEqual(
      expect.arrayContaining([
        "organization_created",
        "membership_assigned",
        "role_created",
        "permission_granted",
        "role_assigned",
      ]),
    );

    await expect(
      pool.query(
        `
          UPDATE audit_logs
          SET action = 'logout'
          WHERE id = $1
        `,
        [auditRows.rows[0]?.id],
      ),
    ).rejects.toMatchObject({
      message: expect.stringContaining("append-only"),
    });

    await expect(
      pool.query("DELETE FROM audit_logs WHERE id = $1", [auditRows.rows[0]?.id]),
    ).rejects.toMatchObject({
      message: expect.stringContaining("append-only"),
    });

    await application.close();
  });

  it("queries audit logs by tenant and preserves the correlation id from the request context", async () => {
    configureDatabaseEnvironment(container);
    const application = await createTestingApplication();
    const createUserAccount = application.get(CreateUserAccountUseCase);
    const createOrganization = application.get(CreateOrganizationUseCase);
    const listAuditLogs = application.get(ListAuditLogsUseCase);
    const requestCorrelationContext = application.get(RequestCorrelationContext);
    const internalEventBus = application.get(InternalEventBus);
    const pool = application.get<Pool>(DATABASE_POOL);

    const alphaOwner = await createUserAccount.execute({
      email: "alpha-audit@example.com",
      fullName: "Alpha Audit",
      password: "Password123",
    });
    const betaOwner = await createUserAccount.execute({
      email: "beta-audit@example.com",
      fullName: "Beta Audit",
      password: "Password123",
    });

    const alphaOrganization = await createOrganization.execute({
      createdByUserId: alphaOwner.userId,
      name: "Alpha Audit Corp",
    });
    const betaOrganization = await createOrganization.execute({
      createdByUserId: betaOwner.userId,
      name: "Beta Audit Corp",
    });

    await requestCorrelationContext.run("request-abc-123", () =>
      internalEventBus.publish({
        method: "GET",
        occurredAt: new Date("2026-03-26T12:30:00.000Z"),
        organizationId: alphaOrganization.organizationId,
        path: "/organizations/alpha-audit/memberships",
        permissionCode: "membership:view",
        type: "authorization.denied",
        userId: alphaOwner.userId,
      }),
    );

    const firstAuditPage = await listAuditLogs.execute({
      limit: 2,
      offset: 0,
      tenantId: alphaOrganization.organizationId,
    });
    const secondAuditPage = await listAuditLogs.execute({
      limit: 2,
      offset: 2,
      tenantId: alphaOrganization.organizationId,
    });
    const deniedLogs = await listAuditLogs.execute({
      action: "authorization_denied",
      limit: 10,
      offset: 0,
      tenantId: alphaOrganization.organizationId,
    });
    const betaLogs = await listAuditLogs.execute({
      limit: 10,
      offset: 0,
      tenantId: betaOrganization.organizationId,
    });
    const indexRows = await pool.query<{ indexname: string }>(
      `
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'audit_logs'
        ORDER BY indexname ASC
      `,
    );

    expect(firstAuditPage.every((entry) => entry.tenantId === alphaOrganization.organizationId)).toBe(
      true,
    );
    expect(firstAuditPage).toHaveLength(2);
    expect(secondAuditPage).toHaveLength(2);
    expect(firstAuditPage.map((entry) => entry.id)).not.toEqual(
      secondAuditPage.map((entry) => entry.id),
    );
    expect(betaLogs.every((entry) => entry.tenantId === betaOrganization.organizationId)).toBe(
      true,
    );
    expect(deniedLogs).toEqual([
      expect.objectContaining({
        action: "authorization_denied",
        correlationId: "request-abc-123",
        tenantId: alphaOrganization.organizationId,
      }),
    ]);
    expect(indexRows.rows.map((row) => row.indexname)).toEqual(
      expect.arrayContaining([
        "idx_audit_logs_tenant_action_timestamp",
        "idx_audit_logs_tenant_timestamp_id",
        "idx_audit_logs_tenant_user_timestamp",
      ]),
    );

    await application.close();
  });
});

async function createTestingApplication() {
  const moduleReference = await Test.createTestingModule({
    imports: [
      AppConfigModule,
      LoggingModule,
      DatabaseModule,
      SecurityModule,
      UsersModule,
      AccessControlModule,
      OrganizationsModule,
      IdentityModule,
      AuditLogsModule,
    ],
  }).compile();

  await moduleReference.init();

  return moduleReference;
}

function configureDatabaseEnvironment(container: StartedPostgreSqlContainer): void {
  process.env.APP_PORT = "3000";
  process.env.AUTH_JWT_EXPIRES_IN_MINUTES = "30";
  process.env.AUTH_JWT_SECRET = "integration-secret";
  process.env.DB_HOST = container.getHost();
  process.env.DB_NAME = container.getDatabase();
  process.env.DB_PASSWORD = container.getPassword();
  process.env.DB_PORT = container.getPort().toString();
  process.env.DB_USER = container.getUsername();
  process.env.NODE_ENV = "test";
}
