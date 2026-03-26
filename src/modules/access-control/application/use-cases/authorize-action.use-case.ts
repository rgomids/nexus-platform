import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import {
  USER_ROLE_ASSIGNMENT_REPOSITORY,
  type UserRoleAssignmentRepository,
} from "../../domain/repositories/user-role-assignment.repository";

export interface AuthorizeActionInput {
  readonly organizationId: string;
  readonly permissionCode: string;
  readonly userId: string;
}

export interface AuthorizationDecision {
  readonly allowed: boolean;
}

@Injectable()
export class AuthorizeActionUseCase {
  public constructor(
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY)
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthorizeActionUseCase.name);
  }

  public async execute(input: AuthorizeActionInput): Promise<AuthorizationDecision> {
    const permissionCodes =
      await this.userRoleAssignmentRepository.listPermissionCodesByUserIdAndOrganizationId(
        input.userId,
        input.organizationId,
      );
    const allowed = permissionCodes.includes(input.permissionCode);

    this.logger.info(
      {
        event: allowed ? "authorization_allowed" : "authorization_denied",
        organizationId: input.organizationId,
        permissionCode: input.permissionCode,
        userId: input.userId,
      },
      allowed ? "Authorization allowed" : "Authorization denied",
    );

    return { allowed };
  }
}
