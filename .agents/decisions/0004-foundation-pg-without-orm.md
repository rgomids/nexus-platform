# ADR 0004 — PostgreSQL com `pg` sem ORM na fundação

## Status
Aceita

## Contexto

A Fase 0 precisa comprovar conectividade com PostgreSQL e lifecycle operacional da aplicação sem antecipar decisões de modelagem, schema ownership, migrations ou escolha definitiva de ORM.

## Decisão

Usar `pg` diretamente na fundação para criar o pool de conexões, validar `SELECT 1` no bootstrap e encerrar o pool no shutdown.

## Alternativas consideradas

- TypeORM desde o início
- Prisma desde o início

## Consequências

Positivas:
- evita acoplamento prematuro a ORM e codegen
- mantém a fundação pequena e verificável
- preserva liberdade para escolher a abordagem de persistência quando o domínio existir

Negativas:
- futuras fases ainda precisarão decidir strategy de mapping e migrations
- não existe camada de repositório funcional nesta fase

## Riscos

- a escolha de ORM pode exigir ajuste na borda de persistência futura
- times podem assumir que a ausência de ORM é uma decisão permanente, quando ela é apenas de fundação
