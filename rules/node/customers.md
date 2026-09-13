# ParceleMais Customers Integration (Node.js)

Read-only access to customers (`clientes`) that have gone through an order at least once.

## Types

```typescript
interface Address {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  complement?: string;
}

interface Customer {
  id: string;
  name: string;
  document: string; // CPF
  dateOfBirth: string;
  address?: Address;
  email?: string;
  phoneNumber?: string;
}

interface ListCustomersRequest {
  name?: string;
  document?: string;
  page?: number;    // default 1
  pageSize?: number; // default 10
}
```

`client.customers` exposes: `get(customerId)` and `list(request?)` — the latter returns a `PagedResult<Customer>`.

## Features
- There is no create/update/delete for customers — records are created as a side effect of `orders.create`.
- Filter by `document` (CPF) when you already know the customer and just need their Parcele+ `id`.

## Example
(Source: `examples/node/customers.ts`)

```typescript
const page = await client.customers.list({ document: '12345678900' });
for (const customer of page.items) {
  console.log(`${customer.name} (${customer.document})`);
}
```

## Error Handling and Edge Cases
- `get` with an unknown `customerId` rejects with a `ParceleMaisApiError` (404) — don't assume the customer exists just because you have an ID cached locally.
- `list` with no filters returns every customer for your establishment, paginated — always pass `pageSize` explicitly if you expect a large base, don't rely on the default.
