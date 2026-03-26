import type { INestApplication } from "@nestjs/common";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import request from "supertest";

import { createApplication, disposeApplication } from "../../../src/bootstrap/application.factory";
import { initializeTelemetry } from "../../../src/bootstrap/telemetry/telemetry.sdk";
import { isDockerAvailable } from "../../support/docker-availability";

const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

describeIfDocker("Access control endpoints", () => {
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

  it("manages tenant-local roles and filters role listings by active tenant", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];
    await createAccount(httpServer, "alpha-owner@example.com", "Alpha Owner");
    const alphaBootstrap = await login(httpServer, "alpha-owner@example.com", undefined);
    const alphaOrganization = await createOrganization(httpServer, alphaBootstrap.accessToken, "Alpha Org");
    const alphaTenantLogin = await login(
      httpServer,
      "alpha-owner@example.com",
      alphaOrganization.organizationId,
    );

    await createAccount(httpServer, "beta-owner@example.com", "Beta Owner");
    const betaBootstrap = await login(httpServer, "beta-owner@example.com", undefined);
    const betaOrganization = await createOrganization(httpServer, betaBootstrap.accessToken, "Beta Org");
    const betaTenantLogin = await login(
      httpServer,
      "beta-owner@example.com",
      betaOrganization.organizationId,
    );

    const permissionsResponse = await request(httpServer)
      .get("/permissions")
      .set("Authorization", `Bearer ${alphaTenantLogin.accessToken}`)
      .expect(200);

    expect(permissionsResponse.body).toHaveLength(12);
    expect(
      permissionsResponse.body.every(
        (permission: { organizationId: string }) =>
          permission.organizationId === alphaOrganization.organizationId,
      ),
    ).toBe(true);

    await request(httpServer)
      .post("/roles")
      .set("Authorization", `Bearer ${alphaTenantLogin.accessToken}`)
      .send({ name: "member_manager" })
      .expect(201);

    const alphaRolesResponse = await request(httpServer)
      .get("/roles")
      .set("Authorization", `Bearer ${alphaTenantLogin.accessToken}`)
      .expect(200);
    const betaRolesResponse = await request(httpServer)
      .get("/roles")
      .set("Authorization", `Bearer ${betaTenantLogin.accessToken}`)
      .expect(200);

    expect(alphaRolesResponse.body.map((role: { name: string }) => role.name)).toEqual([
      "member_manager",
      "organization_admin",
    ]);
    expect(betaRolesResponse.body.map((role: { name: string }) => role.name)).toEqual([
      "organization_admin",
    ]);
  });

  it("denies protected access without permission and allows after assigning a role", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];
    const owner = await createAccount(httpServer, "owner-rbac@example.com", "Owner RBAC");
    const ownerBootstrap = await login(httpServer, "owner-rbac@example.com", undefined);
    const organization = await createOrganization(httpServer, ownerBootstrap.accessToken, "RBAC Org");
    const ownerTenantLogin = await login(
      httpServer,
      "owner-rbac@example.com",
      organization.organizationId,
    );

    const member = await createAccount(httpServer, "member-rbac@example.com", "Member RBAC");

    await request(httpServer)
      .post(`/organizations/${organization.organizationId}/memberships`)
      .set("Authorization", `Bearer ${ownerTenantLogin.accessToken}`)
      .send({ userId: member.userId })
      .expect(201);

    const memberTenantLogin = await login(
      httpServer,
      "member-rbac@example.com",
      organization.organizationId,
    );

    const deniedResponse = await request(httpServer)
      .get(`/organizations/${organization.organizationId}/memberships`)
      .set("Authorization", `Bearer ${memberTenantLogin.accessToken}`)
      .expect(403);

    expect(deniedResponse.body).toEqual({
      error: "Forbidden",
      message: "Permission denied",
      statusCode: 403,
    });

    const roleResponse = await request(httpServer)
      .post("/roles")
      .set("Authorization", `Bearer ${ownerTenantLogin.accessToken}`)
      .send({ name: "membership_viewer" })
      .expect(201);

    await request(httpServer)
      .post(`/roles/${roleResponse.body.roleId}/permissions`)
      .set("Authorization", `Bearer ${ownerTenantLogin.accessToken}`)
      .send({ permissionCode: "membership:view" })
      .expect(201);

    await request(httpServer)
      .post(`/users/${member.userId}/roles`)
      .set("Authorization", `Bearer ${ownerTenantLogin.accessToken}`)
      .send({ roleId: roleResponse.body.roleId })
      .expect(201);

    const allowedResponse = await request(httpServer)
      .get(`/organizations/${organization.organizationId}/memberships`)
      .set("Authorization", `Bearer ${memberTenantLogin.accessToken}`)
      .expect(200);

    expect(allowedResponse.body).toEqual([
      expect.objectContaining({
        organizationId: organization.organizationId,
        status: "active",
        userId: owner.userId,
      }),
      expect.objectContaining({
        organizationId: organization.organizationId,
        status: "active",
        userId: member.userId,
      }),
    ]);
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
