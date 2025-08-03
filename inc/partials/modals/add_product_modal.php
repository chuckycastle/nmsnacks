<?php
// inc/partials/modals/add_product_modal.php
if (!isset($existingCategories)) {
    $stmt = $pdo->query("SELECT DISTINCT category FROM products ORDER BY name ASC");
    $existingCategories = $stmt->fetchAll(PDO::FETCH_COLUMN);
}
?>
<div class="modal fade" id="addProductModal" tabindex="-1" aria-labelledby="addProductModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <form id="addProductForm" enctype="multipart/form-data">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="addProductModalLabel">Add New Product</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Product Name -->
          <div class="mb-3">
            <label for="product_name" class="form-label">Product Name</label>
            <input type="text" class="form-control" id="product_name" name="name" required>
          </div>
          <!-- Sale Price -->
          <div class="mb-3">
            <label for="sale_price" class="form-label">Sale Price (USD)</label>
            <input type="number" step="0.01" class="form-control" id="sale_price" name="sale_price" required>
          </div>
          <!-- Cost -->
          <div class="mb-3">
            <label for="cost" class="form-label">Cost (USD)</label>
            <input type="number" step="0.01" class="form-control" id="cost" name="cost" required>
          </div>
          <!-- Stock -->
          <div class="mb-3">
            <label for="stock" class="form-label">Stock</label>
            <input type="number" class="form-control" id="stock" name="stock" required>
          </div>
          <!-- Category Dropdown -->
          <div class="mb-3">
            <label for="category" class="form-label">Category</label>
            <select class="form-select" id="category" name="category" required>
              <option value="">Select Category</option>
              <?php foreach ($existingCategories as $cat): ?>
                <option value="<?php echo htmlspecialchars($cat); ?>"><?php echo htmlspecialchars($cat); ?></option>
              <?php endforeach; ?>
              <option value="Other">Other (enter new)</option>
            </select>
          </div>
          <div class="mb-3" id="newCategoryDiv" style="display: none;">
            <label for="new_category" class="form-label">New Category</label>
            <input type="text" class="form-control" id="new_category" name="new_category">
          </div>
          <!-- Image URL -->
          <div class="mb-3">
            <label for="image_url" class="form-label">Image URL (optional)</label>
            <input type="text" class="form-control" id="image_url" name="image_url">
          </div>
          <!-- Image File Upload -->
          <div class="mb-3">
            <label for="image_file" class="form-label">Upload Image (optional)</label>
            <input type="file" class="form-control" id="image_file" name="image_file" accept="image/*">
            <div id="fileError" class="text-danger mt-1" style="display:none;"></div>
          </div>
          <!-- Upload progress bar -->
          <div id="uploadProgressContainer" class="progress mt-2" style="display:none;">
            <div id="uploadProgressBar" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Add Product</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        </div>
      </div>
    </form>
  </div>
</div>
<script>
  // Toggle new category input.
  document.getElementById('category').addEventListener('change', function() {
    var newCatDiv = document.getElementById('newCategoryDiv');
    newCatDiv.style.display = (this.value === 'Other') ? 'block' : 'none';
  });

  // Client-side file validation.
  document.getElementById('image_file').addEventListener('change', function() {
    const fileErrorEl = document.getElementById('fileError');
    fileErrorEl.style.display = 'none';
    if (this.files && this.files[0]) {
      const file = this.files[0];
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!allowedTypes.includes(file.type)) {
        fileErrorEl.textContent = "Invalid file type. Allowed types: JPG, JPEG, PNG, GIF.";
        fileErrorEl.style.display = 'block';
        this.value = ""; // Clear the input.
      } else if (file.size > maxSize) {
        fileErrorEl.textContent = "File is too large. Maximum size is 2MB.";
        fileErrorEl.style.display = 'block';
        this.value = "";
      }
    }
  });
</script>
