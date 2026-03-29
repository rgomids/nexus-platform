import { Inject, Injectable } from "@nestjs/common";

import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from "../../domain/repositories/membership.repository";
import type {
  ListMembershipsByOrganizationInput,
  MembershipSnapshot,
} from "../contracts/users-tenancy.contract";

@Injectable()
export class ListMembershipsByOrganizationUseCase {
  public constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
  ) {}

  public async execute(
    input: ListMembershipsByOrganizationInput,
  ): Promise<MembershipSnapshot[]> {
    const memberships = await this.membershipRepository.findByOrganizationId(input);

    return memberships.map((membership) => ({
      membershipId: membership.id,
      organizationId: membership.organizationId,
      status: membership.status,
      userId: membership.userId,
    }));
  }
}
