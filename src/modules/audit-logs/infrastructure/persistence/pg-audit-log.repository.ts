import { Injectable } from "@nestjs/common";

import { DatabaseExecutor } from "../../../../bootstrap/persistence/database.executor";
import { AuditLogEntry } from "../../domain/entities/audit-log-entry.entity";
import type { AuditLogRepository, ListAuditLogsFilters } from "../../domain/repositories/audit-log.repository";

interface AuditLogRow {
  readonly action: string;
  readonly correlation_id: string;
  readonly id: string;
  readonly metadata: Record<string, unknown>;
  readonly resource: string;
  readonly tenant_id: string | null;
  readonly timestamp: Date;
  readonly user_id: string | null;
}

@Injectable()
export class PgAuditLogRepository implements AuditLogRepository {
  public constructor(private readonly databaseExecutor: DatabaseExecutor) {}

  public async append(entry: AuditLogEntry): Promise<void> {
    await this.databaseExecutor.query(
      `
        INSERT INTO audit_logs (
          id,
          timestamp,
          user_id,
          tenant_id,
          action,
          resource,
          metadata,
          correlation_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      `,
      [
        entry.id,
        entry.timestamp,
        entry.userId,
        entry.tenantId,
        entry.action,
        entry.resource,
        JSON.stringify(entry.metadata),
        entry.correlationId,
      ],
    );
  }

  public async list(filters: ListAuditLogsFilters): Promise<AuditLogEntry[]> {
    const values: unknown[] = [filters.tenantId];
    const predicates = ["tenant_id = $1"];

    if (filters.userId !== undefined) {
      values.push(filters.userId);
      predicates.push(`user_id = $${values.length}`);
    }

    if (filters.action !== undefined) {
      values.push(filters.action);
      predicates.push(`action = $${values.length}`);
    }

    if (filters.from !== undefined) {
      values.push(filters.from);
      predicates.push(`timestamp >= $${values.length}`);
    }

    if (filters.to !== undefined) {
      values.push(filters.to);
      predicates.push(`timestamp <= $${values.length}`);
    }

    const result = await this.databaseExecutor.query<AuditLogRow>(
      `
        SELECT
          id,
          timestamp,
          user_id,
          tenant_id,
          action,
          resource,
          metadata,
          correlation_id
        FROM audit_logs
        WHERE ${predicates.join("\n          AND ")}
        ORDER BY timestamp DESC, id DESC
      `,
      values,
    );

    return result.rows.map((row) =>
      AuditLogEntry.restore({
        action: row.action as AuditLogEntry["action"],
        correlationId: row.correlation_id,
        id: row.id,
        metadata: row.metadata,
        resource: row.resource as AuditLogEntry["resource"],
        tenantId: row.tenant_id,
        timestamp: new Date(row.timestamp),
        userId: row.user_id,
      }),
    );
  }
}
