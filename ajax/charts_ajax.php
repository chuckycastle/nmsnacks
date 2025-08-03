<?php
// ajax/charts_ajax.php

// Start output buffering to prevent stray output.
ob_start();

require '../inc/config.php';
require '../inc/auth.php';
require '../inc/functions.php';

header('Content-Type: application/json');

// Retrieve date filter parameters.
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
$end_date   = isset($_GET['end_date']) ? $_GET['end_date'] : '';

// Build date filter if both dates are provided.
$date_filter = "";
$params = [];
if ($start_date && $end_date) {
    $date_filter = " WHERE s.sale_date BETWEEN ? AND ? ";
    $params[] = $start_date;
    $params[] = $end_date;
}

// ------------------------------
// Query 1: Best Selling Products (Top 10 by quantity sold)
$sql_best_selling = "SELECT 
    p.name AS product_name, 
    SUM(s.quantity) AS total_quantity,
    SUM(s.unit_sale_price * s.quantity) AS total_revenue
FROM sales s 
JOIN products p ON s.product_id = p.product_id
" . $date_filter . "
GROUP BY p.name
ORDER BY total_quantity DESC
LIMIT 10";
$stmt = $pdo->prepare($sql_best_selling);
$stmt->execute($params);
$bestSelling = $stmt->fetchAll();

$bestSellingProducts = array_column($bestSelling, 'product_name');
$bestSellingQuantities = array_column($bestSelling, 'total_quantity');
$bestSellingRevenues = array_column($bestSelling, 'total_revenue');

// ------------------------------
// Query 2: Profit Margin by Category
$sql_profit_margin = "SELECT 
    p.category AS category, 
    AVG(s.unit_sale_price) AS avg_sale_price,
    AVG(p.cost) AS avg_cost,
    ((AVG(s.unit_sale_price) - AVG(p.cost)) / AVG(s.unit_sale_price)) * 100 AS profit_margin
FROM sales s 
JOIN products p ON s.product_id = p.product_id
" . $date_filter . "
GROUP BY p.category
ORDER BY profit_margin DESC";
$stmt = $pdo->prepare($sql_profit_margin);
$stmt->execute($params);
$profitMargins = $stmt->fetchAll();

$profitMarginCategories = [];
$profitMarginValues = [];
foreach ($profitMargins as $row) {
    $profitMarginCategories[] = $row['category'];
    $profitMarginValues[] = round($row['profit_margin'], 2);
}

// ------------------------------
// Query 4: Daily Revenue Trend
$sql_daily_revenue = "SELECT 
    DATE(s.sale_date) AS sale_day, 
    SUM(s.unit_sale_price * s.quantity) AS daily_revenue,
    COUNT(*) AS total_sales
FROM sales s
" . $date_filter . "
GROUP BY DATE(s.sale_date)
ORDER BY sale_day ASC";
$stmt = $pdo->prepare($sql_daily_revenue);
$stmt->execute($params);
$dailyRevenue = $stmt->fetchAll();

$dailyDates = [];
$dailyRevenues = [];
$dailySales = [];
foreach ($dailyRevenue as $row) {
    $dailyDates[] = $row['sale_day'];
    $dailyRevenues[] = $row['daily_revenue'];
    $dailySales[] = $row['total_sales'];
}

// ------------------------------
// Query 5: Product Sales Data for Selected Date Range
$sql_product_sales_by_date = "SELECT 
    p.name AS product_name,
    SUM(s.quantity) AS quantity_sold,
    SUM(s.unit_sale_price * s.quantity) AS total_revenue
FROM sales s 
JOIN products p ON s.product_id = p.product_id
" . $date_filter . " -- Apply the date filter here
GROUP BY p.product_id, p.name
HAVING SUM(s.quantity) > 0 -- Only include products sold within the date range
ORDER BY total_revenue DESC";
$stmt_product_sales = $pdo->prepare($sql_product_sales_by_date);
$stmt_product_sales->execute($params); // Use the date parameters
$productSalesByDate = $stmt_product_sales->fetchAll(PDO::FETCH_ASSOC);

// ------------------------------
// Package all chart data into a response array.
$response = [
    'bestSellingProducts' => $bestSellingProducts,
    'bestSellingQuantities' => $bestSellingQuantities,
    'bestSellingRevenues' => $bestSellingRevenues,
    'profitMarginCategories' => $profitMarginCategories,
    'profitMarginValues' => $profitMarginValues,
    'dailyDates' => $dailyDates,
    'dailyRevenues' => $dailyRevenues,
    'dailySales' => $dailySales,
    'productSalesByDate' => $productSalesByDate // Renamed from lifetimeProductSales
];

sendResponse(true, $response, "Charts data retrieved successfully.");

// Flush output buffer.
ob_end_flush();
?>
