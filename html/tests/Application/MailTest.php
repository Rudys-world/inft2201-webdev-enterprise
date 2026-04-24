<?php
use PHPUnit\Framework\TestCase;
use Application\Mail;

class MailTest extends TestCase {
    protected PDO $pdo;

    protected function setUp(): void
    {
        $dsn = "pgsql:host=" . getenv('DB_TEST_HOST') . ";dbname=" . getenv('DB_TEST_NAME');
        $this->pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASS'));
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Clean and reinitialize the table
        $this->pdo->exec("DROP TABLE IF EXISTS mail;");
        $this->pdo->exec("
            CREATE TABLE mail (
                id SERIAL PRIMARY KEY,
                subject TEXT NOT NULL,
                body TEXT NOT NULL
            );
        ");
    }

    public function testCreateMail() {
        $mail = new Mail($this->pdo);
        $id = $mail->createMail("Alice", "Hello world");
        $this->assertIsInt($id);
        $this->assertEquals(1, $id);
    }

    public function testGetMail() {
        $mail = new Mail($this->pdo);
        $mail->createMail("Alice", "Hello world");
        $result = $mail->getMail(1);
        $this->assertEquals("Alice", $result['subject']);
        $this->assertEquals("Hello world", $result['body']);
    }

    public function testGetAllMail() {
        $mail = new Mail($this->pdo);
        $mail->createMail("Alice", "Hello world");
        $mail->createMail("Bob", "Hi there");
        $result = $mail->getAllMail();
        $this->assertCount(2, $result);
    }

    public function testUpdateMail() {
        $mail = new Mail($this->pdo);
        $mail->createMail("Alice", "Hello world");
        $mail->updateMail(1, "Updated Subject", "Updated Body");
        $result = $mail->getMail(1);
        $this->assertEquals("Updated Subject", $result['subject']);
        $this->assertEquals("Updated Body", $result['body']);
    }

    public function testDeleteMail() {
        $mail = new Mail($this->pdo);
        $mail->createMail("Alice", "Hello world");
        $mail->deleteMail(1);
        $result = $mail->getMail(1);
        $this->assertFalse($result);
    }

}