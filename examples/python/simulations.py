"""Installment and value simulations — see rules/python/simulations.md."""

from twila_parcelemais import (
    CalculationValueType,
    ParceleMaisClient,
    SimulateInstallmentsRequest,
    SimulateValuesRequest,
)


def simulate_installments(client: ParceleMaisClient, amount: float) -> None:
    options = client.simulations.simulate_installments(
        SimulateInstallmentsRequest(requested_amount=amount, calculation_value_type=CalculationValueType.GROSS_AMOUNT)
    )
    for option in options:
        print(f"{option.term}x de R$ {option.installment_amount:.2f} (total R$ {option.total_amount:.2f})")


def simulate_values(client: ParceleMaisClient, amount: float, term: int) -> None:
    values = client.simulations.simulate_values(SimulateValuesRequest(amount=amount, term=term))
    print(f"Valor de venda: R$ {values.sale_amount:.2f}")
    print(f"Valor de desembolso: R$ {values.disbursement_amount:.2f}")
    print(f"Valor da parcela: R$ {values.installment_amount:.2f}")
