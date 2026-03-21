<?php
// admin/includes/Database.php
declare(strict_types=1);

class Database {
    private static ?PDO $instance = null;

    private function __construct() {}
    private function __clone() {}

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=utf8mb4;port=%s',
                $_ENV['DB_HOST'] ?? 'localhost',
                $_ENV['DB_NAME'] ?? 'itapolitana_db',
                $_ENV['DB_PORT'] ?? '3306'
            );

            try {
                self::$instance = new PDO($dsn, 
                    $_ENV['DB_USER'] ?? 'root', 
                    $_ENV['DB_PASS'] ?? '', 
                    [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                        PDO::ATTR_PERSISTENT         => false,
                        PDO::MYSQL_ATTR_FOUND_ROWS   => true,
                    ]
                );
            } catch (PDOException $e) {
                http_response_code(503);
                header('Content-Type: application/json');
                die(json_encode(['erro' => 'Serviço temporariamente indisponível']));
            }
        }
        return self::$instance;
    }

    public static function query(string $sql, array $params = []): PDOStatement {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function insert(string $sql, array $params = []): int {
        self::query($sql, $params);
        return (int) self::getInstance()->lastInsertId();
    }
}
