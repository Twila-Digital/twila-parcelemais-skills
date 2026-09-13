# Glossário

## Autenticação
- **Client ID / Client Secret**: credenciais OAuth2 client credentials, uma por ambiente (staging/produção).
- **Token de acesso**: JWT de curta duração (`expira_em_segundos`) usado como `Authorization: Bearer <token>`.

## Domínio de negócio
- **CDC (Crédito Direto ao Consumidor)**: modalidade de crédito concedida diretamente ao cliente final no momento da compra.
- **Pedido (Order)**: uma solicitação de crédito/parcelamento — tem um ciclo de vida (`status`) desde análise até desembolso.
- **Estabelecimento**: a loja/parceiro que originou o pedido, identificado por `documentoEstabelecimento` (CNPJ).
- **Cliente (Customer)**: a pessoa física que solicita o crédito, identificada por `documento` (CPF).
- **Simulação**: cálculo de parcelas/valores sem criar um pedido de verdade.
- **Desembolso**: liberação do valor aprovado — pedido passa a `Disbursed` (status 19).
- **Valor bruto vs. líquido** (`tipoValorCalculo`): bruto (1) é o valor antes dos descontos de MDR/antecipação; líquido (2) é o valor efetivamente recebido pelo estabelecimento.

## Webhooks
- **Webhook**: callback HTTP enviado pelo Parcele+ quando um evento ocorre (ex.: mudança de status de pedido).
- **Chave de assinatura**: segredo retornado ao cadastrar um webhook, usado pra validar a assinatura HMAC-SHA256 do payload recebido.
- **Replay**: reenvio malicioso de um webhook antigo — mitigado validando o timestamp da assinatura (janela de tolerância).

## Operações
- **Circuit breaker**: interrompe temporariamente chamadas à API após uma taxa de falha alta, evitando sobrecarregar um serviço já instável.
- **Idempotência**: garantia de que repetir a mesma operação (ex.: retry automático) não duplica o efeito.
- **Correlation ID**: identificador devolvido em erros da API, útil pra rastrear um incidente junto ao suporte do Parcele+.
