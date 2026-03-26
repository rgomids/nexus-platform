import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { UserRoleAssignmentAlreadyExistsError } from "../../domain/access-control.errors";
import type { UserRoleAssignment } from "../../domain/entities/user-role-assignment.entity";
import type { UserRoleAssignmentRepository } from "../../domain/repositories/user-role-assignment.repository";

interface PermissionCodeRow {
  readonly code: string;
}

@Injectable()
export class PgUserRoleAssignmentRepository implements UserRoleAssignmentRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async listPermissionCodesByUserIdAndOrganizationId(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    const result = await this.databaseExecutor.query<PermissionCodeRow>(
      `
        SELECT DISTINCT permissions.code
        FROM user_role_assignments
        INNER JOIN role_permissions
          ON role_permissions.organization_id = user_role_assignments.organization_id
         AND role_permissions.role_id = user_role_assignments.role_id
        INNER JOIN permissions
          ON permissions.organization_id = role_permissions.organization_id
         AND permissions.id = role_permissions.permission_id
        WHERE user_role_assignments.user_id = $1
          AND user_role_assignments.organization_id = $2
        ORDER BY permissions.code ASC
      `,
      [userId, organizationId],
    );

    return result.rows.map((row) => row.code);
  }

  public async save(userRoleAssignment: UserRoleAssignment): Promise<void> {
    try {
      await this.databaseExecutor.query(
        `
          INSERT INTO user_role_assignments (
            id,
            organization_id,
            user_id,
            role_id,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          userRoleAssignment.id,
          userRoleAssignment.organizationId,
          userRoleAssignment.userId,
          userRoleAssignment.roleId,
          userRoleAssignment.createdAt,
          userRoleAssignment.updatedAt,
        ],
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new UserRoleAssignmentAlreadyExistsError();
      }

      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }
}
