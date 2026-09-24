import express from 'express';
import {
  ParceleMaisClient,
  ParceleMaisEnvironment,
  WebHookType,
  WebHookAuthenticationType,
  parseWebhookEvent,
  ParceleMaisWebhookSignatureError,
  type PagedResult,
  type WebhookAudit,
} from '@twila/parcelemais';

const client = new ParceleMaisClient({
  clientId: process.env.PARCELEMAIS_CLIENT_ID!,
  clientSecret: process.env.PARCELEMAIS_CLIENT_SECRET!,
  environment: ParceleMaisEnvironment.Staging,
});

export async function registerOrderWebhook(url: string) {
  const result = await client.webhooks.create({
    type: WebHookType.Order,
    url,
    authenticationType: WebHookAuthenticationType.None,
  });

  // Store result.signingSecret securely (e.g. secrets manager) — shown only once.
  return result.signingSecret;
}

// Delivery audit: failed attempts (HTTP 500 from your endpoint) in the last 24h, newest first.
export async function listFailedDeliveries(): Promise<PagedResult<WebhookAudit>> {
  const page = await client.webhooks.listAudit({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    statusCode: 500,
  });

  // No auto-pagination — request page: 2, 3, ... while page.hasNext is true.
  return page;
}

const app = express();

app.post('/webhooks/parcelemais', express.text({ type: '*/*' }), (req, res) => {
  try {
    const event = parseWebhookEvent(
      req.body,
      req.header('X-ParceleMais-Signature'),
      process.env.PARCELEMAIS_WEBHOOK_SECRET!,
    );

    console.log(`Order ${event.orderId} is now ${event.statusName}`);
    res.sendStatus(200);
  } catch (error) {
    if (error instanceof ParceleMaisWebhookSignatureError) {
      res.sendStatus(401);
      return;
    }
    res.sendStatus(500);
  }
});
