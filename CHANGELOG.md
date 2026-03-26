# Changelog

## [2026-03-26]
- fix: `AccessControlModule` passou a prover localmente os guards e o resolvedor de tenant para evitar falha de DI dos endpoints RBAC durante os testes de integração.
- fix: workflow de CI agora faz `docker compose down` apenas quando o arquivo `.env` foi preparado, evitando falha secundária no teardown.
- feature: implementação da Phase 3 — RBAC com módulo `access-control`, catálogo de permissões tenant-local, roles, grants e user-role assignments.
- feature: guards de tenant ativo e autorização deny-by-default aplicados aos endpoints RBAC e às rotas sensíveis de `organizations`.
- feature: migration `0003_access_control_rbac.sql` com backfill de `organization_admin` para memberships ativas existentes.
- fix: imagem Docker de produção agora inclui as migrations SQL exigidas no bootstrap da aplicação.
- test: cobertura unitária do domínio e dos casos de uso RBAC, além de suites de integração e functional ampliadas para autorização.
- docs: README, arquitetura, comandos, status de fase, handoff e ADR 0006 atualizados para o rollout RBAC.

## [2026-03-26]
- feature: implementação da Phase 2 — Multi-Tenancy com módulo `organizations`, `memberships` no módulo `users` e sessões autenticadas vinculadas a tenant.
- feature: guards de principal autenticado e tenant context com bloqueio explícito para tenant ausente, tenant inativo, mismatch de tenant e membership inválida.
- test: cobertura unitária para `Organization`, `Membership`, casos de uso de criação de tenant/membership e login tenant-bound; suites de integração e functional ampliadas para multi-tenancy.
- docs: README, arquitetura, comandos, status de fase, handoff e ADR 0005 atualizados para a fundação multi-tenant.

## [2026-03-25]
- feature: implementação da Phase 1 — Core Identity com criação de conta, login por email/senha e logout com sessão persistida.
- feature: módulo `users` mínimo, módulo `identity` funcional, JWT de transporte, hash Argon2id e migrations SQL automáticas.
- test: cobertura unitária do domínio e casos de uso, além de suites de integração e funcional para identity com Testcontainers.
- docs: README, arquitetura, comandos, handoff e status de fase atualizados para o novo fluxo.

## [2026-03-25]
- feature: bootstrap inicial do Nexus Platform com NestJS, TypeScript strict, health check e módulos placeholder.
- feature: configuração centralizada por `.env`, logger estruturado com pino, base OpenTelemetry e conexão PostgreSQL sem ORM.
- feature: Dockerfile multi-stage, `docker-compose.yml`, Makefile operacional e workflow de CI com smoke test Docker.
- refactor: estrutura do repositório organizada para Modular Monolith + DDD + Clean Architecture desde a fundação.
- docs: README expandido, comandos operacionais, arquitetura base, status de fase, handoff e ADR da estratégia de persistência.
