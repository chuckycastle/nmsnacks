<?php
// ajax/bundles_ajax.php
ob_start();
require '../inc/config.php';
require '../inc/auth.php';
require '../inc/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST': // Create new bundle
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $bundle_price = isset($_POST['bundle_price']) ? trim($_POST['bundle_price']) : '';
        $items = isset($_POST['items']) ? trim($_POST['items']) : '[]';  // Expected to be JSON
        
        if(empty($name) || $bundle_price === '' || empty($items)) {
            sendResponse(false, [], "Missing required fields.");
        }
        
        $stmt = $pdo->prepare("INSERT INTO bundles (name, bundle_price, items) VALUES (?, ?, ?)");
        $success = $stmt->execute([$name, $bundle_price, $items]);
        if($success) {
            sendResponse(true, ['bundle_id' => $pdo->lastInsertId()], "Bundle created successfully.");
        } else {
            sendResponse(false, [], "Error creating bundle.");
        }
        break;
    case 'PUT': // Update existing bundle
        $data = json_decode(file_get_contents('php://input'), true);
        if(empty($data['bundle_id']) || empty($data['name']) || $data['bundle_price'] === '' || empty($data['items'])) {
            sendResponse(false, [], "Missing required fields.");
        }
        $stmt = $pdo->prepare("UPDATE bundles SET name = ?, bundle_price = ?, items = ? WHERE bundle_id = ?");
        $success = $stmt->execute([$data['name'], $data['bundle_price'], $data['items'], $data['bundle_id']]);
        if($success) {
            sendResponse(true, [], "Bundle updated successfully.");
        } else {
            sendResponse(false, [], "Error updating bundle.");
        }
        break;
    case 'DELETE': // Delete existing bundle
        if (!isset($_GET['bundle_id'])) {
            sendResponse(false, [], "Missing bundle ID.");
        }
        $bundle_id = $_GET['bundle_id'];
        $stmt = $pdo->prepare("DELETE FROM bundles WHERE bundle_id = ?");
        $success = $stmt->execute([$bundle_id]);
        if ($success) {
            sendResponse(true, [], "Bundle deleted successfully.");
        } else {
            sendResponse(false, [], "Error deleting bundle.");
        }
        break;       
    default:
        sendResponse(false, [], "Method not allowed.");
        break;
}

ob_end_flush();
?>
