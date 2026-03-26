import type { UserRoleAssignment } from "../entities/user-role-assignment.entity";

export const USER_ROLE_ASSIGNMENT_REPOSITORY = Symbol(
  "USER_ROLE_ASSIGNMENT_REPOSITORY",
);

export interface UserRoleAssignmentRepository {
  listPermissionCodesByUserIdAndOrganizationId(
    userId: string,
    organizationId: string,
  ): Promise<string[]>;
  save(userRoleAssignment: UserRoleAssignment): Promise<void>;
}
