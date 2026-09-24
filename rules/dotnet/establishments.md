# Establishment Management (.NET)

An **establishment** (`loja`) is the merchant location that originates orders. Establishments created through the API are registered inside the partner's establishment chain and automatically linked to the partner authenticated by the access token.

## Types

```csharp
public enum DisbursementModel
{
    EstablishmentChain = 1, // the chain receives the disbursement
    Establishment = 2,      // the establishment itself receives it (requires the establishment's bank account)
    External = 3            // a third-party account receives it (requires HolderName + HolderDocument)
}

public enum BankAccountType { Current = 1, Savings = 2, Payment = 3 }

public sealed record EstablishmentOwner(string Name, string Email, string Phone); // Phone: E.164, e.g. "+5511999998888"

public sealed record EstablishmentBankAccount(
    string BankNumber,
    string AgencyNumber,
    string AccountNumber,
    string AccountDigit,
    BankAccountType AccountType,
    string? AgencyDigit = null,
    string? HolderName = null,      // required when DisbursementModel is External
    string? HolderDocument = null); // required when DisbursementModel is External

public sealed record EstablishmentAddress(
    string Street, string Number, string District, string City, string State, string ZipCode,
    string? Complement = null, string? Country = null);

public sealed record CreateEstablishmentRequest(
    string Document, // CNPJ, digits only
    string LegalName,
    string TradeName,
    DisbursementModel DisbursementModel,
    EstablishmentOwner Owner,
    EstablishmentBankAccount BankAccount,
    EstablishmentAddress Address);                // required on create

public sealed record Establishment(
    Guid EstablishmentId,
    string Document,
    string LegalName,
    string TradeName,
    bool IsActive,
    EstablishmentOwner Owner,
    DisbursementModel? DisbursementModel = null,
    EstablishmentBankAccount? BankAccount = null, // null when the establishment has no bank account yet
    EstablishmentAddress? Address = null);        // null when the establishment has no address yet

public sealed record UpdateEstablishmentRequest(
    string TradeName,
    DisbursementModel? DisbursementModel = null, // null keeps the current one
    EstablishmentAddress? Address = null);       // null keeps the current one

public sealed record ListEstablishmentsRequest(
    string? TradeName = null, // partial, case-insensitive match
    bool? IsActive = null);   // null returns active and inactive
```

`client.Establishments` exposes: `CreateAsync(request, ct)`, `GetAsync(establishmentId, ct)`, `ListAsync(request, ct)`, `UpdateAsync(establishmentId, request, ct)`, `UpdateBankAccountAsync(establishmentId, bankAccount, ct)`, `ActivateAsync(establishmentId, ct)`, `DeactivateAsync(establishmentId, ct)`.

## Usage

```csharp
var created = await client.Establishments.CreateAsync(new CreateEstablishmentRequest(
    Document: "12345678000199",
    LegalName: "Loja Centro LTDA",
    TradeName: "Loja Centro",
    DisbursementModel: DisbursementModel.EstablishmentChain,
    Owner: new EstablishmentOwner("Maria Souza", "maria@loja.com.br", "+5511999998888"),
    BankAccount: new EstablishmentBankAccount("341", "1234", "56789", "0", BankAccountType.Current)), cancellationToken);

var establishment = await client.Establishments.GetAsync(created.EstablishmentId, cancellationToken);

var active = await client.Establishments.ListAsync(new ListEstablishmentsRequest(TradeName: "Centro", IsActive: true), cancellationToken);

await client.Establishments.UpdateAsync(created.EstablishmentId, new UpdateEstablishmentRequest("Loja Centro Matriz"), cancellationToken);

await client.Establishments.UpdateBankAccountAsync(created.EstablishmentId,
    new EstablishmentBankAccount("237", "4321", "98765", "1", BankAccountType.Savings), cancellationToken);

await client.Establishments.DeactivateAsync(created.EstablishmentId, cancellationToken);
```

Keep the returned `EstablishmentId` — it's the only way to read, edit or change the status of the establishment later. The establishment's CNPJ is what `CreateOrderAsync` takes as `EstablishmentDocument`.

## Error Handling and Edge Cases
- `Document` (CNPJ) and `LegalName` must be unique across all establishments — a duplicate on `CreateAsync` throws `ParceleMaisApiException` with status `409`.
- The legal name can't be changed through the API — `UpdateAsync` only replaces `TradeName` (always required); `DisbursementModel` and `Address` are only touched when not null.
- The bank account has its own endpoint: `UpdateBankAccountAsync` replaces it as a whole, so send every field, not just the ones that changed.
- An inactive establishment rejects edits — call `ActivateAsync` first. An establishment whose chain is inactive can't be created, edited or reactivated at all.
- `DisbursementModel.Establishment` requires the establishment to already have a bank account; switching to it without one returns `400`.
- A deactivated establishment stops accepting new orders; orders already in progress are unaffected.
- `ListAsync` only returns establishments in the authenticated partner's chain, and `GetAsync` on any other establishment returns `404` — same for editing and deactivating.
