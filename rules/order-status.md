# Status externo de pedido e nota fiscal pendente

Use estas regras ao consultar pedidos, filtrar pendências de nota fiscal ou processar webhooks de Pedido. Elas descrevem a API pública, independentemente da linguagem ou versão do SDK.

## Quando você recebe `PendingInvoice`

- Código: `20`.
- Nome no webhook: `PendingInvoice`.
- Descrição nas consultas: `Nota fiscal pendente`.

Você recebe esse status quando a nota fiscal está inválida e liberada para reenvio. A regra exige as duas condições internas: `InvoiceStatus == Invalid` e `InvoiceImported == false`. Esses campos não são novos campos da resposta pública.

O status é calculado para apresentação externa. Ele não altera o status real do pedido. Não trate `PendingInvoice` como cancelamento, nova análise de crédito ou mudança do desembolso.

## Consultar e filtrar pedidos

`GET /v1/order/{pedidoId}` e `GET /v1/order/paged` apresentam este objeto `status` enquanto a condição estiver ativa:

```json
{
  "valor": 20,
  "descricao": "Nota fiscal pendente"
}
```

Para localizar somente pedidos com nota fiscal inválida e liberada para reenvio, use o filtro `status=20`:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/order/paged?status=20&pagina=1&tamanhoPagina=10" | jq
```

A resposta paginada usa `itens`. Pedidos sem nota fiscal ou com nota já reenviada não atendem a esse filtro. O código `0` (`Undefined`) não é aceito como filtro.

## Reenviar a nota fiscal

Envie o arquivo corrigido por `POST /v1/order/invoice`, com o mesmo `pedidoId`, `arquivoBase64` e `nomeArquivo`. Use o método de importação de nota fiscal do SDK se ele atender ao seu caso.

Quando o reenvio marca a nota fiscal como importada, as consultas voltam automaticamente a apresentar o status real do pedido. Isso não significa que a nota fiscal já foi validada. Não tente restaurar um status anterior por uma chamada da API.

## Receber a pendência por webhook

O webhook de Pedido (`tipo: 3`) envia este payload quando a nota fiscal é invalidada e liberada para reenvio:

```json
{
  "id_pedido": "00000000-0000-0000-0000-000000000000",
  "enum_status": 20,
  "status": "PendingInvoice"
}
```

Valide a assinatura HMAC sobre o corpo bruto antes de processar o evento. Direcione o pedido para correção e reenvio da nota fiscal. A autenticação, a assinatura e a auditoria seguem as regras dos demais webhooks de Pedido.

Não presuma que o reenvio dispara um webhook de retorno ao status anterior. Consulte o pedido para verificar seu status após a importação.

## Compatibilidade com SDKs

O suporte da API ao código `20` não garante que a versão instalada do SDK exponha uma constante `PendingInvoice`. Verifique o SDK antes de gerar código que use essa constante.

Quando o SDK oferece um fallback de status desconhecido, preserve o valor original. Nos eventos de webhook, use o campo de código bruto (`StatusRaw`, `statusRaw` ou equivalente) e o nome original para identificar `20` e `PendingInvoice`.

Se o filtro tipado da versão instalada não aceita `20`, use a API diretamente ou uma versão do SDK com suporte confirmado. Não invente membros de enum nem métodos do SDK.
