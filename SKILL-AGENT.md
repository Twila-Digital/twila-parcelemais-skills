---
name: parcelemais-agent
description: Standalone skill for interacting with the Parcele+ API directly — create orders, simulate installments, list customers, manage webhooks, and more. Agent mode only, no integration code.
metadata:
  tags: parcelemais, cdc, credito, pix-parcelado, webhooks, checkout, agent, api
---

## When to use

When the user wants to **perform actions directly** — create an order, simulate installments, list customers, check an order status, register a webhook, etc. Execute the Parcele+ API via `curl` in the terminal.

---

## Rules: Agent Mode — Direct API Usage

When the user asks to **perform** an action (create, list, simulate, check) instead of **writing integration code**, execute the Parcele+ API directly via `curl`.

### Authentication

The API uses OAuth2 client credentials. Generate an access token before any other call:

```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/authentication/accesstoken" \
  -H "Content-Type: application/json" \
  -d '{"clientId": "'"$PARCELEMAIS_CLIENT_ID"'", "clientSecret": "'"$PARCELEMAIS_CLIENT_SECRET"'"}' | jq
```

Response: `{"token_de_acesso": "...", "expira_em_segundos": 3600, "tipo_de_token": "Bearer"}`. Use it as `Authorization: Bearer <token_de_acesso>` in every subsequent call.

- Always ask for `PARCELEMAIS_CLIENT_ID`/`PARCELEMAIS_CLIENT_SECRET` if not provided and not found in environment variables or `.env`.
- The token expires (`expira_em_segundos`) — generate a new one when it expires or the API returns `401`.

### Base URL

```
Staging:    https://api.staging.parcelemais.com.br/integration/
Produção:   https://api.parcelemais.com.br/integration/
```

Default to staging unless the user explicitly asks for production — staging never moves real money.

### Response Format

Errors follow a Problem Details (RFC 7807-like) shape:
```json
{"tipo": "...", "titulo": "...", "status": 400, "detalhe": "...", "erros": {"campo": ["msg"]}, "correlationId": "..."}
```

Monetary values are **floats in BRL** (e.g. `1500.00`), not cents.

---

### Endpoints Reference

#### Orders (Pedidos)

**Create an order**
```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/order" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678900", "celular": "11999999999",
    "documentoEstabelecimento": "12345678000199", "valorSolicitado": 1500.00,
    "nome": "João Silva", "email": "joao@email.com", "dataDeNascimento": "1990-01-01",
    "endereco": {"logradouro": "Rua Exemplo", "numero": "100", "bairro": "Centro", "cidade": "São Paulo", "estado": "SP", "cep": "01310-100"}
  }' | jq
```
Response: `{"pedidoId": "..."}`.

**Get an order by ID**
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$PARCELEMAIS_BASE_URL/v1/order/ORDER_ID" | jq
```

**List orders (paginated)**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/order/paged?pagina=1&tamanhoPagina=10" | jq
```
Optional query params: `status`, `documentoCliente`, `dataInicio`, `dataFim`, `numero`, `documentoLoja`, `descricao`.

**Start CDC sale (generate payment link)**
```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/order/start-cdc-sale" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"pedidoId": "ORDER_ID"}' | jq
```
Response: `{"linkPagamento": "https://..."}`.

**Attach invoice (base64)**
```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/order/invoice" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"pedidoId": "ORDER_ID", "arquivoBase64": "'"$(base64 -w0 nota.pdf)"'", "nomeArquivo": "nota.pdf"}' | jq
```

**Order status values** (`status.valor`): `0` Undefined, `1` Analysing, `2` Approved, `3` UnavailableBalance, `4` AnalysisExpired, `5` PendingPayment, `6` BiometryRefused, `7` BiometryApproved, `8` PaymentRefused, `9` Purchased, `10` Unauthorized, `11` PendingAuthorization, `12` AwaitingRegistration, `13` SaleNotStarted, `14` Canceled, `15` Billing, `16` Completed, `17` Frozen, `18` PendingPaymentConfirmation, `19` Disbursed.

---

#### Simulations (Simulações)

**Simulate installments by requested amount**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/order/simulate-installments?valorSolicitado=1500&tipoValorCalculo=1" | jq
```
`tipoValorCalculo`: `1` = gross amount, `2` = liquid amount.

**Simulate values by term**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/order/simulate-values?valor=1500&prazo=12&modeloJuros=1&tipoValorCalculo=1" | jq
```

---

#### Customers (Clientes)

**Get customer by ID**
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$PARCELEMAIS_BASE_URL/v1/customer/CUSTOMER_ID" | jq
```

**List customers (paginated)**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/customer/paged?pagina=1&tamanhoPagina=10" | jq
```

