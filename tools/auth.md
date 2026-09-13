# Autenticação

A API do Parcele+ usa OAuth2 client credentials. Toda integração precisa de um `ClientId` e `ClientSecret`, obtidos com o time comercial/técnico da Parcele+.

## Fluxo

1. `POST /v1/authentication/accesstoken` com `{"clientId": "...", "clientSecret": "..."}`.
2. A resposta traz `token_de_acesso`, `expira_em_segundos` e `tipo_de_token` (sempre `"Bearer"`).
3. Envie `Authorization: Bearer <token_de_acesso>` em toda chamada subsequente.
4. Quando o token expirar (ou a API responder `401`), gere um novo — os 6 SDKs oficiais fazem isso automaticamente (cache do token + renovação transparente em caso de `401`).

## Ambientes

| Ambiente | Base URL |
| --- | --- |
| Staging | `https://api.staging.parcelemais.com.br/integration/` |
| Produção | `https://api.parcelemais.com.br/integration/` |

Staging é o ambiente padrão de desenvolvimento — não movimenta dinheiro real. Use produção só quando o usuário pedir explicitamente.

## Boas práticas de segurança

- **Nunca** commite `ClientSecret` em controle de versão.
- Use variáveis de ambiente (`PARCELEMAIS_CLIENT_ID`, `PARCELEMAIS_CLIENT_SECRET`) ou um cofre de segredos.
- `ClientSecret` é **restrito a server-side** — nunca embarque em app mobile, SPA ou qualquer código que rode no dispositivo do usuário final.
- Use credenciais diferentes para staging e produção.
