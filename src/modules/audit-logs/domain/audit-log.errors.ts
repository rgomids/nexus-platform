import { ValidationError } from "../../../shared/domain/nexus.errors";

export class InvalidAuditLogActionError extends ValidationError {
  public constructor() {
    super(
      "Audit log action is invalid",
      "invalid_audit_log_action",
      "Audit log action is invalid",
    );
  }
}

export class InvalidAuditLogCorrelationIdError extends ValidationError {
  public constructor() {
    super(
      "Audit log correlation id is invalid",
      "invalid_audit_log_correlation_id",
      "Audit log correlation id is invalid",
    );
  }
}

export class InvalidAuditLogMetadataError extends ValidationError {
  public constructor() {
    super(
      "Audit log metadata must be a JSON object",
      "invalid_audit_log_metadata",
      "Audit log metadata must be a JSON object",
    );
  }
}

export class InvalidAuditLogResourceError extends ValidationError {
  public constructor() {
    super(
      "Audit log resource is invalid",
      "invalid_audit_log_resource",
      "Audit log resource is invalid",
    );
  }
}

export class InvalidAuditLogTimeRangeError extends ValidationError {
  public constructor() {
    super(
      "Audit log time range is invalid",
      "invalid_audit_log_time_range",
      "Audit log time range is invalid",
    );
  }
}

export class InvalidAuditLogTimestampError extends ValidationError {
  public constructor() {
    super(
      "Audit log timestamp is invalid",
      "invalid_audit_log_timestamp",
      "Audit log timestamp is invalid",
    );
  }
}
