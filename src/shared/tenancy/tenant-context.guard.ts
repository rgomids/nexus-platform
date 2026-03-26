import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

import {
  ORGANIZATIONS_TENANCY_CONTRACT,
  type OrganizationsTenancyContract,
} from "../../modules/organizations/application/contracts/organizations-tenancy.contract";
import {
  OrganizationInactiveError,
  OrganizationNotFoundError,
} from "../../modules/organizations/domain/organization.errors";
import {
  USERS_TENANCY_CONTRACT,
  type UsersTenancyContract,
} from "../../modules/users/application/contracts/users-tenancy.contract";
import { MembershipNotFoundError } from "../../modules/users/domain/user.errors";
import type { RequestWithSecurityContext } from "../auth/request-context.types";
import {
  TenantContextDeniedError,
  TenantContextRequiredError,
} from "./tenant.errors";

@Injectable()
export class TenantContextGuard implements CanActivate {
  public constructor(
    @Inject(ORGANIZATIONS_TENANCY_CONTRACT)
    private readonly organizationsTenancyContract: OrganizationsTenancyContract,
    @Inject(USERS_TENANCY_CONTRACT)
    private readonly usersTenancyContract: UsersTenancyContract,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TenantContextGuard.name);
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSecurityContext>();
    const principal = request.authenticatedPrincipal;

    if (principal === undefined) {
      throw new TenantContextDeniedError();
    }

    if (principal.organizationId === null) {
      this.logDenied(principal.userId, null, "missing_tenant_context");
      throw new TenantContextRequiredError();
    }

    const routeOrganizationId = this.readRouteOrganizationId(request);

    if (routeOrganizationId !== principal.organizationId) {
      this.logDenied(principal.userId, principal.organizationId, "route_mismatch");
      throw new TenantContextDeniedError();
    }

    const organization = await this.organizationsTenancyContract.getOrganizationById(
      principal.organizationId,
    );

    if (organization === null) {
      this.logDenied(principal.userId, principal.organizationId, "tenant_not_found");
      throw new OrganizationNotFoundError();
    }

    if (organization.status !== "active") {
      this.logDenied(principal.userId, principal.organizationId, "tenant_inactive");
      throw new OrganizationInactiveError();
    }

    const membership = await this.usersTenancyContract.findActiveMembership(
      principal.userId,
      principal.organizationId,
    );

    if (membership === null) {
      this.logDenied(principal.userId, principal.organizationId, "membership_missing");
      throw new MembershipNotFoundError();
    }

    request.tenantContext = {
      membershipId: membership.membershipId,
      organizationId: principal.organizationId,
      userId: principal.userId,
    };

    this.logger.info(
      {
        event: "tenant_context_resolved",
        organizationId: principal.organizationId,
        userId: principal.userId,
      },
      "Tenant context resolved",
    );

    return true;
  }

  private readRouteOrganizationId(request: RequestWithSecurityContext): string {
    const organizationId = request.params.id;

    if (typeof organizationId !== "string" || organizationId.length === 0) {
      throw new TenantContextRequiredError();
    }

    return organizationId;
  }

  private logDenied(
    userId: string,
    organizationId: string | null,
    reason: string,
  ): void {
    this.logger.warn(
      {
        event: "tenant_context_denied",
        organizationId,
        reason,
        userId,
      },
      "Tenant context denied",
    );
  }
}
