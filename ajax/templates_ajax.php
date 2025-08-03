<?php
// ajax/templates_ajax.php
ob_start();
require '../inc/config.php';
require '../inc/auth.php';
require '../inc/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST': // Create new template
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $description = isset($_POST['description']) ? trim($_POST['description']) : '';
        $default_cost_per_box = isset($_POST['default_cost_per_box']) ? trim($_POST['default_cost_per_box']) : '';
        $category = isset($_POST['category']) ? trim($_POST['category']) : '';
        $new_category = isset($_POST['new_category']) ? trim($_POST['new_category']) : '';
        $image = isset($_POST['image']) ? trim($_POST['image']) : '';
        $box_contents = isset($_POST['box_contents']) ? trim($_POST['box_contents']) : '[]';
        
        if ($category === 'Other' && !empty($new_category)) {
            $category = $new_category;
        }
        
        if(empty($name) || $default_cost_per_box === '' || empty($category)) {
            sendResponse(false, [], "Missing required fields.");
        }
        
        $stmt = $pdo->prepare("INSERT INTO box_templates (name, description, box_contents, default_cost_per_box, image, category) VALUES (?, ?, ?, ?, ?, ?)");
        $success = $stmt->execute([$name, $description, $box_contents, $default_cost_per_box, $image, $category]);
        if($success) {
            sendResponse(true, ['template_id' => $pdo->lastInsertId()], "Template created successfully.");
        } else {
            sendResponse(false, [], "Error creating template.");
        }
        break;
        
    case 'PUT': // Update template
        $data = json_decode(file_get_contents("php://input"), true);
        if(!$data || !isset($data['template_id'])) {
            sendResponse(false, [], "Template ID is required.");
        }
        $template_id = $data['template_id'];
        $name = isset($data['name']) ? trim($data['name']) : '';
        $description = isset($data['description']) ? trim($data['description']) : '';
        $default_cost_per_box = isset($data['default_cost_per_box']) ? trim($data['default_cost_per_box']) : '';
        $category = isset($data['category']) ? trim($data['category']) : '';
        $new_category = isset($data['new_category']) ? trim($data['new_category']) : '';
        $image = isset($data['image']) ? trim($data['image']) : '';
        $box_contents = isset($data['box_contents']) ? trim($data['box_contents']) : '[]';
        
        if ($category === 'Other' && !empty($new_category)) {
            $category = $new_category;
        }
        
        if(empty($name) || $default_cost_per_box === '' || empty($category)) {
            sendResponse(false, [], "Missing required fields.");
        }
        
        $stmt = $pdo->prepare("UPDATE box_templates SET name = ?, description = ?, box_contents = ?, default_cost_per_box = ?, image = ?, category = ? WHERE template_id = ?");
        $success = $stmt->execute([$name, $description, $box_contents, $default_cost_per_box, $image, $category, $template_id]);
        if($success) {
            sendResponse(true, [], "Template updated successfully.");
        } else {
            sendResponse(false, [], "Error updating template.");
        }
        break;
        
    case 'DELETE': // Delete template
        if (!isset($_GET['template_id'])) {
            sendResponse(false, [], "Template ID is required.");
        }
        $template_id = $_GET['template_id'];
        $stmt = $pdo->prepare("DELETE FROM box_templates WHERE template_id = ?");
        $success = $stmt->execute([$template_id]);
        if($success) {
            sendResponse(true, [], "Template deleted successfully.");
        } else {
            sendResponse(false, [], "Error deleting template.");
        }
        break;
        
    default:
        sendResponse(false, [], "Method not allowed.");
        break;
}

ob_end_flush();
?>
