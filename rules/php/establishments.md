# Establishment Management (PHP)

An **establishment** (`loja`) is the merchant location that originates orders. Establishments created through the API are registered inside the partner's establishment chain and automatically linked to the partner authenticated by the access token.

## Types

```php
use Twila\ParceleMais\Establishments\BankAccountType;
use Twila\ParceleMais\Establishments\CreateEstablishmentRequest;
use Twila\ParceleMais\Establishments\DisbursementModel;
use Twila\ParceleMais\Establishments\Establishment;
use Twila\ParceleMais\Establishments\EstablishmentAddress;
use Twila\ParceleMais\Establishments\EstablishmentBankAccount;
use Twila\ParceleMais\Establishments\EstablishmentOwner;
use Twila\ParceleMais\Establishments\ListEstablishmentsRequest;
use Twila\ParceleMais\Establishments\UpdateEstablishmentRequest;

// DisbursementModel::ESTABLISHMENT_CHAIN (1) — the chain receives the disbursement
// DisbursementModel::ESTABLISHMENT (2)       — the establishment itself receives it (requires the establishment's bank account)
// DisbursementModel::EXTERNAL (3)            — a third-party account (requires holderName + holderDocument)

// BankAccountType::CURRENT (1), ::SAVINGS (2), ::PAYMENT (3)

new EstablishmentOwner(string $name, string $email, string $phone); // phone: E.164, e.g. '+5511999998888'

new EstablishmentBankAccount(
    string $bankNumber,
    string $agencyNumber,
    string $accountNumber,
    string $accountDigit,
    int $accountType,
    ?string $agencyDigit = null,
    ?string $holderName = null,     // required when the disbursement model is EXTERNAL
    ?string $holderDocument = null  // required when the disbursement model is EXTERNAL
);

new EstablishmentAddress(
    string $street, string $number, string $district, string $city, string $state, string $zipCode,
    ?string $complement = null, ?string $country = null
);

new CreateEstablishmentRequest(
    string $document, // CNPJ, digits only
    string $legalName,
    string $tradeName,
    int $disbursementModel,
    EstablishmentOwner $owner,
    EstablishmentBankAccount $bankAccount,
    EstablishmentAddress $address          // required on create
);

// Establishment — returned by get() and list():
//   $establishment->establishmentId, ->document, ->legalName, ->tradeName, ->isActive, ->owner
//   ->disbursementModel, ->bankAccount and ->address are null while the establishment doesn't have them

new UpdateEstablishmentRequest(
    string $tradeName,
    ?int $disbursementModel = null,      // null keeps the current one
    ?EstablishmentAddress $address = null // null keeps the current one
);

new ListEstablishmentsRequest(
    ?string $tradeName = null, // partial, case-insensitive match
    ?bool $isActive = null     // null returns active and inactive
);
```

`$client->establishments` exposes: `create($request)`, `get($establishmentId)`, `list($request)`, `update($establishmentId, $request)`, `updateBankAccount($establishmentId, $bankAccount)`, `activate($establishmentId)`, `deactivate($establishmentId)`.

## Usage

```php
$result = $client->establishments->create(new CreateEstablishmentRequest(
    '12345678000199',
    'Loja Centro LTDA',
    'Loja Centro',
    DisbursementModel::ESTABLISHMENT_CHAIN,
    new EstablishmentOwner('Maria Souza', 'maria@loja.com.br', '+5511999998888'),
    new EstablishmentBankAccount('341', '1234', '56789', '0', BankAccountType::CURRENT)
));

$establishment = $client->establishments->get($result->establishmentId);

$active = $client->establishments->list(new ListEstablishmentsRequest('Centro', true));

$client->establishments->update($result->establishmentId, new UpdateEstablishmentRequest('Loja Centro Matriz'));

$client->establishments->updateBankAccount(
    $result->establishmentId,
    new EstablishmentBankAccount('237', '4321', '98765', '1', BankAccountType::SAVINGS)
);

$client->establishments->deactivate($result->establishmentId);
```

Keep the returned `establishmentId` — it's the only way to read, edit or change the status of the establishment later. The establishment's CNPJ is what the order creation takes as `establishmentDocument`.

## Error Handling and Edge Cases
- `$document` (CNPJ) and `$legalName` must be unique across all establishments — a duplicate on `create` throws `ParceleMaisApiException` with status `409`.
- The legal name can't be changed through the API — `update` only replaces `tradeName` (always required); `disbursementModel` and `address` are only touched when not null.
- The bank account has its own endpoint: `updateBankAccount` replaces it as a whole, so send every field, not just the ones that changed.
- An inactive establishment rejects edits — call `activate($establishmentId)` first. An establishment whose chain is inactive can't be created, edited or reactivated at all.
- `DisbursementModel::ESTABLISHMENT` requires the establishment to already have a bank account; switching to it without one returns `400`.
- A deactivated establishment stops accepting new orders; orders already in progress are unaffected.
- `list` only returns establishments in the authenticated partner's chain, and `get` on any other establishment returns `404` — same for editing and deactivating.
