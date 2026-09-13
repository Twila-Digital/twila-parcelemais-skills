# Ecossistema Parcele+

## Documentação oficial
- [documentacao.parcelemais.com.br](https://documentacao.parcelemais.com.br) — guia completo da API, autenticação, webhooks e SDKs. Índice completo em [`/llms.txt`](https://documentacao.parcelemais.com.br/llms.txt); qualquer página pode ser lida como Markdown puro trocando a extensão da URL para `.md`.

## SDKs oficiais

| Linguagem | Pacote | Repositório |
| --- | --- | --- |
| .NET | `Twila.ParceleMais` (ainda não publicado — ver [tools/sdks/dotnet.md](sdks/dotnet.md)) | [twila-parcelemais-dotnet-sdk](https://github.com/Twila-Digital/twila-parcelemais-dotnet-sdk) |
| Java | `br.com.twila:parcelemais` (Maven Central) | [twila-parcelemais-java-sdk](https://github.com/Twila-Digital/twila-parcelemais-java-sdk) |
| Node.js | `@twila/parcelemais` (npm) | [twila-parcelemais-node-sdk](https://github.com/Twila-Digital/twila-parcelemais-node-sdk) |
| Python | `twila-parcelemais` (PyPI) | [twila-parcelemais-python-sdk](https://github.com/Twila-Digital/twila-parcelemais-python-sdk) |
| PHP | `twila/parcelemais` (Packagist) | [twila-parcelemais-php-sdk](https://github.com/Twila-Digital/twila-parcelemais-php-sdk) |
| Go | `github.com/Twila-Digital/twila-parcelemais-go-sdk` | [twila-parcelemais-go-sdk](https://github.com/Twila-Digital/twila-parcelemais-go-sdk) |

Todos os SDKs encapsulam: autenticação e renovação automática de token, política de retry/circuit breaker, serialização, e uma hierarquia de erros tipados por linguagem. Todos são open source (MIT) e aceitam PR de qualquer pessoa (merge exige aprovação de alguém do time Parcele+).

## Este repositório

[twila-parcelemais-skills](https://github.com/Twila-Digital/twila-parcelemais-skills) — pacotes de contexto especializado (este repositório) pra ensinar agentes de IA a integrar com o Parcele+ nas 6 linguagens acima, e a operar a API diretamente via `curl` (Agent Mode).
