import { Injectable } from "@nestjs/common";

import { WeakPasswordError } from "../identity.errors";

@Injectable()
export class CredentialPolicyService {
  public ensurePasswordIsAllowed(password: string): void {
    if (password.length < 8 || password.length > 128) {
      throw new WeakPasswordError();
    }

    if (!/[a-z]/i.test(password) || !/[0-9]/.test(password)) {
      throw new WeakPasswordError();
    }
  }
}
