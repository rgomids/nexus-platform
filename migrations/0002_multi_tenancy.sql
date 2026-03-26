CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (organization_id, user_id)
);

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS organization_id UUID NULL REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_memberships_organization_id ON memberships (organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_organization_status
  ON memberships (user_id, organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_organization_id ON sessions (organization_id);
