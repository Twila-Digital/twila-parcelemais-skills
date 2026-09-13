import { ParceleMaisClient, ParceleMaisEnvironment } from '@twila/parcelemais';

const client = new ParceleMaisClient({
  clientId: process.env.PARCELEMAIS_CLIENT_ID!,
  clientSecret: process.env.PARCELEMAIS_CLIENT_SECRET!,
  environment: ParceleMaisEnvironment.Staging,
});

export async function findCustomerByDocument(document: string) {
  const page = await client.customers.list({ document, pageSize: 1 });
  return page.items[0];
}

export async function getCustomer(customerId: string) {
  return client.customers.get(customerId);
}
