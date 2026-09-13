<?php

declare(strict_types=1);

use Twila\ParceleMais\Config\ClientOptions;
use Twila\ParceleMais\Config\Environment;
use Twila\ParceleMais\Customers\ListCustomersRequest;
use Twila\ParceleMais\Errors\ParceleMaisApiException;
use Twila\ParceleMais\ParceleMaisClient;

$client = new ParceleMaisClient(new ClientOptions(
    getenv('PARCELEMAIS_CLIENT_ID'),
    getenv('PARCELEMAIS_CLIENT_SECRET'),
    Environment::STAGING
));

try {
    $customer = $client->customers->get('CUSTOMER_ID');
    echo "{$customer->name} — {$customer->document}\n";
} catch (ParceleMaisApiException $e) {
    if ($e->getStatusCode() === 404) {
        echo "Cliente não encontrado.\n";
    } else {
        throw $e;
    }
}

// List, paginated, filtering by document (CPF)
$page = $client->customers->list(new ListCustomersRequest(null, '12345678900'));
foreach ($page->items as $item) {
    echo "{$item->id}: {$item->name}\n";
}
echo $page->hasNext ? "há mais páginas\n" : "última página\n";
