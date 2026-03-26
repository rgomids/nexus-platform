# 30-testing.md

## TDD é obrigatório

Toda mudança deve começar por comportamento esperado, estratégia de teste e critérios de aceitação.

Sequência padrão:

1. definir comportamento
2. escrever teste que falha
3. implementar mínimo necessário
4. refatorar com segurança
5. validar suite relevante

## Tipos de teste obrigatórios

### Unit

Cobrem:

- entidades
- value objects
- policies
- domain services
- use cases isolados

Objetivo:

- comportamento
- invariantes
- regras de autorização e tenant em nível lógico

### Integration

Cobrem:

- repositórios
- persistência PostgreSQL
- adapters
- integração entre aplicação e infraestrutura
- emissão/consumo de eventos internos quando pertinente

Obrigatório usar **Testcontainers** para integrações relevantes com banco e dependências locais.

### Functional

Cobrem:

- fluxos expostos via HTTP ou interface equivalente
- autenticação
- tenant context
- autorização
- auditoria
- cenários de erro importantes

## Regras de qualidade de teste

- teste comportamento, não implementação acidental
- cubra caminhos felizes e negativos
- sempre tenha cenário de vazamento de tenant quando aplicável
- sempre tenha cenário deny-by-default em autorização
- valide persistência e imutabilidade em audit logs
- prefira fixtures explícitas e pequenas

## Cobertura esperada

A meta não é inflar percentual; a meta é cobrir áreas críticas:

- tenant isolation
- authorization decision
- domain invariants
- eventos relevantes
- audit trail
- integrações com banco

## Estrutura sugerida

```text
test/
  unit/
  integration/
  functional/
```

ou co-localizada por módulo, desde que a distinção permaneça clara.

## Gatilhos obrigatórios para novos testes

- nova regra de domínio
- nova policy
- novo repositório
- mudança de contrato entre módulos
- nova ação auditável
- qualquer mudança em fluxo autenticado/autorizado/multi-tenant
