export interface CreateRolePermissionProps {
  readonly id: string;
  readonly now: Date;
  readonly organizationId: string;
  readonly permissionId: string;
  readonly roleId: string;
}

export class RolePermission {
  public static create(props: CreateRolePermissionProps): RolePermission {
    return new RolePermission(
      props.id,
      props.organizationId,
      props.roleId,
      props.permissionId,
      props.now,
      props.now,
    );
  }

  public static restore(props: {
    readonly createdAt: Date;
    readonly id: string;
    readonly organizationId: string;
    readonly permissionId: string;
    readonly roleId: string;
    readonly updatedAt: Date;
  }): RolePermission {
    return new RolePermission(
      props.id,
      props.organizationId,
      props.roleId,
      props.permissionId,
      props.createdAt,
      props.updatedAt,
    );
  }

  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly roleId: string,
    public readonly permissionId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
