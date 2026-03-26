import type { RolePermission } from "../entities/role-permission.entity";

export const ROLE_PERMISSION_REPOSITORY = Symbol("ROLE_PERMISSION_REPOSITORY");

export interface RolePermissionRepository {
  save(rolePermission: RolePermission): Promise<void>;
}
