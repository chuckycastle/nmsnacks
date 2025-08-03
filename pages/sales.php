<?php
// pages/sales.php - Sales listing page with modal triggers for editing, receipt, and metrics.
// This file is included by index.php.
?>
<div class="container mt-2">
  <h1 class="mb-4">Manage Sales</h1>
  
  <!-- Button for "Add New Sale" -->
  <a href="index.php?page=pos" class="btn btn-primary mb-3">Add New Sale</a>
  
  <!-- Sales Listing Table -->
  <div class="table-responsive">
    <table class="table table-bordered table-striped datatable" id="salesTable">
      <thead>
        <tr>
          <th>Buyer</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Payment Status</th>
          <th>Sale Date</th>
          <th>Payment Method</th>
          <th>Seller</th>
          <th>Notes</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php
        // Retrieve sales with seller's full name.
        $stmt = $pdo->query("SELECT s.*, u.name AS seller_name FROM sales s LEFT JOIN users u ON s.payment_received_by = u.username ORDER BY s.sale_date DESC, s.sale_id DESC");
        while ($sale = $stmt->fetch()):
          $sale['seller'] = !empty($sale['seller_name']) ? $sale['seller_name'] : $sale['payment_received_by'];
        ?>
        <tr data-sale='<?php echo json_encode($sale); ?>'>
          <td><?php echo htmlspecialchars($sale['buyer']); ?></td>
          <td><?php echo htmlspecialchars($sale['quantity']); ?></td>
          <td><?php echo htmlspecialchars($sale['unit_sale_price']); ?></td>
          <td><?php echo htmlspecialchars($sale['payment_status']); ?></td>
          <td><?php echo htmlspecialchars($sale['sale_date']); ?></td>
          <td><?php echo htmlspecialchars($sale['payment_method']); ?></td>
          <td><?php echo htmlspecialchars($sale['seller']); ?></td>
          <td><?php echo htmlspecialchars($sale['notes']); ?></td>
          <td>
            <!-- Edit Sale button -->
            <button class="btn btn-sm btn-warning edit-sale-btn" data-sale='<?php echo json_encode($sale); ?>' title="Edit">
              <i class="bi bi-pencil-square"></i>
            </button>
            <!-- View Receipt button -->
            <button class="btn btn-sm btn-info view-receipt-btn" data-batch="<?php echo htmlspecialchars($sale['pos_batch']); ?>" title="View Receipt">
              <i class="bi bi-receipt"></i>
            </button>
            <!-- View Metrics button -->
            <button class="btn btn-sm btn-secondary view-metrics-btn" data-batch="<?php echo htmlspecialchars($sale['pos_batch']); ?>" title="View Metrics">
              <i class="bi bi-graph-up"></i>
            </button>
            <!-- Delete Sale button -->
            <button class="btn btn-sm btn-danger delete-sale-btn" data-sale-id="<?php echo $sale['sale_id']; ?>" title="Delete">
              <i class="bi bi-trash3"></i>
            </button>
          </td>
        </tr>
        <?php endwhile; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Include modals for editing, viewing receipt, and viewing metrics -->
<?php include 'inc/partials/modals/edit_sale_modal.php'; ?>
<?php include 'inc/partials/modals/view_sale_receipt_modal.php'; ?>
<?php include 'inc/partials/modals/view_sale_metrics_modal.php'; ?>
