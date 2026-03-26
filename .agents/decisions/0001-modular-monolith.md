# ADR 0001 — Modular Monolith como arquitetura base

## Status
Aceita

## Contexto

O Nexus Platform precisa equilibrar velocidade de entrega, consistência de regras e clareza de fronteira entre domínios centrais.

## Decisão

Adotar **Modular Monolith** com módulos de negócio explícitos dentro de um único deploy.

## Consequências

Positivas:
- menor custo operacional inicial
- transações e consistência simplificadas
- evolução mais rápida

Negativas:
- disciplina de fronteiras é obrigatória
- risco de acoplamento interno se governança falhar

## Critérios para revisão futura

Revisar somente se houver pressão real por:
- deploy independente
- escalabilidade assimétrica
- autonomia operacional entre domínios
