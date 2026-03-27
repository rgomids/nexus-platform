# Nexus Platform

Multi-tenant backend platform for identity, organizations, users, tenant-scoped RBAC, immutable auditability and operational observability. The codebase remains a modular monolith with DDD, Clean Architecture and explicit internal boundaries.

## 🚧 Project Status

Current Phase: **Phase 5 — Quality, Observability & Engineering**

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

## What Phase 5 Delivers

- production-oriented validation at the HTTP boundary with DTOs, `ValidationPipe` normalization and a stable error contract
- a single API error format with semantic snake_case codes and `correlation_id` mirrored in `x-correlation-id`
- structured logs with `timestamp`, `level`, `message`, `module`, `correlation_id`, `tenant_id` and `user_id`
- request-level correlation propagation across HTTP, use cases, database access, internal events and audit rows
- manual telemetry instrumentation for HTTP entrypoints, critical use cases, `DatabaseExecutor`, `InternalEventBus` and authorization flow
- scrape-friendly Prometheus metrics at `GET /metrics`
- explicit pagination and reasonable limits for `GET /audit-logs` and `GET /organizations/:id/memberships`
- broader unit, integration and functional coverage for identity, organizations, users, access-control, audit logs, validation and observability

## Available Endpoints

- `GET /health`
- `GET /metrics`
- `POST /identity/accounts`
- `POST /identity/login`
- `POST /identity/logout`
- `POST /organizations`
- `GET /organizations/:id`
- `PATCH /organizations/:id/inactive`
- `POST /organizations/:id/memberships`
- `GET /organizations/:id/memberships?limit=<1-100>&offset=<0-1000>`
- `POST /roles`
- `GET /roles`
- `POST /roles/:id/permissions`
- `GET /permissions`
- `POST /users/:id/roles`
- `GET /audit-logs?tenantId=<tenant>&limit=<1-100>&offset=<0-1000>`

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
- The role is granted the full default permission catalog for the current phase.
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

## Error Contract

All non-success HTTP responses now follow the same payload shape:

```json
{
  "error": "permission_denied",
  "message": "Permission denied",
  "correlation_id": "2d2dbbc8-b6dc-4c8f-a76e-b8578dd8d6d8"
}
```

Rules applied in Phase 5:

- semantic codes are stable and snake_case
- request validation fails early with `invalid_request`
- functional errors stay explicit
- technical failures return generic `internal_error`
- `x-correlation-id` is always returned and matches `correlation_id` in error payloads
- authentication and logging never expose password, token or stack details at the HTTP boundary

## Auditability And Querying

```text
HTTP request
  -> correlation id resolved at the request boundary
  -> guards resolve principal + tenant + permission
  -> module executes the main use case
  -> audited modules publish an internal event in-band
  -> audit-logs subscriber appends an immutable row
  -> GET /audit-logs reads by tenant with RBAC protection and pagination
```

### Audited actions

- `login_success`
- `login_failed`
- `logout`
- `organization_created`
- `organization_deactivated`
- `user_created`
- `membership_assigned`
- `role_created`
- `permission_granted`
- `role_assigned`
- `authorization_denied`

### Audit log rules

- `GET /audit-logs` requires `audit:view`
- `tenantId` in the query must match the active tenant from the authenticated session
- optional filters: `userId`, `action`, `from`, `to`
- pagination defaults to `limit=50` and `offset=0`
- public limits are `limit <= 100` and `offset <= 1000`
- ordering stays `timestamp DESC, id DESC`
- bootstrap-session or failed-login rows may persist `tenantId = null` when no tenant context exists

## Observability

### Structured logs

Every HTTP request and main operational event emits structured logs aligned around:

- `timestamp`
- `level`
- `message`
- `module`
- `correlation_id`
- `tenant_id`
- `user_id`

Sensitive headers and values such as `Authorization`, cookies, tokens, passwords and error stacks are sanitized at the boundary.

### Correlation and tracing

- incoming requests reuse `x-correlation-id` when present or generate a new UUID
- the correlation id flows into guards, use cases, internal events and persisted audit rows
- manual OpenTelemetry spans cover HTTP entrypoints, critical use cases, `DatabaseExecutor`, `InternalEventBus` and authorization decisions

### Metrics

`GET /metrics` exposes Prometheus-compatible metrics including:

- `nexus_http_requests_total`
- `nexus_http_request_duration_ms`
- `nexus_module_failures_total`
- `nexus_identity_logins_total`
- `nexus_authorization_decisions_total`
- `nexus_audit_operations_total`
- `nexus_audit_operation_duration_ms`

## Testing Strategy

- Unit: domain rules, use cases, error mapping, validation mapping, logging and telemetry helpers
- Integration: real PostgreSQL flows through Testcontainers for login, tenant resolution, authorization, audit immutability, pagination and indexes
- Functional: end-to-end HTTP scenarios for authenticated tenant access, permission denial, audit correlation, metrics exposure and validation failures

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
      application/
      domain/
      infrastructure/
  shared/
    auth/
    events/
    tenancy/
    request-correlation/
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
npm run dev
```

The application also applies pending SQL migrations during bootstrap, so `npm run db:migrate` is the explicit operational command and app startup remains the safety net.

## Run With Docker

```bash
cp .env.example .env
npm run docker:up
curl http://localhost:3000/health
curl http://localhost:3000/metrics
npm run docker:logs
npm run docker:down
```

The existing `Makefile` mirrors these flows with `make up`, `make down`, `make run`, `make test`, `make test-unit`, `make test-integration` and `make lint`, but the package scripts remain the primary operational commands.

## Test

```bash
npm run lint
npm run build
npm run test:unit
npm run test:integration
npm run test:functional
npm run ci
```

`integration` and `functional` suites use Testcontainers and require a running Docker daemon. When Docker is unavailable, those suites are skipped locally; CI runs them with Docker enabled.

## Architecture Notes

- Modular Monolith remains the deployment model.
- `identity` owns authentication, sessions and the authenticated principal.
- `organizations` owns tenant lifecycle and tenant-scoped membership flows.
- `users` owns the global user record plus `memberships`.
- `access-control` owns roles, permissions, user-role assignments and the final authorization decision.
- `audit-logs` owns the append-only audit trail plus tenant-scoped query access.
- internal events are synchronous and in-process; they exist to decouple audit persistence, not to hide primary business flow.
- PostgreSQL access stays explicit through repositories and SQL, without ORM.
- audit and membership queries are tenant-aware, paginated and backed by explicit composite indexes.

## Documentation

- [Commands](./docs/commands.md)
- [Architecture](./docs/architecture.md)
- [Phase Status](./docs/phase-status.md)
- [Handoff](./docs/handoff.md)
