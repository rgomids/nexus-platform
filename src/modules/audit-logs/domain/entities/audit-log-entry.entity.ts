import {
  InvalidAuditLogActionError,
  InvalidAuditLogCorrelationIdError,
  InvalidAuditLogMetadataError,
  InvalidAuditLogResourceError,
  InvalidAuditLogTimestampError,
} from "../audit-log.errors";

export const AUDIT_LOG_ACTIONS = [
  "login_success",
  "login_failed",
  "logout",
  "organization_created",
  "organization_deactivated",
  "user_created",
  "user_updated",
  "user_deactivated",
  "membership_assigned",
  "role_created",
  "permission_granted",
  "role_assigned",
  "authorization_denied",
] as const;

export const AUDIT_LOG_RESOURCES = [
  "identity.session",
  "identity.account",
  "organization",
  "membership",
  "user",
  "access_control.role",
  "access_control.permission",
  "access_control.assignment",
  "authorization",
] as const;

export type AuditLogAction = (typeof AUDIT_LOG_ACTIONS)[number];
export type AuditLogResource = (typeof AUDIT_LOG_RESOURCES)[number];
export type AuditLogMetadata = Readonly<Record<string, unknown>>;

export interface CreateAuditLogEntryProps {
  readonly action: AuditLogAction;
  readonly correlationId: string;
  readonly id: string;
  readonly metadata: Record<string, unknown>;
  readonly resource: AuditLogResource;
  readonly tenantId: string | null;
  readonly timestamp: Date;
  readonly userId: string | null;
}

export class AuditLogEntry {
  public static create(props: CreateAuditLogEntryProps): AuditLogEntry {
    return new AuditLogEntry(props);
  }

  public static restore(props: CreateAuditLogEntryProps): AuditLogEntry {
    return new AuditLogEntry(props);
  }

  public readonly action: AuditLogAction;
  public readonly correlationId: string;
  public readonly id: string;
  public readonly metadata: AuditLogMetadata;
  public readonly resource: AuditLogResource;
  public readonly tenantId: string | null;
  public readonly timestamp: Date;
  public readonly userId: string | null;

  private constructor(props: CreateAuditLogEntryProps) {
    if (!AUDIT_LOG_ACTIONS.includes(props.action)) {
      throw new InvalidAuditLogActionError();
    }

    if (!AUDIT_LOG_RESOURCES.includes(props.resource)) {
      throw new InvalidAuditLogResourceError();
    }

    if (props.correlationId.trim().length === 0) {
      throw new InvalidAuditLogCorrelationIdError();
    }

    if (Number.isNaN(props.timestamp.getTime())) {
      throw new InvalidAuditLogTimestampError();
    }

    this.action = props.action;
    this.correlationId = props.correlationId;
    this.id = props.id;
    this.metadata = freezeMetadata(props.metadata);
    this.resource = props.resource;
    this.tenantId = props.tenantId;
    this.timestamp = new Date(props.timestamp);
    this.userId = props.userId;

    Object.freeze(this);
  }
}

function freezeMetadata(metadata: Record<string, unknown>): AuditLogMetadata {
  if (!isPlainObject(metadata)) {
    throw new InvalidAuditLogMetadataError();
  }

  const cloned = structuredClone(metadata);

  deepFreeze(cloned);

  return Object.freeze(cloned);
}

function deepFreeze(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      deepFreeze(item);
    }

    Object.freeze(value);
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const nestedValue of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nestedValue);
  }

  Object.freeze(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as object | null;

  return prototype === Object.prototype || prototype === null;
}
