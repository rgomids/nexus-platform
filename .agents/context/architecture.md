# Context — Architecture

## Stack fixa

- Node.js 24 LTS
- TypeScript
- NestJS
- PostgreSQL
- OpenTelemetry
- Docker
- GitHub Actions

## Estilo arquitetural

- Modular Monolith
- DDD
- Clean Architecture
- Event-driven interno

## Estrutura sugerida

```text
src/
  bootstrap/
  modules/
  shared/
  jobs/
```

## Observabilidade

Obrigatória em fluxos críticos com:

- structured logs
- correlation id
- tracing OpenTelemetry
- métricas principais por operação

## Configuração

- `.env` por ambiente
- validação de variáveis obrigatórias no bootstrap
- sem segredos em repositório
