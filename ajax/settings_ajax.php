<?php
// ajax/settings_ajax.php
require '../inc/config.php';
require '../inc/auth.php'; 
require '../inc/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['setting_key']) || !isset($data['setting_value'])) {
        sendResponse(false, [], "Missing required fields: setting_key and setting_value.");
        exit;
    }

    $key = trim($data['setting_key']);
    $value = trim($data['setting_value']);

    // --- Authorization Check ---
    // Ensure only admins can change settings like budget
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        sendResponse(false, [], "Authorization failed: Admin privileges required.");
        exit;
    }
    // --- End Authorization Check ---

    // --- Validation (Example for budget) ---
    if ($key === 'restock_budget') {
        if (!is_numeric($value) || floatval($value) < 0) {
            sendResponse(false, [], "Invalid budget value. Must be a non-negative number.");
            exit;
        }
        // Format to 2 decimal places before saving
        $value = number_format(floatval($value), 2, '.', ''); 
    }
    // --- End Validation ---

    try {
        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle creation or update
        $stmt = $pdo->prepare("
            INSERT INTO settings (setting_key, setting_value)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ");
        
        if ($stmt->execute([$key, $value])) {
            sendResponse(true, ['setting_key' => $key, 'setting_value' => $value], "Setting updated successfully.");
        } else {
            sendResponse(false, [], "Error updating setting in database.");
        }
    } catch (PDOException $e) {
        sendResponse(false, [], "Database error: " . $e->getMessage());
    }

} else {
    // Handle other methods or invalid requests
    sendResponse(false, [], "Invalid request method.");
}

?> 