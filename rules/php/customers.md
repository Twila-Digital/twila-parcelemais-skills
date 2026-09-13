# ParceleMais Customers Integration (PHP)

Look up and list customers (the end consumer requesting credit) — read-only in this SDK; customers are created implicitly by `orders->create()`.

## Classes & Types

```php
use Twila\ParceleMais\Customers\Address;
use Twila\ParceleMais\Customers\Customer;
use Twila\ParceleMais\Customers\ListCustomersRequest;

final class Address {
    public ?string $street; public ?string $number; public ?string $neighborhood;
    public ?string $city; public ?string $state; public ?string $postalCode;
    public ?string $country; public ?string $complement;
}

final class Customer {
    public string $id; public string $name; public string $document; public string $dateOfBirth;
    public ?Address $address; public ?string $email; public ?string $phoneNumber;
}

final class ListCustomersRequest {
    public ?string $name; public ?string $document;
    public int $page = 1; public int $pageSize = 10;
}
```

## Features

- `$client->customers->get(string $customerId): Customer`
- `$client->customers->list(?ListCustomersRequest $request = null): PagedResult` — filter by name and/or document (CPF).

## Example

(Source: `examples/php/customers.php`)

```php
$page = $client->customers->list(new ListCustomersRequest(null, '12345678900'));
foreach ($page->items as $customer) {
    echo $customer->name . ' — ' . $customer->document . "\n";
}
echo $page->hasNext ? "há mais páginas\n" : "última página\n";
```

## Error Handling and Edge Cases

- `get()` throws `ParceleMaisApiException` with status 404 for an unknown `customerId` — check `getStatusCode() === 404` before treating it as an unexpected error.
- `Customer::$address`, `$email`, `$phoneNumber` are all nullable — not every customer record has complete contact data.
- `PagedResult` (`$page->items`, `$page->hasNext`, `$page->hasPrevious`, `$page->pageNumber`, `$page->pageSize`, `$page->totalCount`) has no auto-pagination — advance `page` yourself in a loop while `$page->hasNext` is true.
