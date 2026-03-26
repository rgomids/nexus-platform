import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import type { RequestWithSecurityContext } from "../auth/request-context.types";
import { TenantContextDeniedError } from "./tenant.errors";
import { TenantContextResolverService } from "./tenant-context-resolver.service";

@Injectable()
export class ActiveTenantGuard implements CanActivate {
  public constructor(
    private readonly tenantContextResolverService: TenantContextResolverService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSecurityContext>();
    const principal = request.authenticatedPrincipal;

    if (principal === undefined) {
      throw new TenantContextDeniedError();
    }

    request.tenantContext = await this.tenantContextResolverService.resolve({
      organizationId: principal.organizationId,
      userId: principal.userId,
    });

    return true;
  }
}
