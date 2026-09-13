# SDK .NET

Repositório: [twila-parcelemais-dotnet-sdk](https://github.com/Twila-Digital/twila-parcelemais-dotnet-sdk)

> **Pacote NuGet ainda não publicado.** Enquanto isso, instale a partir do código-fonte (ver `CONTRIBUTING.md` do repositório). Assim que publicado, o pacote será `Twila.ParceleMais`.

- Compatível com .NET Core/.NET 2.0+ e .NET Framework 4.6.2+ (`netstandard2.0` + `net8.0`).
- Autenticação, retry/circuit breaker via Polly.Core, e integração com `IServiceCollection`/`IHttpClientFactory` (`AddParceleMais(...)`).
- Namespace raiz: `ParceleMais` (`ParceleMais.Configuration`, `ParceleMais.Errors`, etc.).

Ver [rules/dotnet/](../../rules/dotnet) para regras de integração por recurso.
