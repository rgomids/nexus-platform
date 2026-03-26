import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { Permission } from "../../domain/entities/permission.entity";
import type { PermissionRepository } from "../../domain/repositories/permission.repository";

interface PermissionRow {
  readonly code: string;
  readonly created_at: Date;
  readonly id: string;
  readonly organization_id: string;
  readonly updated_at: Date;
}

@Injectable()
export class PgPermissionRepository implements PermissionRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async findByCode(
    organizationId: string,
    code: string,
  ): Promise<Permission | null> {
    const result = await this.databaseExecutor.query<PermissionRow>(
      `
        SELECT id, organization_id, code, created_at, updated_at
        FROM permissions
        WHERE organization_id = $1
          AND code = $2
      `,
      [organizationId, code],
    );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return this.mapRow(row);
  }

  public async listByOrganizationId(organizationId: string): Promise<Permission[]> {
    const result = await this.databaseExecutor.query<PermissionRow>(
      `
        SELECT id, organization_id, code, created_at, updated_at
        FROM permissions
        WHERE organization_id = $1
        ORDER BY code ASC
      `,
      [organizationId],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  public async save(permission: Permission): Promise<void> {
    await this.databaseExecutor.query(
      `
        INSERT INTO permissions (id, organization_id, code, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        permission.id,
        permission.organizationId,
        permission.code,
        permission.createdAt,
        permission.updatedAt,
      ],
    );
  }

  private mapRow(row: PermissionRow): Permission {
    return Permission.restore({
      code: row.code,
      createdAt: new Date(row.created_at),
      id: row.id,
      organizationId: row.organization_id,
      updatedAt: new Date(row.updated_at),
    });
  }
}
