# ParceleMais Simulations Integration (PHP)

Simulate installments or values without creating an order — no record is created on the API side.

## Classes & Types

```php
use Twila\ParceleMais\Simulations\CalculationValueType;
use Twila\ParceleMais\Simulations\SimulateInstallmentsRequest;
use Twila\ParceleMais\Simulations\SimulateValuesRequest;
use Twila\ParceleMais\Simulations\InstallmentSimulation;
use Twila\ParceleMais\Simulations\ValuesSimulation;

final class SimulateInstallmentsRequest {
    public float $requestedAmount;
    public ?int $calculationValueType; // CalculationValueType::*, null = GROSS_AMOUNT
}

final class SimulateValuesRequest {
    public float $amount; public int $term;
    public ?int $calculationValueType;
}

final class InstallmentSimulation {
    public float $totalAmount; public int $term; public float $installmentAmount;
}

final class ValuesSimulation {
    public float $saleAmount; public float $disbursementAmount; public float $installmentAmount;
}
```

`CalculationValueType`: `GROSS_AMOUNT = 1` (default when `null`), `LIQUID_AMOUNT = 2`, `UNKNOWN = -1`.

## Features

- `$client->simulations->simulateInstallments(SimulateInstallmentsRequest $request): InstallmentSimulation[]` — one result per available term.
- `$client->simulations->simulateValues(SimulateValuesRequest $request): ValuesSimulation` — for a specific term.

## Example

(Source: `examples/php/simulations.php`)

```php
$installments = $client->simulations->simulateInstallments(
    new SimulateInstallmentsRequest(1500.00, CalculationValueType::GROSS_AMOUNT)
);
foreach ($installments as $installment) {
    printf("%dx de %.2f (total %.2f)\n", $installment->term, $installment->installmentAmount, $installment->totalAmount);
}
```

## Error Handling and Edge Cases

- Same exception hierarchy as Orders (`ParceleMaisValidationException`/`ParceleMaisApiException`) — a `requestedAmount`/`amount` of zero or negative typically returns a 400 with field errors.
- `calculationValueType` defaults to gross (`1`) when omitted — be explicit if your business logic depends on liquid values (post MDR/anticipation fees), don't rely on the default silently.
- These calls have no side effects — safe to call repeatedly (e.g. while a user adjusts a slider in a UI) without idempotency concerns.
