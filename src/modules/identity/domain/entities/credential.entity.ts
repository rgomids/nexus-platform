export class Credential {
  public static create(props: {
    readonly accountId: string;
    readonly now: Date;
    readonly passwordHash: string;
  }): Credential {
    return new Credential(props.accountId, props.passwordHash, props.now, props.now);
  }

  public static restore(props: {
    readonly accountId: string;
    readonly createdAt: Date;
    readonly passwordHash: string;
    readonly updatedAt: Date;
  }): Credential {
    return new Credential(props.accountId, props.passwordHash, props.createdAt, props.updatedAt);
  }

  private constructor(
    public readonly accountId: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
