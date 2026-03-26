# Handoff

## Contexto
- Objetivo da tarefa: implementar a Phase 4 — Auditability do Nexus Platform.
- Fase atual: concluída.
- Escopo atendido: módulo `audit-logs`, migration append-only, bus interno mínimo, endpoint de consulta, publicação de eventos nos fluxos críticos, testes e atualização documental.

## O que foi feito
- módulo `audit-logs` implementado com entidade imutável, casos de uso de append/query, repositório PostgreSQL, controller HTTP e subscribers do bus interno
- migration `0004_audit_logs.sql` criada com tabela `audit_logs`, índices e triggers que bloqueiam `UPDATE` e `DELETE`
- `RequestCorrelationContext` e `InternalEventBus` adicionados para propagar `correlationId` e desacoplar a persistência de auditoria
- fluxos de identity, organizations, users e access-control passaram a publicar eventos auditáveis
- `AuthorizationGuard` passou a persistir `authorization_denied` sem alterar a resposta `403`
- suites unitárias ampliadas para domínio, append/query e mapeamento de subscribers; suites de integração e functional receberam cobertura nova para auditabilidade

## Arquivos alterados
- `src/modules/audit-logs/**/*`
- `src/shared/events/*`
- `src/shared/request-correlation/*`
- `src/modules/identity/**/*`
- `src/modules/organizations/**/*`
- `src/modules/users/**/*`
- `src/modules/access-control/**/*`
- `migrations/0004_audit_logs.sql`
- `test/**/*`
- `README.md`, `CHANGELOG.md`, `docs/*`, `.agents/decisions/0007-minimal-internal-event-bus-for-auditability.md`

## Decisões tomadas
- storage de auditoria é append-only no banco e não expõe nenhuma operação de update/delete em aplicação.
- `GET /audit-logs` exige `audit:view` e só aceita `tenantId` igual ao tenant ativo da sessão.
- falhas de audit append em ações mutáveis bem-sucedidas abortam a transação principal; falhas ao auditar `login_failed` e `authorization_denied` só geram log operacional.

## Testes
- Unit: `npm run test:unit` executado com sucesso.
- Integration: `npm run test:integration` executado; suites ficaram puladas por indisponibilidade do daemon Docker, mas os novos testes compilaram e a aplicação buildou com sucesso.
- Functional: `npm run test:functional` executado; suites ficaram puladas por indisponibilidade do daemon Docker, mas os novos testes compilaram e a aplicação buildou com sucesso.

## Impactos avaliados
- Tenant: queries e persistência de audit continuam tenant-aware; mismatch entre query e tenant ativo é negado.
- RBAC: endpoint de consulta protegido por `audit:view`; denials seguem deny-by-default e agora deixam trilha persistida.
- Audit logs: ações críticas existentes passam a gerar rows append-only com `correlationId`, `action`, `resource`, `metadata`, `userId` e `tenantId`.
- Observability: eventos `audit_log_appended` e `audit_log_query` adicionados, além do log operacional para falha de append em fluxos de negação.

## Riscos e pendências
- validar localmente as suites de integração e functional com Docker ativo para evidência end-to-end completa da migration `0004`
- evoluir a matriz de ações para `user_updated` e `user_deactivated` quando os fluxos correspondentes existirem no produto

## Próximos passos recomendados
1. Executar suites de integração e functional com Docker disponível para evidência local completa da Phase 4.
2. Evoluir a modelagem de eventos internos se o projeto avançar para novos subscribers além de auditoria.
