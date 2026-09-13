# ParceleMais Orders Integration (Node.js)

Orders (`pedidos`) are credit/installment requests. Creating one starts the analysis flow; once approved, a CDC sale can be started to generate a payment link.

## Types

```typescript
interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  complement?: string;
}

interface CreateOrderRequest {
  cpf: string;
  phoneNumber: string;
  establishmentDocument: string;
  requestedAmount: number;
  name: string;
  email: string;
  dateOfBirth: string | Date;
  address: Address;
}

interface Order {
  id: string;
  number: number;
  status: OrderStatus; // enum: Undefined, Analysing, Approved, UnavailableBalance, AnalysisExpired,
                        // PendingPayment, BiometryRefused, BiometryApproved, PaymentRefused, Purchased,
                        // Unauthorized, PendingAuthorization, AwaitingRegistration, SaleNotStarted,
                        // Canceled, Billing, Completed, Frozen, PendingPaymentConfirmation, Disbursed
  statusDescription: string;
  customerDocument: string;
  establishmentLegalName: string;
  establishmentDocument: string;
  createdAt: string;
  total?: number;
  customerName?: string;
  term?: number;
  description?: string;
  approvedAmount?: number;
  disbursed?: boolean;
  disbursedAt?: string;
  requestedAmount?: number;
}

interface ListOrdersRequest {
  status?: OrderStatus;
  customerDocument?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  number?: number;
  establishmentDocument?: string;
  description?: string;
  page?: number;    // default 1
  pageSize?: number; // default 10
}

interface CheckoutLink {
  url?: string;
}

interface InvoiceFile {
  fileName: string;
  base64Content: string;
}
```

`client.orders` exposes: `create(request)`, `get(orderId)`, `list(request?)`, `startCdcSale(orderId)`, `importInvoice(orderId, file)`. `list` returns a `PagedResult<Order>` (`items`, `hasNext`, `hasPrevious`, `pageNumber`, `pageSize`, `totalCount`) — no auto-pagination, advance pages explicitly.

## Features
- Amounts are floats in BRL (`1500.00`), not cents.
- `invoiceFileFromBuffer(content, fileName)` helper encodes a `Buffer`/`Uint8Array` to the base64 shape `importInvoice` expects.
- `startCdcSale` returns the hosted payment link the customer completes the purchase on.

## Example
(Source: `examples/node/orders.ts`)

```typescript
const orderId = await client.orders.create({
  cpf: '12345678900',
  phoneNumber: '11999999999',
  establishmentDocument: '12345678000199',
  requestedAmount: 1500.0,
  name: 'João Silva',
  email: 'joao@email.com',
  dateOfBirth: '1990-01-01',
  address: { street: 'Rua Exemplo', number: '100', neighborhood: 'Centro', city: 'São Paulo', state: 'SP', postalCode: '01310-100' },
});

const order = await client.orders.get(orderId);
if (order.status === OrderStatus.Approved) {
  const link = await client.orders.startCdcSale(orderId);
  console.log(link.url);
}
```

## Error Handling and Edge Cases
- `create`/`get`/`list`/`startCdcSale`/`importInvoice` reject with `ParceleMaisValidationError` (400, has `fieldErrors`), `ParceleMaisApiError` (other status codes, has `errorCode`/`correlationId`), `ParceleMaisRateLimitError` (429, has `retryAfterMs`), or `ParceleMaisTimeoutError`/`ParceleMaisAuthenticationError` for transport/auth failures.
- `startCdcSale` only makes sense once `status` is `Approved` — calling it earlier returns an API error, don't assume it always succeeds.
- `importInvoice` uploads can be larger — the SDK uses a longer attempt timeout for this call specifically; don't wrap it in your own shorter timeout.
- Always check `error instanceof ParceleMaisValidationError` before reading `fieldErrors` — a generic `ParceleMaisApiError` won't have it populated the same way.
