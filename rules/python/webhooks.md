# ParceleMais Webhooks Integration (Python)

Webhooks push order/customer/simulation events to your own endpoint. Access via `client.webhooks`; verify incoming events with `parse_webhook_event`.

## Types

```python
from twila_parcelemais import (
    WebHookType,          # CUSTOMER=1, SIMULATION=2, ORDER=3
    WebHookAuthenticationType,  # NONE=1, BASIC=2, JWT=3
    Webhook,
    CreateWebhookRequest,
    CreateWebhookResult,
    UpdateWebhookRequest,
    OrderWebhookEvent,     # order_id, status (OrderStatus), status_raw (int), status_name (str)
    ListWebhookAuditRequest,  # start_date/end_date (str | date | datetime), order_id (str), order_number (int), status_code (int), page=1, page_size=10 — all optional
    WebhookAudit,          # id (str), type (WebHookType), request (str), response (str), status_code (int), created_at (str)
)
from twila_parcelemais import parse_webhook_event, compute_webhook_signature
```

## Features

- `client.webhooks.create(request: CreateWebhookRequest) -> CreateWebhookResult` — returns `signing_secret`; store it, it's shown only once.
- `client.webhooks.list() -> list[Webhook]`
- `client.webhooks.list_audit(request: ListWebhookAuditRequest | None = None) -> PagedResult[WebhookAudit]` — delivery audit (see below).
- `client.webhooks.update(type: WebHookType, request: UpdateWebhookRequest) -> None`
- `client.webhooks.delete(type: WebHookType) -> None`
- `parse_webhook_event(raw_json, signature_header, signing_secret) -> OrderWebhookEvent` — verifies the HMAC signature (when `signature_header`/`signing_secret` are given) and decodes the event in one call.

## Setup

Register the endpoint once via `client.webhooks.create(...)` (there is no dashboard step for this API — it's all programmatic). Store the returned `signing_secret` next to `client_secret`, with the same security posture.

## Example

(Source: `examples/python/webhooks.py`)

```python
result = client.webhooks.create(
    CreateWebhookRequest(type=WebHookType.ORDER, url="https://yourapp.com/webhooks/parcelemais", authentication_type=WebHookAuthenticationType.NONE)
)
signing_secret = result.signing_secret  # store this

# In your webhook endpoint handler:
event = parse_webhook_event(request.body, request.headers.get("X-Signature"), signing_secret)
if event.status == OrderStatus.PURCHASED:
    ...
```

## Security

- Always pass `signature_header`/`signing_secret` to `parse_webhook_event` in production — skipping them (both `None`) disables verification entirely, only ever do that in local manual testing.
- The signature format is `t=<unix_timestamp>,v1=<hex_hmac_sha256>` over `"{timestamp}.{raw_body}"`; verification uses `hmac.compare_digest` (constant-time) and rejects events more than 5 minutes old (replay protection) — both happen automatically inside `parse_webhook_event`.
- `parse_webhook_event` raises `ParceleMaisWebhookSignatureError` on a bad signature, malformed header, or expired timestamp, and on invalid/empty JSON — always wrap the call in a `try/except` and respond `401`, never `200`, on failure.
- Respond `200` promptly after verifying and enqueuing processing — don't do slow synchronous work in the handler, or Parcele+ may consider the delivery failed and retry.

## Delivery audit

`list_audit` (`GET /v1/webhooks/auditoria`) returns one `WebhookAudit` per delivery attempt — including failed attempts and ones where your endpoint was unreachable — newest first. Every filter is optional: date range (`start_date`/`end_date`), `order_id`, `order_number`, and `status_code` (the HTTP status your endpoint returned). Paging works like Orders/Customers: `page` defaults to 1, `page_size` to 10, no auto-pagination — check `has_next`/`total_count` on the returned `PagedResult[WebhookAudit]`.

```python
from datetime import datetime, timedelta, timezone

failures = client.webhooks.list_audit(
    ListWebhookAuditRequest(start_date=datetime.now(timezone.utc) - timedelta(days=1), status_code=500)
)
for attempt in failures.items:
    print(attempt.created_at, attempt.status_code, attempt.response)
```

- Filter by `status_code` (e.g. `500`) to find failed deliveries.
- `request`/`response` are the raw text bodies sent to and received from your endpoint — not parsed JSON.

## Error Handling and Edge Cases

- `create` on a `type` that already has a webhook registered returns a conflict error — `list()` first if you're not sure one exists.
- `update`/`delete` take the `WebHookType` (not an id) since there's one webhook per type — get the type right, there's no separate identifier to look up.
- Treat `OrderWebhookEvent.status` as `OrderStatus.UNKNOWN` gracefully if the API ever adds a new status value your SDK version doesn't know yet — don't crash on an unrecognized value, log and continue.
