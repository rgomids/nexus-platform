# Handoff

## Contexto
- Objetivo da tarefa: implementar a Phase 3 — RBAC por tenant do Nexus Platform.
- Fase atual: concluída.
- Escopo atendido: módulo `access-control`, guards de autorização, migration RBAC, endpoints de roles/permissões/assignments, testes e atualização documental.

## O que foi feito
- módulo `access-control` implementado com `roles`, `permissions`, `role_permissions`, `user_role_assignments` e política explícita de autorização
- `CreateOrganizationUseCase` passou a bootstrapar o catálogo RBAC do tenant e o role `organization_admin`
- guards `ActiveTenantGuard` e `AuthorizationGuard` adicionados ao fluxo de segurança
- endpoints de `organizations` protegidos por permissões explícitas e novas rotas RBAC session-scoped adicionadas
- migration `0003_access_control_rbac.sql` criada com catálogo tenant-local e backfill de `organization_admin`

## Arquivos alterados
- `src/modules/access-control/**/*`
- `src/shared/auth/*`
- `src/shared/tenancy/*`
- `src/modules/organizations/**/*`
- `migrations/0003_access_control_rbac.sql`
- `test/**/*`
- `README.md`, `CHANGELOG.md`, `docs/*`, `.agents/decisions/0006-rbac-tenant-local-permissions-and-admin-backfill.md`

## Decisões tomadas
- `permissions` repetem código por tenant em vez de usar catálogo global.
- backfill de `organization_admin` foi aplicado a todos os memberships ativos existentes.
- `POST /organizations` permanece fora de RBAC para não quebrar o bootstrap do primeiro tenant.
- a ausência de permissão sempre retorna `403 Permission denied`.

## Testes
- Unit: `npm run test:unit` executado com sucesso.
- Integration: `npm run test:integration` executado; suites ficaram puladas por indisponibilidade do daemon Docker.
- Functional: `npm run test:functional` executado; suites ficaram puladas por indisponibilidade do daemon Docker.

## Impactos avaliados
- Tenant: validação continua obrigatória antes de qualquer decisão RBAC.
- RBAC: deny-by-default ativo em endpoints protegidos e gerenciamento session-scoped implementado.
- Audit logs: append-only ainda pendente para a próxima fase; nesta fase entraram apenas logs estruturados.
- Observability: eventos estruturados de criação de role, grant de permissão, assignment e decisão allow/deny adicionados.

## Riscos e pendências
- validar as suites de integração e functional com Docker ativo para evidência local completa do fluxo HTTP e da migration `0003`
- decidir na próxima fase como auditar mudanças RBAC em storage append-only
- evoluir a modelagem de papéis padrão além de `organization_admin` quando houver novos fluxos de produto

## Próximos passos recomendados
1. Implementar Phase 4 com audit log append-only para login, mudanças RBAC e ações críticas.
2. Validar as suites com Docker ativo localmente ou na CI para evidência end-to-end completa.
