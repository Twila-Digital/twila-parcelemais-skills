# ParceleMais Simulations Integration (Node.js)

Simulate installments or values without creating any order — useful for showing the customer terms before checkout.

## Types

```typescript
enum CalculationValueType {
  GrossAmount = 1,
  LiquidAmount = 2,
}

interface SimulateInstallmentsRequest {
  requestedAmount: number;
  calculationValueType?: CalculationValueType; // defaults to GrossAmount
}

interface SimulateValuesRequest {
  amount: number;
  term: number;
  calculationValueType?: CalculationValueType;
}

interface InstallmentSimulation {
  totalAmount: number;
  term: number;
  installmentAmount: number;
}

interface ValuesSimulation {
  saleAmount: number;
  disbursementAmount: number;
  installmentAmount: number;
}
```

`client.simulations` exposes: `simulateInstallments(request)` (returns `InstallmentSimulation[]`, one entry per possible term) and `simulateValues(request)` (returns a single `ValuesSimulation` for a specific term).

## Features
- `GrossAmount` (bruto) is the value before MDR/anticipation deductions; `LiquidAmount` (líquido) already nets those out — pick based on whether you want the customer-facing amount or the establishment's net.
- No side effects — safe to call as often as needed while the customer adjusts the amount/term in a UI.

## Example
(Source: `examples/node/simulations.ts`)

```typescript
const installments = await client.simulations.simulateInstallments({ requestedAmount: 1500.0 });
for (const parcela of installments) {
  console.log(`${parcela.term}x de R$ ${parcela.installmentAmount.toFixed(2)} (total R$ ${parcela.totalAmount.toFixed(2)})`);
}
```

## Error Handling and Edge Cases
- `requestedAmount`/`amount` of zero or negative returns a `ParceleMaisValidationError` — validate on the client side first for a snappier UX.
- `simulateInstallments` can return an empty array if no installment plan is available for that amount — handle that case in the UI instead of assuming at least one entry.
