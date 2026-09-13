# ParceleMais Webhooks Integration (Java)

Webhooks (`twila.parcelemais.webhooks`) notify your application of asynchronous events (currently: order status changes).

## Models

```java
public interface WebhooksClient {
    CreateWebhookResult create(CreateWebhookRequest request);
    List<Webhook> list();
    void update(WebHookType type, UpdateWebhookRequest request);
    void delete(WebHookType type);
}

@Value @Builder
public class CreateWebhookRequest {
    WebHookType type;
    String url;
    WebHookAuthenticationType authenticationType;
    String credential; // required if authenticationType is BASIC or JWT
}

@Value
public class CreateWebhookResult {
    String signingSecret; // save this — used to verify incoming event signatures
}

@Value
public class OrderWebhookEvent {
    UUID orderId;
    OrderStatus status;
    int statusRaw;
    String statusName;
}
```

`WebHookType`: `CUSTOMER(1)`, `SIMULATION(2)`, `ORDER(3)`, `UNKNOWN(-1)`. `WebHookAuthenticationType`: `NONE(1)`, `BASIC(2)`, `JWT(3)`, `UNKNOWN(-1)`.

## Setup

1. Register a webhook with `client.webhooks().create(...)` for the event type you care about (usually `WebHookType.ORDER`).
2. Store the returned `signingSecret` securely (env var / secret manager) — it's shown only once, at creation time.
3. Your endpoint must respond `2xx` quickly; do heavy processing asynchronously after verifying the signature.

## Verifying the signature

```java
import twila.parcelemais.webhooks.ParceleMaisWebhookEvent;
import twila.parcelemais.webhooks.model.OrderWebhookEvent;

OrderWebhookEvent event = ParceleMaisWebhookEvent.parse(rawJsonBody, signatureHeader, signingSecret);
```

`parse(rawJson, signatureHeader, signingSecret)` verifies an HMAC-SHA256 signature over `"{timestamp}.{rawJson}"` (header format `t=<unix_ts>,v1=<hex_signature>`), using constant-time comparison (`MessageDigest.isEqual`), and rejects events with a timestamp more than 5 minutes old (replay protection) — throws `ParceleMaisWebhookSignatureException` on any failure. There's also a signature-less `parse(rawJson)` overload — only use it if you've already verified the signature yourself upstream.

## Example

(Source: `examples/java/webhooks.java`)

```java
CreateWebhookResult result = client.webhooks().create(CreateWebhookRequest.builder()
        .type(WebHookType.ORDER)
        .url("https://yourapp.com/webhooks/parcelemais")
        .authenticationType(WebHookAuthenticationType.NONE)
        .build());

// persist result.getSigningSecret() securely
```

## Error Handling and Edge Cases

- `ParceleMaisWebhookSignatureException` — malformed header, signature mismatch, or replay window exceeded. Always respond `401` in this case, never `200`.
- Idempotency: use `orderId` + `status` to detect and ignore duplicate deliveries — Parcele+ may redeliver on transient failures.
- `credential` is required when `authenticationType` is `BASIC` or `JWT` — omitting it with those types is a configuration error, not caught until the webhook actually fires.
- Only one webhook per `WebHookType` at a time — calling `create` again for a type you already registered replaces it (confirm with `list()` before assuming you need to `create` vs. `update`).
