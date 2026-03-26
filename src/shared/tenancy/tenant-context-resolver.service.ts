import { Inject, Injectable } from "@nestjs/common";
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
import type { TenantContextSnapshot } from "../auth/request-context.types";
import {
  TenantContextDeniedError,
  TenantContextRequiredError,
} from "./tenant.errors";

export interface ResolveTenantContextInput {
  readonly organizationId: string | null;
  readonly routeOrganizationId?: string;
  readonly userId: string;
}

@Injectable()
export class TenantContextResolverService {
  public constructor(
    @Inject(ORGANIZATIONS_TENANCY_CONTRACT)
    private readonly organizationsTenancyContract: OrganizationsTenancyContract,
    @Inject(USERS_TENANCY_CONTRACT)
    private readonly usersTenancyContract: UsersTenancyContract,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TenantContextResolverService.name);
  }

  public async resolve(input: ResolveTenantContextInput): Promise<TenantContextSnapshot> {
    if (input.organizationId === null) {
      this.logDenied(input.userId, null, "missing_tenant_context");
      throw new TenantContextRequiredError();
    }

    if (
      input.routeOrganizationId !== undefined &&
      input.routeOrganizationId !== input.organizationId
    ) {
      this.logDenied(input.userId, input.organizationId, "route_mismatch");
      throw new TenantContextDeniedError();
    }

    const organization = await this.organizationsTenancyContract.getOrganizationById(
      input.organizationId,
    );

    if (organization === null) {
      this.logDenied(input.userId, input.organizationId, "tenant_not_found");
      throw new OrganizationNotFoundError();
    }

    if (organization.status !== "active") {
      this.logDenied(input.userId, input.organizationId, "tenant_inactive");
      throw new OrganizationInactiveError();
    }

    const membership = await this.usersTenancyContract.findActiveMembership(
      input.userId,
      input.organizationId,
    );

    if (membership === null) {
      this.logDenied(input.userId, input.organizationId, "membership_missing");
      throw new MembershipNotFoundError();
    }

    this.logger.info(
      {
        event: "tenant_context_resolved",
        organizationId: input.organizationId,
        userId: input.userId,
      },
      "Tenant context resolved",
    );

    return {
      membershipId: membership.membershipId,
      organizationId: input.organizationId,
      userId: input.userId,
    };
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
