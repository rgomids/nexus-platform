import { Inject, Injectable } from "@nestjs/common";

import {
  type ListMembershipsByOrganizationInput,
  USERS_TENANCY_CONTRACT,
  type MembershipSnapshot,
  type UsersTenancyContract,
} from "../../../users/application/contracts/users-tenancy.contract";
import {
  OrganizationInactiveError,
  OrganizationNotFoundError,
} from "../../domain/organization.errors";
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from "../../domain/repositories/organization.repository";

@Injectable()
export class ListOrganizationMembershipsUseCase {
  public constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    @Inject(USERS_TENANCY_CONTRACT)
    private readonly usersTenancyContract: UsersTenancyContract,
  ) {}

  public async execute(
    input: ListMembershipsByOrganizationInput,
  ): Promise<MembershipSnapshot[]> {
    const organization = await this.organizationRepository.findById(input.organizationId);

    if (organization === null) {
      throw new OrganizationNotFoundError();
    }

    if (organization.status !== "active") {
      throw new OrganizationInactiveError();
    }

    return this.usersTenancyContract.listMembershipsByOrganization(input);
  }
}
