# Establishment Management (Java)

An **establishment** (`loja`) is the merchant location that originates orders. Establishments created through the API are registered inside the partner's establishment chain and automatically linked to the partner authenticated by the access token.

## Types

```java
public enum DisbursementModel {
    ESTABLISHMENT_CHAIN, // 1 — the chain receives the disbursement
    ESTABLISHMENT,       // 2 — the establishment itself receives it (requires the establishment's bank account)
    EXTERNAL             // 3 — a third-party account receives it (requires holderName + holderDocument)
}

public enum BankAccountType { CURRENT, SAVINGS, PAYMENT }

// All models are Lombok @Value @Builder
EstablishmentOwner.builder().name("...").email("...").phone("+5511999998888").build(); // phone: E.164

EstablishmentBankAccount.builder()
    .bankNumber("341").agencyNumber("1234").agencyDigit("")
    .accountNumber("56789").accountDigit("0")
    .accountType(BankAccountType.CURRENT)
    .holderName(null)     // required when disbursementModel is EXTERNAL
    .holderDocument(null) // required when disbursementModel is EXTERNAL
    .build();

EstablishmentAddress.builder()
    .street("...").number("100").complement(null).district("...")
    .city("...").state("SP").zipCode("01310100").country(null)
    .build();

CreateEstablishmentRequest.builder()
    .document("12345678000199") // CNPJ, digits only
    .legalName("...").tradeName("...")
    .disbursementModel(DisbursementModel.ESTABLISHMENT_CHAIN)
    .owner(owner).bankAccount(bankAccount).address(address) // required (@NonNull — build() throws NullPointerException without it)
    .build();

// Establishment — returned by get() and list():
//   getEstablishmentId(), getDocument(), getLegalName(), getTradeName(), isActive(), getOwner()
//   getDisbursementModel(), getBankAccount() and getAddress() are null while the establishment doesn't have them

UpdateEstablishmentRequest.builder()
    .tradeName("...")
    .disbursementModel(null) // null keeps the current one
    .address(null)           // null keeps the current one
    .build();

ListEstablishmentsRequest.builder()
    .tradeName("Centro") // partial, case-insensitive match
    .isActive(true)      // null returns active and inactive
    .build();
```

`client.establishments()` exposes: `create(request)` (returns the establishment `UUID`), `get(establishmentId)`, `list(request)`, `update(establishmentId, request)`, `updateBankAccount(establishmentId, bankAccount)`, `activate(establishmentId)`, `deactivate(establishmentId)`.

## Usage

```java
UUID establishmentId = client.establishments().create(CreateEstablishmentRequest.builder()
        .document("12345678000199")
        .legalName("Loja Centro LTDA")
        .tradeName("Loja Centro")
        .disbursementModel(DisbursementModel.ESTABLISHMENT_CHAIN)
        .owner(EstablishmentOwner.builder().name("Maria Souza").email("maria@loja.com.br").phone("+5511999998888").build())
        .bankAccount(EstablishmentBankAccount.builder()
                .bankNumber("341").agencyNumber("1234").accountNumber("56789").accountDigit("0")
                .accountType(BankAccountType.CURRENT).build())
        .build());

Establishment establishment = client.establishments().get(establishmentId);

List<Establishment> active = client.establishments()
        .list(ListEstablishmentsRequest.builder().tradeName("Centro").isActive(true).build());

client.establishments().update(establishmentId, UpdateEstablishmentRequest.builder().tradeName("Loja Centro Matriz").build());

client.establishments().updateBankAccount(establishmentId, EstablishmentBankAccount.builder()
        .bankNumber("237").agencyNumber("4321").accountNumber("98765").accountDigit("1")
        .accountType(BankAccountType.SAVINGS).build());

client.establishments().deactivate(establishmentId);
```

Keep the returned `UUID` — it's the only way to read, edit or change the status of the establishment later. The establishment's CNPJ is what `orders().create` takes as `establishmentDocument`.

## Error Handling and Edge Cases
- `document` (CNPJ) and `legalName` must be unique across all establishments — a duplicate on `create` throws `ParceleMaisApiException` with status `409`.
- The legal name can't be changed through the API — `update` only replaces `tradeName` (always required); `disbursementModel` and `address` are only touched when not null.
- The bank account has its own endpoint: `updateBankAccount` replaces it as a whole, so send every field, not just the ones that changed.
- An inactive establishment rejects edits — call `activate(establishmentId)` first. An establishment whose chain is inactive can't be created, edited or reactivated at all.
- `DisbursementModel.ESTABLISHMENT` requires the establishment to already have a bank account; switching to it without one returns `400`.
- A deactivated establishment stops accepting new orders; orders already in progress are unaffected.
- `list` only returns establishments in the authenticated partner's chain, and `get` on any other establishment returns `404` — same for editing and deactivating.
