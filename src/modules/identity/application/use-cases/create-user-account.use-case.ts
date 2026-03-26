import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import {
  USERS_IDENTITY_CONTRACT,
  type UsersIdentityContract,
} from "../../../users/application/contracts/users-identity.contract";
import { Account } from "../../domain/entities/account.entity";
import { Credential } from "../../domain/entities/credential.entity";
import { DuplicateAccountEmailError } from "../../domain/identity.errors";
import { ACCOUNT_REPOSITORY, type AccountRepository } from "../../domain/repositories/account.repository";
import {
  CREDENTIAL_REPOSITORY,
  type CredentialRepository,
} from "../../domain/repositories/credential.repository";
import { CredentialPolicyService } from "../../domain/services/credential-policy.service";
import { EmailAddress } from "../../domain/value-objects/email-address.value-object";
import { PASSWORD_HASHER, type PasswordHasher } from "../ports/password-hasher.port";

export interface CreateUserAccountInput {
  readonly email: string;
  readonly fullName: string;
  readonly password: string;
}

export interface CreateUserAccountResult {
  readonly accountId: string;
  readonly email: string;
  readonly status: "active";
  readonly userId: string;
}

@Injectable()
export class CreateUserAccountUseCase {
  public constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: AccountRepository,
    @Inject(CREDENTIAL_REPOSITORY) private readonly credentialRepository: CredentialRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(USERS_IDENTITY_CONTRACT)
    private readonly usersIdentityContract: UsersIdentityContract,
    private readonly credentialPolicy: CredentialPolicyService,
    private readonly databaseExecutor: DatabaseExecutor,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CreateUserAccountUseCase.name);
  }

  public async execute(input: CreateUserAccountInput): Promise<CreateUserAccountResult> {
    const email = EmailAddress.create(input.email);

    this.credentialPolicy.ensurePasswordIsAllowed(input.password);

    const existingAccount = await this.accountRepository.findByEmail(email);

    if (existingAccount !== null) {
      throw new DuplicateAccountEmailError();
    }

    const userId = randomUUID();
    const accountId = randomUUID();
    const now = new Date();

    await this.databaseExecutor.withTransaction(async () => {
      await this.usersIdentityContract.createUser({
        fullName: input.fullName,
        userId,
      });

      const account = Account.create({
        email,
        id: accountId,
        now,
        userId,
      });

      const passwordHash = await this.passwordHasher.hash(input.password);
      const credential = Credential.create({
        accountId,
        now,
        passwordHash,
      });

      await this.accountRepository.save(account);
      await this.credentialRepository.save(credential);
    });

    this.logger.info(
      {
        accountId,
        event: "account_created",
        userId,
      },
      "Identity account created",
    );

    return {
      accountId,
      email: email.normalized,
      status: "active",
      userId,
    };
  }
}
