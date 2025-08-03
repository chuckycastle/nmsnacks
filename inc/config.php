<?php
// inc/config.php
// For future-proofing, consider loading credentials from environment variables (e.g. with phpdotenv).
$host = 'localhost';
$db   = 'nmsnacks';
$user = 'nmsnacks_user';
$pass = 'your_strong_password'; // Replace with your actual password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}