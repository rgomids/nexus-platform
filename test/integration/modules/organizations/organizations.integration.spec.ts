import { Test } from "@nestjs/testing";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Pool } from "pg";

import { AppConfigModule } from "../../../../src/bootstrap/config/app-config.module";
import { LoggingModule } from "../../../../src/bootstrap/logging/logging.module";
import { DATABASE_POOL } from "../../../../src/bootstrap/persistence/database.constants";
import { DatabaseModule } from "../../../../src/bootstrap/persistence/database.module";
import { CreateUserAccountUseCase } from "../../../../src/modules/identity/application/use-cases/create-user-account.use-case";
import { LoginWithPasswordUseCase } from "../../../../src/modules/identity/application/use-cases/login-with-password.use-case";
import { IdentityModule } from "../../../../src/modules/identity/identity.module";
import { CreateOrganizationUseCase } from "../../../../src/modules/organizations/application/use-cases/create-organization.use-case";
import { OrganizationsModule } from "../../../../src/modules/organizations/organizations.module";
import { UsersModule } from "../../../../src/modules/users/users.module";
import { SecurityModule } from "../../../../src/shared/security.module";
import { isDockerAvailable } from "../../../support/docker-availability";

const describeIfDocker = isDockerAvailable() ? describe : describe.skip;

describeIfDocker("Organizations integration", () => {
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
  });

  afterAll(async () => {
    await container.stop();
  });

  it("creates the organization and the creator membership in the same transaction", async () => {
    configureDatabaseEnvironment(container);
    const application = await createTestingApplication();
    const createUserAccount = application.get(CreateUserAccountUseCase);
    const createOrganization = application.get(CreateOrganizationUseCase);
    const pool = application.get<Pool>(DATABASE_POOL);

    const account = await createUserAccount.execute({
      email: "jane@example.com",
      fullName: "Jane Doe",
      password: "Password123",
    });

    const organization = await createOrganization.execute({
      createdByUserId: account.userId,
      name: "Acme Corp",
    });

    const organizations = await pool.query(
      "SELECT name, status FROM organizations WHERE id = $1",
      [organization.organizationId],
    );
    const memberships = await pool.query(
      "SELECT user_id, organization_id, status FROM memberships WHERE organization_id = $1",
      [organization.organizationId],
    );

    expect(organizations.rows[0]).toEqual({ name: "Acme Corp", status: "active" });
    expect(memberships.rows[0]).toEqual({
      organization_id: organization.organizationId,
      status: "active",
      user_id: account.userId,
    });
    await application.close();
  });

  it("persists organization_id in sessions after tenant-bound login", async () => {
    configureDatabaseEnvironment(container);
    const application = await createTestingApplication();
    const createUserAccount = application.get(CreateUserAccountUseCase);
    const createOrganization = application.get(CreateOrganizationUseCase);
    const loginWithPassword = application.get(LoginWithPasswordUseCase);
    const pool = application.get<Pool>(DATABASE_POOL);

    const account = await createUserAccount.execute({
      email: "john@example.com",
      fullName: "John Doe",
      password: "Password123",
    });
    const organization = await createOrganization.execute({
      createdByUserId: account.userId,
      name: "Beta Corp",
    });

    const login = await loginWithPassword.execute({
      email: "john@example.com",
      organizationId: organization.organizationId,
      password: "Password123",
    });

    const sessions = await pool.query(
      "SELECT organization_id, status FROM sessions WHERE id = $1",
      [login.sessionId],
    );

    expect(sessions.rows[0]).toEqual({
      organization_id: organization.organizationId,
      status: "active",
    });
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
