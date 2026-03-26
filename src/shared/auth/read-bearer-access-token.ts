import { InvalidAccessTokenError } from "../../modules/identity/domain/identity.errors";

export function readBearerAccessToken(authorization?: string): string {
  if (authorization === undefined) {
    throw new InvalidAccessTokenError();
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || token === undefined || token.length === 0) {
    throw new InvalidAccessTokenError();
  }

  return token;
}
