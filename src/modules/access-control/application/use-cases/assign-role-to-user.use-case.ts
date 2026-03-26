import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import {
  USERS_IDENTITY_CONTRACT,
  type UsersIdentityContract,
} from "../../../users/application/contracts/users-identity.contract";
import {
  USERS_TENANCY_CONTRACT,
  type UsersTenancyContract,
} from "../../../users/application/contracts/users-tenancy.contract";
import { MembershipNotFoundError, UserNotFoundError } from "../../../users/domain/user.errors";
import { RoleNotFoundError } from "../../domain/access-control.errors";
import { UserRoleAssignment } from "../../domain/entities/user-role-assignment.entity";
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from "../../domain/repositories/role.repository";
import {
  USER_ROLE_ASSIGNMENT_REPOSITORY,
  type UserRoleAssignmentRepository,
} from "../../domain/repositories/user-role-assignment.repository";
import type { UserRoleAssignmentView } from "../dto/access-control.views";

export interface AssignRoleToUserInput {
  readonly actorUserId: string;
  readonly organizationId: string;
  readonly roleId: string;
  readonly userId: string;
}

@Injectable()
export class AssignRoleToUserUseCase {
  public constructor(
    @Inject(USERS_IDENTITY_CONTRACT)
    private readonly usersIdentityContract: UsersIdentityContract,
    @Inject(USERS_TENANCY_CONTRACT)
    private readonly usersTenancyContract: UsersTenancyContract,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY)
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AssignRoleToUserUseCase.name);
  }

  public async execute(input: AssignRoleToUserInput): Promise<UserRoleAssignmentView> {
    const user = await this.usersIdentityContract.getUserById(input.userId);

    if (user === null) {
      throw new UserNotFoundError();
    }

    const membership = await this.usersTenancyContract.findActiveMembership(
      input.userId,
      input.organizationId,
    );

    if (membership === null) {
      throw new MembershipNotFoundError();
    }

    const role = await this.roleRepository.findById(input.roleId, input.organizationId);

    if (role === null) {
      throw new RoleNotFoundError();
    }

    const assignment = UserRoleAssignment.create({
      id: randomUUID(),
      now: new Date(),
      organizationId: input.organizationId,
      roleId: role.id,
      userId: input.userId,
    });

    await this.userRoleAssignmentRepository.save(assignment);
    this.logger.info(
      {
        event: "role_assigned",
        organizationId: input.organizationId,
        roleId: role.id,
        targetUserId: input.userId,
        userId: input.actorUserId,
      },
      "Role assigned to user",
    );

    return {
      createdAt: assignment.createdAt.toISOString(),
      organizationId: assignment.organizationId,
      roleId: assignment.roleId,
      updatedAt: assignment.updatedAt.toISOString(),
      userId: assignment.userId,
      userRoleAssignmentId: assignment.id,
    };
  }
}
