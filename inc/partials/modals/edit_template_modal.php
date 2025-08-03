<?php
// inc/partials/modals/edit_template_modal.php
// Ensure $template and $availableProducts are provided.
if (!isset($template)) {
    $template = [
        'template_id'          => '',
        'name'                 => '',
        'description'          => '',
        'default_cost_per_box' => '',
        'category'             => '',
        'image'                => '',
        'box_contents'         => '[]'
    ];
} else {
    // Decode box_contents if stored as JSON.
    $template['box_contents'] = is_string($template['box_contents']) ? json_decode($template['box_contents'], true) : $template['box_contents'];
}

// Query a combined list of categories from products and box_templates.
$stmt = $pdo->query("SELECT DISTINCT category FROM (SELECT category FROM products UNION SELECT category FROM box_templates) t ORDER BY category ASC");
$allCategories = $stmt->fetchAll(PDO::FETCH_COLUMN);

// Get available products.
if (!isset($availableProducts)) {
    $stmt = $pdo->query("SELECT product_id, name FROM products ORDER BY name ASC");
    $availableProducts = $stmt->fetchAll();
}
?>
<div class="modal fade" id="editTemplateModal" tabindex="-1" aria-labelledby="editTemplateModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <form id="editTemplateForm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="editTemplateModalLabel">Edit Template</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Hidden field for template_id -->
          <input type="hidden" id="edit_template_id" name="template_id" value="<?php echo htmlspecialchars($template['template_id']); ?>">
          <!-- Template Name -->
          <div class="mb-3">
            <label for="edit_template_name" class="form-label">Template Name</label>
            <input type="text" class="form-control" id="edit_template_name" name="name" value="<?php echo htmlspecialchars($template['name']); ?>" required>
          </div>
          <!-- Description -->
          <div class="mb-3">
            <label for="edit_template_description" class="form-label">Description</label>
            <textarea class="form-control" id="edit_template_description" name="description"><?php echo htmlspecialchars($template['description']); ?></textarea>
          </div>
          <!-- Default Cost -->
          <div class="mb-3">
            <label for="edit_default_cost_per_box" class="form-label">Default Cost per Template (USD)</label>
            <input type="number" step="0.01" class="form-control" id="edit_default_cost_per_box" name="default_cost_per_box" value="<?php echo htmlspecialchars($template['default_cost_per_box']); ?>" required>
          </div>
          <!-- Category -->
          <div class="mb-3">
            <label for="edit_template_category" class="form-label">Category</label>
            <select class="form-select" id="edit_template_category" name="category" required>
              <option value="">Select Category</option>
              <?php foreach ($allCategories as $cat): 
                    $normalizedCat = strtolower(trim($cat));
                    $selected = (strtolower(trim($template['category'])) === $normalizedCat) ? 'selected' : '';
              ?>
                <option value="<?php echo htmlspecialchars($normalizedCat); ?>" <?php echo $selected; ?>>
                  <?php echo htmlspecialchars($normalizedCat); ?>
                </option>
              <?php endforeach; ?>
              <option value="other" <?php if(strtolower(trim($template['category'])) && !in_array(strtolower(trim($template['category'])), array_map(function($c){ return strtolower(trim($c)); }, $allCategories))) echo "selected"; ?>>
                Other (enter new)
              </option>
            </select>
          </div>
          <div class="mb-3" id="edit_templateNewCategoryDiv" style="display: <?php echo (!in_array(strtolower(trim($template['category'])), array_map(function($c){ return strtolower(trim($c)); }, $allCategories))) ? 'block' : 'none'; ?>;">
            <label for="edit_template_new_category" class="form-label">New Category</label>
            <input type="text" class="form-control" id="edit_template_new_category" name="new_category" value="<?php echo (!in_array(strtolower(trim($template['category'])), array_map(function($c){ return strtolower(trim($c)); }, $allCategories))) ? htmlspecialchars($template['category']) : ''; ?>">
          </div>
          <!-- Image URL -->
          <div class="mb-3">
            <label for="edit_template_image" class="form-label">Image URL (optional)</label>
            <input type="text" class="form-control" id="edit_template_image" name="image" value="<?php echo htmlspecialchars($template['image']); ?>">
          </div>
          <!-- Box Contents (Dynamic List) -->
          <div class="mb-3">
            <label class="form-label">Box Contents</label>
            <p class="small text-muted">Edit the products and quantities for this template.</p>
            <table class="table table-bordered" id="editTemplateContentsTable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th style="width:50px;">Action</th>
                </tr>
              </thead>
              <tbody id="editTemplateBoxContentsTbody">
                <?php if (!empty($template['box_contents']) && is_array($template['box_contents'])): ?>
                  <?php foreach ($template['box_contents'] as $row): ?>
                    <tr>
                      <td>
                        <select class="form-select product-select">
                          <?php foreach ($availableProducts as $prod): ?>
                            <option value="<?php echo htmlspecialchars($prod['product_id']); ?>" <?php echo ($prod['product_id'] == $row['product_id']) ? 'selected' : ''; ?>>
                              <?php echo htmlspecialchars($prod['name']); ?>
                            </option>
                          <?php endforeach; ?>
                        </select>
                      </td>
                      <td>
                        <input type="number" class="form-control quantity-input" min="1" value="<?php echo htmlspecialchars($row['quantity']); ?>">
                      </td>
                      <td>
                        <button type="button" class="btn btn-sm btn-danger remove-row-btn" onclick="this.closest('tr').remove();">X</button>
                      </td>
                    </tr>
                  <?php endforeach; ?>
                <?php else: ?>
                  <tr>
                    <td colspan="3" class="text-center">No items defined.</td>
                  </tr>
                <?php endif; ?>
              </tbody>
            </table>
            <button type="button" class="btn btn-secondary" id="editTemplateAddRowBtn">Add Item</button>
          </div>
          <!-- Hidden input for JSON box contents -->
          <input type="hidden" name="box_contents" id="edit_template_box_contents">
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
// Toggle new category field for edit template.
document.getElementById('edit_template_category').addEventListener('change', function() {
  var newCatDiv = document.getElementById('edit_templateNewCategoryDiv');
  newCatDiv.style.display = (this.value.toLowerCase() === 'other') ? 'block' : 'none';
});

