<?php
// inc/partials/modals/edit_product_modal.php
?>
<div class="modal fade" id="editProductModal" tabindex="-1" aria-labelledby="editProductModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <form id="editProductForm" enctype="multipart/form-data">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="editProductModalLabel">Edit Product</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Hidden field for product_id -->
          <input type="hidden" id="edit_product_id" name="product_id">
          <!-- Product Name -->
          <div class="mb-3">
            <label for="edit_product_name" class="form-label">Product Name</label>
            <input type="text" class="form-control" id="edit_product_name" name="name" required>
          </div>
          <!-- Sale Price -->
          <div class="mb-3">
            <label for="edit_sale_price" class="form-label">Sale Price (USD)</label>
            <input type="number" step="0.01" class="form-control" id="edit_sale_price" name="sale_price" required>
          </div>
          <!-- Cost -->
          <div class="mb-3">
            <label for="edit_cost" class="form-label">Cost (USD)</label>
            <input type="number" step="0.01" class="form-control" id="edit_cost" name="cost" required>
          </div>
          <!-- Stock -->
          <div class="mb-3">
            <label for="edit_stock" class="form-label">Stock</label>
            <input type="number" class="form-control" id="edit_stock" name="stock" required>
          </div>
          <!-- Category -->
          <div class="mb-3">
            <label for="edit_category" class="form-label">Category</label>
            <select class="form-select" id="edit_category" name="category" required>
              <option value="">Select Category</option>
              <option value="drinks">Drinks</option>
              <option value="snacks">Snacks</option>
              <option value="Other">Other (enter new)</option>
            </select>
          </div>
          <div class="mb-3" id="editNewCategoryDiv" style="display:none;">
            <label for="edit_new_category" class="form-label">New Category</label>
            <input type="text" class="form-control" id="edit_new_category" name="new_category">
          </div>
          <!-- Image URL -->
          <div class="mb-3">
            <label for="edit_image_url" class="form-label">Image URL (optional)</label>
            <input type="text" class="form-control" id="edit_image_url" name="image_url">
          </div>
          <!-- Image File Upload -->
          <div class="mb-3">
            <label for="edit_image_file" class="form-label">Upload New Image (optional)</label>
            <input type="file" class="form-control" id="edit_image_file" name="image_file" accept="image/*">
          </div>
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
// Toggle new category field for edit form.
document.getElementById('edit_category').addEventListener('change', function() {
  var newCatDiv = document.getElementById('editNewCategoryDiv');
  newCatDiv.style.display = (this.value === 'Other') ? 'block' : 'none';
});
</script>
