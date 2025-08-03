<!-- inc/partials/modals/edit_sale_modal.php -->
<div class="modal fade" id="editSaleModal" tabindex="-1" aria-labelledby="editSaleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <form id="editSaleForm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="editSaleModalLabel">Edit Sale</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Hidden Sale ID -->
          <input type="hidden" id="sale_id" name="sale_id">
          <!-- Buyer -->
          <div class="mb-3">
            <label for="buyer" class="form-label">Buyer</label>
            <input type="text" class="form-control" id="buyer" name="buyer" required>
          </div>
          <!-- Product ID -->
          <div class="mb-3">
            <label for="product_id" class="form-label">Product ID</label>
            <input type="number" class="form-control" id="product_id" name="product_id" required>
          </div>
          <!-- Quantity -->
          <div class="mb-3">
            <label for="quantity" class="form-label">Quantity</label>
            <input type="number" class="form-control" id="quantity" name="quantity" required>
          </div>
          <!-- Unit Sale Price -->
          <div class="mb-3">
            <label for="unit_sale_price" class="form-label">Unit Sale Price</label>
            <input type="number" step="0.01" class="form-control" id="unit_sale_price" name="unit_sale_price" required>
          </div>
          <!-- Payment Status -->
          <div class="mb-3">
            <label for="payment_status" class="form-label">Payment Status</label>
            <select class="form-select" id="payment_status" name="payment_status" required>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Not Paid">Not Paid</option>
            </select>
          </div>
          <!-- Sale Date -->
          <div class="mb-3">
            <label for="sale_date" class="form-label">Sale Date</label>
            <input type="date" class="form-control" id="sale_date" name="sale_date" required>
          </div>
          <!-- Payment Method -->
          <div class="mb-3">
            <label for="payment_method" class="form-label">Payment Method</label>
            <select class="form-select" id="payment_method" name="payment_method" required>
              <option value="Cash">Cash</option>
              <option value="CashApp">CashApp</option>
              <option value="Zelle">Zelle</option>
              <option value="Apple Cash">Apple Cash</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <!-- Payment Received By (Seller) -->
          <div class="mb-3">
            <label for="payment_received_by" class="form-label">Seller</label>
            <input type="text" class="form-control" id="payment_received_by" name="payment_received_by">
          </div>
          <!-- Notes -->
          <div class="mb-3">
            <label for="notes" class="form-label">Notes</label>
            <textarea class="form-control" id="notes" name="notes"></textarea>
          </div>
          <!-- pos_batch can be added here if needed -->
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Save Changes</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        </div>
      </div>
    </form>
  </div>
</div>
