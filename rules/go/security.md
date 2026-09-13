# Security Best Practices for ParceleMais Integration (Go)

This document outlines security practices for integrating with the Parcele+ API in Go.

## Secure Credential Storage

- Store `ClientID`/`ClientSecret` in environment variables or a secret manager — never hardcode them.
- Never commit credentials to version control.
- `ClientSecret` is **server-side only** — never embed it in mobile, desktop, or any client-side code that ships to end users.
- Use different credentials per environment (`parcelemais.EnvironmentStaging` vs `parcelemais.EnvironmentProduction`) — never reuse staging credentials in production.
- Rotate credentials periodically and revoke ones no longer in use.

## Robust HMAC Validation for Webhooks

- Always verify the webhook signature via `parcelemais.ParseWebhookEvent(rawBody, signatureHeader, signingSecret)` — never process an unverified payload.
- The SDK already uses constant-time comparison (`hmac.Equal`) internally to prevent timing attacks — don't reimplement this comparison yourself with `==`.
- The SDK already enforces a 5-minute replay tolerance on the signature timestamp — don't disable this by passing an empty `signatureHeader`/`signingSecret` in production.
- Store the `SigningSecret` returned by `Webhooks.Create` the same way as `ClientSecret` — it's a credential, not a public value.

## LGPD-Conscious Data Handling

Parcele+ operates in Brazil — handle customer data (CPF, name, address, phone) in line with the LGPD (Lei Geral de Proteção de Dados):

- Collect and store only the customer fields actually required for the order/credit flow.
- Don't log full CPF/phone numbers in plaintext application logs — mask or redact.
- Encrypt customer data at rest if you persist it beyond what the Parcele+ API already stores.
- Honor data access/deletion requests from customers per your own data retention policy.

## Concurrency and Performance

- A `*parcelemais.Client` is **safe for concurrent use by multiple goroutines** — build it once (e.g. at application startup) and share it, don't construct a new one per request.
- The SDK has an internal retry/circuit-breaker pipeline (`ResilienceOptions`) — avoid layering your own blind retry loop on top of SDK calls, it can amplify load during an incident instead of shedding it.
- Prefer `context.Context` with a sensible deadline on every call (`ctx, cancel := context.WithTimeout(...)`) so a slow dependency doesn't block a request indefinitely — the SDK's own `AttemptTimeout`/`TotalTimeout` bound the HTTP call, but your caller-side context still governs cancellation.
