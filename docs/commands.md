# Commands

## Core Commands

```bash
cp .env.example .env
npm install
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

## Make Shortcuts

```bash
make up
make down
make build
make run
make logs
make test
make test-unit
make test-integration
make test-functional
make lint
make ci
```
