import { InvalidEmailError } from "../identity.errors";

const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export class EmailAddress {
  public static create(value: string): EmailAddress {
    const normalized = value.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError();
    }

    return new EmailAddress(value.trim(), normalized);
  }

  private constructor(
    public readonly value: string,
    public readonly normalized: string,
  ) {}
}
