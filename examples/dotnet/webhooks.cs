using ParceleMais;
using ParceleMais.Errors;
using ParceleMais.Webhooks;
using ParceleMais.Webhooks.Models;

namespace ParceleMaisExamples;

public static class WebhooksExample
{
    public static async Task<string> RegisterOrderWebhookAsync(IParceleMaisClient client, string url, CancellationToken ct = default)
    {
        var result = await client.Webhooks.CreateAsync(
            new CreateWebhookRequest(Type: WebHookType.Order, Url: url, AuthenticationType: WebHookAuthenticationType.None), ct);

        // Persist result.SigningSecret securely — it is not returned again by ListAsync.
        return result.SigningSecret;
    }

    // Call from your webhook HTTP endpoint handler.
    public static OrderWebhookEvent? HandleIncomingWebhook(string rawBody, string signatureHeader, string signingSecret)
    {
        try
        {
            return ParceleMaisWebhookEvent.Parse(rawBody, signatureHeader, signingSecret);
        }
        catch (ParceleMaisWebhookSignatureException)
        {
            // Respond 401 to the caller — do not process the event.
            return null;
        }
    }
}
