import { Inject, Injectable } from "@nestjs/common";

import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from "../../domain/repositories/membership.repository";

@Injectable()
export class CountActiveMembershipsUseCase {
  public constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
  ) {}

  public execute(userId: string): Promise<number> {
    return this.membershipRepository.countActiveByUserId(userId);
  }
}
