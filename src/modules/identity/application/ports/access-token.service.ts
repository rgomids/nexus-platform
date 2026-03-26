export const ACCESS_TOKEN_SERVICE = Symbol("ACCESS_TOKEN_SERVICE");

export interface AccessTokenPayload {
  readonly aid: string;
  readonly jti: string;
  readonly sid: string;
  readonly sub: string;
}

export interface AccessTokenService {
  issue(payload: AccessTokenPayload, expiresAt: Date): Promise<string>;
  verify(token: string): Promise<AccessTokenPayload>;
}
