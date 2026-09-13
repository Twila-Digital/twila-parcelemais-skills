# ParceleMais Simulations Integration (Python)

Simulate installments or values without creating any real order. Access via `client.simulations`.

## Types

```python
from twila_parcelemais import (
    CalculationValueType,
    SimulateInstallmentsRequest,
    SimulateValuesRequest,
    InstallmentSimulation,
    ValuesSimulation,
)

# CalculationValueType: GROSS_AMOUNT=1, LIQUID_AMOUNT=2 (defaults to GROSS_AMOUNT when omitted)
# SimulateInstallmentsRequest: requested_amount, calculation_value_type (optional)
# SimulateValuesRequest: amount, term, calculation_value_type (optional)
# InstallmentSimulation: total_amount, term, installment_amount
# ValuesSimulation: sale_amount, disbursement_amount, installment_amount
```

## Features

- `client.simulations.simulate_installments(request) -> list[InstallmentSimulation]` — returns every available term/installment combination for a requested amount.
- `client.simulations.simulate_values(request) -> ValuesSimulation` — returns sale/disbursement/installment amounts for a fixed term.
- Neither call creates any record — safe to call as often as needed while building a quote UI.

## Example

(Source: `examples/python/simulations.py`)

```python
options = client.simulations.simulate_installments(
    SimulateInstallmentsRequest(requested_amount=1500.00)
)
for option in options:
    print(f"{option.term}x de R$ {option.installment_amount:.2f} (total R$ {option.total_amount:.2f})")

values = client.simulations.simulate_values(SimulateValuesRequest(amount=1500.00, term=12))
print(values.installment_amount)
```

## Error Handling and Edge Cases

- `requested_amount`/`amount` below the API's minimum threshold returns a `ParceleMaisValidationError` — validate on the client side too before calling, to give faster feedback.
- Gross vs. liquid (`calculation_value_type`) changes which side (establishment vs. customer) absorbs MDR/anticipation fees — pick deliberately, don't leave the default assuming it's always correct for your use case.
- `simulate_installments` can return an empty list for amounts outside the supported range — handle that, don't assume at least one option always comes back.
