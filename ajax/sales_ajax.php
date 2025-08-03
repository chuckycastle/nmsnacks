<?php
// ajax/sales_ajax.php
require '../inc/config.php';
require '../inc/auth.php';
require '../inc/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // If a sale_id is provided, return that sale's details; otherwise, list all sales.
        if (isset($_GET['sale_id'])) {
            $sale_id = $_GET['sale_id'];
            $stmt = $pdo->prepare("SELECT * FROM sales WHERE sale_id = ?");
            $stmt->execute([$sale_id]);
            $sale = $stmt->fetch();
            if ($sale) {
                sendResponse(true, $sale, "Sale retrieved successfully.");
            } else {
                sendResponse(false, [], "Sale not found.");
            }
        } else {
            $stmt = $pdo->query("SELECT * FROM sales ORDER BY sale_date DESC");
            $sales = $stmt->fetchAll();
            sendResponse(true, $sales, "Sales retrieved successfully.");
        }
        break;
    case 'POST':
        // Create a new sale.
        $data = json_decode(file_get_contents("php://input"), true);
        // Validate required fields.
        if (empty($data['product_id']) || empty($data['quantity']) || empty($data['unit_sale_price']) || empty($data['sale_date'])) {
            sendResponse(false, [], "Missing required product, quantity, price, or date fields.");
        }
        $buyer = trim($data['buyer'] ?? ''); // Allow empty buyer name
        $payment_status = $data['payment_status'] ?? 'Paid';
        $payment_received_by = $data['payment_received_by'] ?? null;
        $payment_method = $data['payment_method'] ?? null;
        $notes = $data['notes'] ?? '';
        $pos_batch = $data['pos_batch'] ?? null;
        $stmt = $pdo->prepare("INSERT INTO sales (buyer, product_id, quantity, unit_sale_price, payment_status, sale_date, payment_received_by, payment_method, notes, pos_batch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([
            $buyer, // Use the potentially empty buyer variable
            $data['product_id'],
            $data['quantity'],
            $data['unit_sale_price'],
            $payment_status,
            $data['sale_date'],
            $payment_received_by,
            $payment_method,
            $notes,
            $pos_batch
        ])) {
            $newSaleId = $pdo->lastInsertId();
            sendResponse(true, ['sale_id' => $newSaleId], "Sale created successfully.");
        } else {
            sendResponse(false, [], "Error creating sale.");
        }
        break;
    case 'PUT':
        // Update an existing sale.
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['sale_id'])) {
            sendResponse(false, [], "Sale ID is required.");
        }
        $stmt = $pdo->prepare("UPDATE sales SET buyer = ?, product_id = ?, quantity = ?, unit_sale_price = ?, payment_status = ?, sale_date = ?, payment_received_by = ?, payment_method = ?, notes = ?, pos_batch = ? WHERE sale_id = ?");
        $success = $stmt->execute([
            $data['buyer'] ?? '',
            $data['product_id'] ?? null,
            $data['quantity'] ?? 0,
            $data['unit_sale_price'] ?? 0,
            $data['payment_status'] ?? 'Paid',
            $data['sale_date'] ?? date('Y-m-d'),
            $data['payment_received_by'] ?? null,
            $data['payment_method'] ?? null,
            $data['notes'] ?? '',
            $data['pos_batch'] ?? null,
            $data['sale_id']
        ]);
        if ($success) {
            sendResponse(true, [], "Sale updated successfully.");
        } else {
            sendResponse(false, [], "Error updating sale.");
        }
        break;
    case 'DELETE':
        // Delete a sale by sale_id.
        if (isset($_GET['sale_id'])) {
            $sale_id = $_GET['sale_id'];
            $stmt = $pdo->prepare("DELETE FROM sales WHERE sale_id = ?");
            if ($stmt->execute([$sale_id])) {
                sendResponse(true, [], "Sale deleted successfully.");
            } else {
                sendResponse(false, [], "Error deleting sale.");
            }
        } else {
            sendResponse(false, [], "Sale ID is required.");
        }
        break;
    default:
        sendResponse(false, [], "Method not allowed.");
        break;
}
?>
