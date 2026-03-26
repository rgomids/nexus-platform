# 50-security.md

## Segurança operacional obrigatória

As áreas críticas do Nexus Platform são:

- multi-tenancy
- autenticação
- RBAC
- auditoria
- configuração
- observabilidade sem vazamento

## Regras de multi-tenancy

- toda entidade sensível deve carregar `tenant_id`
- toda query sensível deve filtrar por `tenant_id`
- ausência de tenant context válido deve gerar erro
- isolamento por tenant nunca é opcional
- jobs e eventos também devem respeitar tenant quando aplicável
- testes de tenant leakage são obrigatórios

## Regras de autorização

Fluxo obrigatório:

1. autenticar ator
2. resolver tenant context
3. carregar roles/assignments
4. resolver permissions/policies
5. aplicar decisão final

Princípios:

- **deny-by-default**
- autorização é obrigatória em toda ação protegida
- nenhuma rota sensível pode depender apenas de autenticação
- política deve ser explícita e testável

## Audit logs

- append-only
- sem update destrutivo
- sem delete lógico para trilha oficial
- registrar ator, tenant, ação, alvo, timestamp, correlação e payload sanitizado
- falha em auditoria crítica deve ser tratada explicitamente

## Segredos e configuração

- não commitar segredos
- usar `.env` apenas localmente e de forma controlada
- separar variáveis por ambiente
- validar variáveis obrigatórias no bootstrap
- evitar defaults inseguros em produção

## Logs e traces

- logs estruturados
- correlation id obrigatório
- sem dados sensíveis desnecessários
- mascarar ou omitir segredos, tokens e PII quando necessário

## Hurdles comuns e prevenção

### Vazamento de tenant

Prevenção:
- filtros centrais
- contratos de repositório tenant-aware
- testes negativos
- revisão de query

### Autorização incorreta

Prevenção:
- policy explícita
- deny-by-default
- teste funcional de permissão insuficiente

### Acoplamento indevido

Prevenção:
- contratos formais
- revisão de imports entre módulos
- eventos internos quando apropriado

### Ausência de logs/auditoria

Prevenção:
- checklist de entrega
- requisitos de observabilidade por fluxo
- revisão de ações sensíveis
