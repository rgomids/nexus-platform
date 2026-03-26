import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AuthorizeActionUseCase } from "../../modules/access-control/application/use-cases/authorize-action.use-case";
import { PermissionDeniedError } from "../../modules/access-control/domain/access-control.errors";
import { InvalidAccessTokenError } from "../../modules/identity/domain/identity.errors";
import type { RequestWithSecurityContext } from "./request-context.types";
import { REQUIRED_PERMISSION_METADATA_KEY } from "./require-permission.decorator";
import { TenantContextRequiredError } from "../tenancy/tenant.errors";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly authorizeActionUseCase: AuthorizeActionUseCase,
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
      throw new PermissionDeniedError();
    }

    return true;
  }
}
