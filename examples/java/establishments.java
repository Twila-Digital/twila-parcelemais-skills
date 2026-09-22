import twila.parcelemais.ParceleMaisClient;
import twila.parcelemais.errors.ParceleMaisApiException;
import twila.parcelemais.establishments.model.BankAccountType;
import twila.parcelemais.establishments.model.CreateEstablishmentRequest;
import twila.parcelemais.establishments.model.DisbursementModel;
import twila.parcelemais.establishments.model.Establishment;
import twila.parcelemais.establishments.model.EstablishmentAddress;
import twila.parcelemais.establishments.model.EstablishmentBankAccount;
import twila.parcelemais.establishments.model.EstablishmentOwner;
import twila.parcelemais.establishments.model.ListEstablishmentsRequest;
import twila.parcelemais.establishments.model.UpdateEstablishmentRequest;

import java.util.List;
import java.util.UUID;

public final class EstablishmentsExample {

    public static UUID createEstablishment(ParceleMaisClient client) {
        UUID establishmentId = client.establishments().create(CreateEstablishmentRequest.builder()
                .document("12345678000199")
                .legalName("Loja Centro LTDA")
                .tradeName("Loja Centro")
                .disbursementModel(DisbursementModel.ESTABLISHMENT_CHAIN)
                .owner(EstablishmentOwner.builder()
                        .name("Maria Souza")
                        .email("maria@loja.com.br")
                        .phone("+5511999998888")
                        .build())
                .bankAccount(EstablishmentBankAccount.builder()
                        .bankNumber("341")
                        .agencyNumber("1234")
                        .accountNumber("56789")
                        .accountDigit("0")
                        .accountType(BankAccountType.CURRENT)
                        .build())
                .address(EstablishmentAddress.builder()
                        .street("Rua Exemplo")
                        .number("100")
                        .district("Centro")
                        .city("São Paulo")
                        .state("SP")
                        .zipCode("01310100")
                        .build())
                .build());

        // Persist establishmentId — it's required to read, edit or change the status of the establishment later.
        return establishmentId;
    }

    public static Establishment getEstablishment(ParceleMaisClient client, UUID establishmentId) {
        try {
            return client.establishments().get(establishmentId);
        } catch (ParceleMaisApiException e) {
            if (e.getStatusCode() == 404) {
                System.out.println("Loja " + establishmentId + " não pertence a este parceiro.");
                return null;
            }
            throw e;
        }
    }

    public static List<Establishment> listActiveEstablishments(ParceleMaisClient client, String tradeName) {
        return client.establishments().list(ListEstablishmentsRequest.builder()
                .tradeName(tradeName)
                .isActive(true)
                .build());
    }

    public static void renameEstablishment(ParceleMaisClient client, UUID establishmentId) {
        client.establishments().update(establishmentId, UpdateEstablishmentRequest.builder()
                .tradeName("Loja Centro Matriz")
                .build());
    }

    public static void moveDisbursementToEstablishmentAccount(ParceleMaisClient client, UUID establishmentId) {
        // The establishment needs its own bank account before it can receive the disbursement.
        client.establishments().updateBankAccount(establishmentId, EstablishmentBankAccount.builder()
                .bankNumber("341")
                .agencyNumber("1234")
                .accountNumber("56789")
                .accountDigit("0")
                .accountType(BankAccountType.CURRENT)
                .build());

        client.establishments().update(establishmentId, UpdateEstablishmentRequest.builder()
                .tradeName("Loja Centro Matriz")
                .disbursementModel(DisbursementModel.ESTABLISHMENT)
                .build());
    }

    public static void closeEstablishment(ParceleMaisClient client, UUID establishmentId) {
        try {
            client.establishments().deactivate(establishmentId);
        } catch (ParceleMaisApiException e) {
            if (e.getStatusCode() == 404) {
                System.out.println("Loja " + establishmentId + " não pertence a este parceiro.");
                return;
            }
            throw e;
        }
    }

    public static void reopenEstablishment(ParceleMaisClient client, UUID establishmentId) {
        client.establishments().activate(establishmentId);
    }
}
