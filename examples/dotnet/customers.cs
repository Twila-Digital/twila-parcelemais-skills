using ParceleMais;
using ParceleMais.Customers.Models;

namespace ParceleMaisExamples;

public static class CustomersExample
{
    public static async Task<Customer> GetCustomerAsync(IParceleMaisClient client, Guid customerId, CancellationToken ct = default)
    {
        return await client.Customers.GetAsync(customerId, ct);
    }

    public static async Task<IReadOnlyList<Customer>> FindCustomersByDocumentAsync(
        IParceleMaisClient client, string document, CancellationToken ct = default)
    {
        var page = await client.Customers.ListAsync(new ListCustomersRequest(Document: document), ct);
        return page.Items;
    }
}
