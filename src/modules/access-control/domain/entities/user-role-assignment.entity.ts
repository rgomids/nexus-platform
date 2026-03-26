export interface CreateUserRoleAssignmentProps {
  readonly id: string;
  readonly now: Date;
  readonly organizationId: string;
  readonly roleId: string;
  readonly userId: string;
}

export class UserRoleAssignment {
  public static create(props: CreateUserRoleAssignmentProps): UserRoleAssignment {
    return new UserRoleAssignment(
      props.id,
      props.organizationId,
      props.userId,
      props.roleId,
      props.now,
      props.now,
    );
  }

  public static restore(props: {
    readonly createdAt: Date;
    readonly id: string;
    readonly organizationId: string;
    readonly roleId: string;
    readonly updatedAt: Date;
    readonly userId: string;
  }): UserRoleAssignment {
    return new UserRoleAssignment(
      props.id,
      props.organizationId,
      props.userId,
      props.roleId,
      props.createdAt,
      props.updatedAt,
    );
  }

  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly roleId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
