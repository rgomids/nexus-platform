import { Module } from "@nestjs/common";

import { SharedEventsModule } from "../../shared/events/shared-events.module";
import {
  USERS_IDENTITY_CONTRACT,
  type UsersIdentityContract,
} from "./application/contracts/users-identity.contract";
import {
  USERS_TENANCY_CONTRACT,
  type UsersTenancyContract,
} from "./application/contracts/users-tenancy.contract";
import { CountActiveMembershipsUseCase } from "./application/use-cases/count-active-memberships.use-case";
import { CreateMembershipUseCase } from "./application/use-cases/create-membership.use-case";
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case";
import { FindActiveMembershipUseCase } from "./application/use-cases/find-active-membership.use-case";
import { GetUserByIdUseCase } from "./application/use-cases/get-user-by-id.use-case";
import { ListMembershipsByOrganizationUseCase } from "./application/use-cases/list-memberships-by-organization.use-case";
import { MEMBERSHIP_REPOSITORY } from "./domain/repositories/membership.repository";
import { USER_REPOSITORY } from "./domain/repositories/user.repository";
import { PgMembershipRepository } from "./infrastructure/persistence/pg-membership.repository";
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

class UsersTenancyContractAdapter implements UsersTenancyContract {
  public constructor(
    private readonly countActiveMembershipsUseCase: CountActiveMembershipsUseCase,
    private readonly createMembershipUseCase: CreateMembershipUseCase,
    private readonly findActiveMembershipUseCase: FindActiveMembershipUseCase,
    private readonly listMembershipsByOrganizationUseCase: ListMembershipsByOrganizationUseCase,
  ) {}

  public countActiveMemberships(userId: string) {
    return this.countActiveMembershipsUseCase.execute(userId);
  }

  public createMembership(input: Parameters<CreateMembershipUseCase["execute"]>[0]) {
    return this.createMembershipUseCase.execute(input);
  }

  public findActiveMembership(userId: string, organizationId: string) {
    return this.findActiveMembershipUseCase.execute(userId, organizationId);
  }

  public listMembershipsByOrganization(
    input: Parameters<ListMembershipsByOrganizationUseCase["execute"]>[0],
  ) {
    return this.listMembershipsByOrganizationUseCase.execute(input);
  }
}

@Module({
  imports: [SharedEventsModule],
  providers: [
    CreateUserUseCase,
    GetUserByIdUseCase,
    CreateMembershipUseCase,
    CountActiveMembershipsUseCase,
    FindActiveMembershipUseCase,
    ListMembershipsByOrganizationUseCase,
    PgUserRepository,
    PgMembershipRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: PgUserRepository,
    },
    {
      provide: MEMBERSHIP_REPOSITORY,
      useExisting: PgMembershipRepository,
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
    {
      provide: USERS_TENANCY_CONTRACT,
      inject: [
        CountActiveMembershipsUseCase,
        CreateMembershipUseCase,
        FindActiveMembershipUseCase,
        ListMembershipsByOrganizationUseCase,
      ],
      useFactory: (
        countActiveMembershipsUseCase: CountActiveMembershipsUseCase,
        createMembershipUseCase: CreateMembershipUseCase,
        findActiveMembershipUseCase: FindActiveMembershipUseCase,
        listMembershipsByOrganizationUseCase: ListMembershipsByOrganizationUseCase,
      ): UsersTenancyContract =>
        new UsersTenancyContractAdapter(
          countActiveMembershipsUseCase,
          createMembershipUseCase,
          findActiveMembershipUseCase,
          listMembershipsByOrganizationUseCase,
        ),
    },
  ],
  exports: [USERS_IDENTITY_CONTRACT, USERS_TENANCY_CONTRACT],
})
export class UsersModule {}
