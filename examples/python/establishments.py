"""Establishment registration, reading, editing and deactivation — see rules/python/establishments.md."""

from typing import List, Optional

from twila_parcelemais import (
    BankAccountType,
    CreateEstablishmentRequest,
    DisbursementModel,
    Establishment,
    EstablishmentAddress,
    EstablishmentBankAccount,
    EstablishmentOwner,
    ListEstablishmentsRequest,
    ParceleMaisApiError,
    ParceleMaisClient,
    UpdateEstablishmentRequest,
)


def create_establishment(client: ParceleMaisClient) -> str:
    result = client.establishments.create(
        CreateEstablishmentRequest(
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
            address=EstablishmentAddress(
                street="Rua Exemplo",
                number="100",
                district="Centro",
                city="São Paulo",
                state="SP",
                zip_code="01310100",
            ),
        )
    )

    # Persist establishment_id — it's required to read, edit or change the status of the establishment later.
    return result.establishment_id


def get_establishment(client: ParceleMaisClient, establishment_id: str) -> Optional[Establishment]:
    try:
        return client.establishments.get(establishment_id)
    except ParceleMaisApiError as error:
        if error.status_code == 404:
            print(f"Loja {establishment_id} não pertence a este parceiro.")
            return None
        raise


def list_active_establishments(client: ParceleMaisClient, trade_name: Optional[str] = None) -> List[Establishment]:
    return client.establishments.list(ListEstablishmentsRequest(trade_name=trade_name, is_active=True))


def rename_establishment(client: ParceleMaisClient, establishment_id: str) -> None:
    client.establishments.update(
        establishment_id,
        UpdateEstablishmentRequest(trade_name="Loja Centro Matriz"),
    )


def move_disbursement_to_establishment_account(client: ParceleMaisClient, establishment_id: str) -> None:
    # The establishment needs its own bank account before it can receive the disbursement.
    client.establishments.update_bank_account(
        establishment_id,
        EstablishmentBankAccount(
            bank_number="341",
            agency_number="1234",
            account_number="56789",
            account_digit="0",
            account_type=BankAccountType.CURRENT,
        ),
    )

    client.establishments.update(
        establishment_id,
        UpdateEstablishmentRequest(
            trade_name="Loja Centro Matriz",
            disbursement_model=DisbursementModel.ESTABLISHMENT,
        ),
    )


def close_establishment(client: ParceleMaisClient, establishment_id: str) -> None:
    try:
        client.establishments.deactivate(establishment_id)
    except ParceleMaisApiError as error:
        if error.status_code == 404:
            print(f"Loja {establishment_id} não pertence a este parceiro.")
            return
        raise


def reopen_establishment(client: ParceleMaisClient, establishment_id: str) -> None:
    client.establishments.activate(establishment_id)
