# Nexus Platform

Multi-tenant backend platform for identity, organizations, users, access control and immutable auditability. The codebase is intentionally evolving as a modular monolith with DDD, Clean Architecture and explicit internal boundaries.

## 🚧 Project Status

Current Phase: **Phase 1 — Core Identity**

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

## What Phase 1 Delivers

- minimal `users` ownership for internal user records
- `identity` domain with `Account`, `Credential` and `Session`
- account creation with unique global email
- login with email and password
- persisted and revocable sessions
- JWT as transport contract backed by persisted sessions
- SQL migrations applied automatically during bootstrap
- HTTP validation and standardized error handling
- structured security-aware logging for identity flows

## Available Endpoints

- `GET /health`
- `POST /identity/accounts`
- `POST /identity/login`
- `POST /identity/logout`

## Login Flow

```text
Create account
  -> validate full name, email and password
  -> create user
  -> create account
  -> hash password with Argon2id
  -> persist credential

Login
  -> validate email
  -> load account + user + credential
  -> verify password hash
  -> create persisted session
  -> issue JWT with sub, aid, sid and jti

Logout
  -> verify JWT
  -> load session
  -> revoke persisted session
```

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
    users/
      application/
      domain/
      infrastructure/
    organizations/
    access-control/
    audit-logs/
  shared/
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
- `users` owns the internal user record and exposes a narrow contract to `identity`.
- `identity` owns `accounts`, `credentials` and `sessions`.
- PostgreSQL access stays explicit through repositories and SQL, without ORM.
- Multi-tenancy, RBAC and full auditability remain mandatory next-phase constraints and are not implemented in Phase 1.

## Documentation

- [Commands](./docs/commands.md)
- [Architecture](./docs/architecture.md)
- [Phase Status](./docs/phase-status.md)
- [Handoff](./docs/handoff.md)
