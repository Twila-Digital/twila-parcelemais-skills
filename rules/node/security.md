# Security Best Practices for Parcele+ Integration (Node.js)

This document outlines security best practices for integrating with Parcele+.

## Secure Credential Storage

- Use environment variables (`PARCELEMAIS_CLIENT_ID`, `PARCELEMAIS_CLIENT_SECRET`) instead of hardcoding.
- Never commit `clientSecret` to version control.
- `clientSecret` is **server-side only** — never embed it in a browser bundle, mobile app, or any code that ships to the end user's device.
- Use separate credentials per environment (staging vs. production) and rotate them if a leak is suspected.

## Robust HMAC Validation for Webhooks

- Always verify the signature with `parseWebhookEvent` (see [webhooks.md](webhooks.md)) — never trust an unverified payload.
- It already uses constant-time comparison (`timingSafeEqual`) and rejects timestamps older than 5 minutes to mitigate replay attacks.
- Store the `signingSecret` with the same care as `clientSecret`.

## LGPD Compliance for Customer Data

Parcele+ operates in Brazil — customer data (CPF, name, address, phone, email) is subject to LGPD:
- Collect only what's necessary for the order/simulation you're performing.
- Don't log full CPF/customer PII in plaintext application logs.
- Implement data retention and deletion policies consistent with your own privacy policy.
- Encrypt sensitive data at rest if you cache any customer records locally.

## Performance & Reliability

- Reuse a single `ParceleMaisClient` instance (module-level singleton) — it caches the access token and holds circuit breaker state; creating one per request defeats both.
- Respect the SDK's built-in retry/circuit breaker — don't wrap calls in your own unconditional retry loop on top of it, or you risk retry storms during an incident.
- Handle `ParceleMaisRateLimitError.retryAfterMs` if present instead of retrying immediately.
