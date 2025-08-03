<?php
// ajax/transactions_ajax.php
require '../inc/config.php';
require '../inc/auth.php'; 
require '../inc/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// --- Authorization Check (Example: Allow only admin) ---
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendResponse(false, [], "Authorization failed: Admin privileges required.");
    exit;
}

switch ($method) {
    case 'POST':
        // Create a new transaction (e.g., Payout)
        createTransaction($pdo);
        break;
    
    // Add PUT and DELETE later if needed for editing/deleting transactions
    // case 'PUT':
    //     updateTransaction($pdo);
    //     break;
    // case 'DELETE':
    //     deleteTransaction($pdo);
    //     break;

    default:
        sendResponse(false, [], "Method not allowed.");
        break;
}

function createTransaction($pdo) {
    $data = json_decode(file_get_contents("php://input"), true);

    // Basic Validation
    if (!isset($data['type']) || !isset($data['amount']) || !isset($data['description'])) {
        sendResponse(false, [], "Missing required fields: type, amount, description.");
        return;
    }

    $type = trim($data['type']);
    $amount = floatval($data['amount']);
    $description = trim($data['description']);
    $product_ids = isset($data['product_ids']) ? trim($data['product_ids']) : null;
    $quantities = isset($data['quantities']) ? trim($data['quantities']) : null;
    $template_id = isset($data['template_id']) ? trim($data['template_id']) : null;
    $admin_user = $_SESSION['username']; // Get current logged-in user
    $batch_id = 'payout_' . uniqid(); // Create a unique batch ID for payouts

    if (!in_array($type, ['in', 'out'])) {
        sendResponse(false, [], "Invalid transaction type.");
        return;
    }
    if ($amount <= 0) {
        sendResponse(false, [], "Amount must be positive.");
        return;
    }
    if (empty($description)) {
        sendResponse(false, [], "Description cannot be empty.");
        return;
    }

    // Database Insert
    try {
        $stmt = $pdo->prepare("
            INSERT INTO transactions 
            (type, amount, description, product_id, quantity, template_id, admin_user, batch_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $success = $stmt->execute([
            $type,
            $amount,
            $description,
            null, // product_id is NULL for payouts
            null, // quantity is NULL for payouts
            $template_id,
            $admin_user,
            $batch_id
        ]);

        if ($success) {
            $newId = $pdo->lastInsertId();
            sendResponse(true, ['id' => $newId, 'batch_id' => $batch_id], "Transaction created successfully.");
        } else {
            sendResponse(false, [], "Failed to create transaction in database.");
        }
    } catch (PDOException $e) {
        sendResponse(false, [], "Database error: " . $e->getMessage());
    }
}

// --- Placeholder functions for potential future use ---
// function updateTransaction($pdo) {
//     // Logic to update transaction
//     sendResponse(false, [], "Update not yet implemented.");
// }

// function deleteTransaction($pdo) {
//     $id = isset($_GET['transaction_id']) ? intval($_GET['transaction_id']) : 0;
//     if ($id <= 0) {
//         sendResponse(false, [], "Invalid transaction ID.");
//         return;
//     }
//     // Logic to delete transaction
//      sendResponse(false, [], "Delete not yet implemented.");
// }

?> 