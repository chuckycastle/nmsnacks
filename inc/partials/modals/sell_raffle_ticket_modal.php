<!-- Sell Raffle Ticket Modal -->
<div class="modal fade" id="sellRaffleTicketModal" tabindex="-1" aria-labelledby="sellRaffleTicketModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <form id="sellTicketForm" action="ajax/raffles_ajax.php?action=sell_ticket" method="POST">
        <input type="hidden" id="sellTicketRaffleId" name="raffle_id">
        <div class="modal-header">
          <h5 class="modal-title" id="sellRaffleTicketModalLabel">Sell Raffle Tickets</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p>Selling tickets for: <strong id="sellTicketRaffleName"></strong></p>
          
          <!-- Buyer Information -->
          <div class="mb-3">
            <label for="ticketBuyerName" class="form-label">Buyer Name</label>
            <input type="text" class="form-control" id="ticketBuyerName" name="buyer_name" placeholder="Type to search..." required>
          </div>
          
          <!-- Ticket Details -->
          <div class="mb-3">
            <label for="ticketQuantity" class="form-label">Number of Tickets</label>
            <input type="number" class="form-control" id="ticketQuantity" name="quantity" value="1" min="1" required>
          </div>
          
          <div class="mb-3">
            <label for="ticketPaymentMethod" class="form-label">Payment Method</label>
            <select class="form-select" id="ticketPaymentMethod" name="payment_method" required>
              <option value="Cash">Cash</option>
              <option value="CashApp">CashApp</option>
              <option value="Zelle">Zelle</option>
              <option value="Apple Cash">Apple Cash</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <!-- "Not Paid" Checkbox -->
          <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="ticketNotPaid" name="not_paid">
            <label class="form-check-label" for="ticketNotPaid">Not Paid</label>
          </div>
          
          <div class="mb-3">
            <label for="ticketNotes" class="form-label">Notes</label>
            <textarea class="form-control" id="ticketNotes" name="notes" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-success">Sell Tickets</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
$(document).ready(function() {
  // Initialize buyer autocomplete
  $("#ticketBuyerName").autocomplete({
    source: "pages/customers_autocomplete.php",
    minLength: 2,
    appendTo: "body",
    select: function(event, ui) {
      $("#ticketBuyerName").val(ui.item.value);
      return false;
    }
  });
  
  // Form submission
  $('#sellTicketForm').on('submit', function(e) {
    e.preventDefault();
    
    // Submit form via AJAX
    $.ajax({
      url: $(this).attr('action'),
      type: 'POST',
      data: $(this).serialize(),
      dataType: 'json',
      success: function(response) {
        if (response.success) {
          alert('Tickets sold successfully!');
          location.reload();
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: function() {
        alert('An error occurred while selling tickets.');
      }
    });
  });
});
</script>