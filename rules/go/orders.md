# ParceleMais Orders Integration (Go)

Orders (pedidos) are how a customer requests CDC (Crédito Direto ao Consumidor) credit at the point of sale.

## Structs & Types

```go
type OrderStatus int // Undefined=0, Analysing=1, Approved=2, ..., Purchased=9, ..., Disbursed=19, Unknown=-1

type Address struct {
	Street       string
	Number       string
	Neighborhood string
	City         string
	State        string
	PostalCode   string
	Complement   string
}

type CreateOrderRequest struct {
	CPF                   string
	PhoneNumber           string
	EstablishmentDocument string
	RequestedAmount       float64
	Name                  string
	Email                 string
	DateOfBirth           string
	Address               Address
}

type Order struct {
	ID                     string
	Number                 int64
	Status                 OrderStatus
	StatusDescription      string
	CustomerDocument       string
	EstablishmentLegalName string
	EstablishmentDocument  string
	CreatedAt              string
	Total                  *float64
	CustomerName           *string
	Term                   *int64
	Description            *string
	ApprovedAmount         *float64
	Disbursed              *bool
	DisbursedAt            *string
	RequestedAmount        *float64
}

type ListOrdersRequest struct {
	Status                *OrderStatus
	CustomerDocument      string
	StartDate             string
	EndDate               string
	Number                *int64
	EstablishmentDocument string
	Description           string
	Page                  int
	PageSize              int
}

type CheckoutLink struct {
	URL string
}

type InvoiceFile struct {
	FileName      string
	Base64Content string
}
```

## Features

- `client.Orders.Create(ctx, CreateOrderRequest{...})` — creates an order, returns its ID (`string`).
- `client.Orders.Get(ctx, orderID)` — fetches a single order (`*Order`).
- `client.Orders.List(ctx, ListOrdersRequest{...})` — paginated listing, returns `*PagedResult[Order]` (generics — `Items`, `HasNext`, `HasPrevious`, `PageNumber`, `PageSize`, `TotalCount`). No auto-pagination — advance `Page` explicitly.
- `client.Orders.StartCdcSale(ctx, orderID)` — generates a hosted payment link (`*CheckoutLink`) for an approved order.
- `client.Orders.ImportInvoice(ctx, orderID, file)` — attaches an invoice (base64-encoded); use `parcelemais.NewInvoiceFileFromBytes(content, fileName)` to build `InvoiceFile` from raw bytes.
- `OrderStatus` is a plain `int` type — an unrecognized wire value is classified as `OrderStatusUnknown` (`-1`), but any `int` is otherwise directly usable (no special "unknown enum" wrapper needed, unlike SDKs in languages without a numeric fallback).

## Go Example

(Source: `examples/go/orders.go`)

```go
orderID, err := client.Orders.Create(ctx, parcelemais.CreateOrderRequest{
	CPF:                   "12345678900",
	PhoneNumber:           "11999999999",
	EstablishmentDocument: "12345678000199",
	RequestedAmount:       1500.00,
	Name:                  "João Silva",
	Email:                 "joao@email.com",
	DateOfBirth:           "1990-01-01",
	Address: parcelemais.Address{
		Street: "Rua Exemplo", Number: "100", Neighborhood: "Centro",
		City: "São Paulo", State: "SP", PostalCode: "01310-100",
	},
})
```

## Error Handling and Edge Cases

- Errors are **returned values**, not exceptions. Check the typed hierarchy via `errors.As`:
  ```go
  var apiErr *parcelemais.APIError
  if errors.As(err, &apiErr) {
      fmt.Println(apiErr.StatusCode, apiErr.ErrorCode(), apiErr.FieldErrors())
  }
  ```
- `*ValidationError` (embeds `*APIError`) — status 400, use `FieldErrors()` for per-field validation messages.
- `*RateLimitError` (embeds `*APIError`) — status 429, has `RetryAfterMs`.
- `*AuthenticationError` — token generation/renewal failed. A **persistent network error on a resource call** (e.g. `Orders.Get`) is **not** wrapped as `*AuthenticationError` — it propagates as the raw underlying transport error, matching the other SDKs in this family; only a network failure while fetching the token itself becomes `*AuthenticationError`.
- `*TimeoutError` — network timeout, total resilience-pipeline timeout, or an open circuit breaker.
- Always check `err != nil` before using a returned pointer — a failed call returns `(nil, err)`.
