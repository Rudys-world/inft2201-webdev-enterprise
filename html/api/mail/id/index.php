<?php
require '../../../vendor/autoload.php';

use Application\Mail;
use Application\Page;

$dsn = "pgsql:host=" . getenv('DB_PROD_HOST') . ";dbname=" . getenv('DB_PROD_NAME');
try {
    $pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASS'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo "Database connection failed: " . $e->getMessage();
    exit;
}

$mail = new Mail($pdo);
$page = new Page();

$uri = $_SERVER['REQUEST_URI'];
$parts = explode('/', trim($uri, '/'));
$id = end($parts);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $mail->getMail($id);
    if (!$result) {
        $page->notFound();
        exit;
    }
    $page->item($result);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);

    if (!isset($data['subject']) || !isset($data['body'])) {
        $page->badRequest();
        exit;
    }

    $result = $mail->getMail($id);
    if (!$result) {
        $page->notFound();
        exit;
    }

    $mail->updateMail($id, $data['subject'], $data['body']);
    $page->item($mail->getMail($id));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $result = $mail->getMail($id);
    if (!$result) {
        $page->notFound();
        exit;
    }

    $mail->deleteMail($id);
    http_response_code(200);
    echo json_encode(["message" => "Mail deleted successfully"]);
    exit;
}

$page->badRequest();