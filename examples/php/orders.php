<?php

declare(strict_types=1);

use Twila\ParceleMais\Config\ClientOptions;
use Twila\ParceleMais\Config\Environment;
use Twila\ParceleMais\Orders\Address;
use Twila\ParceleMais\Orders\CreateOrderRequest;
use Twila\ParceleMais\Orders\ListOrdersRequest;
use Twila\ParceleMais\Orders\OrderStatus;
use Twila\ParceleMais\ParceleMaisClient;

$client = new ParceleMaisClient(new ClientOptions(
    getenv('PARCELEMAIS_CLIENT_ID'),
    getenv('PARCELEMAIS_CLIENT_SECRET'),
    Environment::STAGING
));

// Create an order
$orderId = $client->orders->create(new CreateOrderRequest(
    '12345678900',
    '11999999999',
    '12345678000199',
    1500.00,
    'João Silva',
    'joao@email.com',
    '1990-01-01',
    new Address('Rua Exemplo', '100', 'Centro', 'São Paulo', 'SP', '01310-100')
));
echo "Pedido criado: {$orderId}\n";

// Fetch it back
$order = $client->orders->get($orderId);
echo "Status: {$order->statusDescription}\n";

if ($order->status === OrderStatus::APPROVED) {
    $link = $client->orders->startCdcSale($orderId);
    echo "Link de pagamento: {$link->url}\n";
}

// List orders for a customer, paginated
$page = $client->orders->list(new ListOrdersRequest(null, '12345678900'));
foreach ($page->items as $item) {
    echo "#{$item->number} — {$item->statusDescription}\n";
}
