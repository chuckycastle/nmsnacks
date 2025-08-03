<?php
// ajax/users_ajax.php
require '../inc/config.php';
require '../inc/auth.php';
require '../inc/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // If a specific user_id is provided, return that user's details.
        if (isset($_GET['user_id'])) {
            $user_id = $_GET['user_id'];
            // Try to find in users table first.
            $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch();
            if (!$user) {
                // If not found, try customers table.
                $stmt = $pdo->prepare("SELECT customer_id AS user_id, name, credit_balance, created_at FROM customers WHERE customer_id = ?");
                $stmt->execute([$user_id]);
                $user = $stmt->fetch();
                if ($user) {
                    $user['role'] = 'customer';
                    $user['username'] = '';
                    $user['email'] = '';
                    $user['credit_balance'] = $user['credit_balance'] ?? 0.00;
                }
            }
            if ($user) {
                sendResponse(true, $user, "User retrieved successfully.");
            } else {
                sendResponse(false, [], "User not found.");
            }
        } else {
            // Optional role filter: role=admin, seller, customer, or all.
            $roleFilter = isset($_GET['role']) ? $_GET['role'] : 'all';
            if ($roleFilter == 'all') {
                // Union query for all users.
                $stmt = $pdo->query("
                  SELECT user_id AS id, name, username, email, role, 0.00 AS credit_balance, created_at FROM users
                  UNION ALL
                  SELECT customer_id AS id, name, '' AS username, '' AS email, 'customer' AS role, credit_balance, created_at FROM customers
                  ORDER BY created_at DESC
                ");
                $users = $stmt->fetchAll();
                sendResponse(true, $users, "All users retrieved successfully.");
            } elseif ($roleFilter == 'customer') {
                $stmt = $pdo->query("SELECT customer_id AS id, name, '' AS username, '' AS email, 'customer' AS role, credit_balance, created_at FROM customers ORDER BY created_at DESC");
                $users = $stmt->fetchAll();
                sendResponse(true, $users, "Customers retrieved successfully.");
            } else {
                $stmt = $pdo->prepare("SELECT *, 0.00 AS credit_balance FROM users WHERE role = ? ORDER BY created_at DESC");
                $stmt->execute([$roleFilter]);
                $users = $stmt->fetchAll();
                sendResponse(true, $users, ucfirst($roleFilter) . "s retrieved successfully.");
            }
        }
        break;

    case 'POST':
        // Create a new user.
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['name']) || empty($data['role'])) {
            sendResponse(false, [], "Missing required fields: name and role.");
        }
        if ($data['role'] == 'admin' || $data['role'] == 'seller') {
            if (empty($data['username']) || empty($data['password'])) {
                sendResponse(false, [], "Missing required fields for admin or seller: username and password.");
            }
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)");
            if ($stmt->execute([$data['name'], $data['username'], $data['email'] ?? '', $passwordHash, $data['role']])) {
                $newUserId = $pdo->lastInsertId();
                sendResponse(true, ['user_id' => $newUserId, 'name' => $data['name'], 'username' => $data['username'], 'email' => $data['email'] ?? '', 'role' => $data['role'], 'credit_balance' => 0.00], "User created successfully.");
            } else {
                sendResponse(false, [], "Error creating user.");
            }
        } else {
            // For customers, insert into the customers table. Credit balance defaults to 0.00 in DB.
            $stmt = $pdo->prepare("INSERT INTO customers (name) VALUES (?)");
            if ($stmt->execute([$data['name']])) {
                $newCustomerId = $pdo->lastInsertId();
                // Fetch the newly created customer to get the default credit_balance
                $stmt = $pdo->prepare("SELECT credit_balance FROM customers WHERE customer_id = ?");
                $stmt->execute([$newCustomerId]);
                $newCustomerData = $stmt->fetch();
                sendResponse(true, ['user_id' => $newCustomerId, 'name' => $data['name'], 'username' => '', 'email' => '', 'role' => 'customer', 'credit_balance' => $newCustomerData['credit_balance']], "Customer created successfully.");
            } else {
                sendResponse(false, [], "Error creating customer.");
            }
        }
        break;

    case 'PUT':
        // Update an existing user.
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['user_id'])) {
            sendResponse(false, [], "User ID is required.");
        }
        // Check if the user exists and what their role is.
        $stmt_check = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
        $stmt_check->execute([$data['user_id']]);
        $user_role_data = $stmt_check->fetch();
        
        $is_customer = false;
        if (!$user_role_data) {
            $stmt_check_cust = $pdo->prepare("SELECT customer_id FROM customers WHERE customer_id = ?");
            $stmt_check_cust->execute([$data['user_id']]);
            if ($stmt_check_cust->fetch()) {
                $is_customer = true;
            }
        }

        if ($is_customer || (isset($data['role']) && $data['role'] == 'customer')) {
            // For customers, update name and credit_balance in the customers table.
             if (!isset($data['name']) || !isset($data['credit_balance'])) {
                 sendResponse(false, [], "Missing required fields for customer update: name and credit_balance.");
             }
             $creditBalance = floatval($data['credit_balance']);
             if ($creditBalance < 0) {
                 sendResponse(false, [], "Credit balance cannot be negative.");
             }
            $stmt = $pdo->prepare("UPDATE customers SET name = ?, credit_balance = ? WHERE customer_id = ?");
            $success = $stmt->execute([$data['name'], $creditBalance, $data['user_id']]);
            if ($success) {
                sendResponse(true, [], "Customer updated successfully.");
            } else {
                sendResponse(false, [], "Error updating customer.");
            }
        } elseif ($user_role_data) { // It's an admin or seller
            // For admin or seller, update in users table. Ensure required fields are present.
            if (empty($data['name']) || empty($data['username']) || empty($data['role'])) {
                sendResponse(false, [], "Missing required fields for user update: name, username, role.");
            }
             // Ensure role is not customer if updating in users table
             if ($data['role'] == 'customer') {
                 sendResponse(false, [], "Cannot change an admin/seller role to customer via this endpoint.");
             }

            if (!empty($data['password'])) {
                $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET name = ?, username = ?, email = ?, password = ?, role = ? WHERE user_id = ?");
                $success = $stmt->execute([
                    $data['name'],
                    $data['username'],
                    $data['email'] ?? '',
                    $passwordHash,
                    $data['role'],
                    $data['user_id']
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET name = ?, username = ?, email = ?, role = ? WHERE user_id = ?");
                $success = $stmt->execute([
                    $data['name'],
                    $data['username'],
                    $data['email'] ?? '',
                    $data['role'],
                    $data['user_id']
                ]);
            }
            if ($success) {
                sendResponse(true, [], "User updated successfully.");
            } else {
                sendResponse(false, [], "Error updating user.");
            }
        } else {
             sendResponse(false, [], "User ID not found in users or customers table.");
        }
        break;

    case 'DELETE':
        // Delete a user by user_id.
        if (isset($_GET['user_id'])) {
            $user_id = $_GET['user_id'];
            
            // Check if the user is the currently logged-in user to prevent self-deletion.
            if (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $user_id) {
                 sendResponse(false, [], "You cannot delete your own account.");
                 exit;
            }

            // Delete from both tables (if exists). Use transactions for safety.
             $pdo->beginTransaction();
             try {
                 $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = ?");
                 $stmt->execute([$user_id]);
                 $stmt2 = $pdo->prepare("DELETE FROM customers WHERE customer_id = ?");
                 $stmt2->execute([$user_id]);
                 $pdo->commit();
                 sendResponse(true, [], "User deleted successfully.");
             } catch (PDOException $e) {
                 $pdo->rollBack();
                 sendResponse(false, [], "Error deleting user: " . $e->getMessage());
             }
        } else {
            sendResponse(false, [], "User ID is required.");
        }
        break;

    default:
        sendResponse(false, [], "Method not allowed.");
        break;
}

?>