---

#### Webhooks

**Register a webhook**
```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/webhooks" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tipo": 3, "url": "https://yourapp.com/webhooks/parcelemais", "tipoAutenticacao": 1}' | jq
```
`tipo`: `1` Customer, `2` Simulation, `3` Order. `tipoAutenticacao`: `1` None, `2` Basic, `3` JWT.
Response includes `chaveAssinatura` — save it, it's used to validate the HMAC signature of incoming events.

**List registered webhooks**
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$PARCELEMAIS_BASE_URL/v1/webhooks" | jq
```

**Update a webhook**
```bash
curl -s -X PUT "$PARCELEMAIS_BASE_URL/v1/webhooks/3" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url": "https://yourapp.com/new-endpoint", "tipoAutenticacao": 1}' | jq
```

**Delete a webhook**
```bash
curl -s -X DELETE "$PARCELEMAIS_BASE_URL/v1/webhooks/3" -H "Authorization: Bearer $TOKEN" | jq
```

---

### Agent Mode Guidelines

1. Always confirm before creating, updating, or deleting resources — orders and webhooks have real side effects.
2. Default to staging for any exploration/testing; only use production when explicitly asked.
3. Format monetary values as `R$ X,XX` when presenting results.
4. Use `jq` to parse and format JSON responses.
5. On errors, show `titulo`/`detalhe`/`erros` from the Problem Details body and suggest a fix.
6. Never invent a `pedidoId`/customer ID — always obtain it via `create`/`list` before using it in another call.

---

## Tools Reference

### Authentication & Environments

- Base URLs: `https://api.staging.parcelemais.com.br/integration/` (staging), `https://api.parcelemais.com.br/integration/` (production).
- `ClientSecret` is server-side only — never embed in mobile/SPA code.
- Token is a short-lived JWT (`expira_em_segundos`); regenerate on expiry or `401`.

### Official SDKs

| Language | Package | Repository |
| --- | --- | --- |
| .NET | `Twila.ParceleMais` (not yet published to NuGet) | [twila-parcelemais-dotnet-sdk](https://github.com/Twila-Digital/twila-parcelemais-dotnet-sdk) |
| Java | `br.com.twila:parcelemais` (not yet published to Maven Central) | [twila-parcelemais-java-sdk](https://github.com/Twila-Digital/twila-parcelemais-java-sdk) |
| Node.js | `@twila/parcelemais` | [twila-parcelemais-node-sdk](https://github.com/Twila-Digital/twila-parcelemais-node-sdk) |
| Python | `twila-parcelemais` | [twila-parcelemais-python-sdk](https://github.com/Twila-Digital/twila-parcelemais-python-sdk) |
| PHP | `twila/parcelemais` | [twila-parcelemais-php-sdk](https://github.com/Twila-Digital/twila-parcelemais-php-sdk) |
| Go | `github.com/Twila-Digital/twila-parcelemais-go-sdk` | [twila-parcelemais-go-sdk](https://github.com/Twila-Digital/twila-parcelemais-go-sdk) |

Full docs: [documentacao.parcelemais.com.br](https://documentacao.parcelemais.com.br) ([`/llms.txt`](https://documentacao.parcelemais.com.br/llms.txt) for the complete index in LLM-friendly form).

---

## Utils

### FAQ

1. **Where's the full API documentation?** [documentacao.parcelemais.com.br](https://documentacao.parcelemais.com.br).
2. **Which environment should I use while developing?** Staging — no real money moves.
3. **Are monetary values in cents?** No — floats in BRL (`1500.00`), unlike most payment APIs.
4. **How do I know if an order was approved?** Check `status.valor` on the `Order` object, or subscribe to an Order webhook (`tipo: 3`).
5. **Can I simulate installments without creating an order?** Yes — `simulate-installments`/`simulate-values` create no records.
6. **How do I verify a webhook is really from Parcele+?** Validate the HMAC-SHA256 signature using the `chaveAssinatura` returned when the webhook was created.

### Glossary

- **CDC (Crédito Direto ao Consumidor)**: consumer credit granted directly at the point of sale.
- **Estabelecimento**: the merchant that originated the order (`documentoEstabelecimento`, a CNPJ).
- **Desembolso**: disbursement — release of the approved amount (order reaches status `Disbursed`, `19`).
- **Valor bruto vs. líquido**: gross vs. liquid amount (`tipoValorCalculo`) — liquid already nets out MDR/anticipation fees.
- **Chave de assinatura**: signing secret returned when a webhook is created, used to validate HMAC-SHA256 signatures on incoming events.
