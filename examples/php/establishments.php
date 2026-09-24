<?php

declare(strict_types=1);

use Twila\ParceleMais\Config\ClientOptions;
use Twila\ParceleMais\Config\Environment;
use Twila\ParceleMais\Errors\ParceleMaisApiException;
use Twila\ParceleMais\ParceleMaisClient;
use Twila\ParceleMais\Establishments\BankAccountType;
use Twila\ParceleMais\Establishments\CreateEstablishmentRequest;
use Twila\ParceleMais\Establishments\DisbursementModel;
use Twila\ParceleMais\Establishments\EstablishmentAddress;
use Twila\ParceleMais\Establishments\EstablishmentBankAccount;
use Twila\ParceleMais\Establishments\EstablishmentOwner;
use Twila\ParceleMais\Establishments\ListEstablishmentsRequest;
use Twila\ParceleMais\Establishments\UpdateEstablishmentRequest;

$client = new ParceleMaisClient(new ClientOptions(
    getenv('PARCELEMAIS_CLIENT_ID'),
    getenv('PARCELEMAIS_CLIENT_SECRET'),
    Environment::STAGING
));

// Cadastrar loja
$result = $client->establishments->create(new CreateEstablishmentRequest(
    '12345678000199',
    'Loja Centro LTDA',
    'Loja Centro',
    DisbursementModel::ESTABLISHMENT_CHAIN,
    new EstablishmentOwner('Maria Souza', 'maria@loja.com.br', '+5511999998888'),
    new EstablishmentBankAccount('341', '1234', '56789', '0', BankAccountType::CURRENT),
    new EstablishmentAddress('Rua Exemplo', '100', 'Centro', 'São Paulo', 'SP', '01310100')
));

// Guarde o establishmentId — é ele que permite consultar, editar ou mudar a situação da loja depois.
$establishmentId = $result->establishmentId;
echo "Loja criada: {$establishmentId}\n";

// Buscar a loja
$establishment = $client->establishments->get($establishmentId);
echo "Loja {$establishment->tradeName}: " . ($establishment->isActive ? 'ativa' : 'inativa') . "\n";

// Listar as lojas ativas com "Centro" no nome fantasia
$active = $client->establishments->list(new ListEstablishmentsRequest('Centro', true));
echo count($active) . " loja(s) ativa(s)\n";

// Editar loja (o nome fantasia é sempre obrigatório; a razão social não muda)
$client->establishments->update($establishmentId, new UpdateEstablishmentRequest('Loja Centro Matriz'));

// Passar o desembolso para a conta da própria loja — a conta precisa existir antes
$client->establishments->updateBankAccount(
    $establishmentId,
    new EstablishmentBankAccount('341', '1234', '56789', '0', BankAccountType::CURRENT)
);

$client->establishments->update($establishmentId, new UpdateEstablishmentRequest(
    'Loja Centro Matriz',
    DisbursementModel::ESTABLISHMENT
));

// Inativar (a loja para de aceitar novos pedidos)
try {
    $client->establishments->deactivate($establishmentId);
} catch (ParceleMaisApiException $e) {
    if ($e->getStatusCode() === 404) {
        echo "Loja {$establishmentId} não pertence a este parceiro.\n";
    } else {
        throw $e;
    }
}

// Reativar
$client->establishments->activate($establishmentId);
