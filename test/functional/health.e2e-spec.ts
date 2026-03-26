import type { INestApplication } from "@nestjs/common";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import request from "supertest";

import { createApplication, disposeApplication } from "../../src/bootstrap/application.factory";
import { initializeTelemetry } from "../../src/bootstrap/telemetry/telemetry.sdk";
import { isDockerAvailable } from "../support/docker-availability";

const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

describeIfDocker("Health endpoint", () => {
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

  it("responds with the health payload", async () => {
    const httpServer = application.getHttpServer() as Parameters<typeof request>[0];

    await request(httpServer)
      .get("/health")
      .expect(200)
      .expect({ status: "ok" });
  });
});
