import type { INestApplication } from "@nestjs/common";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import request from "supertest";
import type { Pool } from "pg";

import { createApplication, disposeApplication } from "../../../src/bootstrap/application.factory";
import { DATABASE_POOL } from "../../../src/bootstrap/persistence/database.constants";
import { initializeTelemetry } from "../../../src/bootstrap/telemetry/telemetry.sdk";
import { isDockerAvailable } from "../../support/docker-availability";

const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

describeIfDocker("Audit log endpoints", () => {
  let application: INestApplication;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
    process.env.APP_PORT = "3000";
    process.env.AUTH_JWT_EXPIRES_IN_MINUTES = "30";
    process.env.AUTH_JWT_SECRET = "functional-secret";
    process.env.DB_HOST = container.getHost();
    process.env.DB_NAME = container.getDatabase();
    process.env.DB_PASSWORD = container.getPassword();
    process.env.DB_PORT = container.getPort().toString();
    process.env.DB_USER = container.getUsername();
    process.env.NODE_ENV = "test";

    await initializeTelemetry();
    application = await createApplication();
    await application.init();
  });

  afterAll(async () => {
    await disposeApplication(application);
    await container.stop();
  });

  it("returns tenant-scoped audit logs to admins and denies members without audit:view", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];
    await createAccount(httpServer, "owner-audit-http@example.com", "Owner Audit");
    const ownerBootstrap = await login(httpServer, "owner-audit-http@example.com", undefined);
    const organization = await createOrganization(httpServer, ownerBootstrap.accessToken, "Audit Org");
    const ownerTenantLogin = await login(
      httpServer,
      "owner-audit-http@example.com",
      organization.organizationId,
    );

    const member = await createAccount(httpServer, "member-audit-http@example.com", "Member Audit");
    await request(httpServer)
      .post(`/organizations/${organization.organizationId}/memberships`)
      .set("Authorization", `Bearer ${ownerTenantLogin.accessToken}`)
      .send({ userId: member.userId })
      .expect(201);

    const memberTenantLogin = await login(
      httpServer,
      "member-audit-http@example.com",
      organization.organizationId,
    );

    await request(httpServer)
      .get(`/audit-logs?tenantId=${organization.organizationId}`)
      .set("Authorization", `Bearer ${memberTenantLogin.accessToken}`)
      .expect(403);

    const auditLogsResponse = await request(httpServer)
      .get(`/audit-logs?tenantId=${organization.organizationId}`)
      .set("Authorization", `Bearer ${ownerTenantLogin.accessToken}`)
      .expect(200);

    expect(auditLogsResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "membership_assigned",
          tenantId: organization.organizationId,
        }),
        expect.objectContaining({
          action: "authorization_denied",
          resource: "authorization",
          tenantId: organization.organizationId,
        }),
      ]),
    );
    expect(
      auditLogsResponse.body.every(
        (entry: { tenantId: string | null }) => entry.tenantId === organization.organizationId,
      ),
    ).toBe(true);

    await createAccount(httpServer, "other-owner-audit-http@example.com", "Other Owner");
    const otherBootstrap = await login(httpServer, "other-owner-audit-http@example.com", undefined);
    const otherOrganization = await createOrganization(
      httpServer,
      otherBootstrap.accessToken,
      "Other Audit Org",
    );

    await request(httpServer)
      .get(`/audit-logs?tenantId=${otherOrganization.organizationId}`)
      .set("Authorization", `Bearer ${ownerTenantLogin.accessToken}`)
      .expect(403);
  });

  it("persists null tenant ids for bootstrap logout and login failure without tenant context", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];
    const pool = application.get<Pool>(DATABASE_POOL);
    const account = await createAccount(
      httpServer,
      "bootstrap-audit-http@example.com",
      "Bootstrap Audit",
    );
    const bootstrapLogin = await login(httpServer, "bootstrap-audit-http@example.com", undefined);

    await request(httpServer)
      .post("/identity/logout")
      .set("Authorization", `Bearer ${bootstrapLogin.accessToken}`)
      .expect(204);

    await request(httpServer)
      .post("/identity/login")
      .send({
        email: "bootstrap-audit-http@example.com",
        password: "WrongPassword123",
      })
      .expect(401);

    const logoutRows = await pool.query<{
      action: string;
      tenant_id: string | null;
      user_id: string | null;
    }>(
      `
        SELECT action, tenant_id, user_id
        FROM audit_logs
        WHERE action = 'logout'
          AND user_id = $1
        ORDER BY timestamp DESC
        LIMIT 1
      `,
      [account.userId],
    );
    const failedLoginRows = await pool.query<{
      action: string;
      tenant_id: string | null;
      user_id: string | null;
    }>(
      `
        SELECT action, tenant_id, user_id
        FROM audit_logs
        WHERE action = 'login_failed'
          AND metadata ->> 'email' = $1
        ORDER BY timestamp DESC
        LIMIT 1
      `,
      ["bootstrap-audit-http@example.com"],
    );

    expect(logoutRows.rows[0]).toEqual({
      action: "logout",
      tenant_id: null,
      user_id: account.userId,
    });
    expect(failedLoginRows.rows[0]).toEqual({
      action: "login_failed",
      tenant_id: null,
      user_id: account.userId,
    });
  });
});

async function createAccount(
  httpServer: Parameters<typeof request>[0],
  email: string,
  fullName: string,
) {
  const response = await request(httpServer)
    .post("/identity/accounts")
    .send({
      email,
      fullName,
      password: "Password123",
    })
    .expect(201);

  return response.body as {
    readonly accountId: string;
    readonly email: string;
    readonly status: "active";
    readonly userId: string;
  };
}

async function login(
  httpServer: Parameters<typeof request>[0],
  email: string,
  organizationId: string | undefined,
) {
  const payload: Record<string, string> = {
    email,
    password: "Password123",
  };

  if (organizationId !== undefined) {
    payload.organizationId = organizationId;
  }

  const response = await request(httpServer)
    .post("/identity/login")
    .send(payload)
    .expect(200);

  return response.body as {
    readonly accessToken: string;
    readonly principal: {
      readonly organizationId: string | null;
    };
  };
}

async function createOrganization(
  httpServer: Parameters<typeof request>[0],
  accessToken: string,
  name: string,
) {
  const response = await request(httpServer)
    .post("/organizations")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ name })
    .expect(201);

  return response.body as {
    readonly organizationId: string;
  };
}
