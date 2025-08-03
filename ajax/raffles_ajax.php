<?php
// ajax/raffles_ajax.php - AJAX handler for raffle operations

// Include necessary files
require_once '../inc/auth.php';
require_once '../inc/config.php';
require_once '../inc/functions.php';

// Set content type to JSON
header('Content-Type: application/json');

// Check if action is set in GET or POST
if (isset($_GET['action'])) {
    $action = $_GET['action'];
} elseif (isset($_POST['action'])) {
    $action = $_POST['action'];
} else {
    sendResponse(false, [], 'No action specified');
}

// Handle different actions
switch ($action) {
    case 'add_raffle':
        addRaffle();
        break;
    case 'edit_raffle':
        editRaffle();
        break;
    case 'delete_raffle':
        deleteRaffle();
        break;
    case 'sell_ticket':
        sellTicket();
        break;
    case 'get_raffle_details':
        getRaffleDetails();
        break;
    case 'get_raffle_items':
        getRaffleItems();
        break;
    case 'get_products':
        getProducts();
        break;
    case 'get_categories':
        getCategories();
        break;
    case 'get_product_category':
        getProductCategory();
        break;
    default:
        sendResponse(false, [], 'Invalid action');
        break;
}

/**
 * Add a new raffle
 */
function addRaffle() {
    global $pdo;
    
    // Check if required fields are set
    if (!isset($_POST['name']) || !isset($_POST['start_date']) || !isset($_POST['end_date']) || !isset($_POST['ticket_price'])) {
        sendResponse(false, [], 'Missing required fields');
    }
    
    // Get form data
    $name = trim($_POST['name']);
    $description = isset($_POST['description']) ? trim($_POST['description']) : '';
    $startDate = $_POST['start_date'];
    $endDate = $_POST['end_date'];
    $ticketPrice = floatval($_POST['ticket_price']);
    $createdBy = $_SESSION['username'];
    
    // Validate data
    if (empty($name)) {
        sendResponse(false, [], 'Raffle name is required');
    }
    
    if (strtotime($endDate) < strtotime($startDate)) {
        sendResponse(false, [], 'End date cannot be before start date');
    }
    
    if ($ticketPrice <= 0) {
        sendResponse(false, [], 'Ticket price must be greater than zero');
    }
    
    // Check if categories and quantities are set
    if (!isset($_POST['categories']) || !isset($_POST['quantities']) || !is_array($_POST['categories']) || !is_array($_POST['quantities'])) {
        sendResponse(false, [], 'No raffle items specified');
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Insert raffle
        $stmt = $pdo->prepare("
            INSERT INTO raffles (name, description, start_date, end_date, ticket_price, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$name, $description, $startDate, $endDate, $ticketPrice, $createdBy]);
        
        // Get the raffle ID
        $raffleId = $pdo->lastInsertId();
        
        // Insert raffle items
        $categories = $_POST['categories'];
        $quantities = $_POST['quantities'];
        
        for ($i = 0; $i < count($categories); $i++) {
            $category = $categories[$i];
            $quantity = intval($quantities[$i]);
            
            if (empty($category) || $quantity <= 0) {
                continue;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO raffle_items (raffle_id, category, quantity)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$raffleId, $category, $quantity]);
        }
        
        // Commit transaction
        $pdo->commit();
        
        sendResponse(true, ['raffle_id' => $raffleId], 'Raffle created successfully');
    } catch (PDOException $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        sendResponse(false, [], 'Error creating raffle: ' . $e->getMessage());
    }
}

/**
 * Edit an existing raffle
 */
