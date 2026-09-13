# SDK Go

Repositório: [twila-parcelemais-go-sdk](https://github.com/Twila-Digital/twila-parcelemais-go-sdk)

```bash
go get github.com/Twila-Digital/twila-parcelemais-go-sdk
```

- Compatível com Go 1.18+.
- Zero dependências externas — só a standard library.
- Pacote raiz: `parcelemais` (`parcelemais.NewClient(parcelemais.ClientOptions{...})`).
- Erros são valores de retorno tipados, verificáveis via `errors.As` (não exceções).

Ver [rules/go/](../../rules/go) para regras de integração por recurso.
