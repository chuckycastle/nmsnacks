<!-- inc/partials/modals/edit_user_modal.php -->
<div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <form id="editUserForm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="editUserModalLabel">Edit User</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Hidden user ID -->
          <input type="hidden" id="edit_user_id" name="user_id">
          <!-- Name -->
          <div class="mb-3">
            <label for="edit_name" class="form-label">Name<span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="edit_name" name="name" required>
          </div>
          <!-- Username -->
          <div class="mb-3">
            <label for="edit_username" class="form-label">Username<span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="edit_username" name="username">
          </div>
          <!-- Email -->
          <div class="mb-3">
            <label for="edit_email" class="form-label">Email</label>
            <input type="email" class="form-control" id="edit_email" name="email">
          </div>
          <!-- Password (optional) -->
          <div class="mb-3">
            <label for="edit_password" class="form-label">Password (leave blank to keep unchanged)</label>
            <input type="password" class="form-control" id="edit_password" name="password">
          </div>
          <!-- Role -->
          <div class="mb-3">
            <label for="edit_role" class="form-label">Role<span class="text-danger">*</span></label>
            <select class="form-select" id="edit_role" name="role" required>
              <option value="admin">Admin</option>
              <option value="seller">Seller</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <!-- Credit Balance (only for customers) -->
          <div class="mb-3" id="editCreditBalanceDiv" style="display: none;">
            <label for="edit_credit_balance" class="form-label">Credit Balance ($)</label>
            <input type="number" step="0.01" class="form-control" id="edit_credit_balance" name="credit_balance">
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
