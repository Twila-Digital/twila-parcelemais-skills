package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"

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
