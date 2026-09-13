import twila.parcelemais.ParceleMaisClient;
import twila.parcelemais.PagedResult;
import twila.parcelemais.customers.model.Customer;
import twila.parcelemais.customers.model.ListCustomersRequest;

import java.util.UUID;

public final class CustomersExample {

    public static Customer getCustomer(ParceleMaisClient client, UUID customerId) {
        return client.customers().get(customerId);
    }

    public static PagedResult<Customer> findByDocument(ParceleMaisClient client, String cpf) {
        return client.customers().list(ListCustomersRequest.builder()
                .document(cpf)
                .page(1)
                .pageSize(10)
                .build());
    }

    public static void printCustomers(ParceleMaisClient client) {
        PagedResult<Customer> page = findByDocument(client, "12345678900");

        for (Customer customer : page.getItems()) {
            System.out.println(customer.getName() + " - " + customer.getDocument());
        }
    }
}
