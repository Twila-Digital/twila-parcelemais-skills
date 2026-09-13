import twila.parcelemais.ParceleMaisClient;
import twila.parcelemais.PagedResult;
import twila.parcelemais.config.ParceleMaisEnvironment;
import twila.parcelemais.orders.model.Address;
import twila.parcelemais.orders.model.CreateOrderRequest;
import twila.parcelemais.orders.model.ListOrdersRequest;
import twila.parcelemais.orders.model.Order;
import twila.parcelemais.orders.model.CheckoutLink;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class OrdersExample {

    public static UUID createOrder(ParceleMaisClient client) {
        return client.orders().create(CreateOrderRequest.builder()
                .cpf("12345678900")
                .phoneNumber("11999999999")
                .establishmentDocument("12345678000199")
                .requestedAmount(new BigDecimal("1500.00"))
                .name("João Silva")
                .email("joao@email.com")
                .dateOfBirth(OffsetDateTime.parse("1990-01-01T00:00:00-03:00"))
                .address(Address.builder()
                        .street("Rua Exemplo")
                        .number("100")
                        .neighborhood("Centro")
                        .city("São Paulo")
                        .state("SP")
                        .postalCode("01310-100")
                        .build())
                .build());
    }

    public static Order getOrder(ParceleMaisClient client, UUID orderId) {
        return client.orders().get(orderId);
    }

    public static PagedResult<Order> listRecentOrders(ParceleMaisClient client) {
        return client.orders().list(ListOrdersRequest.builder()
                .page(1)
                .pageSize(20)
                .build());
    }

    public static CheckoutLink startCdcSale(ParceleMaisClient client, UUID orderId) {
        return client.orders().startCdcSale(orderId);
    }

    public static void main(String[] args) {
        try (ParceleMaisClient client = ParceleMaisClient.builder()
                .clientId(System.getenv("PARCELEMAIS_CLIENT_ID"))
                .clientSecret(System.getenv("PARCELEMAIS_CLIENT_SECRET"))
                .environment(ParceleMaisEnvironment.STAGING)
                .build()) {

            UUID orderId = createOrder(client);
            Order order = getOrder(client, orderId);
            System.out.println("Pedido " + order.getNumber() + " está " + order.getStatus());

            CheckoutLink link = startCdcSale(client, orderId);
            System.out.println("Link de pagamento: " + link.getUrl());
        }
    }
}
