import { Inject, Injectable } from "@nestjs/common";

import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from "../../domain/repositories/membership.repository";
import type { MembershipSnapshot } from "../contracts/users-tenancy.contract";

@Injectable()
export class ListMembershipsByOrganizationUseCase {
  public constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
  ) {}

  public async execute(organizationId: string): Promise<MembershipSnapshot[]> {
    const memberships = await this.membershipRepository.findByOrganizationId(organizationId);

    return memberships.map((membership) => ({
      membershipId: membership.id,
      organizationId: membership.organizationId,
      status: membership.status,
      userId: membership.userId,
    }));
  }
}
