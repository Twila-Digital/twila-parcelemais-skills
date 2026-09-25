import java.time.OffsetDateTime;
import twila.parcelemais.PagedResult;
import twila.parcelemais.ParceleMaisClient;
import twila.parcelemais.errors.ParceleMaisWebhookSignatureException;
import twila.parcelemais.webhooks.ParceleMaisWebhookEvent;
import twila.parcelemais.webhooks.model.CreateWebhookRequest;
import twila.parcelemais.webhooks.model.CreateWebhookResult;
import twila.parcelemais.webhooks.model.ListWebhookAuditRequest;
import twila.parcelemais.webhooks.model.OrderWebhookEvent;
import twila.parcelemais.webhooks.model.WebHookAuthenticationType;
import twila.parcelemais.webhooks.model.WebHookType;
import twila.parcelemais.webhooks.model.WebhookAudit;

public final class WebhooksExample {

    public static String registerOrderWebhook(ParceleMaisClient client, String url) {
        CreateWebhookResult result = client.webhooks().create(CreateWebhookRequest.builder()
                .type(WebHookType.ORDER)
                .url(url)
                .authenticationType(WebHookAuthenticationType.NONE)
                .build());

        // Persist result.getSigningSecret() in your secret manager — shown only once.
        return result.getSigningSecret();
    }

    /** Call this from your HTTP handler after reading the raw request body. */
    public static int handleIncomingWebhook(String rawJsonBody, String signatureHeader, String signingSecret) {
        try {
            OrderWebhookEvent event = ParceleMaisWebhookEvent.parse(rawJsonBody, signatureHeader, signingSecret);
            System.out.println("Pedido " + event.getOrderId() + " -> " + event.getStatus());
            // ... process the event (idempotently, keyed by orderId + status) ...
            return 200;
        } catch (ParceleMaisWebhookSignatureException ex) {
            System.err.println("Assinatura de webhook inválida: " + ex.getMessage());
            return 401;
        }
    }

    /** Delivery audit: failed attempts (HTTP 500 from your endpoint) in the last 24h, newest first. */
    public static PagedResult<WebhookAudit> listFailedDeliveries(ParceleMaisClient client) {
        PagedResult<WebhookAudit> page = client.webhooks().listAudit(ListWebhookAuditRequest.builder()
                .startDate(OffsetDateTime.now().minusDays(1))
                .statusCode(500)
                .build());

        // No auto-pagination — request .page(2), .page(3), ... while page.isHasNext() is true.
        return page;
    }
}
