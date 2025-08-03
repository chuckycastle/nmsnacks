<?php
// pages/inventory.php - Unified Inventory Management Page for Items, Templates, Bundles, and Restock

// Fetch all products for the Items tab.
$stmt = $pdo->query("SELECT product_id, name, stock, image_link, cost, sale_price, category FROM products ORDER BY name ASC");
$allProducts = $stmt->fetchAll();

// Fetch all bundles for the Bundles tab.
$stmt = $pdo->query("SELECT * FROM bundles ORDER BY created_at DESC");
$allBundles = $stmt->fetchAll();

// For the Restock tab, fetch products (with image info).
$stmt = $pdo->query("SELECT product_id, name, sale_price, cost, stock, image_link FROM products ORDER BY name ASC");
$restockProducts = $stmt->fetchAll();

// Retrieve box templates for use in the Templates tab.
$stmt = $pdo->query("SELECT template_id, name, description, box_contents, default_cost_per_box, image, category, created_at FROM box_templates ORDER BY name ASC");
$templates = $stmt->fetchAll();
?>
<div class="container mt-2">
  <h1 class="mb-4">Manage Inventory</h1>
  
  <!-- Navigation Tabs -->
  <ul class="nav nav-tabs" id="inventoryTabs" role="tablist">
    <li class="nav-item" role="presentation">
      <button class="nav-link active" id="items-tab" data-bs-toggle="tab" data-bs-target="#items" type="button" role="tab">Items</button>
    </li>
    <?php if ($_SESSION['role'] === 'admin'): ?>
      <li class="nav-item" role="presentation">
        <button class="nav-link" id="templates-tab" data-bs-toggle="tab" data-bs-target="#templates" type="button" role="tab">Templates</button>
      </li>
    <?php endif; ?>
    <li class="nav-item" role="presentation">
      <button class="nav-link" id="bundles-tab" data-bs-toggle="tab" data-bs-target="#bundles" type="button" role="tab">Bundles</button>
    </li>
    <li class="nav-item" role="presentation">
      <button class="nav-link" id="restock-tab" data-bs-toggle="tab" data-bs-target="#restock" type="button" role="tab">Restock</button>
    </li>
  </ul>
  
  <div class="tab-content" id="inventoryTabsContent">
    <!-- Items Tab -->
    <div class="tab-pane fade show active" id="items" role="tabpanel">
      <div class="mt-3">
        <!-- Button to trigger Add New Product Modal -->
        <button class="btn btn-primary mb-3" data-bs-toggle="modal" data-bs-target="#addProductModal">Add New Product</button>
        <!-- Products Table wrapped in container for dynamic refresh -->
        <div id="itemsTableContainer">
          <div class="table-responsive">
            <table class="table table-bordered table-striped datatable" id="inventoryTable">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Sale Price</th>
                  <th>Cost</th>
                  <th>Stock</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($allProducts as $prod): ?>
                  <tr data-product='<?php echo json_encode($prod); ?>'>
                    <td>
                      <?php 
                        if (!empty($prod['image_link'])) {
                          // Append a cache-busting timestamp (you may choose a more sophisticated versioning mechanism)
                          echo '<img src="' . htmlspecialchars($prod['image_link']) . '?t=' . time() . '" alt="' . htmlspecialchars($prod['name']) . '" width="80">';
                        } else {
                          echo '<img src="https://placehold.jp/80x80.png" alt="No image">';
                        }
                      ?>
                    </td>
                    <td><?php echo htmlspecialchars($prod['name']); ?></td>
                    <td><?php echo htmlspecialchars($prod['sale_price']); ?></td>
                    <td><?php echo htmlspecialchars($prod['cost']); ?></td>
                    <td><?php echo htmlspecialchars($prod['stock']); ?></td>
                    <td><?php echo htmlspecialchars($prod['category']); ?></td>
                    <td>
                      <button class="btn btn-sm btn-warning edit-product-btn" data-product='<?php echo json_encode($prod); ?>'>
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button class="btn btn-sm btn-danger delete-product-btn" data-product-id="<?php echo $prod['product_id']; ?>">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        </div><!-- /#itemsTableContainer -->
      </div>
    </div>
    
    <?php
      // Before the templates table, build a mapping of product_id to product name.
      $stmtProducts = $pdo->query("SELECT product_id, name FROM products");
      $productsMap = [];
      while ($row = $stmtProducts->fetch(PDO::FETCH_ASSOC)) {
        $productsMap[$row['product_id']] = $row['name'];
      }
    ?>
    <!-- Templates Tab (Admin Only) -->
    <?php if ($_SESSION['role'] === 'admin'): ?>
      <div class="tab-pane fade" id="templates" role="tabpanel">
        <div class="mt-3">
          <!-- Button to trigger Add New Template Modal -->
          <button class="btn btn-primary mb-3" data-bs-toggle="modal" data-bs-target="#addTemplateModal">Add New Template</button>
          <div id="templatesTableContainer">
            <div class="table-responsive">
              <table class="table table-bordered table-striped datatable" id="templatesTable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Default Cost</th>
                    <th>Category</th>
                    <th>Contents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach ($templates as $temp): ?>
                    <tr data-template='<?php echo json_encode($temp); ?>'>
                      <td><?php echo htmlspecialchars($temp['name'] ?? ''); ?></td>
                      <td><?php echo htmlspecialchars($temp['description'] ?? ''); ?></td>
                      <td><?php echo htmlspecialchars($temp['default_cost_per_box'] ?? ''); ?></td>
                      <td><?php echo htmlspecialchars($temp['category'] ?? ''); ?></td>
                      <td>
                        <?php 
                          $contents = [];
                          if (!empty($temp['box_contents'])) {
                            $decoded = json_decode($temp['box_contents'], true);
                            if (is_array($decoded)) {
                              foreach ($decoded as $item) {
                                // Look up the product name from our mapping.
                                $prodName = isset($productsMap[$item['product_id']]) ? $productsMap[$item['product_id']] : 'Unknown Product';
                                $contents[] = htmlspecialchars($prodName) . " (" . htmlspecialchars($item['quantity']) . ")";
                              }
                            }
                          }
                          if (!empty($contents)) {
                            echo "<ul class='list-unstyled mb-0'><li>" . implode("</li><li>", $contents) . "</li></ul>";
                          } else {
                            echo "No items";
                          }
                        ?>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-warning edit-template-btn" data-template='<?php echo json_encode($temp); ?>'>
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-template-btn" data-template-id="<?php echo $temp['template_id']; ?>">
                          <i class="bi bi-trash3"></i>
                        </button>
                      </td>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    <?php endif; ?>
    
    <!-- Bundles Tab -->
    <div class="tab-pane fade" id="bundles" role="tabpanel">
      <div class="mt-3">
        <!-- Button to trigger Add New Bundle Modal -->
        <button class="btn btn-primary mb-3" data-bs-toggle="modal" data-bs-target="#addBundleModal">Add New Bundle</button>
        <div class="table-responsive">
          <table class="table table-bordered table-striped datatable" id="bundlesTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Bundle Price</th>
                <th>Items</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($allBundles as $bundle): ?>
                <tr data-bundle='<?php echo json_encode($bundle); ?>'>
                  <td><?php echo htmlspecialchars($bundle['name']); ?></td>
                  <td><?php echo htmlspecialchars($bundle['bundle_price']); ?></td>
                  <td>
                    <?php 
                      $items = json_decode($bundle['items'], true);
                      if (is_array($items) && count($items) > 0) {
                        echo "<ul class='list-unstyled mb-0'>";
                        foreach ($items as $item) {
                          if (isset($item['type']) && $item['type'] === 'product') {
                            $prodName = isset($productsMap[$item['product_id']]) ? $productsMap[$item['product_id']] : "Unknown Product";
                            echo "<li>" . htmlspecialchars($prodName) . " (" . htmlspecialchars($item['quantity']) . ")</li>";
                          } elseif (isset($item['type']) && $item['type'] === 'category') {
                            echo "<li>" . htmlspecialchars($item['category']) . " (" . htmlspecialchars($item['quantity']) . ")</li>";
                          }
                        }
                        echo "</ul>";
                      } else {
                        echo "No items";
                      }
                    ?>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-warning edit-bundle-btn" data-bundle='<?php echo json_encode($bundle); ?>'>
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-bundle-btn" data-bundle-id="<?php echo $bundle['bundle_id']; ?>">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Restock Tab -->
    <div class="tab-pane fade" id="restock" role="tabpanel">
      <div class="mt-3">
        <h4>Bulk Restock</h4>
        <p>Select products to add to your restock cart. You can also load a template for restock.</p>
        <div class="row">
          <?php foreach ($restockProducts as $prod): 
                  if (!empty($prod['image_link'])) {
                      $imgUrl = htmlspecialchars($prod['image_link']);
                  } else {
                      $imgUrl = "https://placehold.jp/80x80.png";
                  }
          ?>
            <div class="col-4 col-md-2 mb-3">
              <div class="card product-card" style="cursor: pointer;" data-product='<?php echo json_encode($prod, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>'>
                <img src="<?php echo $imgUrl; ?>" class="card-img-top" alt="<?php echo htmlspecialchars($prod['name']); ?>">
                <div class="card-body p-2">
                  <p class="card-text text-center small"><?php echo htmlspecialchars($prod['name']); ?></p>
                  <span class="badge bg-primary"><?php echo htmlspecialchars($prod['stock']); ?></span>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
        <!-- Template Loader for Restock -->
        <div class="mb-3">
          <button class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#loadTemplateModal">Load Template</button>
        </div>
        <!-- Sticky Cart Button -->
        <div id="stickyCartBtn">
          <button id="openCartBtn" class="btn btn-primary btn-lg w-100">
            <i class="bi bi-cart"></i> View Cart (<span id="cartCount">0</span> items)
          </button>
        </div>
        
        <!-- Bulk Restock Form now wraps the modal content -->
        <form id="bulkRestockForm" method="POST" action="ajax/restock_ajax.php?action=submit" style="display:none;">
          <input type="hidden" name="boxesPurchased" id="boxesPurchasedForm" value="1">
          <input type="hidden" name="costPerBox" id="costPerBoxForm" value="0">
          <input type="hidden" name="cart" id="cartInput" value="">
          <input type="hidden" name="notes" id="notesForm" value="">
          <!-- The total cost input remains in the modal, so its value will be submitted -->
          <input type="hidden" name="total_cost" id="totalCostForm" value="">
        </form>
      </div>
    </div>

<!-- Include Modal Partials -->
<?php include 'inc/partials/modals/add_product_modal.php'; ?>
<?php include 'inc/partials/modals/edit_product_modal.php'; ?>
<?php if ($_SESSION['role'] === 'admin'): ?>
  <?php include 'inc/partials/modals/add_template_modal.php'; ?>
  <?php include 'inc/partials/modals/edit_template_modal.php'; ?>
<?php endif; ?>
<?php include 'inc/partials/modals/add_bundle_modal.php'; ?>
<?php include 'inc/partials/modals/edit_bundle_modal.php'; ?>
<?php include 'inc/partials/modals/load_template_modal.php'; ?>
<?php include 'inc/partials/modals/cart_modal.php'; ?>
