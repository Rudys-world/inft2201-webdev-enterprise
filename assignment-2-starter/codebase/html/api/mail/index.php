<?php
require __DIR__ . '/../../../autoload.php';

use Application\Mail;
use Application\Database;
use Application\Page;
use Application\Verifier;

$database = new Database('prod');
$page = new Page();
$mail = new Mail($database->getDb());
$verifier = new Verifier();

// Check for Authorization header
if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

// Decode the JWT token
$verifier->decode($_SERVER['HTTP_AUTHORIZATION']);

// If token is invalid, userId will be null
if (!$verifier->userId) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (array_key_exists('name', $data) && array_key_exists('message', $data)) {
        $id = $mail->createMail($data['name'], $data['message'], $verifier->userId);
        $page->item(array("id" => $id));
    } else {
        $page->badRequest();
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($verifier->role === 'admin') {
        $page->item($mail->listMail());
    } else {
        $page->item($mail->listMailByUser($verifier->userId));
    }
} else {
    $page->badRequest();
}