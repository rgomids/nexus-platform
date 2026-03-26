import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import { TenantContextRequiredError } from "./tenant.errors";
import type { RequestWithSecurityContext } from "../auth/request-context.types";

export const TenantContext = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithSecurityContext>();

  if (request.tenantContext === undefined) {
    throw new TenantContextRequiredError();
  }

  return request.tenantContext;
});
