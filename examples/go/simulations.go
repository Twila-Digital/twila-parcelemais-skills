package main

import (
	"context"
	"errors"
	"fmt"
	"log"

	parcelemais "github.com/Twila-Digital/twila-parcelemais-go-sdk"
)

func simulateInstallments(ctx context.Context, client *parcelemais.Client, amount float64) {
	installments, err := client.Simulations.SimulateInstallments(ctx, parcelemais.SimulateInstallmentsRequest{
		RequestedAmount: amount,
	})
	if err != nil {
		var validationErr *parcelemais.ValidationError
		if errors.As(err, &validationErr) {
			log.Fatalf("valor inválido: %v", validationErr.FieldErrors())
		}
		log.Fatalf("simulate installments: %v", err)
	}

	for _, installment := range installments {
		fmt.Printf("%dx de R$ %.2f (total R$ %.2f)\n",
			installment.Term, installment.InstallmentAmount, installment.TotalAmount)
	}
}

func simulateByTerm(ctx context.Context, client *parcelemais.Client, amount float64, term int64) {
	values, err := client.Simulations.SimulateValues(ctx, parcelemais.SimulateValuesRequest{
		Amount:               amount,
		Term:                 term,
		CalculationValueType: parcelemais.CalculationValueTypeLiquidAmount,
	})
	if err != nil {
		log.Fatalf("simulate values: %v", err)
	}

	fmt.Printf("Venda: R$ %.2f | Desembolso: R$ %.2f | Parcela: R$ %.2f\n",
		values.SaleAmount, values.DisbursementAmount, values.InstallmentAmount)
}
