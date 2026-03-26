import type { Request } from "express";

import type { AuthenticatedPrincipalDto } from "../../modules/identity/application/dto/authenticated-principal.dto";

export interface TenantContextSnapshot {
  readonly membershipId: string;
  readonly organizationId: string;
  readonly userId: string;
}

export interface RequestWithSecurityContext extends Request {
  authenticatedPrincipal?: AuthenticatedPrincipalDto;
  tenantContext?: TenantContextSnapshot;
}
