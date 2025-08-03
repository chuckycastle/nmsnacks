<?php
// pages/pos.php - Point of Sale (POS) experience
require 'inc/config.php';
// session_start() is assumed to be called in index.php
$activePage = 'pos';

// Process the POS sale submission if the form was submitted.
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Generate a unique batch ID for this POS transaction
    $pos_batch = uniqid();
    
    // Retrieve POST data
    $cartJson = $_POST['cart'];
    $buyer = trim($_POST['buyer']);
    $payment_method = $_POST['payment_method'];
    $cart = json_decode($cartJson, true);
    $seller = $_SESSION['username'];  // Logged-in user becomes the seller
    $sale_date = date('Y-m-d H:i:s');
    
    // Determine payment status based on the "Not Paid" checkbox.
    $payment_status = "Paid";
    if (isset($_POST['not_paid']) && $_POST['not_paid'] == 'on') {
        $payment_status = "Not Paid";
    }
    
    // Validate buyer input and get customer ID if applicable
    $customer_id = null;
    if (!empty($buyer)) {
        // Check if the buyer exists in the customers table; if not, create a new customer.
        $stmt = $pdo->prepare("SELECT customer_id, credit_balance FROM customers WHERE name = ?");
        $stmt->execute([$buyer]);
        $customer = $stmt->fetch();
        if ($customer) {
            $customer_id = $customer['customer_id'];
            $current_credit_balance = $customer['credit_balance'];
        } else {
            $stmt = $pdo->prepare("INSERT INTO customers (name) VALUES (?)");
            $stmt->execute([$buyer]);
            $customer_id = $pdo->lastInsertId();
            $current_credit_balance = 0.00; // New customer starts with 0 balance
        }
    } // If buyer is empty, customer_id remains null.
    
    // === STOCK VALIDATION ===
    $error = "";
    if ($cart && is_array($cart)) {
        foreach ($cart as $item) {
            $stmt = $pdo->prepare("SELECT stock FROM products WHERE product_id = ?");
            $stmt->execute([$item['product_id']]);
            $currentStock = (int)$stmt->fetchColumn();
            if ($currentStock < $item['quantity']) {
                $error .= "Not enough stock for " . htmlspecialchars($item['name']) . ". Available: $currentStock. ";
            }
        }
    }
    if ($error != "") {
        $_SESSION['error'] = $error;
        header("Location: index.php?page=pos");
        exit;
    }
    // === END STOCK VALIDATION ===
    
    // Calculate total sale amount
    $total_sale_amount = 0;
    if ($cart && is_array($cart)) {
        foreach ($cart as $item) {
            $total_sale_amount += $item['quantity'] * $item['sale_price'];
        }
    }

    // === CREDIT BALANCE VALIDATION (if applicable) ===
    if ($payment_method === 'Account Credit') {
        if ($customer_id === null) {
            $_SESSION['error'] = "Error: A customer must be selected to use Account Credit.";
            header("Location: index.php?page=pos");
            exit;
        }
        if ($total_sale_amount > $current_credit_balance) {
            $_SESSION['error'] = "Error: Insufficient account credit for this purchase. Available: $" . number_format($current_credit_balance, 2);
            header("Location: index.php?page=pos");
            exit;
        }
        // Ensure payment status is Paid when using credit
        $payment_status = "Paid"; 
    }
    // === END CREDIT BALANCE VALIDATION ===

    // Start transaction
    $pdo->beginTransaction();
    try {
        // Process each cart item
        if ($cart && is_array($cart)) {
            foreach ($cart as $item) {
                // Insert sale record
                $stmt = $pdo->prepare("INSERT INTO sales (buyer, product_id, quantity, unit_sale_price, payment_status, sale_date, payment_received_by, payment_method, notes, pos_batch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $notes = "POS sale"; 
                $stmt->execute([
                    $buyer, // Store buyer name regardless of whether it matched a customer
                    $item['product_id'],
                    $item['quantity'],
                    $item['sale_price'],
                    $payment_status,
                    $sale_date,
                    $seller,
                    $payment_method,
                    $notes,
                    $pos_batch
                ]);
                // Deduct sold quantity from product stock
                $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE product_id = ?");
                $stmt->execute([$item['quantity'], $item['product_id']]);
            }
        }

        // Deduct from credit balance if using Account Credit
        if ($payment_method === 'Account Credit' && $customer_id !== null) {
            // Explicitly cast to float for calculation
            $current_credit_float = floatval($current_credit_balance);
            $total_sale_float = floatval($total_sale_amount);
            $new_balance = $current_credit_float - $total_sale_float;

            $stmt_update_credit = $pdo->prepare("UPDATE customers SET credit_balance = ? WHERE customer_id = ?");
            $update_success = $stmt_update_credit->execute([$new_balance, $customer_id]);

            if (!$update_success) {
                // Throw an exception if the update failed to ensure transaction rollback
                throw new Exception("Failed to update customer credit balance for customer ID: $customer_id");
            }
        }

        // Commit transaction
        $pdo->commit();

        // Redirect to receipt view for this transaction
        header("Location: index.php?page=sales&action=view&batch=" . urlencode($pos_batch));
        exit;
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        $_SESSION['error'] = "Transaction failed: " . $e->getMessage();
        header("Location: index.php?page=pos");
        exit;
    }
}

