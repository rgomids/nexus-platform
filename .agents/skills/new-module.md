# Skill — Criar novo módulo

## Quando usar

Use esta skill ao criar um novo módulo de negócio no Nexus Platform.

## Passos

1. Definir responsabilidade do módulo em uma frase.
2. Listar entidades, value objects, policies e casos de uso.
3. Definir contrato público do módulo.
4. Verificar impactos em tenant, RBAC, auditoria e eventos.
5. Criar testes de domínio e integração mínimos.
6. Atualizar `module-map`, README, CHANGELOG e ADR se necessário.

## Checklist

- [ ] responsabilidade única clara
- [ ] fronteira sem sobreposição relevante
- [ ] tenant model definido
- [ ] policies definidas
- [ ] eventos internos necessários definidos
- [ ] observabilidade mínima definida
