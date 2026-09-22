import {
  ParceleMaisClient,
  ParceleMaisEnvironment,
  BankAccountType,
  DisbursementModel,
  ParceleMaisApiError,
  type Establishment,
} from '@twila/parcelemais';

const client = new ParceleMaisClient({
  clientId: process.env.PARCELEMAIS_CLIENT_ID!,
  clientSecret: process.env.PARCELEMAIS_CLIENT_SECRET!,
  environment: ParceleMaisEnvironment.Staging,
});

export async function createEstablishment() {
  const { establishmentId } = await client.establishments.create({
    document: '12345678000199',
    legalName: 'Loja Centro LTDA',
    tradeName: 'Loja Centro',
    disbursementModel: DisbursementModel.EstablishmentChain,
    owner: {
      name: 'Maria Souza',
      email: 'maria@loja.com.br',
      phone: '+5511999998888',
    },
    bankAccount: {
      bankNumber: '341',
      agencyNumber: '1234',
      accountNumber: '56789',
      accountDigit: '0',
      accountType: BankAccountType.Current,
    },
    address: {
      street: 'Rua Exemplo',
      number: '100',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310100',
    },
  });

  // Persist establishmentId — it's required to read, edit or change the status of the establishment later.
  return establishmentId;
}

export async function getEstablishment(establishmentId: string): Promise<Establishment | null> {
  try {
    return await client.establishments.get(establishmentId);
  } catch (error) {
    if (error instanceof ParceleMaisApiError && error.statusCode === 404) {
      console.warn(`Loja ${establishmentId} não pertence a este parceiro.`);
      return null;
    }
    throw error;
  }
}

export async function listActiveEstablishments(tradeName?: string) {
  return client.establishments.list({ tradeName, isActive: true });
}

export async function renameEstablishment(establishmentId: string) {
  await client.establishments.update(establishmentId, {
    tradeName: 'Loja Centro Matriz',
  });
}

export async function moveDisbursementToEstablishmentAccount(establishmentId: string) {
  // The establishment needs its own bank account before it can receive the disbursement.
  await client.establishments.updateBankAccount(establishmentId, {
    bankNumber: '341',
    agencyNumber: '1234',
    accountNumber: '56789',
    accountDigit: '0',
    accountType: BankAccountType.Current,
  });

  await client.establishments.update(establishmentId, {
    tradeName: 'Loja Centro Matriz',
    disbursementModel: DisbursementModel.Establishment,
  });
}

export async function closeEstablishment(establishmentId: string) {
  try {
    await client.establishments.deactivate(establishmentId);
  } catch (error) {
    if (error instanceof ParceleMaisApiError && error.statusCode === 404) {
      console.warn(`Loja ${establishmentId} não pertence a este parceiro.`);
      return;
    }
    throw error;
  }
}

export async function reopenEstablishment(establishmentId: string) {
  await client.establishments.activate(establishmentId);
}
