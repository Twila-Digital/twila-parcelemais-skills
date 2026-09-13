# ParceleMais Simulations Integration (.NET)

Simulations let you preview installments/values **without** creating an order. `ISimulationsClient` is available as `client.Simulations`.

## Models

```csharp
public enum CalculationValueType
{
    GrossAmount = 1, LiquidAmount = 2,
    [UnknownValue] Unknown = -1
}

public sealed record SimulateInstallmentsRequest(
    decimal RequestedAmount, CalculationValueType CalculationValueType = CalculationValueType.GrossAmount);

public sealed record SimulateValuesRequest(
    decimal Amount, int Term, CalculationValueType CalculationValueType = CalculationValueType.GrossAmount);

public sealed record InstallmentSimulation(decimal TotalAmount, int Term, decimal InstallmentAmount);

public sealed record ValuesSimulation(decimal SaleAmount, decimal DisbursementAmount, decimal InstallmentAmount);
```

## Interface

```csharp
public interface ISimulationsClient
{
    Task<IReadOnlyList<InstallmentSimulation>> SimulateInstallmentsAsync(SimulateInstallmentsRequest request, CancellationToken cancellationToken = default);
    Task<ValuesSimulation> SimulateValuesAsync(SimulateValuesRequest request, CancellationToken cancellationToken = default);
}
```

## Features

- **SimulateInstallments**: given a requested amount, returns every available installment plan (term × total × per-installment amount).
- **SimulateValues**: given an amount and a specific term, returns the establishment's sale/disbursement amount and the customer's installment amount.
- **CalculationValueType.GrossAmount vs. LiquidAmount**: gross is the amount before MDR/anticipation deductions; liquid is what the establishment actually nets. Defaults to `GrossAmount` if omitted.

## Example

(Source: `examples/dotnet/simulations.cs`)

```csharp
var installments = await client.Simulations.SimulateInstallmentsAsync(
    new SimulateInstallmentsRequest(RequestedAmount: 1500.00m));

foreach (var installment in installments)
    Console.WriteLine($"{installment.Term}x de {installment.InstallmentAmount:C} (total {installment.TotalAmount:C})");
```

## Error Handling and Edge Cases

- `ParceleMaisValidationException` — e.g. `RequestedAmount`/`Amount` <= 0, or `Term` outside the accepted range.
- Simulations create no server-side record — safe to call repeatedly (e.g. as the user adjusts an amount slider in a UI) without side effects or idempotency concerns.
- `CalculationValueType.Unknown` only appears if a future API value isn't recognized by this SDK version — not expected in requests you construct yourself.
