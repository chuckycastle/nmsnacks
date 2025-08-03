<?php
// pages/customers_autocomplete.php
require '../inc/config.php';
require '../inc/functions.php';

$term = isset($_GET['term']) ? trim($_GET['term']) : '';

if ($term !== '') {
    $stmt = $pdo->prepare("SELECT customer_id, name, credit_balance FROM customers WHERE name LIKE ? ORDER BY name ASC LIMIT 10");
    $stmt->execute(["%{$term}%"]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $formatted_results = [];
    foreach ($results as $row) {
        $formatted_results[] = [
            'label' => $row['name'] . ' (Credit: $' . number_format($row['credit_balance'], 2) . ')',
            'value' => $row['name'],
            'customer_id' => $row['customer_id'],
            'credit_balance' => $row['credit_balance']
        ];
    }
    
    echo json_encode($formatted_results);
}
?>