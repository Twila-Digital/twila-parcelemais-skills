# Establishment Management (Python)

An **establishment** (`loja`) is the merchant location that originates orders. Establishments created through the API are registered inside the partner's establishment chain and automatically linked to the partner authenticated by the access token.

## Types

```python
class DisbursementModel(IntEnum):
    ESTABLISHMENT_CHAIN = 1  # the chain receives the disbursement
    ESTABLISHMENT = 2        # the establishment itself receives it (requires the establishment's bank account)
    EXTERNAL = 3             # a third-party account receives it (requires holder_name + holder_document)

class BankAccountType(IntEnum):
    CURRENT = 1
    SAVINGS = 2
    PAYMENT = 3

@dataclass(frozen=True)
class EstablishmentOwner:
    name: str
    email: str
    phone: str  # E.164, e.g. "+5511999998888"

@dataclass(frozen=True)
class EstablishmentBankAccount:
    bank_number: str
    agency_number: str
    account_number: str
    account_digit: str
    account_type: BankAccountType
    agency_digit: Optional[str] = None
    holder_name: Optional[str] = None      # required when disbursement_model is EXTERNAL
    holder_document: Optional[str] = None  # required when disbursement_model is EXTERNAL

@dataclass(frozen=True)
class EstablishmentAddress:
    street: str
    number: str
    district: str
    city: str
    state: str
    zip_code: str
    complement: Optional[str] = None
    country: Optional[str] = None

@dataclass(frozen=True)
class CreateEstablishmentRequest:
    document: str  # CNPJ, digits only
    legal_name: str
    trade_name: str
    disbursement_model: DisbursementModel
    owner: EstablishmentOwner
    bank_account: EstablishmentBankAccount
    address: EstablishmentAddress                            # required on create

@dataclass(frozen=True)
class Establishment:
    establishment_id: str
    document: str
    legal_name: str
    trade_name: str
    is_active: bool
    owner: EstablishmentOwner
    disbursement_model: Optional[DisbursementModel] = None
    bank_account: Optional[EstablishmentBankAccount] = None  # None when there's no bank account yet
    address: Optional[EstablishmentAddress] = None           # None when there's no address yet

@dataclass(frozen=True)
class UpdateEstablishmentRequest:
    trade_name: str
    disbursement_model: Optional[DisbursementModel] = None  # None keeps the current one
    address: Optional[EstablishmentAddress] = None          # None keeps the current one

@dataclass(frozen=True)
class ListEstablishmentsRequest:
    trade_name: Optional[str] = None  # partial, case-insensitive match
    is_active: Optional[bool] = None  # None returns active and inactive
```

`client.establishments` exposes: `create(request)`, `get(establishment_id)`, `list(request)`, `update(establishment_id, request)`, `update_bank_account(establishment_id, bank_account)`, `activate(establishment_id)`, `deactivate(establishment_id)`.

## Usage

```python
result = client.establishments.create(CreateEstablishmentRequest(
    document="12345678000199",
    legal_name="Loja Centro LTDA",
    trade_name="Loja Centro",
    disbursement_model=DisbursementModel.ESTABLISHMENT_CHAIN,
    owner=EstablishmentOwner(name="Maria Souza", email="maria@loja.com.br", phone="+5511999998888"),
    bank_account=EstablishmentBankAccount(
        bank_number="341",
        agency_number="1234",
        account_number="56789",
        account_digit="0",
        account_type=BankAccountType.CURRENT,
    ),
))

establishment = client.establishments.get(result.establishment_id)

active = client.establishments.list(ListEstablishmentsRequest(trade_name="Centro", is_active=True))

client.establishments.update(result.establishment_id, UpdateEstablishmentRequest(trade_name="Loja Centro Matriz"))

client.establishments.update_bank_account(result.establishment_id, EstablishmentBankAccount(
    bank_number="237",
    agency_number="4321",
    account_number="98765",
    account_digit="1",
    account_type=BankAccountType.SAVINGS,
))

client.establishments.deactivate(result.establishment_id)
```

Keep the returned `establishment_id` — it's the only way to read, edit or change the status of the establishment later. The establishment's CNPJ is what `create` (orders) takes as `establishment_document`.

## Error Handling and Edge Cases
- `document` (CNPJ) and `legal_name` must be unique across all establishments — a duplicate on `create` raises `ParceleMaisApiError` with status `409`.
- The legal name can't be changed through the API — `update` only replaces `trade_name` (always required); `disbursement_model` and `address` are only touched when not `None`.
- The bank account has its own endpoint: `update_bank_account` replaces it as a whole, so send every field, not just the ones that changed.
- An inactive establishment rejects edits — call `activate(establishment_id)` first. An establishment whose chain is inactive can't be created, edited or reactivated at all.
- `DisbursementModel.ESTABLISHMENT` requires the establishment to already have a bank account; switching to it without one returns `400`.
- A deactivated establishment stops accepting new orders; orders already in progress are unaffected.
- `list` only returns establishments in the authenticated partner's chain, and `get` on any other establishment returns `404` — same for editing and deactivating.
