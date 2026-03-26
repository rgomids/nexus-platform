import { Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";

import { ApplicationConfigService } from "../../../../bootstrap/config/application-config.service";
import { InvalidAccessTokenError } from "../../domain/identity.errors";
import type {
  AccessTokenPayload,
  AccessTokenService,
} from "../../application/ports/access-token.service";

@Injectable()
export class JwtAccessTokenService implements AccessTokenService {
  public constructor(private readonly configuration: ApplicationConfigService) {}

  public async issue(payload: AccessTokenPayload, expiresAt: Date): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      jwt.sign(
        payload,
        this.configuration.auth.jwtSecret,
        {
          algorithm: "HS256",
          expiresIn: Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
        },
        (error, token) => {
          if (error !== null || token === undefined) {
            reject(error ?? new Error("Failed to sign access token"));
            return;
          }

          resolve(token);
        },
      );
    });
  }

  public async verify(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = await new Promise<jwt.JwtPayload | string>((resolve, reject) => {
        jwt.verify(token, this.configuration.auth.jwtSecret, { algorithms: ["HS256"] }, (error, decoded) => {
          if (error !== null || decoded === undefined) {
            reject(error ?? new Error("Failed to verify access token"));
            return;
          }

          resolve(decoded);
        });
      });

      if (typeof payload === "string") {
        throw new InvalidAccessTokenError();
      }

      if (
        typeof payload.sub !== "string" ||
        typeof payload.sid !== "string" ||
        typeof payload.aid !== "string" ||
        typeof payload.jti !== "string"
      ) {
        throw new InvalidAccessTokenError();
      }

      return {
        aid: payload.aid,
        jti: payload.jti,
        sid: payload.sid,
        sub: payload.sub,
      };
    } catch {
      throw new InvalidAccessTokenError();
    }
  }
}
