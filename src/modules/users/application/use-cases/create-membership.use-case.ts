import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { Membership } from "../../domain/entities/membership.entity";
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from "../../domain/repositories/membership.repository";
import { USER_REPOSITORY, type UserRepository } from "../../domain/repositories/user.repository";
import {
  MembershipAlreadyExistsError,
  UserNotFoundError,
} from "../../domain/user.errors";
import type {
  CreateMembershipInput,
  MembershipSnapshot,
} from "../contracts/users-tenancy.contract";

@Injectable()
export class CreateMembershipUseCase {
  public constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CreateMembershipUseCase.name);
  }

  public async execute(input: CreateMembershipInput): Promise<MembershipSnapshot> {
    const user = await this.userRepository.findById(input.userId);

    if (user === null) {
      throw new UserNotFoundError();
    }

    const existingMembership = await this.membershipRepository.findActiveByUserIdAndOrganizationId(
      input.userId,
      input.organizationId,
    );

    if (existingMembership !== null) {
      throw new MembershipAlreadyExistsError();
    }

    const membership = Membership.create({
      id: randomUUID(),
      now: new Date(),
      organizationId: input.organizationId,
      userId: input.userId,
    });

    await this.membershipRepository.save(membership);
    this.logger.info(
      {
        event: "membership_created",
        membershipId: membership.id,
        organizationId: membership.organizationId,
        userId: membership.userId,
      },
      "Membership created",
    );

    return {
      membershipId: membership.id,
      organizationId: membership.organizationId,
      status: membership.status,
      userId: membership.userId,
    };
  }
}
