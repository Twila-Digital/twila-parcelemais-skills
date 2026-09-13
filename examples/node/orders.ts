import { ParceleMaisClient, ParceleMaisEnvironment, OrderStatus, ParceleMaisApiError, ParceleMaisValidationError } from '@twila/parcelemais';

const client = new ParceleMaisClient({
  clientId: process.env.PARCELEMAIS_CLIENT_ID!,
  clientSecret: process.env.PARCELEMAIS_CLIENT_SECRET!,
  environment: ParceleMaisEnvironment.Staging,
});

export async function createOrder(): Promise<string> {
  try {
    const orderId = await client.orders.create({
      cpf: '12345678900',
      phoneNumber: '11999999999',
      establishmentDocument: '12345678000199',
      requestedAmount: 1500.0,
      name: 'João Silva',
      email: 'joao@email.com',
      dateOfBirth: '1990-01-01',
      address: {
        street: 'Rua Exemplo',
        number: '100',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01310-100',
      },
    });
    return orderId;
  } catch (error) {
    if (error instanceof ParceleMaisValidationError) {
      console.error('Validation failed:', error.fieldErrors);
    } else if (error instanceof ParceleMaisApiError) {
      console.error(`API error ${error.statusCode}: ${error.message} (correlationId: ${error.correlationId})`);
    }
    throw error;
  }
}

export async function getOrderAndStartSale(orderId: string): Promise<string | undefined> {
  const order = await client.orders.get(orderId);

  if (order.status !== OrderStatus.Approved) {
    console.log(`Order ${order.id} is not approved yet (status: ${order.statusDescription})`);
    return undefined;
  }

  const link = await client.orders.startCdcSale(orderId);
  return link.url;
}

export async function listRecentOrders() {
  const page = await client.orders.list({ status: OrderStatus.Purchased, pageSize: 20 });
  return page.items;
}