// Load product list ordered by sales volume (best-selling first) and with sold-out items at the end
$stmt = $pdo->query("
    SELECT p.*, COALESCE(SUM(s.quantity), 0) as total_sold 
    FROM products p
    LEFT JOIN sales s ON p.product_id = s.product_id
    GROUP BY p.product_id
    ORDER BY 
        (p.stock > 0) DESC, -- In-stock items first
        total_sold DESC     -- Then by sales volume (best-selling first)
");
$products = $stmt->fetchAll();
?>
<div class="container mt-2">
  <?php
  // Display error message if set
  if (isset($_SESSION['error'])) {
      echo '<div class="alert alert-danger" role="alert">' . htmlspecialchars($_SESSION['error']) . '</div>';
      unset($_SESSION['error']);
  }
  ?>
  <h1 class="mb-4">Point of Sale</h1>
  <div class="mb-3">
    <p>Select products to add to your cart:</p>
    <div class="row">
      <?php 
      foreach ($products as $product):
          // Determine sold-out status and image URL
          $soldOut = ($product['stock'] == 0);
          $dimStyle = $soldOut ? "opacity: 0.5;" : "";
          $soldOutOverlay = $soldOut ? '<div class="sold-out-overlay">Sold Out</div>' : "";
          // Set badge class:
          // 0 stock: bg-danger, 1-3 left: bg-secondary, more: bg-primary.
          if ($product['stock'] == 0) {
              $badgeClass = 'bg-danger';
          } elseif ($product['stock'] <= 3) {
              $badgeClass = 'bg-secondary';
          } else {
              $badgeClass = 'bg-primary';
          }
          if (!empty($product['image_link'])) {
              $imageUrl = htmlspecialchars($product['image_link']);
          } else {
              $imageUrl = "https://placehold.jp/100x100.png";
          }
      ?>
      <div class="col-4 col-md-2 mb-3">
        <div class="card product-card" style="cursor: pointer; position: relative;" data-product='<?php echo json_encode($product); ?>'>
          <span class="badge <?php echo $badgeClass; ?> rounded-pill" style="position: absolute; top: 5px; right: 5px;">
            <?php echo htmlspecialchars($product['stock']); ?> in stock
          </span>
          <img src="<?php echo $imageUrl; ?>" class="card-img-top product-image" alt="<?php echo htmlspecialchars($product['name']); ?>" style="<?php echo $dimStyle; ?>">
          <?php echo $soldOutOverlay; ?>
          <div class="card-body p-2">
            <p class="card-text text-center small"><?php echo htmlspecialchars($product['name']); ?></p>
          </div>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  </div>
  <form id="cartForm" method="POST" action="index.php?page=pos">
    <!-- Cart Modal -->
    <div class="modal fade" id="cartModal" tabindex="-1" aria-labelledby="cartModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="cartModalLabel">Your Cart</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div id="cartItems"></div>
            <hr>
            <div class="mb-3">
              <label for="buyer" class="form-label">Buyer Name</label>
              <input type="text" class="form-control" name="buyer" id="buyer" placeholder="Type to search...">
            </div>
            <div class="mb-3">
              <label for="payment_method" class="form-label">Payment Method</label>
              <select class="form-select" name="payment_method" id="payment_method" required>
                <option value="Cash">Cash</option>
                <option value="CashApp">CashApp</option>
                <option value="Zelle">Zelle</option>
                <option value="Apple Cash">Apple Cash</option>
                <option value="Account Credit">Account Credit</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <!-- "Not Paid" Checkbox -->
            <div class="mb-3 form-check">
              <input type="checkbox" class="form-check-input" id="notPaidCheckbox" name="not_paid">
              <label class="form-check-label" for="notPaidCheckbox">Not Paid</label>
            </div>
            <input type="hidden" name="cart" id="cartInput" value="">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-lg" data-bs-dismiss="modal">
              <i class="bi bi-arrow-left-circle"></i> Continue Shopping
            </button>
            <button type="submit" class="btn btn-success btn-lg">
              <i class="bi bi-check-circle"></i> Complete Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  </form>
</div>

<!-- Sticky Cart Button -->
<div id="stickyCartBtn">
  <button id="openCartBtn" class="btn btn-primary btn-lg w-100">
    <i class="bi bi-cart"></i> View Cart (<span id="cartCount">0</span> items)
  </button>
</div>
