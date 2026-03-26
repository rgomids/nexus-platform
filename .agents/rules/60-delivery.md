# 60-delivery.md

## Entrega padrão

Toda entrega deve incluir, conforme impacto:

- código
- testes
- documentação
- observabilidade
- handoff
- status de fase

## Comandos padrão esperados

```make
make up
make down
make run
make test
make test-unit
make test-integration
```

Comandos adicionais recomendados:

```make
make lint
make format
make test-functional
make ci
```

## CI/CD

GitHub Actions deve validar no mínimo:

- instalação
- lint
- typecheck
- build
- testes unitários
- testes de integração necessários
- falha em qualquer gate bloqueia merge

## Pull Request checklist mínimo

- escopo claro
- motivação clara
- tenant impact avaliado
- authorization impact avaliado
- testes descritos
- docs atualizadas
- riscos e rollback claros quando necessário

## Checklist pós-implementação

- regras de domínio implementadas
- testes escritos e passando
- logs/traces adicionados
- autorização validada
- tenant respeitado
- documentação atualizada
- handoff gerado

## Critério de aceitação operacional

Não declare concluído se faltar qualquer um destes itens críticos:

- proteção de tenant
- proteção de autorização
- evidência de teste
- atualização documental relevante
