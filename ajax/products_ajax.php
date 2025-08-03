<?php
// ajax/products_ajax.php
ob_start();
require '../inc/config.php';
require '../inc/auth.php';
require '../inc/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST': // Create new product
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $sale_price = isset($_POST['sale_price']) ? trim($_POST['sale_price']) : '';
        $cost = isset($_POST['cost']) ? trim($_POST['cost']) : '';
        $stock = isset($_POST['stock']) ? trim($_POST['stock']) : '';
        $category = isset($_POST['category']) ? trim($_POST['category']) : '';
        if ($category === 'Other') {
            $category = isset($_POST['new_category']) ? trim($_POST['new_category']) : '';
        }
        $image_url = isset($_POST['image_url']) ? trim($_POST['image_url']) : '';

        // Validate required fields
        if (empty($name) || $sale_price === '' || $cost === '' || $stock === '' || empty($category)) {
            sendResponse(false, [], "Missing required fields.");
        }

        // Handle image upload: move the file to /img and rename it.
        $uploadedImage = null;
        if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] == UPLOAD_ERR_OK) {
            // Get original filename and temporary path.
            $originalName = $_FILES['image_file']['name'];
            $tempPath = $_FILES['image_file']['tmp_name'];
            $extension = pathinfo($originalName, PATHINFO_EXTENSION);

            // Sanitize category and product name: convert to lowercase, replace spaces with hyphens.
            $sanitizedCategory = strtolower(preg_replace('/\s+/', '-', $category));
            $sanitizedName = strtolower(preg_replace('/\s+/', '-', $name));

            // Build new file name.
            $newFileName = $sanitizedCategory . '-' . $sanitizedName . '.' . $extension;

            // Define target directory (assuming /img is at the root and writable).
            $targetDir = realpath(__DIR__ . '/../img') . DIRECTORY_SEPARATOR;
            $targetPath = $targetDir . $newFileName;

            // Move the uploaded file.
            if (move_uploaded_file($tempPath, $targetPath)) {
                // Set the image URL relative to the web root.
                $uploadedImage = '/img/' . $newFileName;
            } else {
                sendResponse(false, [], "Failed to upload image.");
            }
        }

        // If an image was uploaded successfully, override any provided image URL.
        if ($uploadedImage) {
            $image_url = $uploadedImage;
        }

        // Insert the product into the database.
        $stmt = $pdo->prepare("INSERT INTO products (name, sale_price, cost, stock, image_link, category) VALUES (?, ?, ?, ?, ?, ?)");
        $success = $stmt->execute([$name, $sale_price, $cost, $stock, $image_url, $category]);
        if ($success) {
            sendResponse(true, ['product_id' => $pdo->lastInsertId()], "Product added successfully.");
        } else {
            sendResponse(false, [], "Error adding product.");
        }
        break;

    case 'PUT': // Update product (excluding file upload for simplicity)
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['product_id'])) {
            sendResponse(false, [], "Product ID is required.");
        }
        $product_id = $data['product_id'];
        $name = isset($data['name']) ? trim($data['name']) : '';
        $sale_price = isset($data['sale_price']) ? trim($data['sale_price']) : '';
        $cost = isset($data['cost']) ? trim($data['cost']) : '';
        $stock = isset($data['stock']) ? trim($data['stock']) : '';
        $category = isset($data['category']) ? trim($data['category']) : '';
        if ($category === 'Other') {
            $category = isset($data['new_category']) ? trim($data['new_category']) : '';
        }
        $image_url = isset($data['image_url']) ? trim($data['image_url']) : '';
        
        $stmt = $pdo->prepare("UPDATE products SET name = ?, sale_price = ?, cost = ?, stock = ?, image_link = ?, category = ? WHERE product_id = ?");
        $success = $stmt->execute([$name, $sale_price, $cost, $stock, $image_url, $category, $product_id]);
        if ($success) {
            sendResponse(true, [], "Product updated successfully.");
        } else {
            sendResponse(false, [], "Error updating product.");
        }
        break;

    case 'DELETE': // Delete product
        if (!isset($_GET['product_id'])) {
            sendResponse(false, [], "Product ID is required.");
        }
        $product_id = $_GET['product_id'];
        $stmt = $pdo->prepare("DELETE FROM products WHERE product_id = ?");
        $success = $stmt->execute([$product_id]);
        if ($success) {
            sendResponse(true, [], "Product deleted successfully.");
        } else {
            sendResponse(false, [], "Error deleting product.");
        }
        break;

    default:
        sendResponse(false, [], "Method not allowed.");
        break;
}

ob_end_flush();
?>
