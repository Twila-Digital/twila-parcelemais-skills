# Establishment Management (Node.js)

An **establishment** (`loja`) is the merchant location that originates orders. Establishments created through the API are registered inside the partner's establishment chain and automatically linked to the partner authenticated by the access token.

## Types

```typescript
enum DisbursementModel {
  EstablishmentChain = 1, // the chain receives the disbursement
  Establishment = 2,      // the establishment itself receives it (requires the establishment's bank account)
  External = 3,           // a third-party account receives it (requires holderName + holderDocument)
}

enum BankAccountType {
  Current = 1,
  Savings = 2,
  Payment = 3,
}

interface EstablishmentOwner {
  name: string;
  email: string;
  phone: string; // E.164, e.g. '+5511999998888'
}

interface EstablishmentBankAccount {
  bankNumber: string;
  agencyNumber: string;
  agencyDigit?: string;
  accountNumber: string;
  accountDigit: string;
  accountType: BankAccountType;
  holderName?: string;     // required when disbursementModel is External
  holderDocument?: string; // required when disbursementModel is External
}

interface EstablishmentAddress {
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface CreateEstablishmentRequest {
  document: string; // CNPJ, digits only
  legalName: string;
  tradeName: string;
  disbursementModel: DisbursementModel;
  owner: EstablishmentOwner;
  bankAccount: EstablishmentBankAccount;
  address?: EstablishmentAddress;
}

interface Establishment {
  establishmentId: string;
  document: string;
  legalName: string;
  tradeName: string;
  isActive: boolean;
  owner: EstablishmentOwner;
  disbursementModel?: DisbursementModel;
  bankAccount?: EstablishmentBankAccount; // absent when the establishment has no bank account yet
  address?: EstablishmentAddress;         // absent when the establishment has no address yet
}

interface UpdateEstablishmentRequest {
  tradeName: string;
  disbursementModel?: DisbursementModel; // omit to keep the current one
  address?: EstablishmentAddress;        // omit to keep the current one
}

interface ListEstablishmentsRequest {
  tradeName?: string; // partial, case-insensitive match
  isActive?: boolean; // omit to get active and inactive
}
```

`client.establishments` exposes: `create(request)`, `get(establishmentId)`, `list(request)`, `update(establishmentId, request)`, `updateBankAccount(establishmentId, bankAccount)`, `activate(establishmentId)`, `deactivate(establishmentId)`.

## Usage

```typescript
const { establishmentId } = await client.establishments.create({
  document: '12345678000199',
  legalName: 'Loja Centro LTDA',
  tradeName: 'Loja Centro',
  disbursementModel: DisbursementModel.EstablishmentChain,
  owner: { name: 'Maria Souza', email: 'maria@loja.com.br', phone: '+5511999998888' },
  bankAccount: {
    bankNumber: '341',
    agencyNumber: '1234',
    accountNumber: '56789',
    accountDigit: '0',
    accountType: BankAccountType.Current,
  },
});

const establishment = await client.establishments.get(establishmentId);

const active = await client.establishments.list({ tradeName: 'Centro', isActive: true });

await client.establishments.update(establishmentId, { tradeName: 'Loja Centro Matriz' });

await client.establishments.updateBankAccount(establishmentId, {
  bankNumber: '237',
  agencyNumber: '4321',
  accountNumber: '98765',
  accountDigit: '1',
  accountType: BankAccountType.Savings,
});

await client.establishments.deactivate(establishmentId);
```

Keep the returned `establishmentId` — it's the only way to read, edit or change the status of the establishment later. The establishment's CNPJ is what `createOrder` takes as `establishmentDocument`.

## Error Handling and Edge Cases
- `document` (CNPJ) and `legalName` must be unique across all establishments — a duplicate on `create` returns `409 Conflict`.
- The legal name can't be changed through the API — `update` only replaces `tradeName` (always required); `disbursementModel` and `address` are only touched when present.
- The bank account has its own endpoint: `updateBankAccount` replaces it as a whole, so send every field, not just the ones that changed.
- An inactive establishment rejects edits — call `activate(establishmentId)` first. An establishment whose chain is inactive can't be created, edited or reactivated at all.
- `disbursementModel: Establishment` requires the establishment to already have a bank account; switching to it without one returns `400`.
- A deactivated establishment stops accepting new orders; orders already in progress are unaffected.
- `list` only returns establishments in the authenticated partner's chain, and `get` on any other establishment returns `404` — same for editing and deactivating.
