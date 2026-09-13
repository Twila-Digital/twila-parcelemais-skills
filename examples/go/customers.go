package main

import (
	"context"
	"errors"
	"fmt"
	"log"

	parcelemais "github.com/Twila-Digital/twila-parcelemais-go-sdk"
)

func getCustomer(ctx context.Context, client *parcelemais.Client, customerID string) {
	customer, err := client.Customers.Get(ctx, customerID)
	if err != nil {
		var apiErr *parcelemais.APIError
		if errors.As(err, &apiErr) && apiErr.StatusCode == 404 {
			log.Fatalf("cliente %s não encontrado", customerID)
		}
		log.Fatalf("get customer: %v", err)
	}

	fmt.Printf("%s (%s)\n", customer.Name, customer.Document)
	if customer.Email != nil {
		fmt.Printf("email: %s\n", *customer.Email)
	}
}

func listCustomersByDocument(ctx context.Context, client *parcelemais.Client, document string) {
	result, err := client.Customers.List(ctx, parcelemais.ListCustomersRequest{
		Document: document,
		Page:     1,
		PageSize: 10,
	})
	if err != nil {
		log.Fatalf("list customers: %v", err)
	}

	for _, customer := range result.Items {
		fmt.Println(customer.ID, customer.Name)
	}
}
