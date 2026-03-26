import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";

import type { PasswordHasher } from "../../application/ports/password-hasher.port";

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  public hash(password: string): Promise<string> {
    return argon2.hash(password, {
      memoryCost: 19_456,
      parallelism: 1,
      timeCost: 2,
      type: argon2.argon2id,
    });
  }

  public verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
