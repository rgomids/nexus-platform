CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  user_id UUID NULL REFERENCES users(id),
  tenant_id UUID NULL REFERENCES organizations(id),
  action VARCHAR(80) NOT NULL,
  resource VARCHAR(80) NOT NULL,
  metadata JSONB NOT NULL,
  correlation_id VARCHAR(255) NOT NULL,
  CONSTRAINT chk_audit_logs_action CHECK (
    action IN (
      'login_success',
      'login_failed',
      'logout',
      'organization_created',
      'organization_deactivated',
      'user_created',
      'user_updated',
      'user_deactivated',
      'membership_assigned',
      'role_created',
      'permission_granted',
      'role_assigned',
      'authorization_denied'
    )
  ),
  CONSTRAINT chk_audit_logs_resource CHECK (
    resource IN (
      'identity.session',
      'identity.account',
      'organization',
      'membership',
      'user',
      'access_control.role',
      'access_control.permission',
      'access_control.assignment',
      'authorization'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON audit_logs USING GIN (metadata);

CREATE OR REPLACE FUNCTION prevent_audit_logs_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_prevent_update ON audit_logs;
CREATE TRIGGER trg_audit_logs_prevent_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_logs_modification();

DROP TRIGGER IF EXISTS trg_audit_logs_prevent_delete ON audit_logs;
CREATE TRIGGER trg_audit_logs_prevent_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_logs_modification();
