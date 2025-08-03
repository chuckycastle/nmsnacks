<?php
// inc/partials/modals/cart_modal.php - Modal for the Bulk Restock Cart
// This file is intended to be included in your inventory page.
// It assumes that Bootstrap's CSS/JS are already loaded.
?>
<div class="modal fade" id="cartModal" tabindex="-1" aria-labelledby="cartModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="cartModalLabel">Restock Cart</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <!-- Container for dynamically rendered cart items -->
        <div id="cartItems"></div>
        <hr>
        <div class="mb-3">
          <label for="total_cost" class="form-label">Total Cost (USD)</label>
          <input type="number" step="0.01" class="form-control" id="total_cost" placeholder="Enter total cost" required>
        </div>
        <p>Please review the items you plan to add to inventory.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" data-bs-dismiss="modal">
          <i class="bi bi-arrow-left-circle"></i> Continue Adding
        </button>
        <button type="button" id="createTemplateFromCart" class="btn btn-secondary btn-lg">
          <i class="bi bi-plus-square"></i> Create Template
        </button>
        <button type="button" id="submitBulkBtn" class="btn btn-success btn-lg">
          <i class="bi bi-check-circle"></i> Submit Restock
        </button>
      </div>
    </div>
  </div>
</div>
