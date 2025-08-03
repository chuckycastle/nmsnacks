<?php
// inc/partials/modals/add_bundle_modal.php
if (!isset($availableProducts)) {
    $stmt = $pdo->query("SELECT product_id, name FROM products ORDER BY name ASC");
    $availableProducts = $stmt->fetchAll();
}
$stmt = $pdo->query("SELECT DISTINCT category FROM (SELECT category FROM products UNION SELECT category FROM box_templates) t");
$availableCategories = $stmt->fetchAll(PDO::FETCH_COLUMN);
?>
<div class="modal fade" id="addBundleModal" tabindex="-1" aria-labelledby="addBundleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <form id="addBundleForm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="addBundleModalLabel">Add New Bundle</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Bundle Name -->
          <div class="mb-3">
            <label for="bundle_name" class="form-label">Bundle Name</label>
            <input type="text" class="form-control" id="bundle_name" name="name" required>
          </div>
          <!-- Bundle Price -->
          <div class="mb-3">
            <label for="bundle_price" class="form-label">Bundle Price (USD)</label>
            <input type="number" step="0.01" class="form-control" id="bundle_price" name="bundle_price" required>
          </div>
          <!-- Bundle Items (Dynamic List) -->
          <div class="mb-3">
            <label class="form-label">Bundle Items</label>
            <p class="small text-muted">Add items to the bundle. Each item requires a selection type (Product or Category), the item, and a quantity.</p>
            <table class="table table-bordered" id="bundleItemsTable">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th style="width:50px;">Action</th>
                </tr>
              </thead>
              <tbody>
                <!-- Rows added dynamically -->
              </tbody>
            </table>
            <button type="button" class="btn btn-secondary" id="addBundleItemBtn">Add Item</button>
          </div>
          <!-- Hidden input for JSON bundle items -->
          <input type="hidden" name="items" id="bundle_items">
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Add Bundle</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        </div>
      </div>
    </form>
  </div>
</div>
<script>
// Global available products and categories for bundle modal.
var bundleProducts = <?php echo json_encode($availableProducts); ?>;
var bundleCategories = <?php echo json_encode($availableCategories); ?>;

// Function to create a category select dropdown for category type items.
function createCategorySelect() {
  var select = document.createElement('select');
  select.className = 'form-select category-select';
  // Add options from bundleCategories.
  bundleCategories.forEach(function(cat) {
    var option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
  // Add "New Category" option.
  var newOption = document.createElement('option');
  newOption.value = 'new';
  newOption.textContent = 'New Category';
  select.appendChild(newOption);
  return select;
}

// Function to add a new row to the bundle items table.
function addBundleItemRow() {
  var tbody = document.getElementById('bundleItemsTable').getElementsByTagName('tbody')[0];
  var row = document.createElement('tr');

  // Type select (Product or Category)
  var tdType = document.createElement('td');
  var typeSelect = document.createElement('select');
  typeSelect.className = 'form-select item-type-select';
  var optionProduct = document.createElement('option');
  optionProduct.value = 'product';
  optionProduct.textContent = 'Product';
  var optionCategory = document.createElement('option');
  optionCategory.value = 'category';
  optionCategory.textContent = 'Category';
  typeSelect.appendChild(optionProduct);
  typeSelect.appendChild(optionCategory);
  tdType.appendChild(typeSelect);
  row.appendChild(tdType);

  // Item cell - will contain either product select or category dropdown + new category input.
  var tdItem = document.createElement('td');
  // Create product select as default.
  var productSelect = document.createElement('select');
  productSelect.className = 'form-select product-select';
  bundleProducts.forEach(function(prod) {
    var option = document.createElement('option');
    option.value = prod.product_id;
    option.textContent = prod.name;
    productSelect.appendChild(option);
  });
  tdItem.appendChild(productSelect);

  // Create category select (hidden by default).
  var categorySelect = createCategorySelect();
  categorySelect.style.display = 'none';
  tdItem.appendChild(categorySelect);

  // Create new category input (hidden by default).
  var newCategoryInput = document.createElement('input');
  newCategoryInput.type = 'text';
  newCategoryInput.className = 'form-control new-category-input';
  newCategoryInput.placeholder = 'Enter new category';
  newCategoryInput.style.display = 'none';
  tdItem.appendChild(newCategoryInput);

  row.appendChild(tdItem);

  // Quantity input.
  var tdQuantity = document.createElement('td');
  var qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.min = '1';
  qtyInput.value = '1';
  qtyInput.className = 'form-control quantity-input';
  tdQuantity.appendChild(qtyInput);
  row.appendChild(tdQuantity);

  // Action button.
  var tdAction = document.createElement('td');
  var removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-sm btn-danger remove-row-btn';
  removeBtn.textContent = 'X';
  removeBtn.onclick = function() { row.remove(); };
  tdAction.appendChild(removeBtn);
  row.appendChild(tdAction);

  tbody.appendChild(row);

  // Toggle the item input based on type selection.
  typeSelect.addEventListener('change', function() {
    if (this.value === 'product') {
      productSelect.style.display = '';
      categorySelect.style.display = 'none';
      newCategoryInput.style.display = 'none';
    } else {
      productSelect.style.display = 'none';
      categorySelect.style.display = '';
      // Trigger change event on categorySelect to handle potential "New Category" selection.
      var event = new Event('change');
      categorySelect.dispatchEvent(event);
    }
  });

  // Handle category select change for "New Category" option.
  categorySelect.addEventListener('change', function() {
    if (this.value === 'new') {
      newCategoryInput.style.display = '';
    } else {
      newCategoryInput.style.display = 'none';
    }
  });
}
document.getElementById('addBundleItemBtn').addEventListener('click', addBundleItemRow);

// On form submission, compile bundle items into JSON.
document.getElementById('addBundleForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var tbody = document.getElementById('bundleItemsTable').getElementsByTagName('tbody')[0];
  var rows = tbody.getElementsByTagName('tr');
  var items = [];
  for (var i = 0; i < rows.length; i++) {
    var type = rows[i].querySelector('.item-type-select').value;
    var quantity = rows[i].querySelector('.quantity-input').value;
    if (type === 'product') {
      var productId = rows[i].querySelector('.product-select').value;
      items.push({ type: 'product', product_id: productId, quantity: parseInt(quantity) });
    } else if (type === 'category') {
      var categorySelect = rows[i].querySelector('.category-select');
      var selectedCategory = categorySelect.value;
      if (selectedCategory === 'new') {
        var newCategory = rows[i].querySelector('.new-category-input').value;
        items.push({ type: 'category', category: newCategory, quantity: parseInt(quantity) });
      } else {
        items.push({ type: 'category', category: selectedCategory, quantity: parseInt(quantity) });
      }
    }
  }
  document.getElementById('bundle_items').value = JSON.stringify(items);
  // The form submission via AJAX is handled in inventory.js.
});
</script>
