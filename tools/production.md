# Indo pra produção

## Checklist de segurança

- Reutilize o client (`ParceleMaisClient`/`IParceleMaisClient`/etc.) como singleton — ele mantém cache do token e estado do circuit breaker. Não crie uma instância por requisição.
- `ClientSecret` só em variável de ambiente/cofre — nunca em código-fonte, nunca em app cliente (mobile/SPA).
- Configure o endpoint de webhook com HTTPS e valide a assinatura HMAC em toda requisição recebida (ver [rules/*/webhooks.md](../rules)).
- Trate os erros tipados do SDK (`*ValidationError`, `*RateLimitError`, `*AuthenticationError`, etc.) — não capture só a exceção genérica e ignore o motivo.
- Monitore taxa de erro e latência das chamadas à API do Parcele+; alerta em taxa de erro elevada ou circuit breaker aberto.
- Use staging pra qualquer teste exploratório — nunca teste fluxo novo direto em produção.

## Diferenças staging → produção

- Só a `Environment`/base URL muda (ver [environments.md](environments.md)) — regras de negócio e formato de resposta são os mesmos.
- Em produção, pedidos aprovados geram desembolso real — trate erros de criação de pedido com mais cautela (confirme antes de tentar novamente automaticamente).
- Credenciais (`ClientId`/`ClientSecret`) são diferentes por ambiente — nunca reutilize a de staging em produção.
