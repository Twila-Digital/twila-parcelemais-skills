<?php

declare(strict_types=1);

use Twila\ParceleMais\Config\ClientOptions;
use Twila\ParceleMais\Config\Environment;
use Twila\ParceleMais\ParceleMaisClient;
use Twila\ParceleMais\Simulations\CalculationValueType;
use Twila\ParceleMais\Simulations\SimulateInstallmentsRequest;
use Twila\ParceleMais\Simulations\SimulateValuesRequest;

$client = new ParceleMaisClient(new ClientOptions(
    getenv('PARCELEMAIS_CLIENT_ID'),
    getenv('PARCELEMAIS_CLIENT_SECRET'),
    Environment::STAGING
));

// Simulate installments for a requested amount
$installments = $client->simulations->simulateInstallments(
    new SimulateInstallmentsRequest(1500.00, CalculationValueType::GROSS_AMOUNT)
);
foreach ($installments as $installment) {
    printf(
        "%dx de R$ %.2f (total R$ %.2f)\n",
        $installment->term,
        $installment->installmentAmount,
        $installment->totalAmount
    );
}

// Simulate values for a specific term
$values = $client->simulations->simulateValues(new SimulateValuesRequest(1500.00, 12));
printf(
    "Valor de venda: R$ %.2f | Desembolso: R$ %.2f | Parcela: R$ %.2f\n",
    $values->saleAmount,
    $values->disbursementAmount,
    $values->installmentAmount
);
