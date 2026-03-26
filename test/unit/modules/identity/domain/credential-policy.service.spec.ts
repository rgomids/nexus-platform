import {
  WeakPasswordError,
} from "../../../../../src/modules/identity/domain/identity.errors";
import { CredentialPolicyService } from "../../../../../src/modules/identity/domain/services/credential-policy.service";

describe("CredentialPolicyService", () => {
  const service = new CredentialPolicyService();

  it("accepts a strong password", () => {
    expect(() => service.ensurePasswordIsAllowed("Password123")).not.toThrow();
  });

  it("rejects a weak password", () => {
    expect(() => service.ensurePasswordIsAllowed("password")).toThrow(WeakPasswordError);
  });
});
