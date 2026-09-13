# Webhook Configuration & Security (Node.js)

Webhooks let your application react to real-time events (e.g. an order changing status).

## Types

```typescript
enum WebHookType {
  Customer = 1,
  Simulation = 2,
  Order = 3,
}

enum WebHookAuthenticationType {
  None = 1,
  Basic = 2,
  Jwt = 3,
}

interface CreateWebhookRequest {
  type: WebHookType;
  url: string;
  authenticationType: WebHookAuthenticationType;
  credential?: string; // required if authenticationType is Basic or Jwt
}

interface CreateWebhookResult {
  signingSecret: string;
}

interface OrderWebhookEvent {
  orderId: string;
  status: OrderStatus;
  statusRaw: number;
  statusName: string;
}
```

`client.webhooks` exposes: `create(request)`, `list()`, `update(type, request)`, `delete(type)`. There's exactly one webhook per `WebHookType` — `create`/`update` target it by type, not by an opaque webhook ID.

## Setup

1. Call `client.webhooks.create({ type: WebHookType.Order, url: 'https://yourapp.com/webhooks/parcelemais', authenticationType: WebHookAuthenticationType.None })`.
2. Save the returned `signingSecret` — it's shown once and used to validate every event's signature.
3. Parcele+ will `POST` to your `url` whenever a matching event occurs.

## Security — verifying the signature

Always verify the signature before trusting a webhook body — never process an unverified payload.

```typescript
import { parseWebhookEvent } from '@twila/parcelemais';

app.post('/webhooks/parcelemais', express.text({ type: '*/*' }), (req, res) => {
  try {
    const event = parseWebhookEvent(req.body, req.header('X-ParceleMais-Signature'), process.env.PARCELEMAIS_WEBHOOK_SECRET!);
    // handle event.status / event.orderId
    res.sendStatus(200);
  } catch {
    res.sendStatus(401);
  }
});
```

`parseWebhookEvent` computes `HMAC-SHA256("{timestamp}.{rawBody}", signingSecret)`, compares it to the `v1=` field of the signature header using a constant-time comparison, and rejects timestamps older than 5 minutes (replay protection) — all of that is handled for you; just pass the **raw, unparsed** request body (not `req.body` already JSON-parsed by a body-parser middleware) and the signature header.

## Error Handling and Edge Cases
- `parseWebhookEvent` throws `ParceleMaisWebhookSignatureError` for: malformed signature header, signature mismatch, and stale timestamp (possible replay) — catch it specifically and respond `401`, not `500`.
- Respond `200` only after successfully processing the event; a non-2xx response causes Parcele+ to retry with backoff — make your handler idempotent using `event.orderId` + `event.status` (an old status re-delivered shouldn't redo work already done).
- Register the webhook against a publicly reachable HTTPS URL — no `localhost` in production; use a tunnel (ngrok, etc.) for local testing against staging.
