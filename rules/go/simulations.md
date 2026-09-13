# ParceleMais Simulations Integration (Go)

Simulations calculate installments/values without creating any order record — useful to show pricing before checkout.

## Structs & Types

```go
type CalculationValueType int // GrossAmount=1, LiquidAmount=2

type SimulateInstallmentsRequest struct {
	RequestedAmount      float64
	CalculationValueType CalculationValueType // zero-value treated as GrossAmount
}

type SimulateValuesRequest struct {
	Amount               float64
	Term                 int64
	CalculationValueType CalculationValueType
}

type InstallmentSimulation struct {
	TotalAmount       float64
	Term              int64
	InstallmentAmount float64
}

type ValuesSimulation struct {
	SaleAmount         float64
	DisbursementAmount float64
	InstallmentAmount  float64
}
```

## Features

- `client.Simulations.SimulateInstallments(ctx, req)` — returns `[]InstallmentSimulation`, one entry per available term.
- `client.Simulations.SimulateValues(ctx, req)` — returns `*ValuesSimulation` for a specific term.
- `CalculationValueType` distinguishes **gross** (`1`, before MDR/anticipation discounts) vs **liquid** (`2`, net amount) — leaving it as the zero value defaults to gross.
- No side effects — safe to call repeatedly while a user adjusts amount/term in a UI.

## Go Example

(Source: `examples/go/simulations.go`)

```go
installments, err := client.Simulations.SimulateInstallments(ctx, parcelemais.SimulateInstallmentsRequest{
	RequestedAmount: 1500.00,
})
for _, i := range installments {
	fmt.Printf("%dx de R$ %.2f (total R$ %.2f)\n", i.Term, i.InstallmentAmount, i.TotalAmount)
}
```

## Error Handling and Edge Cases

- Same typed error hierarchy as [orders.md](orders.md) — check `*parcelemais.ValidationError` for an invalid `RequestedAmount`/`Term` (e.g. below the minimum credit amount).
- `SimulateValues` requires a valid `Term` (installment count) — an out-of-range term returns a `*ValidationError` with field errors, not a panic.
- These endpoints are read-only (`GET` under the hood) — safe to retry automatically; the SDK's default resilience policy already does this.
