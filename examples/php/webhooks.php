<?php

declare(strict_types=1);

use Twila\ParceleMais\Config\ClientOptions;
use Twila\ParceleMais\Config\Environment;
use Twila\ParceleMais\Errors\ParceleMaisWebhookSignatureException;
use Twila\ParceleMais\ParceleMaisClient;
use Twila\ParceleMais\Webhooks\CreateWebhookRequest;
use Twila\ParceleMais\Webhooks\WebHookAuthenticationType;
use Twila\ParceleMais\Webhooks\WebHookType;
use Twila\ParceleMais\Webhooks\WebhookEvent;

$client = new ParceleMaisClient(new ClientOptions(
    getenv('PARCELEMAIS_CLIENT_ID'),
    getenv('PARCELEMAIS_CLIENT_SECRET'),
    Environment::STAGING
));

// Register a webhook for order status changes
$result = $client->webhooks->create(new CreateWebhookRequest(
    WebHookType::ORDER,
    'https://yourapp.com/webhooks/parcelemais',
    WebHookAuthenticationType::NONE
));
// Persist $result->signingSecret in your own secrets storage — it is not retrievable again.
$signingSecret = $result->signingSecret;

// --- In your webhook HTTP endpoint ---
function handleParceleMaisWebhook(string $rawBody, string $signatureHeader, string $signingSecret): void
{
    try {
        $event = WebhookEvent::parse($rawBody, $signatureHeader, $signingSecret);
    } catch (ParceleMaisWebhookSignatureException $e) {
        http_response_code(401);
        echo $e->getMessage();
        return;
    }

    // Queue for async processing and respond fast — don't do slow work here.
    // enqueue($event->orderId, $event->status, $event->statusName);
    http_response_code(200);
}
