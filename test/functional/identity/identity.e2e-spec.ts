import type { INestApplication } from "@nestjs/common";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import request from "supertest";

import { createApplication, disposeApplication } from "../../../src/bootstrap/application.factory";
import { initializeTelemetry } from "../../../src/bootstrap/telemetry/telemetry.sdk";
import { isDockerAvailable } from "../../support/docker-availability";

const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

describeIfDocker("Identity endpoints", () => {
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

  it("creates an account, logs in and invalidates the session", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];

    const createAccountResponse = await request(httpServer)
      .post("/identity/accounts")
      .send({
        email: "jane@example.com",
        fullName: "Jane Doe",
        password: "Password123",
      })
      .expect(201);

    expect(createAccountResponse.body).toMatchObject({
      email: "jane@example.com",
      status: "active",
    });

    const loginResponse = await request(httpServer)
      .post("/identity/login")
      .send({
        email: "jane@example.com",
        password: "Password123",
      })
      .expect(200);

    expect(loginResponse.body).toMatchObject({
      tokenType: "Bearer",
      principal: {
        email: "jane@example.com",
      },
    });

    await request(httpServer)
      .post("/identity/logout")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .expect(204);

    await request(httpServer)
      .post("/identity/logout")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .expect(401);
  });

  it("fails with a generic invalid-credentials response", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .post("/identity/login")
      .send({
        email: "missing@example.com",
        password: "Password123",
      })
      .expect(401);

    expect(response.body).toEqual({
      error: "Unauthorized",
      message: "Invalid credentials",
      statusCode: 401,
    });
  });
});
