"""Order creation, lookup, listing, and CDC sale — see rules/python/orders.md."""

from twila_parcelemais import (
    Address,
    CheckoutLink,
    CreateOrderRequest,
    InvoiceFile,
    ListOrdersRequest,
    Order,
    OrderStatus,
    ParceleMaisApiError,
    ParceleMaisClient,
)


def create_order(client: ParceleMaisClient) -> str:
    request = CreateOrderRequest(
        cpf="12345678900",
        phone_number="11999999999",
        establishment_document="12345678000199",
        requested_amount=1500.00,
        name="João Silva",
        email="joao@email.com",
        date_of_birth="1990-01-01",
        address=Address(
            street="Rua Exemplo",
            number="100",
            neighborhood="Centro",
            city="São Paulo",
            state="SP",
            postal_code="01310-100",
        ),
    )
    return client.orders.create(request)


def get_order(client: ParceleMaisClient, order_id: str) -> Order:
    try:
        return client.orders.get(order_id)
    except ParceleMaisApiError as error:
        print(f"{error.status_code} {error.error_code}: {error}")
        raise


def list_pending_orders(client: ParceleMaisClient) -> None:
    page = client.orders.list(ListOrdersRequest(status=OrderStatus.PENDING_PAYMENT, page=1, page_size=10))
    for order in page.items:
        print(order.id, order.status.name, order.total)


def start_cdc_sale(client: ParceleMaisClient, order_id: str) -> CheckoutLink:
    return client.orders.start_cdc_sale(order_id)


def import_invoice(client: ParceleMaisClient, order_id: str, pdf_bytes: bytes) -> None:
    file = InvoiceFile.from_bytes(pdf_bytes, "nota-fiscal.pdf")
    client.orders.import_invoice(order_id, file)
