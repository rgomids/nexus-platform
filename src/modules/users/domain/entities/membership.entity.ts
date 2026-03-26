export type MembershipStatus = "active" | "inactive";

export interface CreateMembershipProps {
  readonly id: string;
  readonly now: Date;
  readonly organizationId: string;
  readonly userId: string;
}

export class Membership {
  public static create(props: CreateMembershipProps): Membership {
    return new Membership(
      props.id,
      props.organizationId,
      props.userId,
      "active",
      props.now,
      props.now,
    );
  }

  public static restore(props: {
    readonly createdAt: Date;
    readonly id: string;
    readonly organizationId: string;
    readonly status: MembershipStatus;
    readonly updatedAt: Date;
    readonly userId: string;
  }): Membership {
    return new Membership(
      props.id,
      props.organizationId,
      props.userId,
      props.status,
      props.createdAt,
      props.updatedAt,
    );
  }

  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly status: MembershipStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public deactivate(now: Date): Membership {
    if (this.status === "inactive") {
      return this;
    }

    return new Membership(
      this.id,
      this.organizationId,
      this.userId,
      "inactive",
      this.createdAt,
      now,
    );
  }
}
