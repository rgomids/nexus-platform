import { AuthorizationError } from "../domain/nexus.errors";

export class TenantContextRequiredError extends AuthorizationError {
  public constructor() {
    super(
      "Tenant context is required",
      "tenant_context_required",
      "Tenant context is required",
    );
  }
}

export class TenantContextDeniedError extends AuthorizationError {
  public constructor() {
    super(
      "Tenant context does not match the request",
      "tenant_context_denied",
      "Tenant access denied",
    );
  }
}
