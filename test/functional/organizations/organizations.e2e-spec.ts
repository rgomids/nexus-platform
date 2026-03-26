import type { INestApplication } from "@nestjs/common";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import request from "supertest";

import { createApplication, disposeApplication } from "../../../src/bootstrap/application.factory";
import { initializeTelemetry } from "../../../src/bootstrap/telemetry/telemetry.sdk";
import { isDockerAvailable } from "../../support/docker-availability";

const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

describeIfDocker("Organizations endpoints", () => {
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

  it("supports bootstrap login, tenant-bound access and membership management", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];
    const owner = await createAccount(httpServer, "owner@example.com", "Owner User");
    const bootstrapLogin = await login(httpServer, "owner@example.com", undefined);
    const organization = await createOrganization(httpServer, bootstrapLogin.accessToken, "Acme Corp");
    const tenantLogin = await login(httpServer, "owner@example.com", organization.organizationId);

    const organizationResponse = await request(httpServer)
      .get(`/organizations/${organization.organizationId}`)
      .set("Authorization", `Bearer ${tenantLogin.accessToken}`)
      .expect(200);

    expect(organizationResponse.body).toMatchObject({
      name: "Acme Corp",
      organizationId: organization.organizationId,
      status: "active",
    });

    const member = await createAccount(httpServer, "member@example.com", "Member User");

    const membershipResponse = await request(httpServer)
      .post(`/organizations/${organization.organizationId}/memberships`)
      .set("Authorization", `Bearer ${tenantLogin.accessToken}`)
      .send({
        userId: member.userId,
      })
      .expect(201);

    expect(membershipResponse.body).toMatchObject({
      organizationId: organization.organizationId,
      status: "active",
      userId: member.userId,
    });

    const listMembershipsResponse = await request(httpServer)
      .get(`/organizations/${organization.organizationId}/memberships`)
      .set("Authorization", `Bearer ${tenantLogin.accessToken}`)
      .expect(200);

    expect(listMembershipsResponse.body).toEqual([
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

  it("rejects tenant-scoped access when the session has no tenant context", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];
    await createAccount(httpServer, "bootstrap@example.com", "Bootstrap User");
    const bootstrapLogin = await login(httpServer, "bootstrap@example.com", undefined);
    const organization = await createOrganization(
      httpServer,
      bootstrapLogin.accessToken,
      "Bootstrap Org",
    );

    const response = await request(httpServer)
      .get(`/organizations/${organization.organizationId}`)
      .set("Authorization", `Bearer ${bootstrapLogin.accessToken}`)
      .expect(403);

    expect(response.body).toEqual({
      error: "Forbidden",
      message: "Tenant context is required",
      statusCode: 403,
    });
  });

  it("rejects cross-tenant access and blocks inactive tenants on later requests", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];
    await createAccount(httpServer, "alpha@example.com", "Alpha User");
    const alphaBootstrap = await login(httpServer, "alpha@example.com", undefined);
    const alphaOrganization = await createOrganization(
      httpServer,
      alphaBootstrap.accessToken,
      "Alpha Org",
    );
    const alphaTenantLogin = await login(
      httpServer,
      "alpha@example.com",
      alphaOrganization.organizationId,
    );

    await createAccount(httpServer, "beta@example.com", "Beta User");
    const betaBootstrap = await login(httpServer, "beta@example.com", undefined);
    const betaOrganization = await createOrganization(
      httpServer,
      betaBootstrap.accessToken,
      "Beta Org",
    );
    const betaTenantLogin = await login(
      httpServer,
      "beta@example.com",
      betaOrganization.organizationId,
    );

    const crossTenantResponse = await request(httpServer)
      .get(`/organizations/${alphaOrganization.organizationId}`)
      .set("Authorization", `Bearer ${betaTenantLogin.accessToken}`)
      .expect(403);

    expect(crossTenantResponse.body).toEqual({
      error: "Forbidden",
      message: "Tenant access denied",
      statusCode: 403,
    });

    const deactivateResponse = await request(httpServer)
      .patch(`/organizations/${alphaOrganization.organizationId}/inactive`)
      .set("Authorization", `Bearer ${alphaTenantLogin.accessToken}`)
      .expect(200);

    expect(deactivateResponse.body.status).toBe("inactive");

    const inactiveResponse = await request(httpServer)
      .get(`/organizations/${alphaOrganization.organizationId}`)
      .set("Authorization", `Bearer ${alphaTenantLogin.accessToken}`)
      .expect(400);

    expect(inactiveResponse.body).toEqual({
      error: "Bad Request",
      message: "Organization is inactive",
      statusCode: 400,
    });
  });

  it("rejects tenant-bound login when the user has no active membership", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];
    await createAccount(httpServer, "org-owner@example.com", "Org Owner");
    const ownerBootstrap = await login(httpServer, "org-owner@example.com", undefined);
    const organization = await createOrganization(httpServer, ownerBootstrap.accessToken, "Gamma Org");

    await createAccount(httpServer, "outsider@example.com", "Outsider User");

    const response = await request(httpServer)
      .post("/identity/login")
      .send({
        email: "outsider@example.com",
        organizationId: organization.organizationId,
        password: "Password123",
      })
      .expect(404);

    expect(response.body).toEqual({
      error: "Not Found",
      message: "Membership not found",
      statusCode: 404,
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
