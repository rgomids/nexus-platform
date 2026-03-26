import { Test } from "@nestjs/testing";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Pool } from "pg";

import { AppConfigModule } from "../../../../src/bootstrap/config/app-config.module";
import { LoggingModule } from "../../../../src/bootstrap/logging/logging.module";
import { DATABASE_POOL } from "../../../../src/bootstrap/persistence/database.constants";
import { DatabaseModule } from "../../../../src/bootstrap/persistence/database.module";
import { CreateUserAccountUseCase } from "../../../../src/modules/identity/application/use-cases/create-user-account.use-case";
import { InvalidateSessionUseCase } from "../../../../src/modules/identity/application/use-cases/invalidate-session.use-case";
import { LoginWithPasswordUseCase } from "../../../../src/modules/identity/application/use-cases/login-with-password.use-case";
import { IdentityModule } from "../../../../src/modules/identity/identity.module";
import { UsersModule } from "../../../../src/modules/users/users.module";
import { isDockerAvailable } from "../../../support/docker-availability";

const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

describeIfDocker("Identity integration", () => {
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
  });

  afterAll(async () => {
    await container.stop();
  });

  it("persists users, accounts and credentials when creating an account", async () => {
    configureDatabaseEnvironment(container);
    const application = await createTestingApplication();
    const createUserAccount = application.get(CreateUserAccountUseCase);
    const pool = application.get<Pool>(DATABASE_POOL);

    const result = await createUserAccount.execute({
      email: "jane@example.com",
      fullName: "Jane Doe",
      password: "Password123",
    });

    const users = await pool.query("SELECT full_name, status FROM users WHERE id = $1", [result.userId]);
    const accounts = await pool.query(
      "SELECT normalized_email, status FROM accounts WHERE id = $1",
      [result.accountId],
    );
    const credentials = await pool.query(
      "SELECT password_hash FROM credentials WHERE account_id = $1",
      [result.accountId],
    );

    expect(users.rows[0]).toEqual({ full_name: "Jane Doe", status: "active" });
    expect(accounts.rows[0]).toEqual({ normalized_email: "jane@example.com", status: "active" });
    expect(credentials.rows[0].password_hash).not.toBe("Password123");
    await application.close();
  });

  it("creates and invalidates a persisted session during login/logout", async () => {
    configureDatabaseEnvironment(container);
    const application = await createTestingApplication();
    const createUserAccount = application.get(CreateUserAccountUseCase);
    const loginWithPassword = application.get(LoginWithPasswordUseCase);
    const invalidateSession = application.get(InvalidateSessionUseCase);
    const pool = application.get<Pool>(DATABASE_POOL);

    await createUserAccount.execute({
      email: "john@example.com",
      fullName: "John Doe",
      password: "Password123",
    });

    const login = await loginWithPassword.execute({
      email: "john@example.com",
      password: "Password123",
    });

    await invalidateSession.execute(login.accessToken);

    const sessions = await pool.query("SELECT status, revoked_at FROM sessions WHERE id = $1", [
      login.sessionId,
    ]);

    expect(sessions.rows[0].status).toBe("revoked");
    expect(sessions.rows[0].revoked_at).not.toBeNull();
    await application.close();
  });
});

async function createTestingApplication() {
  const moduleReference = await Test.createTestingModule({
    imports: [AppConfigModule, LoggingModule, DatabaseModule, UsersModule, IdentityModule],
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
