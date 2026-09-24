using System.Net;
using ParceleMais;
using ParceleMais.Errors;
using ParceleMais.Establishments.Models;

namespace ParceleMaisExamples;

public static class EstablishmentsExample
{
    public static async Task<Guid> CreateEstablishmentAsync(IParceleMaisClient client, CancellationToken ct = default)
    {
        var result = await client.Establishments.CreateAsync(new CreateEstablishmentRequest(
            Document: "12345678000199",
            LegalName: "Loja Centro LTDA",
            TradeName: "Loja Centro",
            DisbursementModel: DisbursementModel.EstablishmentChain,
            Owner: new EstablishmentOwner("Maria Souza", "maria@loja.com.br", "+5511999998888"),
            BankAccount: new EstablishmentBankAccount("341", "1234", "56789", "0", BankAccountType.Current),
            Address: new EstablishmentAddress("Rua Exemplo", "100", "Centro", "São Paulo", "SP", "01310100")), ct);

        // Persist EstablishmentId — it's required to read, edit or change the status of the establishment later.
        return result.EstablishmentId;
    }

    public static async Task<Establishment?> GetEstablishmentAsync(IParceleMaisClient client, Guid establishmentId, CancellationToken ct = default)
    {
        try
        {
            return await client.Establishments.GetAsync(establishmentId, ct);
        }
        catch (ParceleMaisApiException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            Console.WriteLine($"Loja {establishmentId} não pertence a este parceiro.");
            return null;
        }
    }

    public static Task<IReadOnlyList<Establishment>> ListActiveEstablishmentsAsync(IParceleMaisClient client, string? tradeName = null, CancellationToken ct = default)
        => client.Establishments.ListAsync(new ListEstablishmentsRequest(TradeName: tradeName, IsActive: true), ct);

    public static Task RenameEstablishmentAsync(IParceleMaisClient client, Guid establishmentId, CancellationToken ct = default)
        => client.Establishments.UpdateAsync(establishmentId, new UpdateEstablishmentRequest("Loja Centro Matriz"), ct);

    public static async Task MoveDisbursementToEstablishmentAccountAsync(IParceleMaisClient client, Guid establishmentId, CancellationToken ct = default)
    {
        // The establishment needs its own bank account before it can receive the disbursement.
        await client.Establishments.UpdateBankAccountAsync(establishmentId,
            new EstablishmentBankAccount("341", "1234", "56789", "0", BankAccountType.Current), ct);

        await client.Establishments.UpdateAsync(establishmentId, new UpdateEstablishmentRequest(
            TradeName: "Loja Centro Matriz",
            DisbursementModel: DisbursementModel.Establishment), ct);
    }

    public static async Task CloseEstablishmentAsync(IParceleMaisClient client, Guid establishmentId, CancellationToken ct = default)
    {
        try
        {
            await client.Establishments.DeactivateAsync(establishmentId, ct);
        }
        catch (ParceleMaisApiException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            Console.WriteLine($"Loja {establishmentId} não pertence a este parceiro.");
        }
    }

    public static Task ReopenEstablishmentAsync(IParceleMaisClient client, Guid establishmentId, CancellationToken ct = default)
        => client.Establishments.ActivateAsync(establishmentId, ct);
}
