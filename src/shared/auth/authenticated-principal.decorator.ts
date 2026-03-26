import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import { InvalidAccessTokenError } from "../../modules/identity/domain/identity.errors";
import type { RequestWithSecurityContext } from "./request-context.types";

export const AuthenticatedPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithSecurityContext>();

    if (request.authenticatedPrincipal === undefined) {
      throw new InvalidAccessTokenError();
    }

    return request.authenticatedPrincipal;
  },
);
