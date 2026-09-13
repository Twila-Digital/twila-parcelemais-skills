# ParceleMais Customers Integration (Python)

Read-only access to customers (`clientes`) already known to Parcele+. Access via `client.customers`.

## Types

```python
from twila_parcelemais import Address, Customer, ListCustomersRequest

# Address (customer variant): street, number, neighborhood, city, state, postal_code, country, complement — all Optional
# Customer: id, name, document, date_of_birth, address (Optional), email (Optional), phone_number (Optional)
# ListCustomersRequest: name (Optional), document (Optional), page=1, page_size=10
```

## Features

- `client.customers.get(customer_id: str) -> Customer`
- `client.customers.list(request: ListCustomersRequest | None = None) -> PagedResult[Customer]` — filter by `name`/`document`, paginate with `page`/`page_size`.
- There is no create/update/delete for customers via this API — customer records are created as a side effect of `orders.create`.

## Example

(Source: `examples/python/customers.py`)

```python
customer = client.customers.get(customer_id)

page = client.customers.list(ListCustomersRequest(document="12345678900", page=1, page_size=10))
for c in page.items:
    print(c.name, c.document)
if page.has_next:
    next_page = client.customers.list(ListCustomersRequest(document="12345678900", page=2, page_size=10))
```

## Error Handling and Edge Cases

- `get` on a non-existent `customer_id` raises `ParceleMaisApiError` with `status_code == 404` — don't assume the customer exists just because you have an id string.
- `address`/`email`/`phone_number` may be `None` even for an existing customer — don't assume they're always populated.
- Use `PagedResult.has_next`/`has_previous` to drive pagination — don't loop by incrementing `page` until an empty page (that wastes a request).
