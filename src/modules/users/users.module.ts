import { Module } from "@nestjs/common";

import {
  USERS_IDENTITY_CONTRACT,
  type UsersIdentityContract,
} from "./application/contracts/users-identity.contract";
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case";
import { GetUserByIdUseCase } from "./application/use-cases/get-user-by-id.use-case";
import { USER_REPOSITORY } from "./domain/repositories/user.repository";
import { PgUserRepository } from "./infrastructure/persistence/pg-user.repository";

class UsersIdentityContractAdapter implements UsersIdentityContract {
  public constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  public createUser(input: Parameters<CreateUserUseCase["execute"]>[0]) {
    return this.createUserUseCase.execute(input);
  }

  public getUserById(userId: string) {
    return this.getUserByIdUseCase.execute(userId);
  }
}

@Module({
  providers: [
    CreateUserUseCase,
    GetUserByIdUseCase,
    PgUserRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: PgUserRepository,
    },
    {
      provide: USERS_IDENTITY_CONTRACT,
      inject: [CreateUserUseCase, GetUserByIdUseCase],
      useFactory: (
        createUserUseCase: CreateUserUseCase,
        getUserByIdUseCase: GetUserByIdUseCase,
      ): UsersIdentityContract =>
        new UsersIdentityContractAdapter(createUserUseCase, getUserByIdUseCase),
    },
  ],
  exports: [USERS_IDENTITY_CONTRACT],
})
export class UsersModule {}
