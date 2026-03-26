# 70-phase-governance.md

## Governança por fase

Use esta governança para manter execução previsível.

## Fase 0 — Descoberta

Objetivo:
- entender contexto, restrições, risco e impacto

Saídas mínimas:
- problema resumido
- módulos afetados
- hipóteses
- riscos principais
- template `task-brief` preenchido

## Fase 1 — Design

Objetivo:
- definir abordagem mínima e segura

Saídas mínimas:
- contrato da mudança
- impacto em tenant/RBAC/auditoria
- decisão sobre evento/integração
- necessidade de ADR

## Fase 2 — Implementação

Objetivo:
- aplicar mudança mínima necessária com TDD

Saídas mínimas:
- testes iniciais
- código aderente às regras
- sem acoplamento indevido
- observabilidade mínima

## Fase 3 — Validação

Objetivo:
- comprovar comportamento e segurança operacional

Saídas mínimas:
- testes executados
- checklist de revisão
- validação de docs
- validação de regressão relevante

## Fase 4 — Entrega

Objetivo:
- consolidar contexto para continuidade segura

Saídas mínimas:
- handoff
- phase status atualizado
- pendências e riscos documentados

## Regra de avanço

Não avance de fase quando houver bloqueio crítico em:

- multi-tenancy
- autorização
- auditoria
- integridade de domínio
- testes essenciais
