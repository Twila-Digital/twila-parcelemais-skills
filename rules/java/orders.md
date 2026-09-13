# ParceleMais Orders Integration (Java)

Orders (`twila.parcelemais.orders`) são o núcleo do crédito direto ao consumidor (CDC) — criação, consulta, listagem paginada, início da venda CDC e anexo de nota fiscal.

## Models

```java
public interface OrdersClient {
    UUID create(CreateOrderRequest request);
    Order get(UUID orderId);
    PagedResult<Order> list(ListOrdersRequest request);
    CheckoutLink startCdcSale(UUID orderId);
    void importInvoice(UUID orderId, InvoiceFile file);
}

@Value @Builder
public class CreateOrderRequest {
    String cpf;
    String phoneNumber;
    String establishmentDocument; // CNPJ
    BigDecimal requestedAmount;
    String name;
    String email;
    OffsetDateTime dateOfBirth;
    Address address; // street, number, neighborhood, city, state, postalCode, complement
}

@Value @Builder
public class Order {
    UUID id;
    long number;
    OrderStatus status;
    String statusDescription;
    String customerDocument;
    String establishmentLegalName;
    String establishmentDocument;
    OffsetDateTime createdAt;
    BigDecimal total;
    String customerName;
    Integer term;
    String description;
    BigDecimal approvedAmount;
    Boolean disbursed;
    OffsetDateTime disbursedAt;
    BigDecimal requestedAmount;
}

@Value @Builder
public class ListOrdersRequest {
    OrderStatus status;
    String customerDocument;
    OffsetDateTime startDate;
    OffsetDateTime endDate;
    Long number;
    String establishmentDocument;
    String description;
    int page;     // default 1
    int pageSize; // default 10
}
```

`OrderStatus` is an enum: `UNDEFINED`, `ANALYSING`, `APPROVED`, `UNAVAILABLE_BALANCE`, `ANALYSIS_EXPIRED`, `PENDING_PAYMENT`, `BIOMETRY_REFUSED`, `BIOMETRY_APPROVED`, `PAYMENT_REFUSED`, `PURCHASED`, `UNAUTHORIZED`, `PENDING_AUTHORIZATION`, `AWAITING_REGISTRATION`, `SALE_NOT_STARTED`, `CANCELED`, `BILLING`, `COMPLETED`, `FROZEN`, `PENDING_PAYMENT_CONFIRMATION`, `DISBURSED`, and `UNKNOWN` (fallback for any value the API returns that the SDK doesn't recognize yet — never assume the set is closed).

## Features

- `create` returns only the order's `UUID` — the API doesn't return the full order on creation; call `get(orderId)` right after if you need it.
- `list` returns `PagedResult<Order>` — no auto-pagination, you control page advancement explicitly (`ListOrdersRequest.builder().page(2).build()`).
- `startCdcSale` generates a hosted checkout link (`CheckoutLink.getUrl()`) for the customer to complete the CDC purchase.
- `importInvoice` attaches an invoice file — build it via `InvoiceFile.fromBytes(...)`, `.fromStream(...)`, or `.fromFile(path)` (all base64-encode internally).

## Example

(Source: `examples/java/orders.java`)

```java
UUID orderId = client.orders().create(CreateOrderRequest.builder()
        .cpf("12345678900")
        .phoneNumber("11999999999")
        .establishmentDocument("12345678000199")
        .requestedAmount(new BigDecimal("1500.00"))
        .name("João Silva")
        .email("joao@email.com")
        .dateOfBirth(OffsetDateTime.parse("1990-01-01T00:00:00-03:00"))
        .address(Address.builder()
                .street("Rua Exemplo").number("100").neighborhood("Centro")
                .city("São Paulo").state("SP").postalCode("01310-100")
                .build())
        .build());

Order order = client.orders().get(orderId);
```

## Error Handling and Edge Cases

- `ParceleMaisValidationException` (400) — field-level validation errors via `getErrors()` (`Map<String, String[]>`).
- `ParceleMaisApiException` (404/409/5xx) — check `getStatusCode()`/`getErrorCode()`/`getCorrelationId()` before retrying or surfacing to the user.
- `ParceleMaisRateLimitException` (429) — respect `getRetryAfter()` before retrying manually; the SDK's built-in retry policy already handles transient 429s/5xx automatically.
- `ParceleMaisTimeoutException` — attempt/total timeout exceeded, or circuit breaker open; back off, don't retry in a tight loop.
- Reuse `ParceleMaisClient` as a singleton (`try-with-resources` only at application shutdown) — creating one per request discards the token cache and circuit breaker state.
