import type { PinoLogger } from "nestjs-pino";

import type { ApplicationConfigService } from "../../../../../src/bootstrap/config/application-config.service";
import { LoginWithPasswordUseCase } from "../../../../../src/modules/identity/application/use-cases/login-with-password.use-case";
import { Account } from "../../../../../src/modules/identity/domain/entities/account.entity";
import { Credential } from "../../../../../src/modules/identity/domain/entities/credential.entity";
import { InvalidCredentialsError } from "../../../../../src/modules/identity/domain/identity.errors";
import { EmailAddress } from "../../../../../src/modules/identity/domain/value-objects/email-address.value-object";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  } as unknown as PinoLogger;
}

function createConfigService(): ApplicationConfigService {
  return {
    auth: {
      jwtExpiresInMinutes: 30,
      jwtSecret: "test-secret",
    },
  } as ApplicationConfigService;
}

describe("LoginWithPasswordUseCase", () => {
  it("logs in with valid credentials", async () => {
    const account = Account.create({
      email: EmailAddress.create("jane@example.com"),
      id: "account-1",
      now: new Date("2026-03-25T12:00:00.000Z"),
      userId: "user-1",
    });

    const credential = Credential.create({
      accountId: account.id,
      now: new Date("2026-03-25T12:00:00.000Z"),
      passwordHash: "argon2-hash",
    });

    const sessionRepository = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new LoginWithPasswordUseCase(
      {
        findByEmail: jest.fn().mockResolvedValue(account),
      } as never,
      {
        findByAccountId: jest.fn().mockResolvedValue(credential),
      } as never,
      sessionRepository as never,
      {
        verify: jest.fn().mockResolvedValue(true),
      } as never,
      {
        issue: jest.fn().mockResolvedValue("jwt-token"),
      } as never,
      {
        getUserById: jest.fn().mockResolvedValue({
          fullName: "Jane Doe",
          status: "active",
          userId: "user-1",
        }),
      } as never,
      createConfigService(),
      createLoggerMock(),
    );

    const result = await useCase.execute({
      email: "jane@example.com",
      password: "Password123",
    });

    expect(sessionRepository.save).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe("jwt-token");
    expect(result.principal.email).toBe("jane@example.com");
  });

  it("fails with generic invalid credentials for a bad password", async () => {
    const account = Account.create({
      email: EmailAddress.create("jane@example.com"),
      id: "account-1",
      now: new Date(),
      userId: "user-1",
    });

    const useCase = new LoginWithPasswordUseCase(
      {
        findByEmail: jest.fn().mockResolvedValue(account),
      } as never,
      {
        findByAccountId: jest.fn().mockResolvedValue(
          Credential.create({
            accountId: account.id,
            now: new Date(),
            passwordHash: "argon2-hash",
          }),
        ),
      } as never,
      {} as never,
      {
        verify: jest.fn().mockResolvedValue(false),
      } as never,
      {} as never,
      {
        getUserById: jest.fn().mockResolvedValue({
          fullName: "Jane Doe",
          status: "active",
          userId: "user-1",
        }),
      } as never,
      createConfigService(),
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        email: "jane@example.com",
        password: "bad-password",
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("fails when the user is inactive", async () => {
    const account = Account.create({
      email: EmailAddress.create("jane@example.com"),
      id: "account-1",
      now: new Date(),
      userId: "user-1",
    });

    const useCase = new LoginWithPasswordUseCase(
      {
        findByEmail: jest.fn().mockResolvedValue(account),
      } as never,
      {
        findByAccountId: jest.fn().mockResolvedValue(
          Credential.create({
            accountId: account.id,
            now: new Date(),
            passwordHash: "argon2-hash",
          }),
        ),
      } as never,
      {} as never,
      {
        verify: jest.fn().mockResolvedValue(true),
      } as never,
      {} as never,
      {
        getUserById: jest.fn().mockResolvedValue({
          fullName: "Jane Doe",
          status: "inactive",
          userId: "user-1",
        }),
      } as never,
      createConfigService(),
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        email: "jane@example.com",
        password: "Password123",
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
