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
```

## Setup

1. `client.Webhooks.Create(ctx, CreateWebhookRequest{Type: parcelemais.WebHookTypeOrder, URL: "https://yourapp.com/webhooks/parcelemais", AuthenticationType: parcelemais.WebHookAuthenticationTypeNone})`.
2. Store the returned `SigningSecret` securely (env var/secret manager) — it's shown only once, at creation time.
3. `client.Webhooks.List(ctx)` / `.Update(ctx, webhookType, req)` / `.Delete(ctx, webhookType)` manage existing registrations, keyed by `WebHookType` (one webhook per type).

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

## Handling Failures and Edge Cases

- **Always respond `200`** once the event is durably queued/processed — a non-2xx response causes Parcele+ to retry delivery.
- **Idempotency**: use `event.OrderID` + `event.StatusRaw` to detect and skip duplicate deliveries (the same event may be sent more than once).
- **Malformed body**: `ParseWebhookEvent` returns `*parcelemais.WebhookSignatureError` if the body isn't valid JSON — treat it as a `401`, don't panic.
- **Logging**: log every received event (type, order ID, status, timestamp) for observability — don't log the raw `signingSecret`.
