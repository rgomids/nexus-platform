import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Test } from "@nestjs/testing";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PinoLogger } from "nestjs-pino";
import type { Pool } from "pg";

import { AppConfigModule } from "../../../../src/bootstrap/config/app-config.module";
import { loadAppConfig } from "../../../../src/bootstrap/config/app-config";
import { LoggingModule } from "../../../../src/bootstrap/logging/logging.module";
import { DATABASE_POOL } from "../../../../src/bootstrap/persistence/database.constants";
import { DatabaseMigrationService } from "../../../../src/bootstrap/persistence/migration.service";
import { createDatabasePool } from "../../../../src/bootstrap/persistence/database.providers";
import { DatabaseModule } from "../../../../src/bootstrap/persistence/database.module";
import { CreateRoleUseCase } from "../../../../src/modules/access-control/application/use-cases/create-role.use-case";
import { ListPermissionsUseCase } from "../../../../src/modules/access-control/application/use-cases/list-permissions.use-case";
import { ListRolesUseCase } from "../../../../src/modules/access-control/application/use-cases/list-roles.use-case";
import { AccessControlModule } from "../../../../src/modules/access-control/access-control.module";
import { CreateUserAccountUseCase } from "../../../../src/modules/identity/application/use-cases/create-user-account.use-case";
import { IdentityModule } from "../../../../src/modules/identity/identity.module";
import { CreateOrganizationUseCase } from "../../../../src/modules/organizations/application/use-cases/create-organization.use-case";
import { OrganizationsModule } from "../../../../src/modules/organizations/organizations.module";
import { UsersModule } from "../../../../src/modules/users/users.module";
import { SecurityModule } from "../../../../src/shared/security.module";
import { isDockerAvailable } from "../../../support/docker-availability";

const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

jest.setTimeout(120000);

describeIfDocker("Access control integration", () => {
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
  }, 120000);

  afterAll(async () => {
    if (container !== undefined) {
      await container.stop();
    }
  }, 120000);

  it("backfills organization_admin and tenant-local permissions for existing memberships", async () => {
    configureDatabaseEnvironment(container);
    const pool = createDatabasePool(loadAppConfig());

    await applyMigration(pool, "0001_core_identity.sql");
    await applyMigration(pool, "0002_multi_tenancy.sql");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL
      )
    `);
    await pool.query(
      `
        INSERT INTO schema_migrations (version, applied_at)
        VALUES ('0001_core_identity.sql', NOW()), ('0002_multi_tenancy.sql', NOW())
      `,
    );
    await pool.query(
      `
        INSERT INTO users (id, full_name, status, created_at, updated_at)
        VALUES ($1, $2, 'active', NOW(), NOW())
      `,
      ["11111111-1111-4111-8111-111111111111", "Jane Doe"],
    );
    await pool.query(
      `
        INSERT INTO organizations (id, name, status, created_at, updated_at)
        VALUES ($1, $2, 'active', NOW(), NOW())
      `,
      ["22222222-2222-4222-8222-222222222222", "Acme Corp"],
    );
    await pool.query(
      `
        INSERT INTO memberships (id, organization_id, user_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'active', NOW(), NOW())
      `,
      [
        "33333333-3333-4333-8333-333333333333",
        "22222222-2222-4222-8222-222222222222",
        "11111111-1111-4111-8111-111111111111",
      ],
    );

    const migrationService = new DatabaseMigrationService(pool, createLogger());

    await migrationService.runPendingMigrations();

    const roles = await pool.query(
      "SELECT name FROM roles WHERE organization_id = $1 ORDER BY name ASC",
      ["22222222-2222-4222-8222-222222222222"],
    );
    const permissions = await pool.query(
      "SELECT code FROM permissions WHERE organization_id = $1 ORDER BY code ASC",
      ["22222222-2222-4222-8222-222222222222"],
    );
    const assignments = await pool.query(
      `
        SELECT user_id
        FROM user_role_assignments
        WHERE organization_id = $1
      `,
      ["22222222-2222-4222-8222-222222222222"],
    );

    expect(roles.rows).toEqual([{ name: "organization_admin" }]);
    expect(permissions.rows).toHaveLength(12);
    expect(assignments.rows).toEqual([
      { user_id: "11111111-1111-4111-8111-111111111111" },
    ]);
    await pool.end();
  });

  it("bootstraps tenant access control on organization creation and scopes reads by tenant", async () => {
    configureDatabaseEnvironment(container);
    const application = await createTestingApplication();
    const createUserAccount = application.get(CreateUserAccountUseCase);
    const createOrganization = application.get(CreateOrganizationUseCase);
    const createRole = application.get(CreateRoleUseCase);
    const listRoles = application.get(ListRolesUseCase);
    const listPermissions = application.get(ListPermissionsUseCase);
    const pool = application.get<Pool>(DATABASE_POOL);

    const alphaOwner = await createUserAccount.execute({
      email: "alpha@example.com",
      fullName: "Alpha Owner",
      password: "Password123",
    });
    const betaOwner = await createUserAccount.execute({
      email: "beta@example.com",
      fullName: "Beta Owner",
      password: "Password123",
    });

    const alphaOrganization = await createOrganization.execute({
      createdByUserId: alphaOwner.userId,
      name: "Alpha Corp",
    });
    const betaOrganization = await createOrganization.execute({
      createdByUserId: betaOwner.userId,
      name: "Beta Corp",
    });

    await createRole.execute({
      actorUserId: alphaOwner.userId,
      name: "member_manager",
      organizationId: alphaOrganization.organizationId,
    });

    const alphaRoles = await listRoles.execute(alphaOrganization.organizationId);
    const betaRoles = await listRoles.execute(betaOrganization.organizationId);
    const alphaPermissions = await listPermissions.execute(alphaOrganization.organizationId);
    const assignmentRows = await pool.query(
      `
        SELECT user_id
        FROM user_role_assignments
        WHERE organization_id = $1
        ORDER BY user_id ASC
      `,
      [alphaOrganization.organizationId],
    );

    expect(alphaRoles.map((role) => role.name)).toEqual([
      "member_manager",
      "organization_admin",
    ]);
    expect(betaRoles.map((role) => role.name)).toEqual(["organization_admin"]);
    expect(alphaPermissions).toHaveLength(12);
    expect(assignmentRows.rows).toEqual([{ user_id: alphaOwner.userId }]);
    await application.close();
  });
});

async function applyMigration(pool: Pool, fileName: string): Promise<void> {
  const statement = await readFile(join(process.cwd(), "migrations", fileName), "utf8");

  await pool.query(statement);
}

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

function createLogger(): PinoLogger {
  return new PinoLogger({
    pinoHttp: {
      base: null,
      enabled: true,
      level: "info",
      messageKey: "message",
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    },
  });
}
