import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { Organization } from "../../domain/entities/organization.entity";
import type { OrganizationRepository } from "../../domain/repositories/organization.repository";

interface OrganizationRow {
  readonly created_at: Date;
  readonly id: string;
  readonly name: string;
  readonly status: "active" | "inactive";
  readonly updated_at: Date;
}

@Injectable()
export class PgOrganizationRepository implements OrganizationRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async findById(organizationId: string): Promise<Organization | null> {
    const result = await this.databaseExecutor.query<OrganizationRow>(
      `
        SELECT id, name, status, created_at, updated_at
        FROM organizations
        WHERE id = $1
      `,
      [organizationId],
    );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return Organization.restore({
      createdAt: new Date(row.created_at),
      id: row.id,
      name: row.name,
      status: row.status,
      updatedAt: new Date(row.updated_at),
    });
  }

  public async save(organization: Organization): Promise<void> {
    await this.databaseExecutor.query(
      `
        INSERT INTO organizations (id, name, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        organization.id,
        organization.name,
        organization.status,
        organization.createdAt,
        organization.updatedAt,
      ],
    );
  }

  public async update(organization: Organization): Promise<void> {
    await this.databaseExecutor.query(
      `
        UPDATE organizations
        SET name = $2,
            status = $3,
            updated_at = $4
        WHERE id = $1
      `,
      [organization.id, organization.name, organization.status, organization.updatedAt],
    );
  }
}
