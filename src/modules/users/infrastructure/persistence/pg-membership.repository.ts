import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { Membership } from "../../domain/entities/membership.entity";
import type { MembershipRepository } from "../../domain/repositories/membership.repository";
import { MembershipAlreadyExistsError } from "../../domain/user.errors";

interface MembershipRow {
  readonly created_at: Date;
  readonly id: string;
  readonly organization_id: string;
  readonly status: "active" | "inactive";
  readonly updated_at: Date;
  readonly user_id: string;
}

@Injectable()
export class PgMembershipRepository implements MembershipRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async countActiveByUserId(userId: string): Promise<number> {
    const result = await this.databaseExecutor.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM memberships
        WHERE user_id = $1
          AND status = 'active'
      `,
      [userId],
    );

    return Number.parseInt(result.rows[0]?.count ?? "0", 10);
  }

  public async findActiveByUserIdAndOrganizationId(
    userId: string,
    organizationId: string,
  ): Promise<Membership | null> {
    const result = await this.databaseExecutor.query<MembershipRow>(
      `
        SELECT id, organization_id, user_id, status, created_at, updated_at
        FROM memberships
        WHERE user_id = $1
          AND organization_id = $2
          AND status = 'active'
      `,
      [userId, organizationId],
    );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return this.mapRow(row);
  }

  public async findByOrganizationId(organizationId: string): Promise<Membership[]> {
    const result = await this.databaseExecutor.query<MembershipRow>(
      `
        SELECT id, organization_id, user_id, status, created_at, updated_at
        FROM memberships
        WHERE organization_id = $1
        ORDER BY created_at ASC
      `,
      [organizationId],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  public async save(membership: Membership): Promise<void> {
    try {
      await this.databaseExecutor.query(
        `
          INSERT INTO memberships (id, organization_id, user_id, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          membership.id,
          membership.organizationId,
          membership.userId,
          membership.status,
          membership.createdAt,
          membership.updatedAt,
        ],
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new MembershipAlreadyExistsError();
      }

      throw error;
    }
  }

  private mapRow(row: MembershipRow): Membership {
    return Membership.restore({
      createdAt: new Date(row.created_at),
      id: row.id,
      organizationId: row.organization_id,
      status: row.status,
      updatedAt: new Date(row.updated_at),
      userId: row.user_id,
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
