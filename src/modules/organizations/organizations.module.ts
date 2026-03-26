import { forwardRef, Module } from "@nestjs/common";

import { IdentityModule } from "../identity/identity.module";
import { UsersModule } from "../users/users.module";
import {
  ORGANIZATIONS_TENANCY_CONTRACT,
  type OrganizationsTenancyContract,
} from "./application/contracts/organizations-tenancy.contract";
import { CreateOrganizationMembershipUseCase } from "./application/use-cases/create-organization-membership.use-case";
import { CreateOrganizationUseCase } from "./application/use-cases/create-organization.use-case";
import { DeactivateOrganizationUseCase } from "./application/use-cases/deactivate-organization.use-case";
import { GetOrganizationByIdUseCase } from "./application/use-cases/get-organization-by-id.use-case";
import { ListOrganizationMembershipsUseCase } from "./application/use-cases/list-organization-memberships.use-case";
import { OrganizationNotFoundError } from "./domain/organization.errors";
import { ORGANIZATION_REPOSITORY } from "./domain/repositories/organization.repository";
import { OrganizationsController } from "./infrastructure/http/organizations.controller";
import { PgOrganizationRepository } from "./infrastructure/persistence/pg-organization.repository";

class OrganizationsTenancyContractAdapter implements OrganizationsTenancyContract {
  public constructor(
    private readonly getOrganizationByIdUseCase: GetOrganizationByIdUseCase,
  ) {}

  public async getOrganizationById(organizationId: string) {
    try {
      return await this.getOrganizationByIdUseCase.execute(organizationId);
    } catch (error) {
      if (error instanceof OrganizationNotFoundError) {
        return null;
      }

      throw error;
    }
  }
}

@Module({
  controllers: [OrganizationsController],
  imports: [UsersModule, forwardRef(() => IdentityModule)],
  providers: [
    CreateOrganizationUseCase,
    GetOrganizationByIdUseCase,
    DeactivateOrganizationUseCase,
    CreateOrganizationMembershipUseCase,
    ListOrganizationMembershipsUseCase,
    PgOrganizationRepository,
    {
      provide: ORGANIZATION_REPOSITORY,
      useExisting: PgOrganizationRepository,
    },
    {
      provide: ORGANIZATIONS_TENANCY_CONTRACT,
      inject: [GetOrganizationByIdUseCase],
      useFactory: (
        getOrganizationByIdUseCase: GetOrganizationByIdUseCase,
      ): OrganizationsTenancyContract =>
        new OrganizationsTenancyContractAdapter(getOrganizationByIdUseCase),
    },
  ],
  exports: [ORGANIZATIONS_TENANCY_CONTRACT],
})
export class OrganizationsModule {}
