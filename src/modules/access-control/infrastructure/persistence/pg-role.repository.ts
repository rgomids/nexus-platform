import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import {
  RoleAlreadyExistsError,
} from "../../domain/access-control.errors";
import { Role } from "../../domain/entities/role.entity";
import type { RoleRepository } from "../../domain/repositories/role.repository";

interface RoleRow {
  readonly created_at: Date;
  readonly id: string;
  readonly name: string;
  readonly organization_id: string;
  readonly updated_at: Date;
}

@Injectable()
export class PgRoleRepository implements RoleRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async findById(roleId: string, organizationId: string): Promise<Role | null> {
    const result = await this.databaseExecutor.query<RoleRow>(
      `
        SELECT id, organization_id, name, created_at, updated_at
        FROM roles
        WHERE id = $1
          AND organization_id = $2
      `,
      [roleId, organizationId],
    );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return this.mapRow(row);
  }

  public async listByOrganizationId(organizationId: string): Promise<Role[]> {
    const result = await this.databaseExecutor.query<RoleRow>(
      `
        SELECT id, organization_id, name, created_at, updated_at
        FROM roles
        WHERE organization_id = $1
        ORDER BY name ASC
      `,
      [organizationId],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  public async save(role: Role): Promise<void> {
    try {
      await this.databaseExecutor.query(
        `
          INSERT INTO roles (id, organization_id, name, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [role.id, role.organizationId, role.name, role.createdAt, role.updatedAt],
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new RoleAlreadyExistsError();
      }

      throw error;
    }
  }

  private mapRow(row: RoleRow): Role {
    return Role.restore({
      createdAt: new Date(row.created_at),
      id: row.id,
      name: row.name,
      organizationId: row.organization_id,
      updatedAt: new Date(row.updated_at),
    });
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
