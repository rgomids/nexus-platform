CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, code)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (organization_id, role_id, permission_id),
  FOREIGN KEY (organization_id, role_id) REFERENCES roles(organization_id, id),
  FOREIGN KEY (organization_id, permission_id) REFERENCES permissions(organization_id, id)
);

CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (organization_id, user_id, role_id),
  FOREIGN KEY (organization_id, role_id) REFERENCES roles(organization_id, id),
  FOREIGN KEY (organization_id, user_id) REFERENCES memberships(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles (organization_id);
CREATE INDEX IF NOT EXISTS idx_permissions_organization_id ON permissions (organization_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_organization_role
  ON role_permissions (organization_id, role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_organization_user
  ON user_role_assignments (organization_id, user_id);

WITH permission_codes(code) AS (
  VALUES
    ('organization:view'),
    ('organization:deactivate'),
    ('membership:create'),
    ('membership:view'),
    ('role:create'),
    ('role:view'),
    ('permission:view'),
    ('role:grant-permission'),
    ('role:assign'),
    ('user:create'),
    ('user:update'),
    ('audit:view')
),
seed_permissions AS (
  SELECT
    (
      SUBSTRING(digest, 1, 8) || '-' ||
      SUBSTRING(digest, 9, 4) || '-' ||
      SUBSTRING(digest, 13, 4) || '-' ||
      SUBSTRING(digest, 17, 4) || '-' ||
      SUBSTRING(digest, 21, 12)
    )::UUID AS id,
    organizations.id AS organization_id,
    permission_codes.code
  FROM organizations
  CROSS JOIN permission_codes
  CROSS JOIN LATERAL (
    SELECT md5(organizations.id::text || ':' || permission_codes.code) AS digest
  ) AS hashes
)
INSERT INTO permissions (id, organization_id, code, created_at, updated_at)
SELECT id, organization_id, code, NOW(), NOW()
FROM seed_permissions
ON CONFLICT (organization_id, code) DO NOTHING;

WITH seed_roles AS (
  SELECT
    (
      SUBSTRING(digest, 1, 8) || '-' ||
      SUBSTRING(digest, 9, 4) || '-' ||
      SUBSTRING(digest, 13, 4) || '-' ||
      SUBSTRING(digest, 17, 4) || '-' ||
      SUBSTRING(digest, 21, 12)
    )::UUID AS id,
    organizations.id AS organization_id,
    'organization_admin'::VARCHAR(120) AS name
  FROM organizations
  CROSS JOIN LATERAL (
    SELECT md5(organizations.id::text || ':organization_admin') AS digest
  ) AS hashes
)
INSERT INTO roles (id, organization_id, name, created_at, updated_at)
SELECT id, organization_id, name, NOW(), NOW()
FROM seed_roles
ON CONFLICT (organization_id, name) DO NOTHING;

WITH seed_role_permissions AS (
  SELECT
    (
      SUBSTRING(digest, 1, 8) || '-' ||
      SUBSTRING(digest, 9, 4) || '-' ||
      SUBSTRING(digest, 13, 4) || '-' ||
      SUBSTRING(digest, 17, 4) || '-' ||
      SUBSTRING(digest, 21, 12)
    )::UUID AS id,
    roles.organization_id,
    roles.id AS role_id,
    permissions.id AS permission_id
  FROM roles
  INNER JOIN permissions
    ON permissions.organization_id = roles.organization_id
  CROSS JOIN LATERAL (
    SELECT md5(
      roles.organization_id::text || ':' || roles.id::text || ':' || permissions.id::text
    ) AS digest
  ) AS hashes
  WHERE roles.name = 'organization_admin'
)
INSERT INTO role_permissions (
  id,
  organization_id,
  role_id,
  permission_id,
  created_at,
  updated_at
)
SELECT id, organization_id, role_id, permission_id, NOW(), NOW()
FROM seed_role_permissions
ON CONFLICT (organization_id, role_id, permission_id) DO NOTHING;

WITH seed_user_role_assignments AS (
  SELECT
    (
      SUBSTRING(digest, 1, 8) || '-' ||
      SUBSTRING(digest, 9, 4) || '-' ||
      SUBSTRING(digest, 13, 4) || '-' ||
      SUBSTRING(digest, 17, 4) || '-' ||
      SUBSTRING(digest, 21, 12)
    )::UUID AS id,
    memberships.organization_id,
    memberships.user_id,
    roles.id AS role_id
  FROM memberships
  INNER JOIN roles
    ON roles.organization_id = memberships.organization_id
   AND roles.name = 'organization_admin'
  CROSS JOIN LATERAL (
    SELECT md5(
      memberships.organization_id::text || ':' || memberships.user_id::text || ':' || roles.id::text
    ) AS digest
  ) AS hashes
  WHERE memberships.status = 'active'
)
INSERT INTO user_role_assignments (
  id,
  organization_id,
  user_id,
  role_id,
  created_at,
  updated_at
)
SELECT id, organization_id, user_id, role_id, NOW(), NOW()
FROM seed_user_role_assignments
ON CONFLICT (organization_id, user_id, role_id) DO NOTHING;
