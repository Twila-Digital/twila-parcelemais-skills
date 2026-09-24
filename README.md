<div align="center">

# Parcele+ Skills

Conjunto de conhecimentos, regras e ferramentas especializadas para potencializar a integração com o **Parcele+** através de **IAs** e automações.

## O que são SKILLS?

Skills são pacotes de contexto especializado que ensinam **agentes de IA** (como **Cursor**, **Claude Code** e similares) e desenvolvedores sobre as melhores práticas, regras de negócio e padrões técnicos do ecossistema Parcele+. Funcionam como um "manual de instruções inteligente".

## Para que servem?

</div>

- **Contexto Preciso:** informações atualizadas sobre a API e os 6 SDKs oficiais (.NET, Java, Node.js, Python, PHP, Go).
- **Padronização:** garante que o código gerado siga as convenções de cada SDK.
- **Aceleração:** reduz o tempo de leitura de documentação extensa através de regras diretas.
- **Exemplos Práticos:** implementações de referência nas 6 linguagens suportadas.
- **Agent Mode:** permite que a IA opere a API diretamente via `curl`, sem escrever nenhum código.

<div align="center">

## Como Instalar

As skills são consumidas principalmente por **IDEs** e **agentes de IA** que suportam leitura de contexto local.

</div>

1. **Clonagem:** clone este repositório em sua máquina.
2. **Contexto da IA:** adicione a pasta deste repositório ao contexto do seu editor (ex.: `.cursorrules`, configuração de projeto do Claude Code).
3. **Skill única:** se sua ferramenta só aceita um arquivo, use [`SKILL-CONSOLIDATED.md`](SKILL-CONSOLIDATED.md) (tudo concatenado) ou [`SKILL-AGENT.md`](SKILL-AGENT.md) (só o modo de API direta).

<div align="center">

## Como Usar

A estrutura é dividida para facilitar a descoberta.

</div>

- **[`rules/`](rules):** regras de integração por linguagem (.NET/Java/Node/Python/PHP/Go) e por módulo (Orders, Simulations, Customers, Establishments, Webhooks, Security), mais [`rules/agent.md`](rules/agent.md) para uso direto da API.
- **[`examples/`](examples):** implementações de referência prontas para uso, por linguagem.
- **[`tools/`](tools):** documentação técnica de autenticação, ambientes, produção e os 6 SDKs.
- **[`utils/`](utils):** FAQ e glossário.

Para uma visão detalhada de todos os arquivos disponíveis, consulte o [**`SKILL.md`**](SKILL.md).

<div align="center">

## Ecossistema

</div>

- [Documentação Oficial](https://documentacao.parcelemais.com.br) — guia completo da API.
- [SDK .NET](https://github.com/Twila-Digital/twila-parcelemais-dotnet-sdk)
- [SDK Java](https://github.com/Twila-Digital/twila-parcelemais-java-sdk)
- [SDK Node.js](https://www.npmjs.com/package/@twila/parcelemais)
- [SDK Python](https://pypi.org/project/twila-parcelemais/)
- [SDK PHP](https://packagist.org/packages/twila/parcelemais)
- [SDK Go](https://github.com/Twila-Digital/twila-parcelemais-go-sdk)

<div align="center">

Feito pela equipe Twila Digital · Open source, sob licença MIT.

</div>
