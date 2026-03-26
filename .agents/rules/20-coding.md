# 20-coding.md

## Padrões obrigatórios de código

- TypeScript em **strict mode**
- coesão alta e acoplamento baixo
- nomes orientados ao domínio
- funções e classes com responsabilidade clara
- duplicação relevante deve ser removida
- código deve ser legível sem depender de “magia” de framework

## Regras obrigatórias

### Controllers

- recebem request
- validam entrada no nível de borda
- chamam use case
- devolvem resposta

Controllers **não podem**:

- conter regra de negócio
- consultar banco diretamente
- decidir autorização por lógica ad hoc
- orquestrar vários módulos sem passar por aplicação/contrato

### Use Cases

Use cases devem:

- representar uma intenção de negócio clara
- orquestrar domínio, políticas e portas
- validar pré-condições de aplicação
- produzir resultado explícito

### Entidades e Value Objects

- invariantes devem viver no domínio
- construtores/factories devem impedir estado inválido
- preferir VO para conceitos com identidade implícita por valor
- evitar setters abertos

### Repositórios

- expor operações orientadas ao domínio
- aplicar tenant scoping obrigatório
- evitar consultas genéricas demais
- não vazar detalhes de ORM para o domínio

## Acesso entre módulos

Proibido:

- importar `internal` de outro módulo
- ler tabela de outro módulo por atalho
- chamar serviço concreto de outro módulo

Permitido:

- contrato explícito
- porta formal
- evento interno
- query model compartilhado quando formalmente definido

## Patterns aprovados

- **Repository**
- **Use Case**
- **Factory**
- **Policy**
- **Specification** quando a complexidade justificar
- **Event Publisher/Subscriber**
- **Adapter**
- **Mapper** entre camadas quando necessário

## Patterns a evitar

- god service
- util genérico que concentra regra
- base class excessiva
- decorators que escondem regra crítica
- abstração prematura

## Erros e exceções

- use erros semânticos claros
- diferencie erro de domínio, aplicação e infraestrutura
- não exponha detalhes internos sensíveis na borda HTTP
- falha de tenant ou autorização deve falhar de forma explícita e segura

## Estilo de implementação

- prefira composição a herança
- prefira interfaces pequenas
- prefira mudanças locais a refatorações globais
- preserve compatibilidade quando possível
