using ParceleMais;
using ParceleMais.Simulations.Models;

namespace ParceleMaisExamples;

public static class SimulationsExample
{
    public static async Task<IReadOnlyList<InstallmentSimulation>> SimulateInstallmentsAsync(
        IParceleMaisClient client, decimal requestedAmount, CancellationToken ct = default)
    {
        return await client.Simulations.SimulateInstallmentsAsync(
            new SimulateInstallmentsRequest(RequestedAmount: requestedAmount), ct);
    }

    public static async Task<ValuesSimulation> SimulateValuesAsync(
        IParceleMaisClient client, decimal amount, int term, CancellationToken ct = default)
    {
        return await client.Simulations.SimulateValuesAsync(
            new SimulateValuesRequest(Amount: amount, Term: term, CalculationValueType: CalculationValueType.LiquidAmount), ct);
    }
}
