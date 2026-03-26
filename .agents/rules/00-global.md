# 00-global.md

## Objetivo

Definir o comportamento operacional obrigatório para qualquer agente ou desenvolvedor atuando no Nexus Platform.

## Regras globais

1. **Faça mudanças pequenas, reversíveis e verificáveis.**
2. **TDD é obrigatório.** Comece pelo comportamento esperado e pela estratégia de teste.
3. **Trate multi-tenancy, autorização e auditabilidade como requisitos primários.**
4. **Use defaults conservadores quando faltar contexto.** Marque explicitamente como hipótese.
5. **Não infira comportamento crítico sem evidência em código, ADR ou regra.**
6. **Evite mudanças transversais desnecessárias.**
7. **Nunca conclua tarefa sem validar impacto operacional.**

## Classificação de informação

Ao registrar algo, use estas categorias:

- **Fato**: confirmado por código, configuração, ADR ou documentação vigente.
- **Hipótese**: suposição temporária usada por falta de dado.
- **Decisão**: escolha explicitamente adotada.
- **Risco**: consequência negativa potencial.
- **Pendência**: item ainda aberto.

## Regras de escopo

- Não faça refatoração ampla escondida dentro de task funcional.
- Não altere contratos públicos sem registrar impacto.
- Não introduza nova dependência sem justificar valor, custo e risco.
- Não crie abstração “para o futuro” sem caso real.

## Definição de pronto mínima

Uma mudança só está pronta quando:

- comportamento requerido existe
- testes cobrem o comportamento crítico
- tenant e autorização foram avaliados
- observabilidade mínima foi considerada
- documentação impactada foi atualizada
- handoff foi registrado

## Anti-padrões proibidos

- controller gordo
- service genérico concentrando regras de vários módulos
- acesso direto entre repositórios de módulos distintos
- query sem filtro de tenant em dados sensíveis
- autorização ausente ou implícita
- eventos usados para mascarar dependência direta confusa
- “shared” virando depósito de domínio
