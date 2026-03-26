import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { RolePermissionAlreadyExistsError } from "../../domain/access-control.errors";
import type { RolePermission } from "../../domain/entities/role-permission.entity";
import type { RolePermissionRepository } from "../../domain/repositories/role-permission.repository";

@Injectable()
export class PgRolePermissionRepository implements RolePermissionRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async save(rolePermission: RolePermission): Promise<void> {
    try {
      await this.databaseExecutor.query(
        `
          INSERT INTO role_permissions (
            id,
            organization_id,
            role_id,
            permission_id,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          rolePermission.id,
          rolePermission.organizationId,
          rolePermission.roleId,
          rolePermission.permissionId,
          rolePermission.createdAt,
          rolePermission.updatedAt,
        ],
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new RolePermissionAlreadyExistsError();
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
