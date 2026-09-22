# Agent Mode — Uso direto da API

Quando o usuário pedir pra **executar** uma ação (listar, criar, consultar, simular) em vez de **escrever código** de integração, chame a API do Parcele+ diretamente via `curl`.

## Autenticação

A API usa OAuth2 client credentials. Gere um token de acesso antes de qualquer outra chamada:

```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/authentication/accesstoken" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'"$PARCELEMAIS_CLIENT_ID"'",
    "clientSecret": "'"$PARCELEMAIS_CLIENT_SECRET"'"
  }' | jq
```

Resposta:
```json
{
  "token_de_acesso": "eyJhbGciOi...",
  "expira_em_segundos": 3600,
  "tipo_de_token": "Bearer"
}
```

Use o token nas chamadas seguintes:
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$PARCELEMAIS_BASE_URL/v1/ENDPOINT"
```

- Sempre pergunte por `PARCELEMAIS_CLIENT_ID`/`PARCELEMAIS_CLIENT_SECRET` se não fornecidos e não encontrados em variáveis de ambiente ou `.env`.
- O token expira (`expira_em_segundos`) — gere um novo quando expirar, não assuma validade indefinida.
- **Nunca** logue ou exiba o `clientSecret`/token completo em texto solto num terminal compartilhado.

## Base URL

```
Staging:    https://api.staging.parcelemais.com.br/integration/
Produção:   https://api.parcelemais.com.br/integration/
```

Use sempre staging a menos que o usuário peça explicitamente produção — staging não movimenta dinheiro real.

## Formato de resposta e erros

Erros seguem o formato Problem Details (RFC 7807-like):
```json
{
  "tipo": "https://.../validation-error",
  "titulo": "Um ou mais erros de validação ocorreram.",
  "status": 400,
  "detalhe": "...",
  "instancia": "...",
  "erros": { "campo": ["mensagem"] },
  "correlationId": "..."
}
```

Valores monetários são `float` em reais (não em centavos, diferente de outras APIs de pagamento).

---

## Endpoints

### Pedidos (Orders)

**Criar pedido**
```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/order" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678900",
    "celular": "11999999999",
    "documentoEstabelecimento": "12345678000199",
    "valorSolicitado": 1500.00,
    "nome": "João Silva",
    "email": "joao@email.com",
    "dataDeNascimento": "1990-01-01",
    "endereco": {
      "logradouro": "Rua Exemplo",
      "numero": "100",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01310-100"
    }
  }' | jq
```
Resposta: `{"pedidoId": "..."}`.

**Buscar pedido por ID**
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$PARCELEMAIS_BASE_URL/v1/order/ORDER_ID" | jq
```

**Listar pedidos (paginado)**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/order/paged?pagina=1&tamanhoPagina=10&documentoCliente=12345678900" | jq
```
Query params opcionais: `status` (int, ver tabela de status abaixo), `documentoCliente`, `dataInicio`, `dataFim`, `numero`, `documentoLoja`, `descricao`.

**Iniciar venda CDC (gera link de pagamento)**
```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/order/start-cdc-sale" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"pedidoId": "ORDER_ID"}' | jq
```
Resposta: `{"linkPagamento": "https://..."}`.

**Anexar nota fiscal (base64)**
```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/order/invoice" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"pedidoId": "ORDER_ID", "arquivoBase64": "'"$(base64 -w0 nota.pdf)"'", "nomeArquivo": "nota.pdf"}' | jq
```

#### Status de pedido (`status.valor`)
| Valor | Significado |
| --- | --- |
| 0 | Indefinido |
| 1 | Em análise |
| 2 | Aprovado |
| 3 | Saldo indisponível |
| 4 | Análise expirada |
| 5 | Pagamento pendente |
| 6 | Biometria recusada |
| 7 | Biometria aprovada |
| 8 | Pagamento recusado |
| 9 | Comprado |
| 10 | Não autorizado |
| 11 | Autorização pendente |
| 12 | Aguardando cadastro |
| 13 | Venda não iniciada |
| 14 | Cancelado |
| 15 | Faturando |
| 16 | Concluído |
| 17 | Congelado |
| 18 | Aguardando confirmação de pagamento |
| 19 | Desembolsado |

---

### Simulações (Simulations)

**Simular parcelas por valor solicitado**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/order/simulate-installments?valorSolicitado=1500&tipoValorCalculo=1" | jq
```
`tipoValorCalculo`: `1` = valor bruto, `2` = valor líquido.

**Simular valores por prazo**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/order/simulate-values?valor=1500&prazo=12&modeloJuros=1&tipoValorCalculo=1" | jq
```

---

### Clientes (Customers)

**Buscar cliente por ID**
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$PARCELEMAIS_BASE_URL/v1/customer/CUSTOMER_ID" | jq
```

