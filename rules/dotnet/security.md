# Security Best Practices for ParceleMais Integration (.NET)

This document outlines security practices for integrating with the Parcele+ API in .NET.

## Secure Credential Storage

- Store `ClientId`/`ClientSecret` via `IConfiguration`/`IOptions` bound from environment variables, User Secrets (dev), or Azure Key Vault/AWS Secrets Manager (production) — never hardcode them.
- Never commit credentials to version control.
- `ClientSecret` is **server-side only** — never ship it in a mobile app, SPA/Blazor WebAssembly, or any code that runs on the end-user's device.
- Use different credentials for staging and production; rotate them periodically.
- Register `IParceleMaisClient` via `AddParceleMais(...)` as a singleton (the default `services.AddSingleton<IParceleMaisClient, ParceleMaisClient>()`) — it caches the access token and holds circuit-breaker state; don't construct it per-request.

## Robust HMAC Webhook Validation

- Always use the signature-checking overload: `ParceleMaisWebhookEvent.Parse(rawJson, signatureHeader, signingSecret)`.
- The SDK already does fixed-time comparison (`CryptoUtility.FixedTimeEquals`) to prevent timing attacks — don't reimplement comparison with `==`/`string.Equals`.
- The SDK already enforces a 5-minute replay tolerance on the signed timestamp — don't disable or bypass this check.
- Store the `SigningSecret` (returned once, at webhook creation) the same way you store `ClientSecret`.

## LGPD Compliance for Customer Data

Parcele+ operates in Brazil, so integrations handling `Customer`/`Order` data should:
- Obtain explicit consent for collecting CPF, name, address, and other personal data.
- Minimize what you store locally — the API is the source of truth for order/customer state.
- Implement a data retention policy and honor access/rectification/deletion requests.
- Encrypt any locally cached customer data at rest and in transit.

## Performance and Resilience

- The client already retries transient failures and opens a circuit breaker under sustained failure (see `ParceleMaisResilienceOptions`) — avoid adding a second layer of ad hoc retries around SDK calls, which can compound backoff delays.
- Catch `ParceleMaisRateLimitException` and respect `.RetryAfter` if you do add custom retry logic on top.
- Reuse `IOrdersClient`/`ISimulationsClient`/etc. as scoped/singleton services (DI already does this via `AddParceleMais`) rather than creating new `HttpClient` instances per call.
