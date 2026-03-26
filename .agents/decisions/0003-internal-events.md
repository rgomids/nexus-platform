# ADR 0003 — Event-driven interno entre módulos

## Status
Aceita

## Contexto

Os módulos precisam reagir a mudanças sem acoplamento direto excessivo.

## Decisão

Usar bus de eventos interno para side effects e reações inter-módulo, preservando contratos explícitos para fluxos principais.

## Consequências

Positivas:
- reduz dependência direta
- facilita evolução modular

Negativas:
- exige observabilidade e idempotência
- pode esconder fluxo se usado de forma indevida

## Regras

- não usar eventos para mascarar lógica central obrigatória
- handlers devem ser testáveis
- payload deve carregar contexto mínimo necessário
