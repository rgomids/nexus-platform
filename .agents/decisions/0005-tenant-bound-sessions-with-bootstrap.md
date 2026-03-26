# ADR 0005 — Sessão vinculada a tenant com exceção controlada de bootstrap

## Status
Aceita

## Contexto

A Fase 2 precisa tornar o contexto de tenant explícito nas operações protegidas sem bloquear o primeiro fluxo de criação de tenant por um usuário recém-criado.

## Decisão

Adotar sessão autenticada com `organization_id` opcional:

- usuários com pelo menos uma membership ativa devem autenticar com `organizationId`
- a sessão e o token passam a carregar o tenant ativo
- usuários sem memberships ativas podem autenticar em modo bootstrap, com sessão sem tenant
- sessão bootstrap só consegue atravessar rotas autenticadas sem escopo de tenant, como `POST /organizations`

## Alternativas consideradas

- resolver tenant via header em toda request
- criar o primeiro tenant já no signup
- permitir sessão tenant-agnostic até seleção posterior

## Consequências

Positivas:
- tenant context vira explícito e verificável
- reduz risco de operação fora do tenant
- prepara o caminho para RBAC por tenant

Negativas:
- login passa a depender de `organizationId` em cenários multi-tenant
- existe um modo bootstrap especial que precisa ser protegido por guardrails

## Riscos

- uso indevido de sessão bootstrap fora do fluxo inicial
- divergência entre tenant do token e tenant da rota
- erro de implementação em guards pode reabrir vazamento cross-tenant
