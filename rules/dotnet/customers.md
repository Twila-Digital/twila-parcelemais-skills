# ParceleMais Customers Integration (.NET)

`ICustomersClient` (available as `client.Customers`) manages the people who request credit.

## Models

```csharp
public sealed record Address(
    string? Street = null, string? Number = null, string? Neighborhood = null, string? City = null,
    string? State = null, string? PostalCode = null, string? Country = null, string? Complement = null);

public sealed record Customer(
    Guid Id, string Name, string Document, DateTimeOffset DateOfBirth,
    Address? Address = null, string? Email = null, string? PhoneNumber = null);

public sealed record ListCustomersRequest(
    string? Name = null, string? Document = null, int Page = 1, int PageSize = 10);
```

## Interface

```csharp
public interface ICustomersClient
{
    Task<Customer> GetAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<PagedResult<Customer>> ListAsync(ListCustomersRequest? request = null, CancellationToken cancellationToken = default);
}
```

## Features

- **Get**: fetch a single customer by id.
- **List**: paginated, filterable by name (partial match) or document (CPF, exact match).
- Customers are created implicitly as part of `Orders.CreateAsync` — there's no standalone `Customers.CreateAsync`; look them up after an order references them.

## Example

(Source: `examples/dotnet/customers.cs`)

```csharp
var page = await client.Customers.ListAsync(new ListCustomersRequest(Document: "12345678900"));
foreach (var customer in page.Items)
    Console.WriteLine($"{customer.Name} ({customer.Document})");
```

## Error Handling and Edge Cases

- `ParceleMaisApiException` (404) — customer id not found.
- `ParceleMaisValidationException` — invalid document format.
- `Address`, `Email`, `PhoneNumber` are all nullable — a customer created via an order may not have every field populated depending on what was collected.
- `PagedResult<Customer>` — check `HasNext`/`TotalCount` before assuming a single page is the full result set.
