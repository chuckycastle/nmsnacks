<!-- inc/partials/modals/edit_budget_modal.php -->
<div class="modal fade" id="editBudgetModal" tabindex="-1" aria-labelledby="editBudgetModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-sm"> <!-- Smaller modal -->
    <form id="editBudgetForm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="editBudgetModalLabel">Edit Restock Budget</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="edit_restock_budget" class="form-label">Budget Amount ($)</label>
            <input type="number" step="0.01" class="form-control" id="edit_restock_budget" name="restock_budget" required>
          </div>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Save Budget</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        </div>
      </div>
    </form>
  </div>
</div> 