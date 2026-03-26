import type { Permission } from "../entities/permission.entity";

export const PERMISSION_REPOSITORY = Symbol("PERMISSION_REPOSITORY");

export interface PermissionRepository {
  findByCode(organizationId: string, code: string): Promise<Permission | null>;
  listByOrganizationId(organizationId: string): Promise<Permission[]>;
  save(permission: Permission): Promise<void>;
}
