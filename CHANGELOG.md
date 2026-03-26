# Changelog

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
