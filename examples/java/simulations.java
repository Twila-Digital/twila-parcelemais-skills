import twila.parcelemais.ParceleMaisClient;
import twila.parcelemais.simulations.model.CalculationValueType;
import twila.parcelemais.simulations.model.InstallmentSimulation;
import twila.parcelemais.simulations.model.SimulateInstallmentsRequest;
import twila.parcelemais.simulations.model.SimulateValuesRequest;
import twila.parcelemais.simulations.model.ValuesSimulation;

import java.math.BigDecimal;
import java.util.List;

public final class SimulationsExample {

    public static List<InstallmentSimulation> simulateInstallments(ParceleMaisClient client, BigDecimal requestedAmount) {
        return client.simulations().simulateInstallments(SimulateInstallmentsRequest.builder()
                .requestedAmount(requestedAmount)
                .calculationValueType(CalculationValueType.GROSS_AMOUNT)
                .build());
    }

    public static ValuesSimulation simulateValues(ParceleMaisClient client, BigDecimal amount, int term) {
        return client.simulations().simulateValues(SimulateValuesRequest.builder()
                .amount(amount)
                .term(term)
                .calculationValueType(CalculationValueType.LIQUID_AMOUNT)
                .build());
    }

    public static void printInstallments(ParceleMaisClient client) {
        List<InstallmentSimulation> parcelas = simulateInstallments(client, new BigDecimal("1500.00"));

        for (InstallmentSimulation parcela : parcelas) {
            System.out.printf("%dx de %s (total %s)%n",
                    parcela.getTerm(), parcela.getInstallmentAmount(), parcela.getTotalAmount());
        }
    }
}
