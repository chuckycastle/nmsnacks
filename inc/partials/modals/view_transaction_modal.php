<?php
// inc/partials/modals/view_transaction_modal.php
?>
<div class="modal fade" id="viewTransactionModal" tabindex="-1" aria-labelledby="viewTransactionModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="viewTransactionModalLabel">Transaction Details</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <!-- Basic Transaction Info -->
        <div class="mb-3">
          <strong>Type:</strong> <span id="viewTransactionType"></span>
        </div>
        <div class="mb-3">
          <strong>Total Amount (USD):</strong> <span id="viewTransactionAggregatePrice"></span>
        </div>
        <div class="mb-3">
          <strong>Date:</strong> <span id="viewTransactionDate"></span>
        </div>
        <div class="mb-3">
          <strong><span id="viewTransactionSellerLabel">Seller</span>:</strong> <span id="viewTransactionSeller"></span>
        </div>
        <!-- Products Details -->
        <h6><span id="viewTransactionProductsLabel">Products Sold</span></h6>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price (USD)</th>
              <th>Line Total (USD)</th>
            </tr>
          </thead>
          <tbody id="viewTransactionProductsTableBody">
            <!-- Filled dynamically via JS -->
          </tbody>
        </table>
        <div class="mb-3">
          <strong>Batch ID:</strong> <span id="viewTransactionBatchId"></span>
        </div>
        <div class="mb-3">
          <strong>Template ID:</strong> <span id="viewTransactionTemplateId"></span>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
