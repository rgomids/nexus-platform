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

## Phase 2 API Smoke

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

curl http://localhost:3000/organizations/<organization-id> \
  -H "Authorization: Bearer <tenant-token>"
```
