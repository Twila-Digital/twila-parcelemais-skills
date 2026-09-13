# ParceleMais Orders Integration (Python)

Orders (`pedidos`) represent a CDC (Crédito Direto ao Consumidor) credit request. Access via `client.orders`.

## Types

```python
from twila_parcelemais import (
    Address,
    CreateOrderRequest,
    Order,
    OrderStatus,
    ListOrdersRequest,
    CheckoutLink,
    InvoiceFile,
)

# Address: street, number, neighborhood, city, state, postal_code, complement (optional)
# CreateOrderRequest: cpf, phone_number, establishment_document, requested_amount, name, email, date_of_birth, address
# Order: id, number, status (OrderStatus), status_description, customer_document, establishment_legal_name,
#        establishment_document, created_at, total, customer_name, term, description, approved_amount,
#        disbursed, disbursed_at, requested_amount (all fields after created_at are Optional)
```

`OrderStatus` is an `IntEnum` (`UNDEFINED=0` ... `DISBURSED=19`, plus `UNKNOWN=-1` for values the SDK doesn't recognize yet — reached via `OrderStatus.from_wire_value(raw_int)`).

## Features

- `client.orders.create(request: CreateOrderRequest) -> str` — returns the new order id.
- `client.orders.get(order_id: str) -> Order`
- `client.orders.list(request: ListOrdersRequest | None = None) -> PagedResult[Order]` — filter by `status`, `customer_document`, `start_date`/`end_date`, `number`, `establishment_document`, `description`; paginate with `page`/`page_size` (defaults `1`/`10`).
- `client.orders.start_cdc_sale(order_id: str) -> CheckoutLink` — generates the hosted payment link.
- `client.orders.import_invoice(order_id: str, file: InvoiceFile) -> None` — attaches an invoice; build `file` with `InvoiceFile.from_bytes(content, file_name)`.

## Example

(Source: `examples/python/orders.py`)

```python
order_id = client.orders.create(
    CreateOrderRequest(
        cpf="12345678900",
        phone_number="11999999999",
        establishment_document="12345678000199",
        requested_amount=1500.00,
        name="João Silva",
        email="joao@email.com",
        date_of_birth="1990-01-01",
        address=Address(street="Rua Exemplo", number="100", neighborhood="Centro", city="São Paulo", state="SP", postal_code="01310-100"),
    )
)

order = client.orders.get(order_id)
if order.status == OrderStatus.APPROVED:
    link = client.orders.start_cdc_sale(order_id)
    print(link.url)
```

## Error Handling and Edge Cases

- `client.orders.create(...)` raises `ParceleMaisValidationError` (subclass of `ParceleMaisApiError`) on a `400` with `.problem_details.errors` populated per field — surface those messages, don't just retry blindly.
- `start_cdc_sale` on an order that isn't `APPROVED` yet returns an API error — check `order.status` first.
- `import_invoice` uses a longer per-attempt timeout (`resilience.invoice_upload_attempt_timeout_ms`) since file uploads take longer than typical calls — don't lower it below the expected upload time for large files.
- Treat `total`/`approved_amount`/`term`/etc. as possibly `None` until the order reaches a status where they're populated by the API.
- A persistent network failure while calling any of these methods propagates as the underlying `httpx` exception, not a `ParceleMais*Error` — only API responses and auth failures get wrapped.
