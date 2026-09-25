# ParceleMais Webhooks Integration (Go)

Webhooks let your application react in real time to events (currently: order status changes).

## Structs & Types

```go
type WebHookType int // Customer=1, Simulation=2, Order=3
type WebHookAuthenticationType int // None=1, Basic=2, JWT=3

type Webhook struct {
	Type               WebHookType
	URL                string
	AuthenticationType WebHookAuthenticationType
}

type CreateWebhookRequest struct {
	Type               WebHookType
	URL                string
	AuthenticationType WebHookAuthenticationType
	Credential         string // required if AuthenticationType is Basic/JWT
}

type CreateWebhookResult struct {
	SigningSecret string // save this — used to verify HMAC signatures on incoming events
}

type OrderWebhookEvent struct {
	OrderID    string
	Status     OrderStatus
	StatusRaw  int
	StatusName string
}

type ListWebhookAuditRequest struct { // all filters optional — empty strings / nil pointers are omitted
	StartDate   string // ISO-8601 date-time
	EndDate     string // ISO-8601 date-time
	OrderID     string
	OrderNumber *int64
	StatusCode  *int // HTTP status your endpoint returned
	Page        int  // 0 → 1
	PageSize    int  // 0 → 10
}

type WebhookAudit struct {
	ID         string
	Type       WebHookType
	Request    string // raw body sent to your endpoint
	Response   string // raw body your endpoint returned
	StatusCode int
	CreatedAt  string
}
```

## Setup

1. `client.Webhooks.Create(ctx, CreateWebhookRequest{Type: parcelemais.WebHookTypeOrder, URL: "https://yourapp.com/webhooks/parcelemais", AuthenticationType: parcelemais.WebHookAuthenticationTypeNone})`.
2. Store the returned `SigningSecret` securely (env var/secret manager) — it's shown only once, at creation time.
3. `client.Webhooks.List(ctx)` / `.Update(ctx, webhookType, req)` / `.Delete(ctx, webhookType)` manage existing registrations, keyed by `WebHookType` (one webhook per type).
4. `client.Webhooks.ListAudit(ctx, ListWebhookAuditRequest{...})` returns `(*PagedResult[WebhookAudit], error)` — the delivery audit (see below).

## Security: Signature Verification

Always verify the signature before trusting a received payload — the SDK does this for you when you pass the signature header:

```go
event, err := parcelemais.ParseWebhookEvent(rawBody, signatureHeader, signingSecret)
if err != nil {
	var sigErr *parcelemais.WebhookSignatureError
	if errors.As(err, &sigErr) {
		// invalid signature, malformed header, or outside the 5-minute replay window — reject with 401
	}
}
```

- Signature header format: `t=<unix-timestamp>,v1=<hex-hmac>` (mirrors Stripe's convention).
- `ParseWebhookEvent` internally computes `HMAC-SHA256("{timestamp}.{rawBody}", signingSecret)` and compares it in constant time (`hmac.Equal`) against `v1`.
- It also rejects events whose timestamp is more than **5 minutes** off from now — mitigates replay attacks.
- To compute a signature yourself (e.g. for tests), use `parcelemais.ComputeWebhookSignature(signingSecret, timestampSeconds, payload)`.

## Go Example

(Source: `examples/go/webhooks.go`)

```go
func handleWebhook(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	event, err := parcelemais.ParseWebhookEvent(body, r.Header.Get("X-ParceleMais-Signature"), signingSecret)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	// event.OrderID, event.Status, event.StatusName
	w.WriteHeader(http.StatusOK)
}
```

## Delivery audit

`ListAudit` (`GET /v1/webhooks/auditoria`) returns one `WebhookAudit` per delivery attempt — including failed attempts and ones where your endpoint was unreachable — newest first. Every filter is optional: date range (`StartDate`/`EndDate`), `OrderID`, `OrderNumber`, and `StatusCode` (the HTTP status your endpoint returned). Paging works like Orders/Customers: `Page` defaults to 1, `PageSize` to 10, no auto-pagination — advance `Page` explicitly and check `result.HasNext`.

```go
status := 500
failures, err := client.Webhooks.ListAudit(ctx, parcelemais.ListWebhookAuditRequest{
	StartDate:  time.Now().Add(-24 * time.Hour).UTC().Format(time.RFC3339),
	StatusCode: &status,
})
if err != nil {
	return err
}
for _, attempt := range failures.Items {
	fmt.Println(attempt.CreatedAt, attempt.StatusCode, attempt.Response)
}
```

- Filter by `StatusCode` (e.g. `500`) to find failed deliveries.
- `Request`/`Response` are the raw text bodies sent to and received from your endpoint — not parsed JSON.

## Handling Failures and Edge Cases

- **Always respond `200`** once the event is durably queued/processed — a non-2xx response causes Parcele+ to retry delivery.
- **Idempotency**: use `event.OrderID` + `event.StatusRaw` to detect and skip duplicate deliveries (the same event may be sent more than once).
- **Malformed body**: `ParseWebhookEvent` returns `*parcelemais.WebhookSignatureError` if the body isn't valid JSON — treat it as a `401`, don't panic.
- **Logging**: log every received event (type, order ID, status, timestamp) for observability — don't log the raw `signingSecret`.
