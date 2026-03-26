# Phase Status

## Fase atual
- Nome: Phase 3 — RBAC
- Status: done
- Responsável: Codex
- Data: 2026-03-26

## Objetivo da fase
- Introduzir autorização explícita por tenant com roles, permissions, deny-by-default e proteção automática dos endpoints sensíveis.

## Entradas
- `AGENTS.md` e regras em `.agents/rules/*`
- contexto do produto, mapa de módulos e ADRs 0001, 0002, 0003, 0004 e 0005
- página `Nexus Platform` e documentação complementar no Notion

## Saídas esperadas
- módulo `access-control` funcional com `roles`, `permissions`, `role_permissions` e `user_role_assignments`
- política de autorização explícita e deny-by-default
- guards reutilizáveis para tenant ativo e permissão obrigatória
- migration SQL com catálogo tenant-local e backfill de `organization_admin`
- documentação operacional atualizada para a nova fase

## Bloqueios
- daemon Docker indisponível no ambiente local durante a validação desta execução, então suites de integração e functional permaneceram puladas localmente

## Decisões / observações
- `permissions` são tenant-local para manter consistência literal com o requisito de tabelas RBAC tenant-aware.
- `organization_admin` é o role padrão de bootstrap e backfill para preservar o comportamento operacional dos tenants existentes.
- o fluxo de tenant continua obrigatório antes da autorização; membership ativa segue como pré-condição para entrar no tenant, e RBAC decide a ação final.
