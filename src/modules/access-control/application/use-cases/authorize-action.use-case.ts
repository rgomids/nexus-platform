import { Inject, Injectable, Optional } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import { ApplicationMetricsService } from "../../../../bootstrap/telemetry/application-metrics.service";
import { ApplicationTelemetryService } from "../../../../bootstrap/telemetry/application-telemetry.service";
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
    @Optional()
    private readonly applicationTelemetryService?: ApplicationTelemetryService,
    @Optional()
    private readonly applicationMetricsService?: ApplicationMetricsService,
  ) {
    this.logger.setContext(AuthorizeActionUseCase.name);
  }

  public async execute(input: AuthorizeActionInput): Promise<AuthorizationDecision> {
    const executeOperation = async (): Promise<AuthorizationDecision> => {
      const permissionCodes =
        await this.userRoleAssignmentRepository.listPermissionCodesByUserIdAndOrganizationId(
          input.userId,
          input.organizationId,
        );
      const allowed = permissionCodes.includes(input.permissionCode);

      this.applicationMetricsService?.recordAuthorizationDecision(allowed ? "allow" : "deny");
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
    };

    if (this.applicationTelemetryService === undefined) {
      return executeOperation();
    }

    return this.applicationTelemetryService.runInSpan(
      "access_control.authorize_action",
      {
        "authorization.permission_code": input.permissionCode,
        "tenant.id": input.organizationId,
        "user.id": input.userId,
      },
      executeOperation,
    );
  }
}
