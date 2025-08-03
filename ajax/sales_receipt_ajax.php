<?php
// ajax/sales_receipt_ajax.php
require '../inc/config.php';
require '../inc/auth.php';
require '../inc/functions.php';

header('Content-Type: application/json');

// Require the "batch" parameter.
if (!isset($_GET['batch'])) {
    sendResponse(false, [], "Batch parameter is required.");
}
$batch = $_GET['batch'];

$stmt = $pdo->prepare("SELECT s.*, p.name AS product_name, p.category, u.name AS seller_name
                           FROM sales s 
                           JOIN products p ON s.product_id = p.product_id 
                           LEFT JOIN users u ON s.payment_received_by = u.username
                           WHERE s.pos_batch = ?");
$stmt->execute([$batch]);
$details = $stmt->fetchAll();

if (!$details) {
    sendResponse(false, [], "No receipt details found.");
}

$items = [];
$grandTotal = 0;
foreach ($details as $detail) {
    $lineTotal = $detail['unit_sale_price'] * $detail['quantity'];
    $grandTotal += $lineTotal;
    $items[] = [
        'product_name' => $detail['product_name'],
        'quantity' => $detail['quantity'],
        'unit_sale_price' => $detail['unit_sale_price'],
        'total' => $lineTotal
    ];
}

$receipt = [
    'buyer' => $details[0]['buyer'],
    'sale_date' => $details[0]['sale_date'],
    'seller_name' => $details[0]['seller_name'],
    'payment_method' => $details[0]['payment_method'],
    'items' => $items,
    'grand_total' => $grandTotal
];

sendResponse(true, $receipt, "Receipt retrieved successfully.");
?>
