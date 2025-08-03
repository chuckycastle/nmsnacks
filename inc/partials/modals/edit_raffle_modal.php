<!-- Edit Raffle Modal -->
<div class="modal fade" id="editRaffleModal" tabindex="-1" aria-labelledby="editRaffleModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <form id="editRaffleForm" action="ajax/raffles_ajax.php?action=edit_raffle" method="POST">
        <input type="hidden" id="editRaffleId" name="raffle_id">
        <div class="modal-header">
          <h5 class="modal-title" id="editRaffleModalLabel">Edit Raffle</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Raffle Details -->
          <div class="mb-3">
            <label for="editRaffleName" class="form-label">Raffle Name</label>
            <input type="text" class="form-control" id="editRaffleName" name="name" required>
          </div>
          
          <div class="mb-3">
            <label for="editRaffleDescription" class="form-label">Description</label>
            <textarea class="form-control" id="editRaffleDescription" name="description" rows="3"></textarea>
          </div>
          
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="editRaffleStartDate" class="form-label">Start Date</label>
              <input type="date" class="form-control" id="editRaffleStartDate" name="start_date" required>
            </div>
            <div class="col-md-6 mb-3">
              <label for="editRaffleEndDate" class="form-label">End Date</label>
              <input type="date" class="form-control" id="editRaffleEndDate" name="end_date" required>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="editRaffleTicketPrice" class="form-label">Ticket Price</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control" id="editRaffleTicketPrice" name="ticket_price" step="0.01" min="0.01" required>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="editRaffleStatus" class="form-label">Status</label>
            <select class="form-select" id="editRaffleStatus" name="status" required>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <!-- Raffle Items -->
          <h5 class="mt-4">Raffle Items</h5>
          <p class="text-muted">Edit categories included in this raffle (e.g., "1 drink and 1 chips").</p>
          
          <div class="table-responsive">
            <table class="table table-bordered" id="editRaffleItemsTable">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="editRaffleItemsTableBody">
                <!-- Items will be populated dynamically -->
              </tbody>
            </table>
          </div>
          
          <button type="button" class="btn btn-sm btn-secondary" id="editAddItemBtn">
            <i class="bi bi-plus-circle"></i> Add Another Item
          </button>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
$(document).ready(function() {
  // Add item row button
  $('#editAddItemBtn').on('click', function() {
    const newRow = `
      <tr>
        <td>
          <input type="hidden" name="item_ids[]" value="new">
          <select name="categories[]" class="form-select" required>
            <option value="">Select Category</option>
            <!-- Categories will be populated dynamically -->
          </select>
        </td>
        <td>
          <input type="number" name="quantities[]" class="form-control" value="1" min="1" required>
        </td>
        <td>
          <button type="button" class="btn btn-sm btn-danger remove-edit-item-btn">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      </tr>
    `;
    
    $('#editRaffleItemsTableBody').append(newRow);
    
    // Load categories for the new select
    loadCategoriesForSelect($('#editRaffleItemsTableBody tr:last-child select'));
  });
  
  // Remove item row button
  $(document).on('click', '.remove-edit-item-btn', function() {
    // Don't remove if it's the only row
    if ($('#editRaffleItemsTableBody tr').length > 1) {
      $(this).closest('tr').remove();
    } else {
      alert('You must have at least one item in the raffle.');
    }
  });
  
  // Load categories for a select element
  function loadCategoriesForSelect(selectElement) {
    $.ajax({
      url: 'ajax/raffles_ajax.php',
      type: 'GET',
      data: {
        action: 'get_categories'
      },
      dataType: 'json',
      success: function(response) {
        if (response.success) {
          let options = '<option value="">Select Category</option>';
          response.data.forEach(function(category) {
            options += `<option value="${category.category}">${category.category}</option>`;
          });
          
          selectElement.html(options);
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: function() {
        alert('An error occurred while loading categories.');
      }
    });
  }
  
  // Form submission
  $('#editRaffleForm').on('submit', function(e) {
    e.preventDefault();
    
    // Validate dates
    const startDate = new Date($('#editRaffleStartDate').val());
    const endDate = new Date($('#editRaffleEndDate').val());
    
    if (endDate < startDate) {
      alert('End date cannot be before start date.');
      return false;
    }
    
    // Submit form via AJAX
    $.ajax({
      url: $(this).attr('action'),
      type: 'POST',
      data: $(this).serialize(),
      dataType: 'json',
      success: function(response) {
        if (response.success) {
          alert('Raffle updated successfully!');
          location.reload();
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: function() {
        alert('An error occurred while updating the raffle.');
      }
    });
  });
});
</script>