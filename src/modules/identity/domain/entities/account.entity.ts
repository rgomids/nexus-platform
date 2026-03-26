import type { EmailAddress } from "../value-objects/email-address.value-object";

export type AccountStatus = "active" | "inactive";

export class Account {
  public static create(props: {
    readonly email: EmailAddress;
    readonly id: string;
    readonly now: Date;
    readonly userId: string;
  }): Account {
    return new Account(props.id, props.userId, props.email, "active", props.now, props.now);
  }

  public static restore(props: {
    readonly createdAt: Date;
    readonly email: EmailAddress;
    readonly id: string;
    readonly status: AccountStatus;
    readonly updatedAt: Date;
    readonly userId: string;
  }): Account {
    return new Account(
      props.id,
      props.userId,
      props.email,
      props.status,
      props.createdAt,
      props.updatedAt,
    );
  }

  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly email: EmailAddress,
    public readonly status: AccountStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
