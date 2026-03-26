# Phase Status

## Fase atual
- Nome: Phase 1 — Core Identity
- Status: done
- Responsável: Codex
- Data: 2026-03-25

## Objetivo da fase
- Validar a arquitetura modular com um fluxo funcional real de criação de conta, autenticação por email/senha e invalidação de sessão.

## Entradas
- `AGENTS.md` e regras em `.agents/rules/*`
- contexto do produto, mapa de módulos e ADRs 0001, 0002, 0003 e 0004
- página `Nexus Platform` no Notion

## Saídas entregues
- módulo `users` com contrato interno mínimo
- módulo `identity` com domínio, casos de uso, controllers e persistência
- migrations SQL para `users`, `accounts`, `credentials` e `sessions`
- validação HTTP global e tratamento padronizado de erro
- logs estruturados para `account_created`, `login_succeeded`, `login_failed` e `session_invalidated`
- documentação operacional atualizada para a fase

## Bloqueios
- daemon Docker indisponível no ambiente local durante a validação desta execução, então suites de integração e funcional permaneceram puladas localmente

## Decisões / observações
- `users` passou a ser o dono do registro mínimo de usuário e `identity` consome apenas o contrato interno exportado.
- JWT foi adotado apenas como contrato de transporte; a revogação real continua sendo determinada pela tabela `sessions`.
- multi-tenancy, RBAC e auditoria completa permanecem fora do escopo desta fase.
