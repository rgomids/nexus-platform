# ADR 0008 — Contrato HTTP de erro e boundary de observabilidade

## Status
Aceita

## Contexto

A Phase 5 precisa tornar a API previsível para consumidores e, ao mesmo tempo, elevar a rastreabilidade operacional sem introduzir novos módulos de negócio nem mensageria externa. A base já possuía validação por DTO, logger estruturado, contexto de correlação e bootstrap mínimo de OpenTelemetry, mas faltava um contrato público único para erros, métricas mínimas e instrumentação consistente dos fluxos críticos.

## Decisão

Adotar as seguintes regras no boundary da aplicação:

- todo erro HTTP não bem-sucedido retorna `{ error, message, correlation_id }`
- `correlation_id` no payload deve coincidir com o header `x-correlation-id`
- validações de request passam por uma `exceptionFactory` central e retornam `invalid_request`
- falhas técnicas retornam apenas `internal_error` com mensagem genérica
- `GET /metrics` expõe métricas Prometheus sem autenticação na aplicação
- spans manuais cobrem HTTP, banco, bus interno, login, RBAC, autorização e audit logs
- logs do boundary são estruturados, module-aware e sanitizam segredos, cookies e stack traces

## Alternativas consideradas

- manter múltiplos formatos de erro por origem (`HttpException`, `NexusError`, validação)
- introduzir coletor externo de métricas ou tracing já nesta fase
- proteger `GET /metrics` com autenticação da própria aplicação

## Consequências

Positivas:
- contrato de erro fica estável, simples e fácil de testar
- investigações operacionais passam a correlacionar request, log, trace, métrica e audit row
- a aplicação ganha sinais mínimos de engenharia sem elevar muito a complexidade

Negativas:
- o contrato antigo de erro deixa de ser compatível imediatamente
- `GET /metrics` exige disciplina operacional na borda da infraestrutura
- a telemetria continua básica e local, sem exporter distribuído definido nesta fase

## Regras

- não vazar senha, token, `Authorization`, cookies nem stack interna no boundary HTTP
- manter autorização deny-by-default e tenant context explícito em rotas protegidas
- qualquer mudança futura no contrato público de erro deve passar por ADR nova
- qualquer evolução para exporter externo, sampling avançado ou storage dedicado de métricas/traces deve ser reavaliada em ADR futura
