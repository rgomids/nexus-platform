# Phase Status

## Fase atual
- Nome: Phase 0 — Foundation
- Status: done
- Responsável: Codex
- Data: 2026-03-25

## Objetivo da fase
- Estabelecer a base operacional do Nexus Platform com NestJS, TypeScript strict, PostgreSQL, observabilidade mínima, Docker e CI.

## Entradas
- `AGENTS.md` e regras em `.agents/rules/*`
- contexto do produto, mapa de módulos e ADRs 0001, 0002, 0003

## Saídas esperadas
- aplicação subindo com `GET /health`
- conexão PostgreSQL validada
- estrutura modular criada
- documentação operacional atualizada

## Bloqueios
- daemon Docker indisponível no ambiente local durante a validação desta execução

## Decisões / observações
- `pg` foi adotado como adapter de conexão para evitar antecipar a escolha de ORM.
- suites de integração e funcional usam Testcontainers e rodam integralmente quando Docker está disponível; localmente elas são puladas se o daemon estiver indisponível.
