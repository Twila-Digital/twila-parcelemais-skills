using ParceleMais;
using ParceleMais.Orders.Models;

namespace ParceleMaisExamples;

public static class OrdersExample
{
    public static async Task<Order> CreateAndFetchOrderAsync(IParceleMaisClient client, CancellationToken ct = default)
    {
        var orderId = await client.Orders.CreateAsync(new CreateOrderRequest(
            Cpf: "12345678900",
            PhoneNumber: "11999999999",
            EstablishmentDocument: "12345678000199",
            RequestedAmount: 1500.00m,
            Name: "João Silva",
            Email: "joao@email.com",
            DateOfBirth: new DateTimeOffset(1990, 1, 1, 0, 0, 0, TimeSpan.Zero),
            Address: new Address(
                Street: "Rua Exemplo",
                Number: "100",
                Neighborhood: "Centro",
                City: "São Paulo",
                State: "SP",
                PostalCode: "01310-100")),
            ct);

        return await client.Orders.GetAsync(orderId, ct);
    }

    public static async Task<IReadOnlyList<Order>> ListPendingOrdersAsync(IParceleMaisClient client, CancellationToken ct = default)
    {
        var page = await client.Orders.ListAsync(
            new ListOrdersRequest(Status: OrderStatus.PendingPayment, Page: 1, PageSize: 20), ct);

        return page.Items;
    }

    public static async Task<string?> StartCdcSaleAsync(IParceleMaisClient client, Guid orderId, CancellationToken ct = default)
    {
        var checkoutLink = await client.Orders.StartCdcSaleAsync(orderId, ct);
        return checkoutLink.Url;
    }

    public static async Task ImportInvoiceAsync(IParceleMaisClient client, Guid orderId, string filePath, CancellationToken ct = default)
    {
        var file = InvoiceFile.FromFile(filePath);
        await client.Orders.ImportInvoiceAsync(orderId, file, ct);
    }
}
