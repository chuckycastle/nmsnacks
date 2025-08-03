<?php
// ajax/sales_metrics_ajax.php

// Start output buffering to prevent stray output.
ob_start();

require '../inc/config.php';
require '../inc/auth.php';
require '../inc/functions.php';

// Suppress direct display of errors.
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');

if (!isset($_GET['batch'])) {
    sendResponse(false, [], "Batch parameter is required.");
}
$batch = $_GET['batch'];

// Retrieve sale details for the given batch (i.e. the current sale).
$stmt = $pdo->prepare("SELECT s.*, p.name AS product_name, p.category, p.cost, u.name AS seller_name 
                           FROM sales s 
                           JOIN products p ON s.product_id = p.product_id
                           LEFT JOIN users u ON s.payment_received_by = u.username
                           WHERE s.pos_batch = ?");
$stmt->execute([$batch]);
$details = $stmt->fetchAll();

if (!$details) {
    sendResponse(false, [], "No sale metrics found.");
}

// Compute metrics for this sale.
$totalSpent = 0;
$overallProfit = 0;
$itemTrends = [];
foreach ($details as $detail) {
    $lineTotal = $detail['unit_sale_price'] * $detail['quantity'];
    $totalSpent += $lineTotal;
    $lineProfit = ($detail['unit_sale_price'] - $detail['cost']) * $detail['quantity'];
    $overallProfit += $lineProfit;
    if (isset($itemTrends[$detail['product_name']])) {
        $itemTrends[$detail['product_name']]['quantity'] += $detail['quantity'];
        $itemTrends[$detail['product_name']]['total_profit'] += $lineProfit;
    } else {
        $itemTrends[$detail['product_name']] = [
            'quantity' => $detail['quantity'],
            'total_profit' => $lineProfit
        ];
    }
}

// Compute aggregate metrics for all purchases by this buyer.
// Updated query to join products so that "p.cost" is available.
$buyer = $details[0]['buyer'];
$stmtAll = $pdo->prepare("SELECT SUM(s.unit_sale_price * s.quantity) AS allTotalSpent, 
                                  SUM((s.unit_sale_price - p.cost) * s.quantity) AS allOverallProfit 
                           FROM sales s
                           JOIN products p ON s.product_id = p.product_id
                           WHERE s.buyer = ?");
$stmtAll->execute([$buyer]);
$allMetrics = $stmtAll->fetch();
$allTotalSpent = $allMetrics['allTotalSpent'] ? floatval($allMetrics['allTotalSpent']) : 0;
$allOverallProfit = $allMetrics['allOverallProfit'] ? floatval($allMetrics['allOverallProfit']) : 0;

// Prepare vertical chart data as two arrays:
// First array for "This Sale", second for "All Purchases"
$verticalChartLabels = ["Total Spent", "Overall Profit"];
$verticalChartData = [ [ $totalSpent, $overallProfit ], [ $allTotalSpent, $allOverallProfit ] ];

// Retrieve aggregate data for donut chart.
$stmtAggregate = $pdo->prepare("SELECT p.name as product_name, p.category, SUM(s.quantity) as total_quantity 
                                FROM sales s 
                                JOIN products p ON s.product_id = p.product_id 
                                WHERE s.buyer = ? 
                                GROUP BY p.product_id");
$stmtAggregate->execute([$buyer]);
$aggregateData = $stmtAggregate->fetchAll();

$donutLabels = [];
$donutData = [];
$donutColors = [];
$totalItems = count($aggregateData);
foreach ($aggregateData as $i => $row) {
    $donutLabels[] = $row['product_name'];
    $donutData[] = $row['total_quantity'];
    $hue = round(360 * $i / ($totalItems > 0 ? $totalItems : 1));
    $donutColors[] = "hsl($hue, 70%, 50%)";
}

// Determine top purchased item per category for center text.
$topByCategory = [];
foreach ($aggregateData as $row) {
    $cat = $row['category'];
    if (!isset($topByCategory[$cat]) || $row['total_quantity'] > $topByCategory[$cat]['total_quantity']) {
        $topByCategory[$cat] = $row;
    }
}
$centerText = "Most purchased items:\n";
foreach ($topByCategory as $cat => $item) {
    $centerText .= $item['product_name'] . " (" . $cat . ")\n";
}
$centerText = trim($centerText);

$metrics = [
    'buyer' => $buyer,
    'sale_date' => $details[0]['sale_date'],
    'seller_name' => $details[0]['seller_name'],
    'payment_method' => $details[0]['payment_method'],
    'verticalChartLabels' => $verticalChartLabels,
    'verticalChartData' => $verticalChartData,
    'donutLabels' => $donutLabels,
    'donutData' => $donutData,
    'donutColors' => $donutColors,
    'centerText' => $centerText
];

sendResponse(true, $metrics, "Sale metrics retrieved successfully.");

// Flush output buffer.
ob_end_flush();
?>
