# Nexus Platform

Multi-tenant backend platform for identity, organizations, users, tenant-scoped RBAC and future immutable auditability. The codebase remains a modular monolith with DDD, Clean Architecture and explicit internal boundaries.

## 🚧 Project Status

Current Phase: **Phase 3 — RBAC**

Notion reference: [Nexus Platform](https://www.notion.so/mrgomides/Nexus-Platform-32fe01f2262680cd9e32db2b5cdd8f7b?source=copy_link)

## Stack

- Node.js 24 LTS
- TypeScript (`strict`)
- NestJS
- PostgreSQL
- `pg` with explicit repositories
- Argon2
- JWT
- Pino
- OpenTelemetry
- Docker
- GitHub Actions

## What Phase 3 Delivers

- tenant-scoped `roles`, `permissions`, `role_permissions` and `user_role_assignments`
- explicit authorization policy with deny-by-default decisions
- protected HTTP endpoints using `AuthenticatedRequestGuard -> tenant guard -> authorization guard`
- session-scoped RBAC management endpoints for role creation, permission grants and user-role assignment
- SQL migration that backfills `organization_admin` plus the default permission catalog for existing tenants
- structured logs for `role_created`, `permission_granted`, `role_assigned`, `authorization_allowed` and `authorization_denied`
- unit, integration and functional coverage for RBAC behavior

## Available Endpoints

- `GET /health`
- `POST /identity/accounts`
- `POST /identity/login`
- `POST /identity/logout`
- `POST /organizations`
- `GET /organizations/:id`
- `PATCH /organizations/:id/inactive`
- `POST /organizations/:id/memberships`
- `GET /organizations/:id/memberships`
- `POST /roles`
- `GET /roles`
- `POST /roles/:id/permissions`
- `GET /permissions`
- `POST /users/:id/roles`

## Authorization Model

```text
Authenticated User
  -> tenant context resolved from the active session
  -> active organization validation
  -> active membership validation
  -> roles assigned inside the tenant
  -> permissions resolved from those roles
  -> allow / deny
```

### Default bootstrap and backfill

- Every tenant receives a default `organization_admin` role.
- The role is granted the full default permission catalog for this phase.
- Existing active memberships were backfilled with `organization_admin` in the Phase 3 migration.
- New organizations bootstrap the creator membership and the `organization_admin` assignment in the same transaction flow.

### Default permission catalog

- `organization:view`
- `organization:deactivate`
- `membership:create`
- `membership:view`
- `role:create`
- `role:view`
- `permission:view`
- `role:grant-permission`
- `role:assign`
- `user:create`
- `user:update`
- `audit:view`

## Tenant and Authorization Notes

- `POST /identity/login` still accepts `organizationId` for tenant-bound sessions.
- Users with active memberships must log in with `organizationId`.
- Users without active memberships can still obtain a bootstrap session with `organizationId = null`.
- `POST /organizations` remains authentication-only because it happens before tenant RBAC exists.
- Tenant-scoped organization routes require:
  - authenticated principal
  - tenant context resolved from the active session
  - active organization
  - active membership
  - matching RBAC permission for the requested action
- Session-scoped RBAC routes (`/roles`, `/permissions`, `/users/:id/roles`) resolve the tenant directly from the active session and still validate organization + membership before authorization.

## Project Structure

```text
src/
  bootstrap/
    config/
    errors/
    http/
    logging/
    persistence/
    telemetry/
  modules/
    identity/
      application/
      domain/
      infrastructure/
    organizations/
      application/
      domain/
      infrastructure/
    users/
      application/
      domain/
      infrastructure/
    access-control/
      application/
      domain/
      infrastructure/
    audit-logs/
  shared/
    auth/
    tenancy/
    domain/
test/
  unit/
  integration/
  functional/
docs/
migrations/
```

## Environment Variables

Use `.env.example` as the baseline:

```dotenv
APP_PORT=3000
AUTH_JWT_SECRET=change-me-in-production
AUTH_JWT_EXPIRES_IN_MINUTES=480
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=nexus
NODE_ENV=development
```

## Run Locally

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run start:dev
```

The application also applies pending SQL migrations during bootstrap, so `npm run db:migrate` is the explicit operational option and app startup is the safety net.

## Run with Docker

```bash
cp .env.example .env
docker compose up -d --build
curl http://localhost:3000/health
docker compose logs -f app postgres
docker compose down -v
```

## Test

```bash
npm run lint
npm run build
npm run test:unit
npm run test:integration
npm run test:functional
```

`integration` and `functional` suites use Testcontainers and require a running Docker daemon. When Docker is unavailable, those suites are skipped locally; CI runs them with Docker enabled.

## Architecture Notes

- Modular Monolith remains the deployment model.
- `identity` owns authentication, sessions and the authenticated principal.
- `organizations` owns tenant lifecycle and tenant-scoped membership flows.
- `users` owns the global user record and `memberships`.
- `access-control` owns roles, permissions, user-role assignments and the final authorization decision.
- PostgreSQL access stays explicit through repositories and SQL, without ORM.
- Full append-only audit logs remain the next major phase.

## Documentation

- [Commands](./docs/commands.md)
- [Architecture](./docs/architecture.md)
- [Phase Status](./docs/phase-status.md)
- [Handoff](./docs/handoff.md)
