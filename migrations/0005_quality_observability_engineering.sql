CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp_id
  ON audit_logs (tenant_id, timestamp DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action_timestamp
  ON audit_logs (tenant_id, action, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_user_timestamp
  ON audit_logs (tenant_id, user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_memberships_organization_created_id
  ON memberships (organization_id, created_at ASC, id ASC);
