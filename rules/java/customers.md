# ParceleMais Customers Integration (Java)

Customers (`twila.parcelemais.customers`) represent the individual (CPF) requesting credit.

## Models

```java
public interface CustomersClient {
    Customer get(UUID customerId);
    PagedResult<Customer> list(ListCustomersRequest request);
}

@Value @Builder
public class Customer {
    UUID id;
    String name;
    String document; // CPF
    OffsetDateTime dateOfBirth;
    Address address; // street, number, neighborhood, city, state, postalCode, country, complement
    String email;
    String phoneNumber;
}

@Value @Builder
public class ListCustomersRequest {
    String name;
    String document;
    int page;     // default 1
    int pageSize; // default 10
}
```

## Features

- `list` supports filtering by partial `name` or exact `document` (CPF).
- Customers are created implicitly by `OrdersClient.create(...)` — there's no standalone `create` on `CustomersClient`; look a customer up by the CPF you used when creating their first order.
- `list` returns `PagedResult<Customer>` — same pagination model as Orders (no auto-pagination).

## Example

(Source: `examples/java/customers.java`)

```java
PagedResult<Customer> page = client.customers().list(
        ListCustomersRequest.builder().document("12345678900").pageSize(10).build());

for (Customer customer : page.getItems())
    System.out.println(customer.getName() + " - " + customer.getDocument());
```

## Error Handling and Edge Cases

- `ParceleMaisApiException` (404) when `get(customerId)` doesn't match any known customer — don't assume every CPF used in a simulation has a corresponding `Customer` record (simulations never create one).
- `address`/`email`/`phoneNumber` can be `null` — a customer created via a minimal order payload may not have all fields populated.
