import { ParceleMaisClient, ParceleMaisEnvironment, CalculationValueType } from '@twila/parcelemais';

const client = new ParceleMaisClient({
  clientId: process.env.PARCELEMAIS_CLIENT_ID!,
  clientSecret: process.env.PARCELEMAIS_CLIENT_SECRET!,
  environment: ParceleMaisEnvironment.Staging,
});

export async function simulateInstallments(requestedAmount: number) {
  const installments = await client.simulations.simulateInstallments({
    requestedAmount,
    calculationValueType: CalculationValueType.GrossAmount,
  });

  return installments.map((parcela) => ({
    term: parcela.term,
    installment: `R$ ${parcela.installmentAmount.toFixed(2)}`,
    total: `R$ ${parcela.totalAmount.toFixed(2)}`,
  }));
}

export async function simulateValuesForTerm(amount: number, term: number) {
  const result = await client.simulations.simulateValues({
    amount,
    term,
    calculationValueType: CalculationValueType.LiquidAmount,
  });

  return result;
}
