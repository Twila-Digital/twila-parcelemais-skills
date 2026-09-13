"""Webhook registration and signature verification — see rules/python/webhooks.md."""

from twila_parcelemais import (
    CreateWebhookRequest,
    OrderStatus,
    ParceleMaisClient,
    ParceleMaisWebhookSignatureError,
    WebHookAuthenticationType,
    WebHookType,
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
