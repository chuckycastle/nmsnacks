<?php
// inc/partials/modals/add_template_modal.php
// Ensure $existingCategories and $availableProducts are defined; if not, load them.
if (!isset($existingCategories)) {
    $stmt = $pdo->query("SELECT DISTINCT category FROM products ORDER BY category ASC");
    $existingCategories = $stmt->fetchAll(PDO::FETCH_COLUMN);
}
if (!isset($availableProducts)) {
    $stmt = $pdo->query("SELECT product_id, name FROM products ORDER BY name ASC");
    $availableProducts = $stmt->fetchAll();
}
?>
<div class="modal fade" id="addTemplateModal" tabindex="-1" aria-labelledby="addTemplateModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <form id="addTemplateForm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="addTemplateModalLabel">Add New Template</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Template Name -->
          <div class="mb-3">
            <label for="template_name" class="form-label">Template Name</label>
            <input type="text" class="form-control" id="template_name" name="name" required>
          </div>
          <!-- Description -->
          <div class="mb-3">
            <label for="template_description" class="form-label">Description</label>
            <textarea class="form-control" id="template_description" name="description"></textarea>
          </div>
          <!-- Default Cost -->
          <div class="mb-3">
            <label for="default_cost_per_template" class="form-label">Default Cost per Template (USD)</label>
            <input type="number" step="0.01" class="form-control" id="default_cost_per_template" name="default_cost_per_box" required>
          </div>
          <!-- Category -->
          <div class="mb-3">
            <label for="template_category" class="form-label">Category</label>
            <select class="form-select" id="template_category" name="category" required>
              <option value="">Select Category</option>
              <?php foreach ($existingCategories as $cat): ?>
                <option value="<?php echo htmlspecialchars($cat); ?>"><?php echo htmlspecialchars($cat); ?></option>
              <?php endforeach; ?>
              <option value="Other">Other (enter new)</option>
            </select>
          </div>
          <div class="mb-3" id="templateNewCategoryDiv" style="display:none;">
            <label for="template_new_category" class="form-label">New Category</label>
            <input type="text" class="form-control" id="template_new_category" name="new_category">
          </div>
          <!-- Image URL -->
          <div class="mb-3">
            <label for="template_image" class="form-label">Image URL (optional)</label>
            <input type="url" class="form-control" id="template_image" name="image">
          </div>
          <!-- Box Contents (Dynamic List) -->
          <div class="mb-3">
            <label class="form-label">Box Contents</label>
            <p class="small text-muted">Select products and specify quantities for this template.</p>
            <table class="table table-bordered" id="templateContentsTable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th style="width:50px;">Action</th>
                </tr>
              </thead>
              <tbody>
                <!-- Rows will be added dynamically -->
              </tbody>
            </table>
            <button type="button" class="btn btn-secondary" id="addTemplateRowBtn">Add Item</button>
          </div>
          <!-- Hidden input for JSON box contents -->
          <input type="hidden" name="box_contents" id="template_box_contents">
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Add New Template</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        </div>
      </div>
    </form>
  </div>
</div>
<script>
// Toggle new category field for template.
document.getElementById('template_category').addEventListener('change', function() {
  var newCatDiv = document.getElementById('templateNewCategoryDiv');
  newCatDiv.style.display = (this.value === 'Other') ? 'block' : 'none';
});

// Global available products for the template modal.
var addTemplateProducts = <?php echo json_encode($availableProducts); ?>;

// Function to add a row to the box contents table.
function addTemplateRow() {
  var tbody = document.getElementById('templateContentsTable').getElementsByTagName('tbody')[0];
  var row = document.createElement('tr');

  // Product select.
  var tdProduct = document.createElement('td');
  var select = document.createElement('select');
  select.className = 'form-select product-select';
  addTemplateProducts.forEach(function(prod) {
    var option = document.createElement('option');
    option.value = prod.product_id;
    option.textContent = prod.name;
    select.appendChild(option);
  });
  tdProduct.appendChild(select);
  row.appendChild(tdProduct);

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
}
document.getElementById('addTemplateRowBtn').addEventListener('click', addTemplateRow);

// On form submission, compile box contents into JSON.
document.getElementById('addTemplateForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var tbody = document.getElementById('templateContentsTable').getElementsByTagName('tbody')[0];
  var rows = tbody.getElementsByTagName('tr');
  var contents = [];
  for (var i = 0; i < rows.length; i++) {
    var productId = rows[i].querySelector('.product-select').value;
    var quantity = rows[i].querySelector('.quantity-input').value;
    contents.push({ product_id: productId, quantity: parseInt(quantity) });
  }
  document.getElementById('template_box_contents').value = JSON.stringify(contents);
  // Submit form via AJAX (handled in inventory.js)
});
</script>
