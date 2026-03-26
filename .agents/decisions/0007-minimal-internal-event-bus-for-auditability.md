# ADR 0007 — Bus interno mínimo para auditabilidade

## Status
Aceita

## Contexto

A Phase 4 precisa persistir audit logs append-only sem acoplar fortemente `identity`, `organizations`, `users` e `access-control` ao módulo `audit-logs`. O repositório já tinha a diretriz de event-driven interno, mas ainda não possuía um bus implementado.

## Decisão

Adotar um bus interno **mínimo, síncrono e in-process** com as seguintes regras:

- publishers disparam eventos no mesmo processo e no mesmo call stack da ação principal
- subscribers são registrados no bootstrap do módulo consumidor
- a auditoria consome esses eventos e persiste rows append-only
- em mutações bem-sucedidas, o append auditável ocorre dentro da mesma transação da operação principal sempre que houver alteração de estado

## Alternativas consideradas

- chamadas explícitas diretas do módulo de auditoria em todos os use cases
- introdução imediata de mensageria externa
- outbox completo já nesta fase

## Consequências

Positivas:
- reduz acoplamento direto entre módulos e `audit-logs`
- mantém implementação simples e observável
- preserva atomicidade local sem infraestrutura externa

Negativas:
- o bus ainda não oferece durabilidade fora do processo
- handlers precisam continuar pequenos e previsíveis para não esconder fluxo crítico

## Regras

- usar o bus apenas para side effects claramente secundários ao fluxo principal
- não introduzir assíncrono distribuído nem retry nesta fase
- qualquer evolução para múltiplos consumidores ou entrega garantida deve ser reavaliada em ADR futura
