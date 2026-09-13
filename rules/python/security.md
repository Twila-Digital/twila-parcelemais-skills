# Security Best Practices for ParceleMais Integration (Python)

## Secure Credential Storage

- Store `client_id`/`client_secret` in environment variables or a secrets manager — never hardcode or commit them.
- `client_secret` is **server-side only** — never ship it in a mobile app, SPA, or any code that runs on the end user's device.
- Use different credentials for staging and production; rotate them periodically.

## Robust HMAC Webhook Validation

- Always pass `signature_header`/`signing_secret` to `parse_webhook_event` (see [webhooks.md](webhooks.md)) — verification uses `hmac.compare_digest` (constant-time, avoids timing attacks) and a 5-minute replay window automatically.
- Store the webhook `signing_secret` with the same care as `client_secret`.
- Reject (`401`) on any `ParceleMaisWebhookSignatureError`, never fall back to processing an unverified payload.

## LGPD (Lei Geral de Proteção de Dados)

Parcele+ operates in Brazil — customer data (CPF, name, address) flowing through this SDK is personal data under LGPD:
- Collect only the fields required for the order/simulation you're performing.
- Don't log full CPF/address/phone in plaintext application logs — mask or omit.
- Define a retention policy for locally-cached `Order`/`Customer` data; Parcele+ remains the source of truth.

## Performance & Resilience

- Reuse `ParceleMaisClient` as a singleton (or use it as a context manager for the app's lifetime, e.g. `with ParceleMaisClient(options) as client:`) — it caches the access token and the circuit breaker state; creating one per request throws both away.
- Don't disable the built-in retry/circuit breaker (`resilience` options) without a specific reason — it already handles transient network failures and `401` token refresh.
- Call `client.close()` (or exit the `with` block) on shutdown to release the underlying `httpx` connection pool cleanly.
