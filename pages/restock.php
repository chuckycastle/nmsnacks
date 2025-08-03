<?php
// pages/restock.php - Bulk Inventory Replenishment (Restock Workflow)

$activePage = 'restock'; // Use "restock" as active page for conditional JS loading

// Only admin users are allowed to replenish inventory
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    $_SESSION['error'] = "Insufficient permissions.";
    header("Location: index.php?page=inventory");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Generate a unique batch ID for this replenishment transaction.
    $batch_id = uniqid();

    // Retrieve POST data.
    $totalCost = isset($_POST['total_cost']) ? (float) $_POST['total_cost'] : 0;
    $notes = isset($_POST['notes']) ? trim($_POST['notes']) : "";
    $cartJson = isset($_POST['cart']) ? $_POST['cart'] : "";
    $cart = json_decode($cartJson, true);
    $admin_user = $_SESSION['username'];
    $replenishment_date = date('Y-m-d H:i:s');

    // Validate cart.
    if (!$cart || !is_array($cart) || count($cart) === 0) {
        $_SESSION['error'] = "Your restock cart is empty.";
        header("Location: index.php?page=restock");
        exit;
    }
    // (Optional) Validate overall quantity.
    $totalQuantity = 0;
    foreach ($cart as $item) {
        $totalQuantity += $item['quantity'];
    }
    if ($totalQuantity <= 0) {
        $_SESSION['error'] = "Invalid quantities in the cart.";
        header("Location: index.php?page=restock");
        exit;
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
                    $stmt = $pdo->prepare("INSERT INTO replenishments (product_id, quantity, total_cost, admin_user, replenishment_date, notes, batch_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$p['product_id'], $quantityToAdd, $costForProduct, $admin_user, $replenishment_date, $notes, $batch_id]);
                }
            } else {
                // Regular product item.
                if (!isset($item['product_id'])) {
                    throw new Exception("Product ID is missing for an item.");
                }
                // Update product stock.
                $stmt = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE product_id = ?");
                $stmt->execute([$item['quantity'], $item['product_id']]);
                // Insert replenishment record (assumed cost 0 for regular products).
                $stmt = $pdo->prepare("INSERT INTO replenishments (product_id, quantity, total_cost, admin_user, replenishment_date, notes, batch_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$item['product_id'], $item['quantity'], 0, $admin_user, $replenishment_date, $notes, $batch_id]);
            }
        }

        $pdo->commit();
        $_SESSION['success'] = "Inventory replenished successfully.";
        header("Location: index.php?page=restock&action=receipt&batch=" . urlencode($batch_id));
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        $_SESSION['error'] = "Failed to restock inventory: " . $e->getMessage();
        header("Location: index.php?page=restock");
        exit;
    }
}

// Fetch product list for display (if needed)
$stmt = $pdo->query("SELECT * FROM products ORDER BY name ASC");
$products = $stmt->fetchAll();
?>
<div class="container mt-2">
  <?php
  if (isset($_SESSION['error'])) {
      echo '<div class="alert alert-danger" role="alert">' . htmlspecialchars($_SESSION['error']) . '</div>';
      unset($_SESSION['error']);
  }
  ?>
  <h1 class="mb-4">Inventory Replenishment (Bulk)</h1>
  <div class="mb-3">
    <p>Select products to add to your restock cart:</p>
    <div class="row">
      <?php foreach ($products as $product):
            if (!empty($product['image_link'])) {
                $imageUrl = htmlspecialchars($product['image_link']);
            } else {
                $imageUrl = "https://placehold.jp/100x100.png";
            }
      ?>
      <div class="col-4 col-md-2 mb-3">
        <div class="card product-card" style="cursor: pointer; position: relative;" data-product='<?php echo json_encode($product); ?>'>
          <img src="<?php echo $imageUrl; ?>" class="card-img-top product-image" alt="<?php echo htmlspecialchars($product['name']); ?>">
          <div class="card-body p-2">
            <p class="card-text text-center small"><?php echo htmlspecialchars($product['name']); ?></p>
          </div>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  </div>
  
  <!-- Hidden Bulk Restock Form -->
  <form id="bulkRestockForm" action="index.php?page=restock" method="POST" style="display:none;">
    <input type="hidden" name="section" value="restock">
    <input type="hidden" name="mode" value="bulk">
    <input type="hidden" name="template_id" id="template_id" value="">
    <input type="hidden" name="boxesPurchased" id="boxesPurchasedForm" value="1">
    <input type="hidden" name="costPerBox" id="costPerBoxForm" value="0">
    <input type="hidden" name="total_cost" id="totalCostForm" value="">
    <input type="hidden" name="cart" id="cartInput" value="">
    <input type="hidden" name="notes" id="notesForm" value="">
  </form>
</div>

<!-- Sticky Cart Button -->
<div id="stickyCartBtn" style="position: fixed; bottom: 20px; right: 20px; z-index: 1050;">
  <button id="openCartBtn" class="btn btn-primary btn-lg">
    <i class="bi bi-cart"></i> View Cart (<span id="cartCount">0</span> items)
  </button>
</div>
