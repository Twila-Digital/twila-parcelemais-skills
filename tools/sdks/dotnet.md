# SDK .NET

Repositório: [twila-parcelemais-dotnet-sdk](https://github.com/Twila-Digital/twila-parcelemais-dotnet-sdk)

> **`Twila.ParceleMais` ainda não foi publicado no NuGet.org.** Existe um pacote `ParceleMais` (sem o prefixo `Twila.`) publicado sob o nome antigo, anterior à padronização — **não o use**, ele está órfão e não recebe mais atualizações. Enquanto `Twila.ParceleMais` não sai, instale a partir do código-fonte (ver `CONTRIBUTING.md` do repositório).

- Compatível com .NET Core/.NET 2.0+ e .NET Framework 4.6.2+ (`netstandard2.0` + `net8.0`).
- Autenticação, retry/circuit breaker via Polly.Core, e integração com `IServiceCollection`/`IHttpClientFactory` (`AddParceleMais(...)`).
- Namespace raiz: `ParceleMais` (`ParceleMais.Configuration`, `ParceleMais.Errors`, etc.).

Ver [rules/dotnet/](../../rules/dotnet) para regras de integração por recurso.
