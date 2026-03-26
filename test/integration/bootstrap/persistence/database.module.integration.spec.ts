import { Test } from "@nestjs/testing";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Pool } from "pg";

import { AppConfigModule } from "../../../../src/bootstrap/config/app-config.module";
import { LoggingModule } from "../../../../src/bootstrap/logging/logging.module";
import { DATABASE_POOL } from "../../../../src/bootstrap/persistence/database.constants";
import { DatabaseModule } from "../../../../src/bootstrap/persistence/database.module";
import { isDockerAvailable } from "../../../support/docker-availability";

const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

describeIfDocker("DatabaseModule integration", () => {
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
  });

  afterAll(async () => {
    await container.stop();
  });

  it("connects to PostgreSQL and validates the connection", async () => {
    configureDatabaseEnvironment(container);
    const application = await createTestingApplication();
    const pool = application.get<Pool>(DATABASE_POOL);

    const result = await pool.query<{ value: number }>("SELECT 1 AS value");

    expect(result.rows[0]).toEqual({ value: 1 });
    await application.close();
  });

  it("closes the pool during shutdown", async () => {
    configureDatabaseEnvironment(container);
    const application = await createTestingApplication();
    const pool = application.get<Pool>(DATABASE_POOL);

    await application.close();

    await expect(pool.query("SELECT 1")).rejects.toThrow();
  });
});

async function createTestingApplication() {
  const moduleReference = await Test.createTestingModule({
    imports: [AppConfigModule, LoggingModule, DatabaseModule],
  }).compile();

  await moduleReference.init();

  return moduleReference;
}

function configureDatabaseEnvironment(container: StartedPostgreSqlContainer): void {
  process.env.APP_PORT = "3000";
  process.env.DB_HOST = container.getHost();
  process.env.DB_NAME = container.getDatabase();
  process.env.DB_PASSWORD = container.getPassword();
  process.env.DB_PORT = container.getPort().toString();
  process.env.DB_USER = container.getUsername();
  process.env.NODE_ENV = "test";
}
