# 40-documentation.md

## Objetivo

Garantir que a documentação acompanhe a evolução real do sistema.

## Regras obrigatórias

- **README** deve refletir estado atual do projeto, setup, execução e visão geral.
- **CHANGELOG** deve registrar mudanças relevantes e de impacto operacional.
- **ADRs** são obrigatórias para decisões arquiteturais relevantes.
- Diagramas devem ser mantidos em **Mermaid**, preferencialmente no estilo **C4 Model**.
- Documentação não deve contradizer código e ADRs.

## Quando atualizar documentação

Atualize documentação quando houver:

- novo módulo
- mudança de contrato
- mudança relevante de fluxo
- nova decisão de arquitetura
- novo requisito operacional
- mudança de CI/CD
- mudança importante de observabilidade, tenant, RBAC ou auditoria

## Documentos mínimos esperados

- README
- CHANGELOG
- ADRs em diretório apropriado
- diagramas de contexto/container/componente relevantes
- este engine `.agents/*`

## Regras para ADR

Toda ADR deve responder:

- contexto
- decisão
- alternativas consideradas
- consequências
- riscos
- status

## Regra de consistência

Ao concluir uma tarefa, revise se:

- README precisa ajuste
- CHANGELOG precisa entrada
- diagrama precisa atualização
- ADR precisa ser criada ou alterada
