# ParceleMais Simulations Integration (Java)

Simulations (`twila.parcelemais.simulations`) let you calculate installments or values **without creating an order** — no record is persisted.

## Models

```java
public interface SimulationsClient {
    List<InstallmentSimulation> simulateInstallments(SimulateInstallmentsRequest request);
    ValuesSimulation simulateValues(SimulateValuesRequest request);
}

@Value @Builder
public class SimulateInstallmentsRequest {
    BigDecimal requestedAmount;
    CalculationValueType calculationValueType; // default GROSS_AMOUNT
}

@Value @Builder
public class SimulateValuesRequest {
    BigDecimal amount;
    int term;
    CalculationValueType calculationValueType; // default GROSS_AMOUNT
}

@Value
public class InstallmentSimulation {
    BigDecimal totalAmount;
    int term;
    BigDecimal installmentAmount;
}

@Value
public class ValuesSimulation {
    BigDecimal saleAmount;
    BigDecimal disbursementAmount;
    BigDecimal installmentAmount;
}
```

`CalculationValueType`: `GROSS_AMOUNT` (before MDR/anticipation discounts) or `LIQUID_AMOUNT` (net amount the establishment actually receives).

## Features

- `simulateInstallments` returns every available installment plan for a requested amount — present all options to the end user, don't hardcode a single term.
- `simulateValues` calculates sale/disbursement/installment amounts for a specific term.
- Neither call creates a record — safe to call repeatedly as the user adjusts inputs (e.g. a live calculator UI).

## Example

(Source: `examples/java/simulations.java`)

```java
List<InstallmentSimulation> parcelas = client.simulations().simulateInstallments(
        SimulateInstallmentsRequest.builder()
                .requestedAmount(new BigDecimal("1500.00"))
                .build());

for (InstallmentSimulation parcela : parcelas)
    System.out.printf("%dx de %s (total %s)%n", parcela.getTerm(), parcela.getInstallmentAmount(), parcela.getTotalAmount());
```

## Error Handling and Edge Cases

- `ParceleMaisValidationException` — invalid `requestedAmount`/`term` (e.g. negative or zero); validate client-side before calling to give faster feedback.
- Values are `BigDecimal` in BRL, not cents — never multiply/divide by 100.
- `simulateValues` requires `term` — if the user hasn't chosen one yet, call `simulateInstallments` first to list the valid terms.
