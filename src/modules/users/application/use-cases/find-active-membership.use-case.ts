import { Inject, Injectable } from "@nestjs/common";

import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from "../../domain/repositories/membership.repository";
import type { MembershipSnapshot } from "../contracts/users-tenancy.contract";

@Injectable()
export class FindActiveMembershipUseCase {
  public constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
  ) {}

  public async execute(
    userId: string,
    organizationId: string,
  ): Promise<MembershipSnapshot | null> {
    const membership = await this.membershipRepository.findActiveByUserIdAndOrganizationId(
      userId,
      organizationId,
    );

    if (membership === null) {
      return null;
    }

    return {
      membershipId: membership.id,
      organizationId: membership.organizationId,
      status: membership.status,
      userId: membership.userId,
    };
  }
}
