# ParceleMais Webhooks Integration (Java)

Webhooks (`twila.parcelemais.webhooks`) notify your application of asynchronous events (currently: order status changes).

## Models

```java
public interface WebhooksClient {
    CreateWebhookResult create(CreateWebhookRequest request);
    List<Webhook> list();
    void update(WebHookType type, UpdateWebhookRequest request);
    void delete(WebHookType type);
    PagedResult<WebhookAudit> listAudit(); // default: page 1, pageSize 10, no filters
    PagedResult<WebhookAudit> listAudit(ListWebhookAuditRequest request);
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

@Value @Builder
public class ListWebhookAuditRequest {
    OffsetDateTime startDate;
    OffsetDateTime endDate;
    UUID orderId;
    Long orderNumber;
    Integer statusCode;
    @Builder.Default int page = 1;
    @Builder.Default int pageSize = 10;
}

@Value @Builder
public class WebhookAudit {
    UUID id;
    WebHookType type;
    String request;  // raw body sent to your endpoint
    String response; // raw body your endpoint returned
    int statusCode;
    OffsetDateTime createdAt;
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

## Delivery audit

`listAudit(...)` (`GET /v1/webhooks/auditoria`) returns one `WebhookAudit` per delivery attempt — including failed attempts and ones where your endpoint was unreachable — newest first. Every filter is optional: date range (`startDate`/`endDate`), `orderId`, `orderNumber`, and `statusCode` (the HTTP status your endpoint returned). Paging works like Orders/Customers: `page` defaults to 1, `pageSize` to 10, no auto-pagination — check `isHasNext()`/`getTotalCount()` on the returned `PagedResult<WebhookAudit>`.

```java
PagedResult<WebhookAudit> failures = client.webhooks().listAudit(ListWebhookAuditRequest.builder()
        .startDate(OffsetDateTime.now().minusDays(1))
        .statusCode(500)
        .build());

for (WebhookAudit attempt : failures.getItems()) {
    System.out.println(attempt.getCreatedAt() + " " + attempt.getStatusCode() + ": " + attempt.getResponse());
}
```

- Filter by `statusCode` (e.g. `500`) to find failed deliveries.
- `request`/`response` are the raw text bodies sent to and received from your endpoint — not parsed JSON.

## Error Handling and Edge Cases

- `ParceleMaisWebhookSignatureException` — malformed header, signature mismatch, or replay window exceeded. Always respond `401` in this case, never `200`.
- Idempotency: use `orderId` + `status` to detect and ignore duplicate deliveries — Parcele+ may redeliver on transient failures.
- `credential` is required when `authenticationType` is `BASIC` or `JWT` — omitting it with those types is a configuration error, not caught until the webhook actually fires.
- Only one webhook per `WebHookType` at a time — calling `create` again for a type you already registered replaces it (confirm with `list()` before assuming you need to `create` vs. `update`).
