# ParceleMais Orders Integration (.NET)

Orders (`Pedidos`) are credit/installment requests. `IOrdersClient` (available as `client.Orders` on `IParceleMaisClient`) exposes the full lifecycle.

## Models

```csharp
public sealed record Address(
    string Street, string Number, string Neighborhood, string City, string State,
    string PostalCode, string? Complement = null);

public sealed record CreateOrderRequest(
    string Cpf, string PhoneNumber, string EstablishmentDocument, decimal RequestedAmount,
    string Name, string Email, DateTimeOffset DateOfBirth, Address Address);

public sealed record Order(
    Guid Id, long Number, OrderStatus Status, string StatusDescription,
    string CustomerDocument, string EstablishmentLegalName, string EstablishmentDocument,
    DateTimeOffset CreatedAt, decimal? Total = null, string? CustomerName = null,
    int? Term = null, string? Description = null, decimal? ApprovedAmount = null,
    bool? Disbursed = null, DateTimeOffset? DisbursedAt = null, decimal? RequestedAmount = null);

public sealed record ListOrdersRequest(
    OrderStatus? Status = null, string? CustomerDocument = null, DateTimeOffset? StartDate = null,
    DateTimeOffset? EndDate = null, long? Number = null, string? EstablishmentDocument = null,
    string? Description = null, int Page = 1, int PageSize = 10);

public sealed record CheckoutLink(string? Url);

public enum OrderStatus
{
    Undefined = 0, Analysing = 1, Approved = 2, UnavailableBalance = 3, AnalysisExpired = 4,
    PendingPayment = 5, BiometryRefused = 6, BiometryApproved = 7, PaymentRefused = 8,
    Purchased = 9, Unauthorized = 10, PendingAuthorization = 11, AwaitingRegistration = 12,
    SaleNotStarted = 13, Canceled = 14, Billing = 15, Completed = 16, Frozen = 17,
    PendingPaymentConfirmation = 18, Disbursed = 19,
    [UnknownValue] Unknown = -1 // any value the API adds later that this SDK version doesn't know yet
}
```

## Interface

```csharp
public interface IOrdersClient
{
    Task<Guid> CreateAsync(CreateOrderRequest request, CancellationToken cancellationToken = default);
    Task<Order> GetAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<PagedResult<Order>> ListAsync(ListOrdersRequest? request = null, CancellationToken cancellationToken = default);
    Task<CheckoutLink> StartCdcSaleAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task ImportInvoiceAsync(Guid orderId, InvoiceFile file, CancellationToken cancellationToken = default);
}
```

## Features

- **Create**: submits a credit request for a customer at an establishment; returns the new order's `Guid`.
- **Get**: fetch a single order by id, including its current `Status`.
- **List**: paginated, filterable by status, customer/establishment document, date range, order number, description.
- **StartCdcSale**: generates a hosted payment link (`CheckoutLink.Url`) once an order is `Approved`.
- **ImportInvoice**: attaches an invoice file (`InvoiceFile.FromBytes/FromStream/FromFile`) to an order — encodes to base64 internally.

## Example

(Source: `examples/dotnet/orders.cs`)

```csharp
var orderId = await client.Orders.CreateAsync(new CreateOrderRequest(
    Cpf: "12345678900", PhoneNumber: "11999999999", EstablishmentDocument: "12345678000199",
    RequestedAmount: 1500.00m, Name: "João Silva", Email: "joao@email.com",
    DateOfBirth: new DateTimeOffset(1990, 1, 1, 0, 0, 0, TimeSpan.Zero),
    Address: new Address("Rua Exemplo", "100", "Centro", "São Paulo", "SP", "01310-100")));

var order = await client.Orders.GetAsync(orderId);
```

## Error Handling and Edge Cases

- `ParceleMaisValidationException` (400) — missing/invalid fields; check `.Errors` (per-field messages).
- `ParceleMaisApiException` — any other API error (404 order not found, 409 conflict, 5xx); check `.StatusCode`/`.ErrorCode`/`.CorrelationId`.
- `ParceleMaisRateLimitException` (429) — back off using `.RetryAfter` before retrying (the SDK's built-in retry policy already handles this automatically in most cases).
- `ParceleMaisTimeoutException` — attempt/total timeout or open circuit breaker; safe to retry after a delay.
- `Order.Status` uses `OrderStatus.Unknown = -1` as a forward-compatible fallback if the API introduces a new status value this SDK version doesn't know about yet — always handle the `Unknown` case rather than assuming an exhaustive switch.
- `Order.Total`, `.CustomerName`, `.Term`, `.ApprovedAmount`, etc. are nullable — not every field is populated at every order stage (e.g. `ApprovedAmount` is only set after approval).
