# ADR 0002 — Multi-tenancy como regra central

## Status
Aceita

## Contexto

O principal risco funcional e de segurança do Nexus Platform é vazamento de dados entre tenants.

## Decisão

Multi-tenancy será tratada como restrição central do sistema, com `tenant_id` obrigatório em entidades sensíveis e filtragem mandatória em queries.

## Consequências

Positivas:
- reduz risco de vazamento
- padroniza desenho de repositórios e policies

Negativas:
- exige disciplina em todo fluxo
- aumenta rigor em testes e revisões

## Guardrails

- ausência de tenant context gera erro
- isolamento nunca é opcional
- testes negativos de tenant leakage são obrigatórios
