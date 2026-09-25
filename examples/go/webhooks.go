package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	parcelemais "github.com/Twila-Digital/twila-parcelemais-go-sdk"
)

func registerOrderWebhook(ctx context.Context, client *parcelemais.Client, url string) string {
	result, err := client.Webhooks.Create(ctx, parcelemais.CreateWebhookRequest{
		Type:               parcelemais.WebHookTypeOrder,
		URL:                url,
		AuthenticationType: parcelemais.WebHookAuthenticationTypeNone,
	})
	if err != nil {
		log.Fatalf("create webhook: %v", err)
	}
	// Guarde result.SigningSecret com segurança — é usado pra validar eventos recebidos.
	return result.SigningSecret
}

// Auditoria de entregas: tentativas que falharam (HTTP 500 no seu endpoint) nas últimas 24h, mais recentes primeiro.
func listFailedDeliveries(ctx context.Context, client *parcelemais.Client) *parcelemais.PagedResult[parcelemais.WebhookAudit] {
	status := 500
	page, err := client.Webhooks.ListAudit(ctx, parcelemais.ListWebhookAuditRequest{
		StartDate:  time.Now().Add(-24 * time.Hour).UTC().Format(time.RFC3339),
		StatusCode: &status,
	})
	if err != nil {
		log.Fatalf("list webhook audit: %v", err)
	}
	// Sem auto-paginação — peça Page: 2, 3, ... enquanto page.HasNext for true.
	return page
}

func webhookHandler(signingSecret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		event, err := parcelemais.ParseWebhookEvent(body, r.Header.Get("X-ParceleMais-Signature"), signingSecret)
		if err != nil {
			var sigErr *parcelemais.WebhookSignatureError
			if errors.As(err, &sigErr) {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		fmt.Printf("pedido %s -> %s\n", event.OrderID, event.StatusName)
		w.WriteHeader(http.StatusOK)
	}
}
