# Nexus Platform

Multi-tenant backend platform for identity, organizations, users, access control and immutable auditability. The codebase is intentionally evolving as a modular monolith with DDD, Clean Architecture and explicit internal boundaries.

## 🚧 Project Status

Current Phase: **Phase 2 — Multi-Tenancy**

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

## What Phase 2 Delivers

- `organizations` module with tenant lifecycle (`active|inactive`)
- `users` ownership for `memberships` between users and organizations
- tenant-bound login with controlled bootstrap sessions for users without memberships
- protected tenant context resolution with explicit deny-by-default guards
- SQL migrations for `organizations`, `memberships` and `sessions.organization_id`
- structured logs for organization, membership and tenant-context events
- unit, integration and functional coverage for the multi-tenant base

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

## Tenant Context Flow

```text
Bootstrap path
  -> create account
  -> login without organizationId when user has zero active memberships
  -> create organization
  -> creator receives first active membership

Tenant-bound path
  -> login with email, password and organizationId
  -> validate active organization
  -> validate active membership for user + organization
  -> create persisted session bound to organization_id
  -> resolve tenant context on protected routes
  -> deny requests with missing, inactive or mismatched tenant context
```

## Core Entities Added In Phase 2

- `Organization`
- `Membership`
- `Session.organizationId`

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

## Authentication And Tenant Notes

- `POST /identity/login` accepts `organizationId` for tenant-bound sessions.
- If a user has at least one active membership, `organizationId` is mandatory at login.
- If a user has zero active memberships, login can create a bootstrap session with `organizationId = null`.
- Bootstrap sessions can authenticate `POST /organizations`, but tenant-scoped routes require a resolved tenant context.
- Protected tenant-scoped routes validate:
  - authenticated principal
  - `organizationId` bound to the session
  - active organization
  - active membership for the authenticated user

## Architecture Notes

- Modular Monolith remains the deployment model.
- `users` owns the global user record and all `memberships`.
- `organizations` owns tenant lifecycle and coordinates organization-scoped flows.
- `identity` owns `accounts`, `credentials` and `sessions`, but consumes tenant contracts from `organizations` and `users`.
- PostgreSQL access stays explicit through repositories and SQL, without ORM.
- RBAC and full auditability remain next-phase constraints.

## Documentation

- [Commands](./docs/commands.md)
- [Architecture](./docs/architecture.md)
- [Phase Status](./docs/phase-status.md)
- [Handoff](./docs/handoff.md)
