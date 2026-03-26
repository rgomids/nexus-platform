# Architecture

## Overview

Phase 4 adds append-only auditability on top of the tenant-scoped RBAC platform. The repository remains a modular monolith, and now `identity`, `organizations`, `users`, `access-control` and `audit-logs` collaborate through explicit contracts, shared guards and a minimal internal event bus.

## C4-lite Diagram

```mermaid
flowchart LR
  client["HTTP Client"] --> api["Nexus Platform API\nNestJS + TypeScript"]
  api --> health["Health Endpoint\nGET /health"]
  api --> identity["Identity Module\naccounts, credentials, sessions"]
  api --> organizations["Organizations Module\ntenants, lifecycle, memberships"]
  api --> accessControl["Access Control Module\nroles, permissions, assignments, policy"]
  api --> auditLogs["Audit Logs Module\nappend-only storage and query"]
  api --> eventBus["Internal Event Bus\nin-process and synchronous"]
  api --> guards["Security Guards\nauthenticated principal + tenant + permission"]
  identity --> users["Users Module\nusers, memberships"]
  organizations --> accessControl
  accessControl --> users
  identity --> eventBus
  organizations --> eventBus
  accessControl --> eventBus
  users --> eventBus
  eventBus --> auditLogs
  guards --> organizations
  guards --> accessControl
  api --> logs["Structured Logs\napp events plus audit query/append"]
  api --> database["PostgreSQL\nSQL migrations + explicit repositories"]
  api --> telemetry["OpenTelemetry Bootstrap"]
```

## Module Boundaries

- `src/bootstrap`: startup, validation pipe, global error mapping, config, logging, migrations and database lifecycle.
- `src/modules/identity`: owns account creation, password hashing, login, session persistence, token issue and logout.
- `src/modules/organizations`: owns tenant lifecycle and organization-scoped membership flows.
- `src/modules/users`: owns the global user record plus `memberships`.
- `src/modules/access-control`: owns `roles`, `permissions`, `role_permissions`, `user_role_assignments` and the authorization decision.
- `src/modules/audit-logs`: owns append-only `audit_logs`, audit query use cases and internal event subscribers.
- `src/shared`: security, tenancy, request correlation and internal event primitives that are reused without collapsing module boundaries.

## Active Decisions in Phase 4

- PostgreSQL still uses `pg` directly with explicit repository implementations.
- SQL migrations remain versioned in `migrations/` and are applied automatically during bootstrap.
- Permissions are tenant-local, even when codes repeat across tenants.
- Existing active memberships were backfilled with `organization_admin` to preserve the current access baseline during the RBAC rollout.
- New organizations bootstrap the default permission catalog, `organization_admin` role and creator assignment inside the same transaction flow as tenant creation.
- Authorization is explicit and deny-by-default for all protected routes.
- Audit rows are appended in-band to the same transaction as the successful mutating action whenever the flow is state-changing.
- Failed login and authorization denial events preserve the original denial response even if audit append fails; the failure is logged operationally.
- The internal event bus is intentionally synchronous and in-process because it exists only to decouple audit persistence from the publishing modules.

## Security Flow

```text
Authenticated request
  -> resolve correlation id
  -> resolve authenticated principal from session/token
  -> resolve active tenant from session or route
  -> validate active organization
  -> validate active membership
  -> resolve required permission metadata
  -> authorize allow / deny
  -> execute use case
```

### Guard composition

- Session-scoped RBAC endpoints use `AuthenticatedRequestGuard -> ActiveTenantGuard -> AuthorizationGuard`.
- Path-scoped organization endpoints use `AuthenticatedRequestGuard -> TenantContextGuard -> AuthorizationGuard`.
- Audit log queries use `AuthenticatedRequestGuard -> ActiveTenantGuard -> AuthorizationGuard` plus `audit:view`.
- `POST /organizations` stays outside RBAC because the tenant and default role do not exist yet.

## Multi-Tenancy Rules Applied

- All RBAC tables carry `organization_id`.
- Cross-tenant links are blocked with composite foreign keys on `(organization_id, id)` pairs.
- Authorization decisions always use the active organization from the request context.
- Tenant mismatch between route and session is denied before application code runs.
- Cross-tenant access remains denied even if the actor has valid roles in another tenant.

## Constraints Preserved

- No external message bus or ACL/ABAC model.
- Membership remains the prerequisite for login into a tenant; RBAC only governs what the authenticated member can do after login.
- `audit_logs` remains append-only and is queried only within the active tenant context in this phase.
