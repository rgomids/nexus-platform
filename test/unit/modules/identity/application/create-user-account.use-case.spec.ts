import type { PinoLogger } from "nestjs-pino";

import type { DatabaseExecutor } from "../../../../../src/bootstrap/persistence/database.executor";
import { CreateUserAccountUseCase } from "../../../../../src/modules/identity/application/use-cases/create-user-account.use-case";
import { Account } from "../../../../../src/modules/identity/domain/entities/account.entity";
import { Credential } from "../../../../../src/modules/identity/domain/entities/credential.entity";
import {
  DuplicateAccountEmailError,
} from "../../../../../src/modules/identity/domain/identity.errors";
import { CredentialPolicyService } from "../../../../../src/modules/identity/domain/services/credential-policy.service";
import { EmailAddress } from "../../../../../src/modules/identity/domain/value-objects/email-address.value-object";

function createLoggerMock(): PinoLogger {
  return {
    info: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  } as unknown as PinoLogger;
}

describe("CreateUserAccountUseCase", () => {
  it("creates a user, account and credential", async () => {
    const accountRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const credentialRepository = {
      findByAccountId: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const passwordHasher = {
      hash: jest.fn().mockResolvedValue("argon2-hash"),
      verify: jest.fn(),
    };
    const usersIdentityContract = {
      createUser: jest.fn().mockResolvedValue({
        fullName: "Jane Doe",
        status: "active",
        userId: "ignored",
      }),
      getUserById: jest.fn().mockResolvedValue(null),
    };
    const databaseExecutor = {
      withTransaction: jest.fn(async (callback: () => Promise<void>) => callback()),
    } as unknown as DatabaseExecutor;

    const useCase = new CreateUserAccountUseCase(
      accountRepository,
      credentialRepository,
      passwordHasher,
      usersIdentityContract,
      new CredentialPolicyService(),
      databaseExecutor,
      createLoggerMock(),
    );

    const result = await useCase.execute({
      email: "jane@example.com",
      fullName: "Jane Doe",
      password: "Password123",
    });

    expect(usersIdentityContract.createUser).toHaveBeenCalledTimes(1);
    expect(accountRepository.save).toHaveBeenCalledWith(expect.any(Account));
    expect(credentialRepository.save).toHaveBeenCalledWith(expect.any(Credential));
    expect(result.email).toBe("jane@example.com");
    expect(result.status).toBe("active");
  });

  it("fails when the email already exists", async () => {
    const accountRepository = {
      findByEmail: jest.fn().mockResolvedValue(
        Account.create({
          email: EmailAddress.create("jane@example.com"),
          id: "account-1",
          now: new Date(),
          userId: "user-1",
        }),
      ),
      findById: jest.fn().mockResolvedValue(null),
    };

    const useCase = new CreateUserAccountUseCase(
      accountRepository as never,
      {} as never,
      {} as never,
      {} as never,
      new CredentialPolicyService(),
      {
        withTransaction: jest.fn(),
      } as unknown as DatabaseExecutor,
      createLoggerMock(),
    );

    await expect(
      useCase.execute({
        email: "jane@example.com",
        fullName: "Jane Doe",
        password: "Password123",
      }),
    ).rejects.toThrow(DuplicateAccountEmailError);
  });
});
