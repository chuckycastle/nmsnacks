<?php
// inc/partials/modals/edit_bundle_modal.php
if (!isset($availableProducts)) {
    $stmt = $pdo->query("SELECT product_id, name FROM products ORDER BY name ASC");
    $availableProducts = $stmt->fetchAll();
}
$stmt = $pdo->query("SELECT DISTINCT category FROM (SELECT category FROM products UNION SELECT category FROM box_templates) t");
$availableCategories = $stmt->fetchAll(PDO::FETCH_COLUMN);
?>
<div class="modal fade" id="editBundleModal" tabindex="-1" aria-labelledby="editBundleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <form id="editBundleForm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="editBundleModalLabel">Edit Bundle</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Hidden bundle ID -->
          <input type="hidden" id="edit_bundle_id" name="bundle_id">
          <!-- Bundle Name -->
          <div class="mb-3">
            <label for="edit_bundle_name" class="form-label">Bundle Name</label>
            <input type="text" class="form-control" id="edit_bundle_name" name="name" required>
          </div>
          <!-- Bundle Price -->
          <div class="mb-3">
            <label for="edit_bundle_price" class="form-label">Bundle Price (USD)</label>
            <input type="number" step="0.01" class="form-control" id="edit_bundle_price" name="bundle_price" required>
          </div>
          <!-- Bundle Items (Dynamic List) -->
          <div class="mb-3">
            <label class="form-label">Bundle Items</label>
            <p class="small text-muted">Edit items for the bundle. Each item requires a selection type (Product or Category), the item, and a quantity.</p>
            <table class="table table-bordered" id="editBundleItemsTable">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th style="width:50px;">Action</th>
                </tr>
              </thead>
              <tbody>
                <!-- Rows will be populated dynamically -->
              </tbody>
            </table>
            <button type="button" class="btn btn-secondary" id="addEditBundleItemBtn">Add Item</button>
          </div>
          <!-- Hidden input for JSON bundle items -->
          <input type="hidden" name="items" id="edit_bundle_items">
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Save Changes</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        </div>
      </div>
    </form>
  </div>
</div>
<script>
// Global available products and categories for edit bundle modal.
var editBundleProducts = <?php echo json_encode($availableProducts); ?>;
var editBundleCategories = <?php echo json_encode($availableCategories); ?>;

// Create a category select dropdown for edit modal.
function createEditCategorySelect() {
  var select = document.createElement('select');
  select.className = 'form-select category-select';
  editBundleCategories.forEach(function(cat) {
    var option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
  var newOption = document.createElement('option');
  newOption.value = 'new';
  newOption.textContent = 'New Category';
  select.appendChild(newOption);
  return select;
}

// Function to add a row to the edit bundle items table.
// If an item object is provided, prepopulate the row.
function addEditBundleItemRow(item) {
  var tbody = document.getElementById('editBundleItemsTable').getElementsByTagName('tbody')[0];
  var row = document.createElement('tr');

  // Type select.
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

  // Item cell.
  var tdItem = document.createElement('td');
  // Create product select.
  var productSelect = document.createElement('select');
  productSelect.className = 'form-select product-select';
  editBundleProducts.forEach(function(prod) {
    var option = document.createElement('option');
    option.value = prod.product_id;
    option.textContent = prod.name;
    productSelect.appendChild(option);
  });
  tdItem.appendChild(productSelect);
  // Create category select.
  var categorySelect = createEditCategorySelect();
  categorySelect.style.display = 'none';
  tdItem.appendChild(categorySelect);
  // Create new category input.
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
  qtyInput.value = item && item.quantity ? item.quantity : '1';
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

  // If editing, set initial values.
  if (item) {
    if (item.type === 'product') {
      typeSelect.value = 'product';
      productSelect.style.display = '';
      categorySelect.style.display = 'none';
      newCategoryInput.style.display = 'none';
      productSelect.value = item.product_id;
    } else if (item.type === 'category') {
      typeSelect.value = 'category';
      productSelect.style.display = 'none';
      categorySelect.style.display = '';
      if (editBundleCategories.includes(item.category)) {
        categorySelect.value = item.category;
        newCategoryInput.style.display = 'none';
      } else {
        categorySelect.value = 'new';
        newCategoryInput.style.display = '';
        newCategoryInput.value = item.category;
      }
    }
  }
  
  // Toggle behavior on type change.
  typeSelect.addEventListener('change', function() {
    if (this.value === 'product') {
      productSelect.style.display = '';
      categorySelect.style.display = 'none';
      newCategoryInput.style.display = 'none';
    } else {
      productSelect.style.display = 'none';
      categorySelect.style.display = '';
      var event = new Event('change');
      categorySelect.dispatchEvent(event);
    }
  });
  categorySelect.addEventListener('change', function() {
    if (this.value === 'new') {
      newCategoryInput.style.display = '';
    } else {
      newCategoryInput.style.display = 'none';
    }
  });
}
document.getElementById('addEditBundleItemBtn').addEventListener('click', function() {
  addEditBundleItemRow();
});

// On form submission, compile edited bundle items into JSON and send update request.
document.getElementById('editBundleForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var tbody = document.getElementById('editBundleItemsTable').getElementsByTagName('tbody')[0];
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
  document.getElementById('edit_bundle_items').value = JSON.stringify(items);
  
  // Prepare data for update.
  var bundleData = {
    bundle_id: document.getElementById('edit_bundle_id').value,
    name: document.getElementById('edit_bundle_name').value,
    bundle_price: document.getElementById('edit_bundle_price').value,
    items: document.getElementById('edit_bundle_items').value
  };
  fetch('ajax/bundles_ajax.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bundleData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showAlert('success', data.message);
      $('#editBundleModal').modal('hide');
      // Refresh the Bundles table.
      $('#bundles').load(location.href + " #bundles .table-responsive", function() {
        if ($.fn.DataTable.isDataTable('#bundlesTable')) {
          $('#bundlesTable').DataTable().destroy();
        }
        $('#bundlesTable').DataTable({
          paging: true,
          ordering: true,
          searching: true,
          pageLength: 10,
          lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]]
        });
      });
    } else {
      showAlert('danger', data.message);
    }
  })
  .catch(err => {
    console.error(err);
    showAlert('danger', "An unexpected error occurred.");
  });
});
</script>
