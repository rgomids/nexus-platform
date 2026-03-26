export const ORGANIZATION_ADMIN_ROLE_NAME = "organization_admin";

export const DEFAULT_PERMISSION_CODES = [
  "organization:view",
  "organization:deactivate",
  "membership:create",
  "membership:view",
  "role:create",
  "role:view",
  "permission:view",
  "role:grant-permission",
  "role:assign",
  "user:create",
  "user:update",
  "audit:view",
] as const;

export type DefaultPermissionCode = (typeof DEFAULT_PERMISSION_CODES)[number];
