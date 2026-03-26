# AGENTS.md

# Nexus Platform — roteador principal para agentes

Este arquivo é o ponto de entrada operacional para agentes automatizados e desenvolvedores humanos no repositório do **Nexus Platform**.

## Missão do projeto

Construir e evoluir uma plataforma backend multi-tenant para identidade, organizações, usuários, controle de acesso e trilha de auditoria imutável com:

- **Node.js 24 LTS**
- **TypeScript**
- **NestJS**
- **PostgreSQL**
- **OpenTelemetry**
- **Docker**
- **GitHub Actions**

Princípios obrigatórios:

- **Modular Monolith**
- **DDD**
- **Clean Architecture**
- **Event-driven interno**
- **Multi-tenancy como regra central**
- **RBAC**
- **Audit logs imutáveis**
- **TDD obrigatório**

## Como usar este diretório

Use `AGENTS.md` como índice. Não concentre aqui regras detalhadas. Carregue contexto sob demanda na seguinte ordem.

### Ordem de leitura padrão

1. `AGENTS.md`
2. `.agents/rules/00-global.md`
3. `.agents/rules/10-architecture.md`
4. `.agents/rules/20-coding.md`
5. `.agents/rules/30-testing.md`
6. `.agents/rules/50-security.md`
7. `.agents/rules/60-delivery.md`
8. `.agents/context/*.md` relevantes para a tarefa
9. `.agents/decisions/*.md` relevantes ao impacto da mudança
10. `.agents/templates/*.md` para execução, handoff e revisão

### Política de contexto mínimo

Leia apenas o necessário para executar com segurança.

- Mudança pequena em código: `00-global`, `20-coding`, `30-testing`, contexto do módulo afetado.
- Mudança de arquitetura ou borda entre módulos: adicione `10-architecture`, `module-map`, ADRs relevantes.
- Mudança com risco de segurança, tenant, RBAC ou auditoria: adicione `50-security` e ADRs correspondentes.
- Entrega: sempre valide com `60-delivery` antes de concluir.

## Convenção de fases

Use fases curtas, verificáveis e reversíveis.

- **Fase 0 — Descoberta**: entender contexto, risco e escopo
- **Fase 1 — Design**: definir abordagem, contratos e impactos
- **Fase 2 — Implementação**: aplicar mudança mínima necessária
- **Fase 3 — Validação**: testes, observabilidade e revisão
- **Fase 4 — Entrega**: documentação, handoff e pendências

Estado atual da fase deve ser registrado usando `.agents/templates/phase-status.md`.

## Regras de operação

- Nunca trate isolamento por tenant como opcional.
- Nunca trate autorização como implícita.
- Nunca mova lógica de negócio para controllers, DTOs, decorators ou ORMs.
- Nunca acesse internals de outro módulo diretamente; use contrato explícito.
- Sempre proponha ou escreva testes antes de alterar código.
- Sempre atualize README, CHANGELOG e diagramas/ADRs quando a mudança exigir.
- Sempre registre hipótese, fato, decisão, risco e pendência quando houver lacuna.

## Regra de handoff

Ao encerrar uma tarefa, gere um handoff compacto usando `.agents/templates/handoff.md` contendo:

- fase atual
- objetivo concluído
- arquivos alterados
- decisões tomadas
- testes executados
- riscos e pendências
- próximos passos

## Validação antes de concluir qualquer tarefa

Antes de declarar uma tarefa concluída, verifique no mínimo:

- tenant foi respeitado em leitura e escrita
- autorização foi validada com deny-by-default
- logs/traces relevantes foram adicionados
- testes unitários e integrações pertinentes existem
- documentação operacional foi atualizada
- não houve acoplamento indevido entre módulos

## Quando consultar docs do projeto, código ou fontes externas

Consulte primeiro:

1. código-fonte existente do módulo afetado
2. `.agents/context/*.md`
3. `.agents/decisions/*.md`
4. README/CHANGELOG/diagramas do repositório

Consulte documentação externa de stack apenas quando necessário para comportamento específico de NestJS, Node, PostgreSQL, OpenTelemetry, Docker ou GitHub Actions.

## Estrutura esperada deste engine

```text
AGENTS.md
.agents/
  rules/
  templates/
  skills/
  subagents/
  context/
  decisions/
```

## Ordem sugerida de uso dos arquivos

1. `AGENTS.md`
2. regras globais e de arquitetura
3. contexto do produto e mapa de módulos
4. ADRs relevantes
5. template de task brief
6. implementação e testes
7. checklist de revisão
8. handoff

## Como registrar a fase atual

Crie ou atualize um artefato baseado em `.agents/templates/phase-status.md` sempre que iniciar ou concluir uma fase relevante.

## Como manter este engine enxuto

- mantenha `AGENTS.md` como roteador, não como depósito
- mova detalhes por responsabilidade para `rules`, `context` ou `decisions`
- crie `skills` apenas para fluxos repetitivos
- crie `subagents` apenas quando houver ganho real de isolamento de contexto
- revise arquivos pouco usados e consolide duplicações

## O que revisar antes de usar em produção

- cobertura das regras de tenant, RBAC e auditoria
- aderência da estrutura real do repositório aos contratos descritos
- consistência entre ADRs, README, diagramas e código
- pipelines de CI com gates ativos
- observabilidade mínima operacional habilitada
