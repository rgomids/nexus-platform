export interface RoleView {
  readonly createdAt: string;
  readonly name: string;
  readonly organizationId: string;
  readonly roleId: string;
  readonly updatedAt: string;
}

export interface PermissionView {
  readonly code: string;
  readonly createdAt: string;
  readonly organizationId: string;
  readonly permissionId: string;
  readonly updatedAt: string;
}

export interface RolePermissionView {
  readonly createdAt: string;
  readonly organizationId: string;
  readonly permissionCode: string;
  readonly permissionId: string;
  readonly roleId: string;
  readonly rolePermissionId: string;
  readonly updatedAt: string;
}

export interface UserRoleAssignmentView {
  readonly createdAt: string;
  readonly organizationId: string;
  readonly roleId: string;
  readonly updatedAt: string;
  readonly userId: string;
  readonly userRoleAssignmentId: string;
}