**Listar clientes (paginado)**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/customer/paged?pagina=1&tamanhoPagina=10&documento=12345678900" | jq
```

---

### Lojas (Establishments)

A loja (`loja`) é o estabelecimento que origina os pedidos. Toda loja cadastrada aqui entra na rede do parceiro do token e já fica vinculada a ele.

**Cadastrar loja**
```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/establishment" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "documento": "12345678000199",
    "razaoSocial": "Loja Centro LTDA",
    "nomeFantasia": "Loja Centro",
    "modeloDesembolso": 1,
    "responsavel": {
      "nome": "Maria Souza",
      "email": "maria@loja.com.br",
      "celular": "+5511999999999"
    },
    "contaBancaria": {
      "banco": "341",
      "agencia": "1234",
      "digitoAgencia": "",
      "conta": "56789",
      "digitoConta": "0",
      "tipoConta": 1
    },
    "endereco": {
      "rua": "Rua Exemplo",
      "numero": "100",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01310100"
    }
  }' | jq
```
`modeloDesembolso`: `1` = a rede recebe, `2` = a própria loja recebe (exige conta bancária da loja), `3` = conta de terceiro (exige `nomeTitular` e `documentoTitular` na conta). `tipoConta`: `1` = corrente, `2` = poupança, `3` = pagamento. `endereco` é opcional no cadastro.
Resposta: `{"estabelecimentoId": "..."}` — guarde, é o que permite editar e mudar a situação da loja depois.

**Buscar loja**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/establishment/ESTABELECIMENTO_ID" | jq
```
Devolve a loja inteira: `documento`, `razaoSocial`, `nomeFantasia`, `ativa`, `modeloDesembolso`, `responsavel`, `contaBancaria` e `endereco`.

**Listar lojas**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PARCELEMAIS_BASE_URL/v1/establishment/list?nomeFantasia=Centro&ativa=true" | jq
```
Traz as lojas da rede do parceiro do token. `nomeFantasia` filtra por busca parcial, sem diferenciar maiúsculas de minúsculas; `ativa` filtra pela situação. Sem filtros, devolve todas — ativas e inativas.

**Editar loja**
```bash
curl -s -X PUT "$PARCELEMAIS_BASE_URL/v1/establishment/ESTABELECIMENTO_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "nomeFantasia": "Loja Centro Matriz"
  }' | jq
```
`nomeFantasia` é obrigatório. `modeloDesembolso` e `endereco` são opcionais — quando omitidos, mantêm o valor atual. A **razão social não pode ser alterada** pela API: é definida no cadastro e só muda via BackOffice. A conta bancária tem endpoint próprio.

**Trocar a conta bancária**
```bash
curl -s -X PUT "$PARCELEMAIS_BASE_URL/v1/establishment/ESTABELECIMENTO_ID/bank-account" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "banco": "341",
    "agencia": "1234",
    "digitoAgencia": "",
    "conta": "56789",
    "digitoConta": "0",
    "tipoConta": 1
  }' | jq
```
A conta é substituída por inteiro — mande todos os campos, não só os que mudaram. Quando o `modeloDesembolso` da loja é `3`, `nomeTitular` e `documentoTitular` continuam obrigatórios.

**Inativar / reativar loja**
```bash
curl -s -X PUT "$PARCELEMAIS_BASE_URL/v1/establishment/ESTABELECIMENTO_ID/status" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"ativa": false}' | jq
```
Loja inativa não aceita novos pedidos (os em andamento seguem normalmente) e não aceita edição. Para reativar, envie `{"ativa": true}`.

---

### Webhooks

**Cadastrar webhook**
```bash
curl -s -X POST "$PARCELEMAIS_BASE_URL/v1/webhooks" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tipo": 3, "url": "https://meusite.com/webhooks/parcelemais", "tipoAutenticacao": 1}' | jq
```
`tipo`: `1` = Cliente, `2` = Simulação, `3` = Pedido. `tipoAutenticacao`: `1` = Nenhuma, `2` = Basic, `3` = JWT (use `credencial` se `2`/`3`).
Resposta inclui `chaveAssinatura` — guarde-a, é usada pra validar a assinatura HMAC dos eventos recebidos.

**Listar webhooks cadastrados**
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$PARCELEMAIS_BASE_URL/v1/webhooks" | jq
```

**Atualizar webhook**
```bash
curl -s -X PUT "$PARCELEMAIS_BASE_URL/v1/webhooks/3" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"url": "https://meusite.com/novo-endpoint", "tipoAutenticacao": 1}' | jq
```

**Remover webhook**
```bash
curl -s -X DELETE "$PARCELEMAIS_BASE_URL/v1/webhooks/3" -H "Authorization: Bearer $TOKEN" | jq
```

---

## Diretrizes do Agent Mode

1. Sempre confirme antes de criar, atualizar ou remover recursos (pedidos, lojas, webhooks) — são ações com efeito colateral real.
2. Prefira o ambiente de staging pra qualquer teste/exploração, a menos que o usuário peça produção explicitamente.
3. Formate valores monetários como `R$ X,XX` ao apresentar resultados ao usuário.
4. Use `jq` pra formatar e filtrar respostas JSON.
5. Em erro, mostre `titulo`/`detalhe`/`erros` do Problem Details e sugira a correção (ex.: campo obrigatório faltando).
6. Nunca invente `pedidoId`/`CUSTOMER_ID`/`ESTABELECIMENTO_ID` — sempre obtenha via `create`/`list` antes de usar em outra chamada.
