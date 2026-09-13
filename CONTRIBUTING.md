# Contribuindo

Obrigado por contribuir com as Parcele+ Skills! Este repositório é só conteúdo (Markdown + snippets de código de referência) — não há build nem testes automatizados de execução.

## Estrutura

- `rules/<linguagem>/<modulo>.md` — regra de integração por linguagem e módulo (`orders`, `simulations`, `customers`, `webhooks`, `security`).
- `rules/agent.md` — uso direto da API via `curl`, independente de linguagem.
- `examples/<linguagem>/<modulo>.<ext>` — snippet de referência (não é um projeto completo — para código testado de verdade contra staging, veja `samples/` no repositório do SDK correspondente).
- `tools/`, `utils/` — documentação de apoio (autenticação, ambientes, FAQ, glossário).

## Ao adicionar ou editar uma regra

1. Verifique a API pública real do SDK correspondente (nomes de classe/método podem mudar entre versões) antes de escrever ou atualizar um exemplo.
2. Siga o padrão de seção usado nos arquivos existentes: `## Structs & Types` (ou equivalente), `## Features`, exemplo de código, `## Error Handling and Edge Cases`.
3. Atualize o índice em [`SKILL.md`](SKILL.md) se adicionar um arquivo novo.
4. Regenere o [`SKILL-CONSOLIDATED.md`](SKILL-CONSOLIDATED.md) (arquivo único com tudo concatenado, para ferramentas que só aceitam uma skill):

   ```bash
   node scripts/build-consolidated.mjs
   ```

## Pull Requests

Este repositório é público — qualquer pessoa pode abrir um PR. Todo merge exige aprovação de alguém dos times Admin ou Backend da Twila Digital (`CODEOWNERS`), e `production` é protegida (sem push direto, mesmo por admins).

## Dúvidas

Abra uma issue neste repositório, ou veja [tools/ecosystem.md](tools/ecosystem.md) para os canais oficiais.
