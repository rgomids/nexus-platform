import type { AuditLogAction } from "../entities/audit-log-entry.entity";
import type { AuditLogEntry } from "../entities/audit-log-entry.entity";

export const AUDIT_LOG_REPOSITORY = Symbol("AUDIT_LOG_REPOSITORY");

export interface ListAuditLogsFilters {
  readonly action?: AuditLogAction;
  readonly from?: Date;
  readonly tenantId: string;
  readonly to?: Date;
  readonly userId?: string;
}

export interface AuditLogRepository {
  append(entry: AuditLogEntry): Promise<void>;
  list(filters: ListAuditLogsFilters): Promise<AuditLogEntry[]>;
}