function editRaffle() {
    global $pdo;
    
    // Check if required fields are set
    if (!isset($_POST['raffle_id']) || !isset($_POST['name']) || !isset($_POST['start_date']) || !isset($_POST['end_date']) || !isset($_POST['ticket_price'])) {
        sendResponse(false, [], 'Missing required fields');
    }
    
    // Get form data
    $raffleId = intval($_POST['raffle_id']);
    $name = trim($_POST['name']);
    $description = isset($_POST['description']) ? trim($_POST['description']) : '';
    $startDate = $_POST['start_date'];
    $endDate = $_POST['end_date'];
    $ticketPrice = floatval($_POST['ticket_price']);
    $status = $_POST['status'];
    
    // Validate data
    if (empty($name)) {
        sendResponse(false, [], 'Raffle name is required');
    }
    
    if (strtotime($endDate) < strtotime($startDate)) {
        sendResponse(false, [], 'End date cannot be before start date');
    }
    
    if ($ticketPrice <= 0) {
        sendResponse(false, [], 'Ticket price must be greater than zero');
    }
    
    // Check if categories and quantities are set
    if (!isset($_POST['categories']) || !isset($_POST['quantities']) || !isset($_POST['item_ids']) || 
        !is_array($_POST['categories']) || !is_array($_POST['quantities']) || !is_array($_POST['item_ids'])) {
        sendResponse(false, [], 'No raffle items specified');
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Update raffle
        $stmt = $pdo->prepare("
            UPDATE raffles
            SET name = ?, description = ?, start_date = ?, end_date = ?, ticket_price = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE raffle_id = ?
        ");
        $stmt->execute([$name, $description, $startDate, $endDate, $ticketPrice, $status, $raffleId]);
        
        // Update raffle items
        $itemIds = $_POST['item_ids'];
        $categories = $_POST['categories'];
        $quantities = $_POST['quantities'];
        
        for ($i = 0; $i < count($itemIds); $i++) {
            $itemId = $itemIds[$i];
            $category = $categories[$i];
            $quantity = intval($quantities[$i]);
            
            if (empty($category) || $quantity <= 0) {
                continue;
            }
            
            if ($itemId === 'new') {
                // Insert new item
                $stmt = $pdo->prepare("
                    INSERT INTO raffle_items (raffle_id, category, quantity)
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$raffleId, $category, $quantity]);
            } else {
                // Update existing item
                $stmt = $pdo->prepare("
                    UPDATE raffle_items
                    SET category = ?, quantity = ?
                    WHERE raffle_item_id = ? AND raffle_id = ?
                ");
                $stmt->execute([$category, $quantity, $itemId, $raffleId]);
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        sendResponse(true, ['raffle_id' => $raffleId], 'Raffle updated successfully');
    } catch (PDOException $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        sendResponse(false, [], 'Error updating raffle: ' . $e->getMessage());
    }
}

/**
 * Delete a raffle
 */
function deleteRaffle() {
    global $pdo;
    
    // Check if raffle ID is set
    if (!isset($_POST['raffle_id'])) {
        sendResponse(false, [], 'Raffle ID is required');
    }
    
    $raffleId = intval($_POST['raffle_id']);
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Delete raffle items
        $stmt = $pdo->prepare("DELETE FROM raffle_items WHERE raffle_id = ?");
        $stmt->execute([$raffleId]);
        
        // Delete raffle tickets
        $stmt = $pdo->prepare("DELETE FROM raffle_tickets WHERE raffle_id = ?");
        $stmt->execute([$raffleId]);
        
        // Delete raffle
        $stmt = $pdo->prepare("DELETE FROM raffles WHERE raffle_id = ?");
        $stmt->execute([$raffleId]);
        
        // Commit transaction
        $pdo->commit();
        
        sendResponse(true, [], 'Raffle deleted successfully');
    } catch (PDOException $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        sendResponse(false, [], 'Error deleting raffle: ' . $e->getMessage());
    }
}

/**
 * Sell a raffle ticket
 */
function sellTicket() {
    global $pdo;
    
    // Check if required fields are set
    if (!isset($_POST['raffle_id']) || !isset($_POST['buyer_name']) || !isset($_POST['quantity']) || !isset($_POST['payment_method'])) {
        sendResponse(false, [], 'Missing required fields');
    }
    
    // Get form data
    $raffleId = intval($_POST['raffle_id']);
    $buyerName = trim($_POST['buyer_name']);
    $contactInfo = isset($_POST['contact_info']) ? trim($_POST['contact_info']) : '';
    $quantity = intval($_POST['quantity']);
    $paymentMethod = $_POST['payment_method'];
    $notes = isset($_POST['notes']) ? trim($_POST['notes']) : '';
    $seller = $_SESSION['username'];
    
    // Determine payment status
    $paymentStatus = isset($_POST['not_paid']) && $_POST['not_paid'] === 'on' ? 'Not Paid' : 'Paid';
    
    // Validate data
    if (empty($buyerName)) {
        sendResponse(false, [], 'Buyer name is required');
    }
    
    if ($quantity <= 0) {
        sendResponse(false, [], 'Quantity must be greater than zero');
    }
    
    // Get raffle details
    $stmt = $pdo->prepare("SELECT ticket_price, status FROM raffles WHERE raffle_id = ?");
    $stmt->execute([$raffleId]);
    $raffle = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$raffle) {
        sendResponse(false, [], 'Raffle not found');
    }
    
    if ($raffle['status'] !== 'active') {
        sendResponse(false, [], 'Cannot sell tickets for a non-active raffle');
    }
    
    $ticketPrice = $raffle['ticket_price'];
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Insert tickets
        for ($i = 0; $i < $quantity; $i++) {
            // Generate ticket number
            $ticketNumber = generateTicketNumber($raffleId);
            
            $stmt = $pdo->prepare("
                INSERT INTO raffle_tickets (raffle_id, buyer_name, contact_info, ticket_number, price, payment_method, payment_status, seller, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$raffleId, $buyerName, $contactInfo, $ticketNumber, $ticketPrice, $paymentMethod, $paymentStatus, $seller, $notes]);
        }
        
        // Commit transaction
        $pdo->commit();
        
        sendResponse(true, ['quantity' => $quantity], 'Tickets sold successfully');
    } catch (PDOException $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        sendResponse(false, [], 'Error selling tickets: ' . $e->getMessage());
    }
}

