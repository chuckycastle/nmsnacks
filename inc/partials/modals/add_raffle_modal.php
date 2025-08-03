<!-- Add Raffle Modal -->
<div class="modal fade" id="addRaffleModal" tabindex="-1" aria-labelledby="addRaffleModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <form id="addRaffleForm" action="ajax/raffles_ajax.php?action=add_raffle" method="POST">
        <div class="modal-header">
          <h5 class="modal-title" id="addRaffleModalLabel">Create New Raffle</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Raffle Details -->
          <div class="mb-3">
            <label for="raffleName" class="form-label">Raffle Name</label>
            <input type="text" class="form-control" id="raffleName" name="name" required>
          </div>
          
          <div class="mb-3">
            <label for="raffleDescription" class="form-label">Description</label>
            <textarea class="form-control" id="raffleDescription" name="description" rows="3"></textarea>
          </div>
          
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="raffleStartDate" class="form-label">Start Date</label>
              <input type="date" class="form-control" id="raffleStartDate" name="start_date" required>
            </div>
            <div class="col-md-6 mb-3">
              <label for="raffleEndDate" class="form-label">End Date</label>
              <input type="date" class="form-control" id="raffleEndDate" name="end_date" required>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="raffleTicketPrice" class="form-label">Ticket Price</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control" id="raffleTicketPrice" name="ticket_price" step="0.01" min="0.01" required>
            </div>
          </div>
          
          <!-- Raffle Items -->
          <h5 class="mt-4">Raffle Items</h5>
          <p class="text-muted">Add categories that will be included in this raffle (e.g., "1 drink and 1 chips").</p>
          
          <div class="table-responsive">
            <table class="table table-bordered" id="raffleItemsTable">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="raffleItemsTableBody">
                <tr>
                  <td>
                    <select name="categories[]" class="form-select" required>
                      <option value="">Select Category</option>
                      <?php
                      // Fetch categories for dropdown
                      $stmt = $pdo->query("SELECT DISTINCT category FROM products ORDER BY category ASC");
                      while ($category = $stmt->fetch()) {
                        echo '<option value="' . htmlspecialchars($category['category']) . '">' . 
                             htmlspecialchars(ucfirst($category['category'])) . '</option>';
                      }
                      ?>
                    </select>
                  </td>
                  <td>
                    <input type="number" name="quantities[]" class="form-control" value="1" min="1" required>
                  </td>
                  <td>
                    <button type="button" class="btn btn-sm btn-danger remove-item-btn">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <button type="button" class="btn btn-sm btn-secondary" id="addItemRowBtn">
            <i class="bi bi-plus-circle"></i> Add Another Item
          </button>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Raffle</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
$(document).ready(function() {
  // Set default dates
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(today.getMonth() + 1);
  
  $('#raffleStartDate').val(today.toISOString().split('T')[0]);
  $('#raffleEndDate').val(nextMonth.toISOString().split('T')[0]);
  
  // Add item row button
  $('#addItemRowBtn').on('click', function() {
    // Clone the first row
    const newRow = $('#raffleItemsTableBody tr:first').clone();
    
    // Reset values
    newRow.find('select').val('');
    newRow.find('input[type="number"]').val(1);
    
    // Append to table
    $('#raffleItemsTableBody').append(newRow);
  });
  
  // Remove item row button
  $(document).on('click', '.remove-item-btn', function() {
    // Don't remove if it's the only row
    if ($('#raffleItemsTableBody tr').length > 1) {
      $(this).closest('tr').remove();
    } else {
      alert('You must have at least one item in the raffle.');
    }
  });
  
  // Form submission
  $('#addRaffleForm').on('submit', function(e) {
    e.preventDefault();
    
    // Validate dates
    const startDate = new Date($('#raffleStartDate').val());
    const endDate = new Date($('#raffleEndDate').val());
    
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
          alert('Raffle created successfully!');
          location.reload();
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: function() {
        alert('An error occurred while creating the raffle.');
      }
    });
  });
});
</script>