// Global available products for the edit template modal.
var editTemplateProducts = <?php echo json_encode($availableProducts); ?>;

// Function to add a new row to the edit template contents table.
function addEditTemplateRow() {
  var tbody = document.getElementById('editTemplateBoxContentsTbody');
  var row = document.createElement('tr');

  // Product select.
  var tdProduct = document.createElement('td');
  var select = document.createElement('select');
  select.className = 'form-select product-select';
  editTemplateProducts.forEach(function(prod) {
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
  tdAction.style.width = '50px';
  var removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-sm btn-danger remove-row-btn';
  removeBtn.textContent = 'X';
  removeBtn.onclick = function() { row.remove(); };
  tdAction.appendChild(removeBtn);
  row.appendChild(tdAction);

  tbody.appendChild(row);
}

document.getElementById('editTemplateAddRowBtn').addEventListener('click', addEditTemplateRow);

// Helper: Populate box contents into the edit template modal's table.
function populateEditTemplateBoxContents(boxContents) {
  var tbody = document.getElementById('editTemplateBoxContentsTbody');
  if (!tbody) {
    console.warn("Element 'editTemplateBoxContentsTbody' not found.");
    return;
  }
  tbody.innerHTML = ''; // Clear existing rows.
  let items = [];
  if (typeof boxContents === 'string') {
    try {
      items = JSON.parse(boxContents);
    } catch (e) {
      items = [];
    }
  } else if (Array.isArray(boxContents)) {
    items = boxContents;
  }
  if (items.length === 0) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = 3;
    td.className = "text-center";
    td.textContent = "No items defined.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    items.forEach(function(item) {
      var tr = document.createElement('tr');
      
      // Product cell.
      var tdProd = document.createElement('td');
      var select = document.createElement('select');
      select.className = 'form-select product-select';
      editTemplateProducts.forEach(function(prod) {
        var option = document.createElement('option');
        option.value = prod.product_id;
        option.textContent = prod.name;
        if (String(prod.product_id) === String(item.product_id)) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      tdProd.appendChild(select);
      tr.appendChild(tdProd);
      
      // Quantity cell.
      var tdQty = document.createElement('td');
      var qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.value = item.quantity;
      qtyInput.className = 'form-control quantity-input';
      tdQty.appendChild(qtyInput);
      tr.appendChild(tdQty);
      
      // Action cell.
      var tdAct = document.createElement('td');
      tdAct.style.width = '50px';
      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-sm btn-danger remove-row-btn';
      removeBtn.textContent = 'X';
      removeBtn.onclick = function() { tr.remove(); };
      tdAct.appendChild(removeBtn);
      tr.appendChild(tdAct);
      
      tbody.appendChild(tr);
    });
  }
}

// On form submission, compile box contents into JSON.
document.getElementById('editTemplateForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var tbody = document.getElementById('editTemplateBoxContentsTbody');
  var rows = tbody.getElementsByTagName('tr');
  var contents = [];
  for (var i = 0; i < rows.length; i++) {
    var selectElem = rows[i].querySelector('.product-select');
    var qtyElem = rows[i].querySelector('.quantity-input');
    if (selectElem && qtyElem) {
      contents.push({
        product_id: selectElem.value,
        quantity: parseInt(qtyElem.value)
      });
    }
  }
  document.getElementById('edit_template_box_contents').value = JSON.stringify(contents);
  // The form submission via AJAX is handled elsewhere.
});
</script>
