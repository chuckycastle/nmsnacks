<!-- inc/partials/modals/add_user_modal.php -->
<div class="modal fade" id="addUserModal" tabindex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <form id="createUserForm">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="addUserModalLabel">Add New User</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Name -->
          <div class="mb-3">
            <label for="name" class="form-label">Name<span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="name" name="name" required>
          </div>
          <!-- Role -->
          <div class="mb-3">
            <label for="role" class="form-label">Role<span class="text-danger">*</span></label>
            <select class="form-select" id="role" name="role" required>
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="seller">Seller</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <!-- Username & Password (displayed for admin/seller roles) -->
          <div class="mb-3" id="usernameDiv" style="display:none;">
            <label for="username" class="form-label">Username<span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="username" name="username">
          </div>
          <div class="mb-3" id="passwordDiv" style="display:none;">
            <label for="password" class="form-label">Password<span class="text-danger">*</span></label>
            <input type="password" class="form-control" id="password" name="password">
          </div>
          <!-- Email -->
          <div class="mb-3">
            <label for="email" class="form-label">Email (optional)</label>
            <input type="email" class="form-control" id="email" name="email">
          </div>
        </div>
        <div class="modal-footer">
          <button type="submit" id="createUserBtn" class="btn btn-primary">Create User</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        </div>
      </div>
    </form>
  </div>
</div>
