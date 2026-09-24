# ParceleMais Webhooks Integration (.NET)

Webhooks let your application react to events (order status changes) in real time. `IWebhooksClient` (as `client.Webhooks`) manages registrations; `ParceleMaisWebhookEvent` parses and verifies incoming payloads.

## Models

```csharp
public enum WebHookType { Customer = 1, Simulation = 2, Order = 3, [UnknownValue] Unknown = -1 }
public enum WebHookAuthenticationType { None = 1, Basic = 2, Jwt = 3, [UnknownValue] Unknown = -1 }

public sealed record Webhook(WebHookType Type, string Url, WebHookAuthenticationType AuthenticationType);
public sealed record CreateWebhookRequest(WebHookType Type, string Url, WebHookAuthenticationType AuthenticationType, string? Credential = null);
public sealed record CreateWebhookResult(string SigningSecret);
public sealed record UpdateWebhookRequest(string Url, WebHookAuthenticationType AuthenticationType, string? Credential = null);
public sealed record OrderWebhookEvent(Guid OrderId, OrderStatus Status, int StatusRaw, string StatusName);
public sealed record ListWebhookAuditRequest(DateTimeOffset? StartDate = null, DateTimeOffset? EndDate = null, Guid? OrderId = null, long? OrderNumber = null, int? StatusCode = null, int Page = 1, int PageSize = 10);
public sealed record WebhookAudit(Guid Id, WebHookType Type, string Request, string Response, int StatusCode, DateTimeOffset CreatedAt);
```

## Interface

```csharp
public interface IWebhooksClient
{
    Task<CreateWebhookResult> CreateAsync(CreateWebhookRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Webhook>> ListAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<WebhookAudit>> ListAuditAsync(ListWebhookAuditRequest? request = null, CancellationToken cancellationToken = default);
    Task UpdateAsync(WebHookType type, UpdateWebhookRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(WebHookType type, CancellationToken cancellationToken = default);
}
```

## Setup

1. Register a webhook via `client.Webhooks.CreateAsync(...)` with `WebHookType.Order` for order status changes.
2. Save `CreateWebhookResult.SigningSecret` — it's returned **only once**, at creation, and is required to verify incoming payloads.
3. Point `Url` at an HTTPS endpoint that returns `200` promptly (process asynchronously if the handler does heavy work).

## Signature Verification

`ParceleMaisWebhookEvent.Parse(rawJson, signatureHeader, signingSecret)` verifies the signature and parses the event in one call:

```csharp
public static class ParceleMaisWebhookEvent
{
    public static OrderWebhookEvent Parse(string rawJson);
    public static OrderWebhookEvent Parse(string rawJson, string signatureHeader, string signingSecret);
}
```

Internally: HMAC-SHA256 over `"{unixTimestamp}.{rawJson}"` using the signing secret; header format is `t=<timestamp>,v1=<hex signature>`; comparison uses fixed-time equality (`CryptoUtility.FixedTimeEquals`) to avoid timing attacks; rejects if the timestamp is more than 5 minutes old (replay protection).

## Example

(Source: `examples/dotnet/webhooks.cs`)

```csharp
var result = await client.Webhooks.CreateAsync(new CreateWebhookRequest(
    Type: WebHookType.Order, Url: "https://myapp.com/webhooks/parcelemais", AuthenticationType: WebHookAuthenticationType.None));

// In your webhook endpoint:
var evt = ParceleMaisWebhookEvent.Parse(rawBody, signatureHeader, storedSigningSecret);
```

## Delivery audit

`ListAuditAsync` (`GET /v1/webhooks/auditoria`) returns one `WebhookAudit` per delivery attempt — including failed attempts and ones where your endpoint was unreachable — newest first. Every filter is optional: date range (`StartDate`/`EndDate`), `OrderId`, `OrderNumber`, and `StatusCode` (the HTTP status your endpoint returned). Paging works like Orders/Customers: `Page` defaults to 1, `PageSize` to 10, no auto-pagination — check `HasNext`/`TotalCount` on the returned `PagedResult<WebhookAudit>`.

```csharp
var failures = await client.Webhooks.ListAuditAsync(new ListWebhookAuditRequest(
    StartDate: DateTimeOffset.UtcNow.AddDays(-1), StatusCode: 500));

foreach (var attempt in failures.Items)
    Console.WriteLine($"{attempt.CreatedAt:u} {attempt.StatusCode}: {attempt.Response}");
```

- Filter by `StatusCode` (e.g. `500`) to find failed deliveries.
- `Request`/`Response` are the raw text bodies sent to and received from your endpoint — not parsed JSON.

## Error Handling and Edge Cases

- `ParceleMaisWebhookSignatureException` — signature mismatch, malformed `t=/v1=` header, or timestamp outside the 5-minute replay window. Always return `401` (not `200`) when this is thrown, so Parcele+ can retry/alert.
- Always call the signature-checking overload of `Parse` in production; the unauthenticated overload exists mainly for local testing with a captured payload.
- `OrderWebhookEvent.Status` uses `OrderStatus.Unknown` as a forward-compatible fallback; `StatusRaw`/`StatusName` preserve the original API values regardless.
- Process webhook handlers idempotently — the same event can be delivered more than once.
