import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import { ResolveAuthenticatedPrincipalUseCase } from "../../modules/identity/application/use-cases/resolve-authenticated-principal.use-case";
import { readBearerAccessToken } from "./read-bearer-access-token";
import type { RequestWithSecurityContext } from "./request-context.types";

@Injectable()
export class AuthenticatedRequestGuard implements CanActivate {
  public constructor(
    private readonly resolveAuthenticatedPrincipalUseCase: ResolveAuthenticatedPrincipalUseCase,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSecurityContext>();
    const authorization = request.headers.authorization;
    const accessToken = readBearerAccessToken(
      typeof authorization === "string" ? authorization : undefined,
    );

    request.authenticatedPrincipal =
      await this.resolveAuthenticatedPrincipalUseCase.execute(accessToken);

    return true;
  }
}
