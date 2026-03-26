import type {
  AuditLogAction,
  AuditLogResource,
} from "../../domain/entities/audit-log-entry.entity";

export interface AuditLogView {
  readonly action: AuditLogAction;
  readonly correlationId: string;
  readonly id: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly resource: AuditLogResource;
  readonly tenantId: string | null;
  readonly timestamp: string;
  readonly userId: string | null;
}
