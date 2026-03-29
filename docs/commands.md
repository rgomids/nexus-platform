# Commands

## Core Scripts

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
npm run docker:up
npm run docker:logs
npm run docker:down
npm run build
npm run lint
npm run test
npm run test:unit
npm run test:integration
npm run test:functional
npm run ci
```

## Make Wrappers

```bash
make up
make down
make run
make test
make test-unit
make test-integration
make test-functional
make lint
make ci
```

## Phase 5 API Smoke

```bash
curl -X POST http://localhost:3000/identity/accounts \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jane Doe","email":"jane@example.com","password":"Password123"}'

curl -X POST http://localhost:3000/identity/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Password123"}'

curl -X POST http://localhost:3000/organizations \
  -H "Authorization: Bearer <bootstrap-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp"}'

curl -X POST http://localhost:3000/identity/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Password123","organizationId":"<organization-id>"}'

curl -X POST http://localhost:3000/roles \
  -H "Authorization: Bearer <tenant-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"membership_viewer"}'

curl -X POST http://localhost:3000/roles/<role-id>/permissions \
  -H "Authorization: Bearer <tenant-token>" \
  -H "Content-Type: application/json" \
  -d '{"permissionCode":"membership:view"}'

curl -X POST http://localhost:3000/organizations/<organization-id>/memberships \
  -H "Authorization: Bearer <tenant-token>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<member-user-id>"}'

curl "http://localhost:3000/organizations/<organization-id>/memberships?limit=50&offset=0" \
  -H "Authorization: Bearer <tenant-token>"

curl "http://localhost:3000/audit-logs?tenantId=<organization-id>&limit=50&offset=0" \
  -H "Authorization: Bearer <tenant-token>"

curl "http://localhost:3000/audit-logs?tenantId=<organization-id>&action=authorization_denied&limit=20&offset=0" \
  -H "Authorization: Bearer <tenant-token>"

curl http://localhost:3000/metrics
```

## Standardized Error Example

```bash
curl -X POST http://localhost:3000/identity/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"short"}'
```

```json
{
  "error": "invalid_request",
  "message": "password must be longer than or equal to 8 characters",
  "correlation_id": "7ef4e259-31d8-4b91-ae84-0f81f00c84d3"
}
```
