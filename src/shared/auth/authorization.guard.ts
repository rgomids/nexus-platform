import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PinoLogger } from "nestjs-pino";

import { AuthorizeActionUseCase } from "../../modules/access-control/application/use-cases/authorize-action.use-case";
import { PermissionDeniedError } from "../../modules/access-control/domain/access-control.errors";
import { InvalidAccessTokenError } from "../../modules/identity/domain/identity.errors";
import { InternalEventBus } from "../events/internal-event-bus";
import type { RequestWithSecurityContext } from "./request-context.types";
import { REQUIRED_PERMISSION_METADATA_KEY } from "./require-permission.decorator";
import { TenantContextRequiredError } from "../tenancy/tenant.errors";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly authorizeActionUseCase: AuthorizeActionUseCase,
    private readonly internalEventBus: InternalEventBus,
    private readonly logger: PinoLogger,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionCode = this.reflector.getAllAndOverride<string>(
      REQUIRED_PERMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (permissionCode === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithSecurityContext>();
    const principal = request.authenticatedPrincipal;
    const tenantContext = request.tenantContext;

    if (principal === undefined) {
      throw new InvalidAccessTokenError();
    }

    if (tenantContext === undefined) {
      throw new TenantContextRequiredError();
    }

    const decision = await this.authorizeActionUseCase.execute({
      organizationId: tenantContext.organizationId,
      permissionCode,
      userId: principal.userId,
    });

    if (!decision.allowed) {
      try {
        await this.internalEventBus.publish({
          method: request.method,
          occurredAt: new Date(),
          organizationId: tenantContext.organizationId,
          path: request.originalUrl ?? request.url,
          permissionCode,
          type: "authorization.denied",
          userId: principal.userId,
        });
      } catch (auditError) {
        this.logger.error(
          {
            err: auditError,
            event: "error",
            failedAuditEvent: "authorization_denied",
            organizationId: tenantContext.organizationId,
            permissionCode,
            userId: principal.userId,
          },
          "Failed to append audit log for authorization denial",
        );
      }

      throw new PermissionDeniedError();
    }

    return true;
  }
}
