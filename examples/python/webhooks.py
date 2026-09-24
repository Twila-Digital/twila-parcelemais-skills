"""Webhook registration, signature verification and delivery audit — see rules/python/webhooks.md."""

from datetime import datetime, timedelta, timezone

from twila_parcelemais import (
    CreateWebhookRequest,
    ListWebhookAuditRequest,
    OrderStatus,
    PagedResult,
    ParceleMaisClient,
    ParceleMaisWebhookSignatureError,
    WebHookAuthenticationType,
    WebHookType,
    WebhookAudit,
    parse_webhook_event,
)


def register_order_webhook(client: ParceleMaisClient, url: str) -> str:
    result = client.webhooks.create(
        CreateWebhookRequest(type=WebHookType.ORDER, url=url, authentication_type=WebHookAuthenticationType.NONE)
    )
    return result.signing_secret  # persist this — needed to verify incoming events


def handle_incoming_webhook(raw_body: str, signature_header: str, signing_secret: str) -> None:
    try:
        event = parse_webhook_event(raw_body, signature_header, signing_secret)
    except ParceleMaisWebhookSignatureError as error:
        print(f"Assinatura inválida: {error}")
        raise

    if event.status == OrderStatus.PURCHASED:
        print(f"Pedido {event.order_id} comprado.")
    elif event.status == OrderStatus.DISBURSED:
        print(f"Pedido {event.order_id} desembolsado.")
    else:
        print(f"Pedido {event.order_id}: {event.status_name}")


def list_failed_deliveries(client: ParceleMaisClient) -> PagedResult[WebhookAudit]:
    """Delivery audit: failed attempts (HTTP 500 from your endpoint) in the last 24h, newest first."""
    page = client.webhooks.list_audit(
        ListWebhookAuditRequest(start_date=datetime.now(timezone.utc) - timedelta(days=1), status_code=500)
    )
    # No auto-pagination — request page=2, 3, ... while page.has_next is True.
    return page
