"""Customer lookup and listing — see rules/python/customers.md."""

from twila_parcelemais import Customer, ListCustomersRequest, ParceleMaisClient


def get_customer(client: ParceleMaisClient, customer_id: str) -> Customer:
    return client.customers.get(customer_id)


def list_customers_by_document(client: ParceleMaisClient, document: str) -> list[Customer]:
    all_customers: list[Customer] = []
    page_number = 1

    while True:
        page = client.customers.list(ListCustomersRequest(document=document, page=page_number, page_size=10))
        all_customers.extend(page.items)
        if not page.has_next:
            break
        page_number += 1

    return all_customers
