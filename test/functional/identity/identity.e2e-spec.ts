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
    expect(typeof createAccountResponse.headers["x-correlation-id"]).toBe("string");

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
    expect(loginResponse.headers["x-correlation-id"]).toBeDefined();

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

    expectCorrelatedErrorResponse(response, {
      error: "invalid_credentials",
      message: "Invalid credentials",
    });
  });

  it("fails fast on invalid input with a standardized validation payload", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .post("/identity/login")
      .send({
        email: "jane@example.com",
        password: "short",
      })
      .expect(400);

    expectCorrelatedErrorResponse(response, {
      error: "invalid_request",
      message: "password must be longer than or equal to 8 characters",
    });
  });
});

function expectCorrelatedErrorResponse(
  response: { body: unknown; headers: Record<string, unknown> },
  expected: { readonly error: string; readonly message: string },
): void {
  expect(response.body).toEqual({
    correlation_id: expect.any(String),
    error: expected.error,
    message: expected.message,
  });
  expect(response.headers["x-correlation-id"]).toBe(
    (response.body as { correlation_id: string }).correlation_id,
  );
}
