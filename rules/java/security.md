# Security Best Practices for Parcele+ Integration (Java)

## Secure Credential Storage

- Store `clientId`/`clientSecret` in environment variables or a secret manager (AWS Secrets Manager, HashiCorp Vault, Google Secret Manager) — never hardcode them or commit to version control.
- `clientSecret` is **server-side only** — never embed it in an Android app, applet, or any code running on the end user's device.
- Use separate credentials for staging and production; never reuse a production secret in a test environment.
- Rotate credentials periodically and revoke any that may have leaked.

## Robust HMAC Webhook Validation

- Always call the signature-verifying overload — `ParceleMaisWebhookEvent.parse(rawJson, signatureHeader, signingSecret)` — never the signature-less one on a public-facing endpoint.
- The SDK already uses constant-time comparison (`MessageDigest.isEqual`) internally — don't add your own naive `String.equals` comparison on top.
- The 5-minute replay tolerance is enforced automatically; don't disable or widen it without a specific reason.
- Store `signingSecret` with the same rigor as `clientSecret`.

## LGPD Compliance (Brazilian data protection law)

Parcele+ handles CPF, address, and financial data — treat it accordingly:
- Obtain explicit consent before collecting customer data for credit analysis.
- Minimize retained data to what's necessary for the order lifecycle.
- Define a retention/deletion policy for `Customer`/`Order` data you cache locally.
- Encrypt sensitive data at rest and in transit (the SDK already uses HTTPS for all API calls).

## Performance and Reliability

- Reuse `ParceleMaisClient` as a singleton (built once at application startup, closed only at shutdown) — it holds the OkHttp connection pool, the access token cache, and the circuit breaker state. Building one per request throws all of that away and adds latency.
- Let the SDK's built-in retry/circuit breaker policy handle transient failures (429/5xx/timeouts) — don't wrap every call in your own ad-hoc retry loop on top of it.
- Process webhooks asynchronously after signature verification — respond `200` fast, do heavy work (DB writes, notifications) in a background job/queue.
