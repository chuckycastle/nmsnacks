<?php
// ajax/restock_ajax.php
ob_start();
require '../inc/config.php';
require '../inc/auth.php';
require '../inc/functions.php';

header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'load_template') {
    // Load a template for restock purposes.
    if (!isset($_GET['template_id'])) {
        sendResponse(false, [], "Template ID is required.");
    }
    $template_id = $_GET['template_id'];
    $stmt = $pdo->prepare("SELECT * FROM box_templates WHERE template_id = ?");
    $stmt->execute([$template_id]);
    $template = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($template) {
        $template['box_contents'] = json_decode($template['box_contents'], true);
        sendResponse(true, ['template' => $template], "Template loaded successfully.");
    } else {
        sendResponse(false, [], "Template not found.");
    }
} elseif ($action === 'submit') {
    // Submit restock (expects POST data)
    if ($method !== 'POST') {
        sendResponse(false, [], "Invalid request method for restock submission.");
    }
    $batch_id = uniqid(); // Generate unique batch ID for the transaction
    $total_cost = isset($_POST['total_cost']) ? floatval($_POST['total_cost']) : 0;
    $notes = isset($_POST['notes']) ? trim($_POST['notes']) : '';
    $cartJson = isset($_POST['cart']) ? $_POST['cart'] : '';
    $cart = json_decode($cartJson, true);
    $admin_user = $_SESSION['username'];
    $replenishment_date = date('Y-m-d H:i:s');
    
    if (!$cart || !is_array($cart) || count($cart) === 0) {
        sendResponse(false, [], "Restock cart is empty.");
    }
    
    try {
        $pdo->beginTransaction();

        // Process each item in the cart.
        foreach ($cart as $item) {
            if (isset($item['is_template']) && $item['is_template'] === true) {
                // This item is a template.
                if (!isset($item['box_contents']) || !is_array($item['box_contents'])) {
                    throw new Exception("Invalid template data.");
                }
                // Calculate the total quantity in the template for cost allocation.
                $sumQuantities = 0;
                foreach ($item['box_contents'] as $p) {
                    $sumQuantities += $p['quantity'];
                }
                // Assume the template's cost (item['cost']) is the cost per template unit.
                $templateCost = isset($item['cost']) ? floatval($item['cost']) : 0;
                $costPerUnit = ($sumQuantities > 0) ? ($templateCost / $sumQuantities) : 0;
                foreach ($item['box_contents'] as $p) {
                    // Quantity to add for each product in the template.
                    $quantityToAdd = $p['quantity'] * $item['quantity'];
                    // Update product stock.
                    $stmt = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE product_id = ?");
                    $stmt->execute([$quantityToAdd, $p['product_id']]);
                    // Calculate cost allocation for this product.
                    $costForProduct = $quantityToAdd * $costPerUnit;
                    // Insert replenishment record.
                    $stmt = $pdo->prepare("INSERT INTO replenishments (product_id, quantity, total_cost, admin_user, replenishment_date, notes, batch_id, template_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$p['product_id'], $quantityToAdd, $costForProduct, $admin_user, $replenishment_date, $notes, $batch_id, $item['template_id']]);
                }
            } else {
                // Regular product item.
                if (!isset($item['product_id'])) {
                    throw new Exception("Product ID missing in restock item.");
                }
                // Determine cost per unit.
                if (isset($item['cost']) && is_numeric($item['cost']) && floatval($item['cost']) > 0) {
                    $costPerUnit = floatval($item['cost']);
                } else {
                    // Retrieve default cost from products table if not provided.
                    $stmtCost = $pdo->prepare("SELECT cost FROM products WHERE product_id = ?");
                    $stmtCost->execute([$item['product_id']]);
                    $costPerUnit = floatval($stmtCost->fetchColumn());
                }
                // Calculate total cost for this product.
                $costForProduct = $costPerUnit * $item['quantity'];
                // Update product stock.
                $stmt = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE product_id = ?");
                $stmt->execute([$item['quantity'], $item['product_id']]);
                // Insert replenishment record with the calculated cost.
                $stmt = $pdo->prepare("INSERT INTO replenishments (product_id, quantity, total_cost, admin_user, replenishment_date, notes, batch_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$item['product_id'], $item['quantity'], $costForProduct, $admin_user, $replenishment_date, $notes, $batch_id]);
            }
        }

        $pdo->commit();
        sendResponse(true, ['batch_id' => $batch_id], "Inventory replenished successfully.");
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, [], "Failed to restock inventory: " . $e->getMessage());
    }
} else {
    sendResponse(false, [], "Invalid action parameter.");
}

ob_end_flush();
?>
