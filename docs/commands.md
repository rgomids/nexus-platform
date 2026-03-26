# Commands

## Core Commands

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:unit
npm run test:integration
npm run test:functional
docker compose up -d --build
docker compose down -v
docker compose logs -f app postgres
```

## Phase 3 API Smoke

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

curl -X POST http://localhost:3000/users/<member-user-id>/roles \
  -H "Authorization: Bearer <tenant-token>" \
  -H "Content-Type: application/json" \
  -d '{"roleId":"<role-id>"}'

curl http://localhost:3000/organizations/<organization-id>/memberships \
  -H "Authorization: Bearer <tenant-token>"
```
