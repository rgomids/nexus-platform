import type { Role } from "../entities/role.entity";

export const ROLE_REPOSITORY = Symbol("ROLE_REPOSITORY");

export interface RoleRepository {
  findById(roleId: string, organizationId: string): Promise<Role | null>;
  listByOrganizationId(organizationId: string): Promise<Role[]>;
  save(role: Role): Promise<void>;
}
