# FAQ

1. **Onde encontro a documentação completa da API?**
   [documentacao.parcelemais.com.br](https://documentacao.parcelemais.com.br) — inclui autenticação, todos os endpoints e guias de webhook.

2. **Qual ambiente devo usar durante o desenvolvimento?**
   Staging (`https://api.staging.parcelemais.com.br/integration/`) — nenhum valor é desembolsado de verdade.

3. **Os valores monetários são em centavos?**
   Não — diferente de outras APIs de pagamento, o Parcele+ usa `float` em reais (ex.: `1500.00`, não `150000`).

4. **Como sei se um pedido foi aprovado?**
   Consulte `status.valor` no objeto `Order` (ver tabela de status em [rules/agent.md](../rules/agent.md)) ou assine um webhook do tipo `Order` (tipo `3`).

5. **Posso simular parcelas sem criar um pedido?**
   Sim — os endpoints `simulate-installments`/`simulate-values` (ou `client.Simulations.*` nos SDKs) não criam nenhum registro.

6. **Como valido que um webhook recebido é de verdade do Parcele+?**
   Verificando a assinatura HMAC-SHA256 com o `chaveAssinatura` retornado na criação do webhook — ver [rules/*/webhooks.md](../rules) na linguagem do seu projeto.

7. **Onde reporto um bug ou peço uma feature num SDK?**
   Abra uma issue ou PR no repositório do SDK correspondente (ver [tools/ecosystem.md](../tools/ecosystem.md)) — todos são open source e aceitam contribuição externa.
