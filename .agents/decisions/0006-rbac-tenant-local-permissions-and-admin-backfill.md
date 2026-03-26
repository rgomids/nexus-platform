# ADR 0006 — Permissions tenant-local com backfill de `organization_admin`

## Status
Aceita

## Contexto

A Fase 3 introduz RBAC real no Nexus Platform. O sistema já possuía tenants, memberships e sessão vinculada a tenant, mas ainda não tomava decisões explícitas de autorização. Ao ativar deny-by-default, havia dois riscos principais:

- criar exceções de tenant no catálogo de permissões
- bloquear imediatamente tenants já existentes por falta de roles atribuídas

## Decisão

- `permissions` serão persistidas por tenant, mesmo com códigos repetidos entre tenants.
- cada tenant recebe o role padrão `organization_admin`.
- a migration de rollout faz backfill de `organization_admin` para todos os memberships ativos existentes.
- o bootstrap de um novo tenant cria o catálogo padrão de permissões, o role `organization_admin` e a atribuição ao criador na mesma transação do fluxo de criação da organização.

## Alternativas consideradas

- catálogo global de permissões com escopo apenas em `roles` e `assignments`
- rollout sem backfill, exigindo configuração manual em todos os tenants
- atribuir o role administrativo apenas ao criador original do tenant

## Consequências

Positivas:
- mantém a regra literal de tabelas RBAC tenant-aware
- reduz risco de vazamento ou vínculo cross-tenant acidental
- preserva o comportamento operacional atual durante a ativação de deny-by-default

Negativas:
- repete o catálogo de permissões por tenant
- aumenta o volume de dados de bootstrap
- exige manter o catálogo padrão sincronizado entre migration e bootstrap de aplicação

## Riscos

- divergência futura entre tenants se o catálogo padrão mudar sem migration ou bootstrap correspondente
- uso excessivo de `organization_admin` se o produto não evoluir para papéis mais específicos
- falsa sensação de auditoria completa antes da fase append-only de audit logs
