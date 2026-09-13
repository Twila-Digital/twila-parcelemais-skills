# ParceleMais Orders Integration (PHP)

Orders (`pedidos`) represent a credit/installment request. This module lets you create an order, look it up, list orders with filters, generate the CDC payment link, and attach an invoice.

## Classes & Types

```php
use Twila\ParceleMais\Orders\Address;
use Twila\ParceleMais\Orders\CreateOrderRequest;
use Twila\ParceleMais\Orders\Order;
use Twila\ParceleMais\Orders\OrderStatus;
use Twila\ParceleMais\Orders\ListOrdersRequest;
use Twila\ParceleMais\Orders\CheckoutLink;
use Twila\ParceleMais\Orders\InvoiceFile;

final class Address {
    public string $street; public string $number; public string $neighborhood;
    public string $city; public string $state; public string $postalCode;
    public ?string $complement;
}

final class CreateOrderRequest {
    public string $cpf; public string $phoneNumber; public string $establishmentDocument;
    public float $requestedAmount; public string $name; public string $email;
    public string $dateOfBirth; public Address $address;
}

final class Order {
    public string $id; public int $number; public int $status; // OrderStatus::*
    public string $statusDescription; public string $customerDocument;
    public string $establishmentLegalName; public string $establishmentDocument;
    public string $createdAt;
    public ?float $total; public ?string $customerName; public ?int $term;
    public ?string $description; public ?float $approvedAmount;
    public ?bool $disbursed; public ?string $disbursedAt; public ?float $requestedAmount;
}

final class ListOrdersRequest {
    public ?int $status; public ?string $customerDocument;
    public ?string $startDate; public ?string $endDate; public ?int $number;
    public ?string $establishmentDocument; public ?string $description;
    public int $page = 1; public int $pageSize = 10;
}
```

`OrderStatus` is a pseudo-enum (`final class` with `public const` ints, not a native `enum` — the SDK supports PHP 7.4+, and `enum` only exists since 8.1): `UNDEFINED=0`, `ANALYSING=1`, `APPROVED=2`, `UNAVAILABLE_BALANCE=3`, `ANALYSIS_EXPIRED=4`, `PENDING_PAYMENT=5`, `BIOMETRY_REFUSED=6`, `BIOMETRY_APPROVED=7`, `PAYMENT_REFUSED=8`, `PURCHASED=9`, `UNAUTHORIZED=10`, `PENDING_AUTHORIZATION=11`, `AWAITING_REGISTRATION=12`, `SALE_NOT_STARTED=13`, `CANCELED=14`, `BILLING=15`, `COMPLETED=16`, `FROZEN=17`, `PENDING_PAYMENT_CONFIRMATION=18`, `DISBURSED=19`, `UNKNOWN=-1` (any value the API returns that isn't in this list — never trust an unbounded `int` blindly).

## Features

- `$client->orders->create(CreateOrderRequest $request): string` — returns the new order's ID.
- `$client->orders->get(string $orderId): Order`
- `$client->orders->list(?ListOrdersRequest $request = null): PagedResult` — filter by status, customer document, date range, order number, establishment document, description.
- `$client->orders->startCdcSale(string $orderId): CheckoutLink` — generates the hosted payment link (`$link->url`).
- `$client->orders->importInvoice(string $orderId, InvoiceFile $file): void` — attach an invoice as base64 (`InvoiceFile::fromString($content, $fileName)` encodes it for you).

## Example

(Source: `examples/php/orders.php`)

```php
$orderId = $client->orders->create(new CreateOrderRequest(
    '12345678900', '11999999999', '12345678000199', 1500.00,
    'João Silva', 'joao@email.com', '1990-01-01',
    new Address('Rua Exemplo', '100', 'Centro', 'São Paulo', 'SP', '01310-100')
));

$order = $client->orders->get($orderId);
if ($order->status === OrderStatus::APPROVED) {
    $link = $client->orders->startCdcSale($orderId);
    // redirect the customer to $link->url
}
```

## Error Handling and Edge Cases

- `create()`/`get()`/`list()`/`startCdcSale()`/`importInvoice()` throw `Twila\ParceleMais\Errors\ParceleMaisValidationException` (HTTP 400, has `getFieldErrors(): ?array` per-field messages) or the base `Twila\ParceleMais\Errors\ParceleMaisApiException` (any other non-2xx — `getStatusCode()`, `getErrorCode()`, `getCorrelationId()`) for API errors, `ParceleMaisRateLimitException` (429, `getRetryAfterMs()`) for rate limiting, and `ParceleMaisAuthenticationException`/`ParceleMaisTimeoutException` for auth/network failures.
- Always check `$order->status` against `OrderStatus::*` constants before calling `startCdcSale()` — only `APPROVED` orders should generate a payment link.
- `Order::$total`, `$customerName`, `$term`, `$description`, `$approvedAmount`, `$disbursed`, `$disbursedAt`, `$requestedAmount` are all nullable — the API only fills them in at certain points in the order lifecycle (e.g. `$approvedAmount` is `null` until the order is approved).
- `importInvoice()` uses a longer HTTP timeout internally (configurable via `ResilienceOptions`) since file uploads take longer than typical requests — don't wrap it in your own aggressive timeout.
