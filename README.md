# Nexus Platform

Multi-tenant backend platform for identity, organizations, users, access control and immutable auditability. The codebase starts as a modular monolith and keeps DDD, Clean Architecture and internal event-driven boundaries explicit from day one.

## 🚧 Project Status

Current Phase: **Phase 0 — Foundation**

Notion reference: [Nexus Platform](https://www.notion.so/mrgomides/Nexus-Platform-32fe01f2262680cd9e32db2b5cdd8f7b?source=copy_link)

## Stack

- Node.js 24 LTS
- TypeScript (`strict`)
- NestJS
- PostgreSQL
- Pino
- OpenTelemetry
- Docker
- GitHub Actions

## Foundation Scope

- HTTP bootstrap with `GET /health`
- centralized environment configuration
- PostgreSQL connectivity without schema or ORM
- structured logging with correlation id support
- OpenTelemetry provider bootstrap without exporters
- placeholder business modules with no domain logic yet

## Project Structure

```text
src/
  bootstrap/
    config/
    http/
    logging/
    persistence/
    telemetry/
  modules/
    identity/
    organizations/
    users/
    access-control/
    audit-logs/
  shared/
    application/
    domain/
    infrastructure/
    events/
    tenancy/
    auth/
    testing/
  jobs/
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
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=nexus
NODE_ENV=development
```

## Run

Local development:

```bash
cp .env.example .env
npm install
npm run start:dev
```

Docker:

```bash
cp .env.example .env
docker compose up -d --build
curl http://localhost:3000/health
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

- Modular Monolith is the deployment model.
- DDD and Clean Architecture boundaries are preserved by keeping business modules isolated and pushing operational concerns into `src/bootstrap`.
- Multi-tenancy, authorization and auditability are treated as first-class constraints, but their business rules are intentionally deferred to later phases.

## Documentation

- [Commands](./docs/commands.md)
- [Architecture](./docs/architecture.md)
- [Phase Status](./docs/phase-status.md)
- [Handoff](./docs/handoff.md)
