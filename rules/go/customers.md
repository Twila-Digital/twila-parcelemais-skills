# ParceleMais Customers Integration (Go)

Customers are the individuals (CPF) who request credit — created implicitly when an order is created, then queryable on their own.

## Structs & Types

```go
type CustomerAddress struct {
	Street       *string
	Number       *string
	Neighborhood *string
	City         *string
	State        *string
	PostalCode   *string
	Country      *string
	Complement   *string
}

type Customer struct {
	ID          string
	Name        string
	Document    string // CPF
	DateOfBirth string
	Address     *CustomerAddress
	Email       *string
	PhoneNumber *string
}

type ListCustomersRequest struct {
	Name     string
	Document string
	Page     int
	PageSize int
}
```

## Features

- `client.Customers.Get(ctx, customerID)` — fetches a single customer (`*Customer`).
- `client.Customers.List(ctx, req)` — paginated listing, filterable by `Name`/`Document`, returns `*PagedResult[Customer]`.
- Address and contact fields are pointers (`*string`) — the API may omit them; always nil-check before dereferencing.

## Go Example

(Source: `examples/go/customers.go`)

```go
result, err := client.Customers.List(ctx, parcelemais.ListCustomersRequest{
	Document: "12345678900",
	Page:     1,
	PageSize: 10,
})
for _, c := range result.Items {
	fmt.Println(c.ID, c.Name)
}
```

## Error Handling and Edge Cases

- `Get` on a non-existent `customerID` returns a `*parcelemais.APIError` with `StatusCode == 404` — check via `errors.As` rather than assuming any error means "not found".
- Pagination follows the same shape as Orders — no auto-pagination, advance `Page` explicitly and check `result.HasNext`.
- Optional fields (`Email`, `PhoneNumber`, `Address`) are pointers — a missing value is `nil`, not a zero-value string.
