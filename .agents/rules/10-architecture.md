# 10-architecture.md

## Arquitetura mandatória

O Nexus Platform segue:

- **Modular Monolith**
- **DDD**
- **Clean Architecture**
- **Event-driven interno**
- **Multi-tenancy obrigatório**
- **RBAC**
- **Audit logs imutáveis**

## Estrutura macro

```text
src/
  bootstrap/
  modules/
    identity/
    organizations/
    users/
    access-control/
    audit-logs/
  shared/
  jobs/
```

## Papel das camadas

### Domain

Contém:

- entidades
- value objects
- invariantes
- políticas de domínio
- domain services quando necessários
- eventos de domínio

Restrições:

- não depende de NestJS
- não depende de banco
- não depende de transporte HTTP
- não depende de ORM

### Application

Contém:

- use cases
- orquestração
- portas
- DTOs internos de aplicação
- coordenação transacional conforme desenho adotado

Restrições:

- depende do domínio e de abstrações
- não deve conter detalhes de framework ou banco

### Infrastructure

Contém:

- controllers
- presenters
- repositórios concretos
- ORM mappings
- adapters externos
- config e bootstrap específicos
- subscribers/listeners técnicos

Restrições:

- não colocar regra de negócio aqui
- não decidir autorização aqui sem policy explícita do módulo

## Modular Monolith — regras

- Cada módulo possui autonomia interna.
- Comunicação entre módulos deve ocorrer por contrato explícito.
- É proibido importar classes internas de outro módulo por conveniência.
- Eventos internos são preferíveis para efeitos colaterais e desacoplamento.
- Extração futura para serviço externo deve ser possível sem reescrever o domínio.

## Módulos centrais

### Identity

Responsável por autenticação e prova de identidade.

### Organizations

Responsável pela representação do tenant e estrutura organizacional.

### Users

Responsável por usuários e vínculos operacionais no tenant.

### Access Control

Responsável por roles, permissions, assignments e decisão final de autorização.

### Audit Logs

Responsável por trilha imutável e consultável de ações relevantes.

## Regras de borda entre módulos

- Module A pode consumir contrato público de Module B.
- Module A não pode acessar repositório concreto de Module B.
- Module A não pode mutar entidades de Module B.
- Eventos entre módulos devem carregar contexto mínimo necessário.
- Mudanças em contratos inter-módulo exigem revisão explícita.

## Event-driven interno

Use eventos internos quando:

- um módulo precisa reagir sem acoplamento direto
- há side effects não essenciais ao commit principal
- a reação pode ser observada e testada isoladamente

Não use eventos para:

- esconder fluxo principal obrigatório
- evitar desenhar um contrato claro
- introduzir comportamento implícito imprevisível

## Diretrizes de evolução

Extrair microserviço só quando houver evidência forte de:

- necessidade operacional distinta
- escalabilidade assimétrica recorrente
- autonomia de deploy indispensável
- desacoplamento de domínio já maduro

Mensageria externa só quando o bus interno não cobrir requisitos de confiabilidade, integração ou throughput de forma aceitável.

Cache distribuído só quando houver medição que demonstre gargalo real e invalidação conhecida.
