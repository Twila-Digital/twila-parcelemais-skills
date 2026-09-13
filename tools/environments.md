# Ambientes (Staging vs Produção)

O Parcele+ tem dois ambientes, selecionados pela URL base (não por uma flag na credencial, diferente de outras APIs de pagamento):

| Ambiente | Base URL | Uso |
| --- | --- | --- |
| Staging | `https://api.staging.parcelemais.com.br/integration/` | Desenvolvimento e testes — nenhum valor é desembolsado de verdade |
| Produção | `https://api.parcelemais.com.br/integration/` | Ambiente real — pedidos aprovados geram desembolso |

Nos 6 SDKs oficiais, isso é configurado via `Environment`/`environment` (`staging`/`production`) na criação do client, com `BaseURL` custom como escape hatch:

- **.NET**: `ParceleMaisOptions.Environment`
- **Java**: equivalente em `ParceleMaisOptions`
- **Node.js**: `ParceleMaisClientOptions.environment`
- **Python**: `ParceleMaisEnvironment.STAGING`/`.PRODUCTION`
- **PHP**: constante equivalente em `ClientOptions`
- **Go**: `parcelemais.EnvironmentStaging`/`EnvironmentProduction`

Sempre desenvolva e valide contra staging antes de apontar pra produção. Staging usa as mesmas regras de negócio e formato de resposta — só não move dinheiro real.
