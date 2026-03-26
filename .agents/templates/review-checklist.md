# Template — Review Checklist

## Arquitetura
- [ ] Respeita Modular Monolith
- [ ] Não introduz acoplamento indevido entre módulos
- [ ] Mantém direção de dependências coerente

## Domínio
- [ ] Regras de negócio estão no domínio/aplicação, não em controllers
- [ ] Invariantes estão protegidas
- [ ] Contratos estão claros

## Segurança
- [ ] Tenant foi respeitado
- [ ] Autorização é explícita
- [ ] Deny-by-default preservado
- [ ] Audit logs foram considerados

## Qualidade
- [ ] TDD seguido
- [ ] Testes relevantes adicionados/ajustados
- [ ] Sem duplicação desnecessária
- [ ] Observabilidade mínima adicionada

## Documentação
- [ ] README revisado
- [ ] CHANGELOG revisado
- [ ] ADR necessária criada/atualizada
- [ ] Diagramas revisados se aplicável
