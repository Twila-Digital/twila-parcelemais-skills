# Establishment Management (Go)

An **establishment** (`loja`) is the merchant location that originates orders. Establishments created through the API are registered inside the partner's establishment chain and automatically linked to the partner authenticated by the access token.

## Types

```go
type DisbursementModel int

const (
    DisbursementModelEstablishmentChain DisbursementModel = 1 // the chain receives the disbursement
    DisbursementModelEstablishment      DisbursementModel = 2 // the establishment itself receives it (requires the establishment's bank account)
    DisbursementModelExternal           DisbursementModel = 3 // a third-party account (requires HolderName + HolderDocument)
)

type BankAccountType int

const (
    BankAccountTypeCurrent BankAccountType = 1
    BankAccountTypeSavings BankAccountType = 2
    BankAccountTypePayment BankAccountType = 3
)

type EstablishmentOwner struct {
    Name  string
    Email string
    Phone string // E.164, e.g. "+5511999998888"
}

type EstablishmentBankAccount struct {
    BankNumber     string
    AgencyNumber   string
    AgencyDigit    string
    AccountNumber  string
    AccountDigit   string
    AccountType    BankAccountType
    HolderName     string // required when the disbursement model is External
    HolderDocument string // required when the disbursement model is External
}

type EstablishmentAddress struct {
    Street, Number, Complement, District, City, State, ZipCode, Country string
}

type CreateEstablishmentRequest struct {
    Document          string // CNPJ, digits only
    LegalName         string
    TradeName         string
    DisbursementModel DisbursementModel
    Owner             EstablishmentOwner
    BankAccount       EstablishmentBankAccount
    Address           *EstablishmentAddress // optional
}

type Establishment struct {
    EstablishmentID   string
    Document          string
    LegalName         string
    TradeName         string
    IsActive          bool
    Owner             EstablishmentOwner
    DisbursementModel *DisbursementModel
    BankAccount       *EstablishmentBankAccount // nil when there's no bank account yet
    Address           *EstablishmentAddress     // nil when there's no address yet
}

type UpdateEstablishmentRequest struct {
    TradeName         string
    DisbursementModel *DisbursementModel    // nil keeps the current one
    Address           *EstablishmentAddress // nil keeps the current one
}

type ListEstablishmentsRequest struct {
    TradeName string // partial, case-insensitive match
    IsActive  *bool  // nil returns active and inactive
}
```

`client.Establishments` exposes: `Create(ctx, req)`, `Get(ctx, establishmentID)`, `List(ctx, req)`, `Update(ctx, establishmentID, req)`, `UpdateBankAccount(ctx, establishmentID, bankAccount)`, `Activate(ctx, establishmentID)`, `Deactivate(ctx, establishmentID)`.

## Usage

```go
created, err := client.Establishments.Create(ctx, parcelemais.CreateEstablishmentRequest{
    Document:          "12345678000199",
    LegalName:         "Loja Centro LTDA",
    TradeName:         "Loja Centro",
    DisbursementModel: parcelemais.DisbursementModelEstablishmentChain,
    Owner:             parcelemais.EstablishmentOwner{Name: "Maria Souza", Email: "maria@loja.com.br", Phone: "+5511999998888"},
    BankAccount: parcelemais.EstablishmentBankAccount{
        BankNumber:    "341",
        AgencyNumber:  "1234",
        AccountNumber: "56789",
        AccountDigit:  "0",
        AccountType:   parcelemais.BankAccountTypeCurrent,
    },
})
if err != nil {
    return err
}

establishment, err := client.Establishments.Get(ctx, created.EstablishmentID)

isActive := true
active, err := client.Establishments.List(ctx, parcelemais.ListEstablishmentsRequest{TradeName: "Centro", IsActive: &isActive})

err = client.Establishments.Update(ctx, created.EstablishmentID, parcelemais.UpdateEstablishmentRequest{
    TradeName: "Loja Centro Matriz",
})

err = client.Establishments.UpdateBankAccount(ctx, created.EstablishmentID, parcelemais.EstablishmentBankAccount{
    BankNumber:    "237",
    AgencyNumber:  "4321",
    AccountNumber: "98765",
    AccountDigit:  "1",
    AccountType:   parcelemais.BankAccountTypeSavings,
})

err = client.Establishments.Deactivate(ctx, created.EstablishmentID)
```

Keep the returned `EstablishmentID` — it's the only way to read, edit or change the status of the establishment later. The establishment's CNPJ is what `Orders.Create` takes as `EstablishmentDocument`.

## Error Handling and Edge Cases
- `Document` (CNPJ) and `LegalName` must be unique across all establishments — a duplicate on `Create` returns a `*ParceleMaisAPIError` with status `409`.
- The legal name can't be changed through the API — `Update` only replaces `TradeName` (always required); `DisbursementModel` and `Address` are only touched when not nil.
- The bank account has its own endpoint: `UpdateBankAccount` replaces it as a whole, so send every field, not just the ones that changed.
- An inactive establishment rejects edits — call `Activate` first. An establishment whose chain is inactive can't be created, edited or reactivated at all.
- `DisbursementModelEstablishment` requires the establishment to already have a bank account; switching to it without one returns `400`.
- A deactivated establishment stops accepting new orders; orders already in progress are unaffected.
- `List` only returns establishments in the authenticated partner's chain, and `Get` on any other establishment returns `404` — same for editing and deactivating.
