# Phase Status

## Fase atual
- Nome: Phase 4 — Auditability
- Status: done
- Responsável: Codex
- Data: 2026-03-26

## Objetivo da fase
- Introduzir trilha de auditoria append-only com contexto completo, query protegida por tenant/RBAC e desacoplamento por eventos internos síncronos.

## Entradas
- `AGENTS.md` e regras em `.agents/rules/*`
- contexto do produto, mapa de módulos e ADRs 0001, 0002, 0003, 0004, 0005 e 0006
- página `Nexus Platform` e documentação complementar no Notion

## Saídas esperadas
- módulo `audit-logs` funcional com entidade imutável, casos de uso, repositório PostgreSQL e endpoint `GET /audit-logs`
- migration `0004_audit_logs.sql` com proteção append-only em storage
- bus interno mínimo para publicação/assinatura de eventos auditáveis
- ações críticas existentes emitindo eventos e persistindo audit rows
- documentação operacional atualizada para a nova fase

## Bloqueios
- daemon Docker indisponível no ambiente local durante a validação desta execução, então suites de integração e functional permaneceram puladas localmente após compilar com os novos testes

## Decisões / observações
- `audit_logs.user_id` e `audit_logs.tenant_id` aceitam `null` para cenários que genuinamente não resolvem ator ou tenant, como login falho ou sessão bootstrap.
- o bus interno é síncrono e in-process para manter atomicidade e simplicidade; não há mensageria externa nesta fase.
- mutações bem-sucedidas auditadas persistem o log na mesma transação da ação principal quando a operação altera estado.
