# Security Best Practices for ParceleMais Integration (PHP)

This document outlines security practices for integrating with Parcele+ in PHP.

## Secure Credential Storage

- Store `clientId`/`clientSecret` in environment variables (`PARCELEMAIS_CLIENT_ID`/`PARCELEMAIS_CLIENT_SECRET`) or a secrets manager — never hardcode them or commit them to version control.
- `clientSecret` is **server-side only** — never embed it in a mobile app, SPA, or any code that runs on the end-user's device.
- Use different credentials for staging and production; never reuse a production secret in a test environment.
- Rotate credentials periodically and immediately if one is ever exposed (leaked log, committed by mistake, etc.).

## Robust HMAC Validation for Webhooks

- Always verify with `WebhookEvent::parse($rawJson, $signatureHeader, $signingSecret)` — never process a webhook body without passing both `$signatureHeader` and `$signingSecret`.
- The comparison uses `hash_equals()` (constant-time) internally — don't reimplement it with `===`/`==`, which leaks timing information an attacker could exploit to guess the signature byte by byte.
- The 5-minute replay window is enforced automatically — don't disable it by calling `WebhookEvent::parse()` without a signature just to "get it working faster."
- Store `signingSecret` with the same rigor as `clientSecret`.

## LGPD (Data Protection)

Parcele+ operates in Brazil, so customer data (CPF, address, phone, email) is subject to LGPD:
- Collect only the fields your integration actually needs.
- Don't log full `CreateOrderRequest`/`Customer` payloads in plaintext (CPF and address are sensitive) — redact before logging.
- Encrypt sensitive data at rest if you persist customer records locally.
- Honor data access/deletion requests from end users per your own data retention policy.

## Performance

- Reuse a single `ParceleMaisClient` instance as a singleton across your application (e.g. bound once in a DI container) — it caches the access token and holds circuit breaker state; creating one per request throws that away and re-authenticates unnecessarily.
- Handle webhook processing asynchronously (queue the event, respond `200` immediately) rather than doing slow downstream work synchronously in the HTTP handler.
- Respect the SDK's built-in retry/circuit breaker (`ResilienceOptions`) instead of layering your own naive retry loop on top — doubled-up retries can amplify load during an incident instead of backing off.
