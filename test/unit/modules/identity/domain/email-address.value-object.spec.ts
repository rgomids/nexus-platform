import {
  InvalidEmailError,
} from "../../../../../src/modules/identity/domain/identity.errors";
import { EmailAddress } from "../../../../../src/modules/identity/domain/value-objects/email-address.value-object";

describe("EmailAddress", () => {
  it("normalizes a valid email", () => {
    const email = EmailAddress.create("  USER@Example.COM ");

    expect(email.value).toBe("USER@Example.COM");
    expect(email.normalized).toBe("user@example.com");
  });

  it("rejects an invalid email", () => {
    expect(() => EmailAddress.create("not-an-email")).toThrow(InvalidEmailError);
  });
});
