package main

import (
	"context"
	"errors"
	"fmt"
	"log"

	parcelemais "github.com/Twila-Digital/twila-parcelemais-go-sdk"
)

func createEstablishment(ctx context.Context, client *parcelemais.Client) string {
	created, err := client.Establishments.Create(ctx, parcelemais.CreateEstablishmentRequest{
		Document:          "12345678000199",
		LegalName:         "Loja Centro LTDA",
		TradeName:         "Loja Centro",
		DisbursementModel: parcelemais.DisbursementModelEstablishmentChain,
		Owner: parcelemais.EstablishmentOwner{
			Name:  "Maria Souza",
			Email: "maria@loja.com.br",
			Phone: "+5511999998888",
		},
		BankAccount: parcelemais.EstablishmentBankAccount{
			BankNumber:    "341",
			AgencyNumber:  "1234",
			AccountNumber: "56789",
			AccountDigit:  "0",
			AccountType:   parcelemais.BankAccountTypeCurrent,
		},
		Address: parcelemais.EstablishmentAddress{
			Street:   "Rua Exemplo",
			Number:   "100",
			District: "Centro",
			City:     "São Paulo",
			State:    "SP",
			ZipCode:  "01310100",
		},
	})
	if err != nil {
		log.Fatalf("create establishment: %v", err)
	}

	// Persist EstablishmentID — it's required to read, edit or change the status of the establishment later.
	fmt.Println("loja criada:", created.EstablishmentID)
	return created.EstablishmentID
}

func getEstablishment(ctx context.Context, client *parcelemais.Client, establishmentID string) *parcelemais.Establishment {
	establishment, err := client.Establishments.Get(ctx, establishmentID)
	if err == nil {
		return establishment
	}

	var apiErr *parcelemais.APIError
	if errors.As(err, &apiErr) && apiErr.StatusCode == 404 {
		log.Printf("loja %s não pertence a este parceiro", establishmentID)
		return nil
	}

	log.Fatalf("get establishment: %v", err)
	return nil
}

func listActiveEstablishments(ctx context.Context, client *parcelemais.Client, tradeName string) []parcelemais.Establishment {
	isActive := true

	establishments, err := client.Establishments.List(ctx, parcelemais.ListEstablishmentsRequest{
		TradeName: tradeName,
		IsActive:  &isActive,
	})
	if err != nil {
		log.Fatalf("list establishments: %v", err)
	}

	return establishments
}

func renameEstablishment(ctx context.Context, client *parcelemais.Client, establishmentID string) {
	if err := client.Establishments.Update(ctx, establishmentID, parcelemais.UpdateEstablishmentRequest{
		TradeName: "Loja Centro Matriz",
	}); err != nil {
		log.Fatalf("update establishment: %v", err)
	}
}

func moveDisbursementToEstablishmentAccount(ctx context.Context, client *parcelemais.Client, establishmentID string) {
	// The establishment needs its own bank account before it can receive the disbursement.
	if err := client.Establishments.UpdateBankAccount(ctx, establishmentID, parcelemais.EstablishmentBankAccount{
		BankNumber:    "341",
		AgencyNumber:  "1234",
		AccountNumber: "56789",
		AccountDigit:  "0",
		AccountType:   parcelemais.BankAccountTypeCurrent,
	}); err != nil {
		log.Fatalf("update establishment bank account: %v", err)
	}

	disbursementModel := parcelemais.DisbursementModelEstablishment

	if err := client.Establishments.Update(ctx, establishmentID, parcelemais.UpdateEstablishmentRequest{
		TradeName:         "Loja Centro Matriz",
		DisbursementModel: &disbursementModel,
	}); err != nil {
		log.Fatalf("update establishment: %v", err)
	}
}

func closeEstablishment(ctx context.Context, client *parcelemais.Client, establishmentID string) {
	err := client.Establishments.Deactivate(ctx, establishmentID)
	if err == nil {
		return
	}

	var apiErr *parcelemais.APIError
	if errors.As(err, &apiErr) && apiErr.StatusCode == 404 {
		log.Printf("loja %s não pertence a este parceiro", establishmentID)
		return
	}

	log.Fatalf("deactivate establishment: %v", err)
}

func reopenEstablishment(ctx context.Context, client *parcelemais.Client, establishmentID string) {
	if err := client.Establishments.Activate(ctx, establishmentID); err != nil {
		log.Fatalf("activate establishment: %v", err)
	}
}
