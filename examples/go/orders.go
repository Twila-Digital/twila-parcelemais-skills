package main

import (
	"context"
	"fmt"
	"log"

	parcelemais "github.com/Twila-Digital/twila-parcelemais-go-sdk"
)

func createAndFetchOrder(ctx context.Context, client *parcelemais.Client) {
	orderID, err := client.Orders.Create(ctx, parcelemais.CreateOrderRequest{
		CPF:                   "12345678900",
		PhoneNumber:           "11999999999",
		EstablishmentDocument: "12345678000199",
		RequestedAmount:       1500.00,
		Name:                  "João Silva",
		Email:                 "joao@email.com",
		DateOfBirth:           "1990-01-01",
		Address: parcelemais.Address{
			Street:       "Rua Exemplo",
			Number:       "100",
			Neighborhood: "Centro",
			City:         "São Paulo",
			State:        "SP",
			PostalCode:   "01310-100",
		},
	})
	if err != nil {
		log.Fatalf("create order: %v", err)
	}

	order, err := client.Orders.Get(ctx, orderID)
	if err != nil {
		log.Fatalf("get order: %v", err)
	}
	fmt.Printf("Pedido %s — status: %s\n", order.ID, order.StatusDescription)

	if order.Status == parcelemais.OrderStatusApproved {
		link, err := client.Orders.StartCdcSale(ctx, orderID)
		if err != nil {
			log.Fatalf("start cdc sale: %v", err)
		}
		fmt.Printf("Link de pagamento: %s\n", link.URL)
	}
}

func listRecentOrders(ctx context.Context, client *parcelemais.Client, customerDocument string) {
	result, err := client.Orders.List(ctx, parcelemais.ListOrdersRequest{
		CustomerDocument: customerDocument,
		Page:             1,
		PageSize:         10,
	})
	if err != nil {
		log.Fatalf("list orders: %v", err)
	}
	for _, order := range result.Items {
		fmt.Printf("#%d %s (status %s)\n", order.Number, order.ID, order.StatusDescription)
	}
	if result.HasNext {
		fmt.Println("há mais páginas — repita com Page: 2")
	}
}