/**
 * Generate a unique ticket number
 */
function generateTicketNumber($raffleId) {
    global $pdo;
    
    // Get the current highest ticket number for this raffle
    $stmt = $pdo->prepare("
        SELECT MAX(CAST(SUBSTRING(ticket_number, LOCATE('-', ticket_number) + 1) AS UNSIGNED)) as max_number
        FROM raffle_tickets
        WHERE raffle_id = ? AND ticket_number LIKE 'R" . $raffleId . "-%'
    ");
    $stmt->execute([$raffleId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $nextNumber = 1;
    if ($result && $result['max_number']) {
        $nextNumber = intval($result['max_number']) + 1;
    }
    
    return 'R' . $raffleId . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
}

/**
 * Get raffle details
 */
function getRaffleDetails() {
    global $pdo;
    
    // Check if raffle ID is set
    if (!isset($_GET['raffle_id'])) {
        sendResponse(false, [], 'Raffle ID is required');
    }
    
    $raffleId = intval($_GET['raffle_id']);
    
    try {
        // Get raffle details
        $stmt = $pdo->prepare("
            SELECT r.*, u.name as creator_name
            FROM raffles r
            LEFT JOIN users u ON r.created_by = u.username
            WHERE r.raffle_id = ?
        ");
        $stmt->execute([$raffleId]);
        $raffle = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$raffle) {
            sendResponse(false, [], 'Raffle not found');
        }
        
        // Get raffle items
        $stmt = $pdo->prepare("
            SELECT ri.*
            FROM raffle_items ri
            WHERE ri.raffle_id = ?
        ");
        $stmt->execute([$raffleId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate total cost based on average category costs
        $totalCost = 0;
        foreach ($items as &$item) {
            // Get average cost for this category
            $stmt = $pdo->prepare("
                SELECT AVG(cost) as avg_cost
                FROM products
                WHERE category = ?
            ");
            $stmt->execute([$item['category']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $avgCost = $result['avg_cost'] ? floatval($result['avg_cost']) : 0;
            $item['cost'] = $avgCost;
            $item['total_cost'] = $item['quantity'] * $avgCost;
            $totalCost += $item['total_cost'];
        }
        
        // Get raffle tickets
        $stmt = $pdo->prepare("
            SELECT rt.*, u.name as seller_name
            FROM raffle_tickets rt
            LEFT JOIN users u ON rt.seller = u.username
            WHERE rt.raffle_id = ?
            ORDER BY rt.purchase_date DESC
        ");
        $stmt->execute([$raffleId]);
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate total revenue
        $totalRevenue = 0;
        $ticketsSold = count($tickets);
        foreach ($tickets as $ticket) {
            if ($ticket['payment_status'] === 'Paid') {
                $totalRevenue += $ticket['price'];
            }
        }
        
        $data = [
            'raffle' => $raffle,
            'items' => $items,
            'tickets' => $tickets,
            'tickets_sold' => $ticketsSold,
            'total_cost' => $totalCost,
            'total_revenue' => $totalRevenue
        ];
        
        sendResponse(true, $data, 'Raffle details retrieved successfully');
    } catch (PDOException $e) {
        sendResponse(false, [], 'Error retrieving raffle details: ' . $e->getMessage());
    }
}

/**
 * Get raffle items
 */
function getRaffleItems() {
    global $pdo;
    
    // Check if raffle ID is set
    if (!isset($_GET['raffle_id'])) {
        sendResponse(false, [], 'Raffle ID is required');
    }
    
    $raffleId = intval($_GET['raffle_id']);
    
    try {
        // Get raffle items
        $stmt = $pdo->prepare("
            SELECT ri.*
            FROM raffle_items ri
            WHERE ri.raffle_id = ?
        ");
        $stmt->execute([$raffleId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add category information
        foreach ($items as &$item) {
            // Get average cost for this category
            $stmt = $pdo->prepare("
                SELECT AVG(cost) as avg_cost, COUNT(*) as product_count
                FROM products
                WHERE category = ?
            ");
            $stmt->execute([$item['category']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $avgCost = $result['avg_cost'] ? floatval($result['avg_cost']) : 0;
            $productCount = intval($result['product_count']);
            
            $item['avg_cost'] = $avgCost;
            $item['total_cost'] = $item['quantity'] * $avgCost;
            $item['product_count'] = $productCount;
        }
        
        sendResponse(true, $items, 'Raffle items retrieved successfully');
    } catch (PDOException $e) {
        sendResponse(false, [], 'Error retrieving raffle items: ' . $e->getMessage());
    }
}

/**
 * Get products for dropdowns
 */
function getProducts() {
    global $pdo;
    
    try {
        // Get products
        $stmt = $pdo->query("SELECT product_id, name, cost FROM products ORDER BY name ASC");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, $products, 'Products retrieved successfully');
    } catch (PDOException $e) {
        sendResponse(false, [], 'Error retrieving products: ' . $e->getMessage());
    }
}

/**
 * Get categories for dropdowns
 */
function getCategories() {
    global $pdo;
    
    try {
        // Get distinct categories
        $stmt = $pdo->query("SELECT DISTINCT category FROM products ORDER BY category ASC");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, $categories, 'Categories retrieved successfully');
    } catch (PDOException $e) {
        sendResponse(false, [], 'Error retrieving categories: ' . $e->getMessage());
    }
}

/**
 * Get category for a specific product (for backward compatibility)
 */
function getProductCategory() {
    global $pdo;
    
    // Check if product ID is set
    if (!isset($_GET['product_id'])) {
        sendResponse(false, [], 'Product ID is required');
    }
    
    $productId = intval($_GET['product_id']);
    
    try {
        // Get product category
        $stmt = $pdo->prepare("SELECT category FROM products WHERE product_id = ?");
        $stmt->execute([$productId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            sendResponse(false, [], 'Product not found');
        }
        
        sendResponse(true, $product, 'Product category retrieved successfully');
    } catch (PDOException $e) {
        sendResponse(false, [], 'Error retrieving product category: ' . $e->getMessage());
    }
}
?>