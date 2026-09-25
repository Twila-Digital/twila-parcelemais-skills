# ParceleMais Webhooks Integration (PHP)

Webhooks let your application react to order status changes in real time instead of polling `orders->get()`.

## Classes & Types

```php
use Twila\ParceleMais\Webhooks\WebHookType;
use Twila\ParceleMais\Webhooks\WebHookAuthenticationType;
use Twila\ParceleMais\Webhooks\Webhook;
use Twila\ParceleMais\Webhooks\CreateWebhookRequest;
use Twila\ParceleMais\Webhooks\CreateWebhookResult;
use Twila\ParceleMais\Webhooks\UpdateWebhookRequest;
use Twila\ParceleMais\Webhooks\WebhookEvent;
use Twila\ParceleMais\Webhooks\OrderWebhookEvent;
use Twila\ParceleMais\Webhooks\ListWebhookAuditRequest;
use Twila\ParceleMais\Webhooks\WebhookAudit;

final class CreateWebhookRequest {
    public int $type; // WebHookType::*
    public string $url;
    public int $authenticationType; // WebHookAuthenticationType::*
    public ?string $credential; // required if authenticationType is BASIC or JWT
}

final class CreateWebhookResult { public string $signingSecret; }

final class Webhook { public int $type; public string $url; public int $authenticationType; }

final class OrderWebhookEvent {
    public string $orderId; public int $status; // OrderStatus::*, already normalized
    public int $statusRaw; public string $statusName;
}

final class ListWebhookAuditRequest { // constructor args in this order, all optional
    public ?string $startDate; public ?string $endDate; // ISO-8601 date-time strings
    public ?string $orderId; public ?int $orderNumber;
    public ?int $statusCode; // HTTP status your endpoint returned
    public int $page = 1; public int $pageSize = 10;
}

final class WebhookAudit {
    public string $id; public int $type; // WebHookType::*
    public string $request; public string $response; // raw bodies sent / received
    public int $statusCode; public string $createdAt;
}
```

`WebHookType`: `CUSTOMER = 1`, `SIMULATION = 2`, `ORDER = 3`. `WebHookAuthenticationType`: `NONE = 1`, `BASIC = 2`, `JWT = 3`.

## Features

- `$client->webhooks->create(CreateWebhookRequest $request): CreateWebhookResult` — returns `signingSecret`, used to verify incoming events. **Save it** — it isn't retrievable again later.
- `$client->webhooks->list(): Webhook[]`
- `$client->webhooks->listAudit(?ListWebhookAuditRequest $request = null): PagedResult` — delivery audit; `items` are `WebhookAudit` (see below).
- `$client->webhooks->update(int $type, UpdateWebhookRequest $request): void`
- `$client->webhooks->delete(int $type): void`
- `WebhookEvent::parse(string $rawJson, ?string $signatureHeader = null, ?string $signingSecret = null): OrderWebhookEvent` — decodes and, when both `$signatureHeader` and `$signingSecret` are given, verifies the HMAC-SHA256 signature and replay window before returning.

## Example

(Source: `examples/php/webhooks.php`)

```php
$result = $client->webhooks->create(new CreateWebhookRequest(
    WebHookType::ORDER, 'https://yourapp.com/webhooks/parcelemais', WebHookAuthenticationType::NONE
));
// persist $result->signingSecret securely — you'll need it in the endpoint below

// In your webhook endpoint:
$event = WebhookEvent::parse($rawBody, $request->header('X-ParceleMais-Signature'), $storedSigningSecret);
// $event->orderId, $event->status (OrderStatus::*), $event->statusName
```

## Security

Always verify the webhook signature to ensure the request really comes from Parcele+ — never process an unverified payload.

1. The signature header carries `t=<unix timestamp>,v1=<hex HMAC-SHA256 signature>`.
2. `WebhookEvent::parse()` recomputes `hash_hmac('sha256', "{$timestamp}.{$rawBody}", $signingSecret)` and compares it to `v1` using `hash_equals()` (constant-time, prevents timing attacks).
3. It also rejects events whose timestamp is more than 5 minutes old — mitigates replay attacks with a captured, still-valid-looking payload.
4. Store `signingSecret` the same way you store `clientSecret` — environment variable or secrets manager, never in version control.

## Delivery audit

`listAudit()` (`GET /v1/webhooks/auditoria`) returns one `WebhookAudit` per delivery attempt — including failed attempts and ones where your endpoint was unreachable — newest first. Every filter is optional: date range (`startDate`/`endDate`, ISO-8601 strings), `orderId`, `orderNumber`, and `statusCode` (the HTTP status your endpoint returned). Paging works like Orders/Customers: `page` defaults to 1, `pageSize` to 10, no auto-pagination — check `$page->hasNext`/`$page->totalCount`.

```php
$failures = $client->webhooks->listAudit(new ListWebhookAuditRequest(
    (new DateTimeImmutable('-1 day'))->format(DATE_ATOM), // startDate
    null, null, null,
    500 // statusCode
));

foreach ($failures->items as $attempt) { // WebhookAudit
    echo "{$attempt->createdAt} {$attempt->statusCode}: {$attempt->response}\n";
}
```

- Filter by `statusCode` (e.g. `500`) to find failed deliveries.
- `request`/`response` are the raw text bodies sent to and received from your endpoint — not parsed JSON.

## Error Handling and Edge Cases

- `WebhookEvent::parse()` throws `Twila\ParceleMais\Errors\ParceleMaisWebhookSignatureException` for: empty/invalid JSON body, signature mismatch, malformed signature header, or a timestamp outside the replay window — catch it specifically and respond `401`, don't let it bubble as a generic 500.
- `create()`/`update()`/`delete()` throw the same `ParceleMaisApiException` hierarchy as other modules — e.g. registering a second webhook for the same `type` typically returns a validation error (409/400 depending on the API version) since each `type` has exactly one webhook configuration.
- Respond `200` as soon as the event is durably queued for processing — don't do slow work synchronously in the handler, or Parcele+'s retry logic may re-deliver the same event before your first response completes.
