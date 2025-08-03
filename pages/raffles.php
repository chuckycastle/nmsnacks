<?php
// pages/raffles.php - Raffle Management Page

// Fetch all active raffles
$stmt = $pdo->query("
    SELECT r.*, 
           COUNT(DISTINCT rt.ticket_id) as tickets_sold,
           SUM(rt.price) as total_revenue,
           u.name as creator_name
    FROM raffles r
    LEFT JOIN raffle_tickets rt ON r.raffle_id = rt.raffle_id
    LEFT JOIN users u ON r.created_by = u.username
    GROUP BY r.raffle_id
    ORDER BY r.created_at DESC
");
$raffles = $stmt->fetchAll();

// Function to calculate total cost of raffle items
function calculateRaffleCost($pdo, $raffleId) {
    // Try the category-based approach first
    $stmt = $pdo->prepare("
        SELECT ri.category, ri.quantity
        FROM raffle_items ri
        WHERE ri.raffle_id = ? AND ri.category IS NOT NULL
    ");
    $stmt->execute([$raffleId]);
    $categoryItems = $stmt->fetchAll();
    
    if (count($categoryItems) > 0) {
        // Category-based calculation
        $totalCost = 0;
        foreach ($categoryItems as $item) {
            // Get average cost for this category
            $stmt = $pdo->prepare("
                SELECT AVG(cost) as avg_cost
                FROM products
                WHERE category = ?
            ");
            $stmt->execute([$item['category']]);
            $result = $stmt->fetch();
            $avgCost = $result['avg_cost'] ?: 0;
            
            $totalCost += $item['quantity'] * $avgCost;
        }
        return $totalCost;
    } else {
        // Fall back to product_id-based calculation for backward compatibility
        $stmt = $pdo->prepare("
            SELECT SUM(ri.quantity * p.cost) as total_cost
            FROM raffle_items ri
            JOIN products p ON ri.product_id = p.product_id
            WHERE ri.raffle_id = ?
        ");
        $stmt->execute([$raffleId]);
        $result = $stmt->fetch();
        return $result['total_cost'] ?: 0;
    }
}

// Calculate costs for each raffle
foreach ($raffles as &$raffle) {
    $raffle['total_cost'] = calculateRaffleCost($pdo, $raffle['raffle_id']);
    $raffle['profit'] = $raffle['total_revenue'] - $raffle['total_cost'];
}
?>

<div class="container mt-2">
  <h1 class="mb-4">Manage Raffles</h1>
  
  <!-- Button to trigger Add New Raffle Modal -->
  <button class="btn btn-primary mb-3" data-bs-toggle="modal" data-bs-target="#addRaffleModal">
    <i class="bi bi-plus-circle"></i> Create New Raffle
  </button>
  
  <?php if (empty($raffles)): ?>
    <div class="alert alert-info">
      No raffles found. Click the button above to create your first raffle!
    </div>
  <?php else: ?>
    <!-- Raffles Table -->
    <div class="table-responsive">
      <table class="table table-bordered table-striped datatable" id="rafflesTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Ticket Price</th>
            <th>Tickets Sold</th>
            <th>Revenue</th>
            <th>Cost</th>
            <th>Profit</th>
            <th>Created By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($raffles as $raffle): ?>
            <tr data-raffle='<?php echo json_encode($raffle); ?>'>
              <td><?php echo htmlspecialchars($raffle['name']); ?></td>
              <td>
                <span class="badge <?php 
                  echo $raffle['status'] == 'active' ? 'bg-success' : 
                      ($raffle['status'] == 'completed' ? 'bg-primary' : 'bg-secondary'); 
                ?>">
                  <?php echo htmlspecialchars(ucfirst($raffle['status'])); ?>
                </span>
              </td>
              <td><?php echo htmlspecialchars($raffle['start_date']); ?></td>
              <td><?php echo htmlspecialchars($raffle['end_date']); ?></td>
              <td>$<?php echo htmlspecialchars(number_format($raffle['ticket_price'], 2)); ?></td>
              <td><?php echo htmlspecialchars($raffle['tickets_sold']); ?></td>
              <td>$<?php echo htmlspecialchars(number_format($raffle['total_revenue'], 2)); ?></td>
              <td>$<?php echo htmlspecialchars(number_format($raffle['total_cost'], 2)); ?></td>
              <td>
                <span class="<?php echo $raffle['profit'] >= 0 ? 'text-success' : 'text-danger'; ?>">
                  $<?php echo htmlspecialchars(number_format(abs($raffle['profit']), 2)); ?>
                  <?php echo $raffle['profit'] >= 0 ? '' : '(Loss)'; ?>
                </span>
              </td>
              <td><?php echo htmlspecialchars($raffle['creator_name'] ?: $raffle['created_by']); ?></td>
              <td>
                <div class="btn-group" role="group">
                  <button class="btn btn-sm btn-info view-raffle-btn" data-raffle-id="<?php echo $raffle['raffle_id']; ?>" title="View Details">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-success sell-ticket-btn" data-raffle-id="<?php echo $raffle['raffle_id']; ?>" data-raffle-name="<?php echo htmlspecialchars($raffle['name']); ?>" title="Sell Tickets">
                    <i class="bi bi-ticket-perforated"></i>
                  </button>
                  <button class="btn btn-sm btn-warning edit-raffle-btn" data-raffle-id="<?php echo $raffle['raffle_id']; ?>" title="Edit">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button class="btn btn-sm btn-danger delete-raffle-btn" data-raffle-id="<?php echo $raffle['raffle_id']; ?>" title="Delete">
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    
    <!-- Raffle Details Section -->
    <div class="mt-5">
      <h2>Raffle Details</h2>
      <p>Click on a raffle to view detailed information and charts.</p>
      
      <div id="raffleDetailsContainer" class="d-none">
        <div class="card mb-4">
          <div class="card-header">
            <h3 id="detailRaffleName">Raffle Name</h3>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h4>Raffle Information</h4>
                <p id="detailRaffleDescription">Description will appear here.</p>
                <table class="table table-sm">
                  <tr>
                    <th>Status:</th>
                    <td id="detailRaffleStatus">Active</td>
                  </tr>
                  <tr>
                    <th>Dates:</th>
                    <td id="detailRaffleDates">Start - End</td>
                  </tr>
                  <tr>
                    <th>Ticket Price:</th>
                    <td id="detailRaffleTicketPrice">$0.00</td>
                  </tr>
                  <tr>
                    <th>Created By:</th>
                    <td id="detailRaffleCreator">Username</td>
                  </tr>
                </table>
              </div>
              <div class="col-md-6">
                <h4>Financial Summary</h4>
                <table class="table table-sm">
                  <tr>
                    <th>Tickets Sold:</th>
                    <td id="detailRaffleTicketsSold">0</td>
                  </tr>
                  <tr>
                    <th>Total Revenue:</th>
                    <td id="detailRaffleRevenue">$0.00</td>
                  </tr>
                  <tr>
                    <th>Total Cost:</th>
                    <td id="detailRaffleCost">$0.00</td>
                  </tr>
                  <tr>
                    <th>Profit/Loss:</th>
                    <td id="detailRaffleProfit">$0.00</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <!-- Raffle Charts -->
            <div class="row mt-4">
              <div class="col-md-6">
                <h4>Revenue vs. Cost</h4>
                <canvas id="raffleFinancialChart" width="400" height="200"></canvas>
              </div>
              <div class="col-md-6">
                <h4>Raffle Items</h4>
                <canvas id="raffleItemsChart" width="400" height="200"></canvas>
              </div>
            </div>
            
            <!-- Raffle Items Table -->
            <div class="mt-4">
              <h4>Raffle Items</h4>
              <div class="table-responsive">
                <table class="table table-sm table-bordered" id="raffleItemsTable">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Avg. Unit Cost</th>
                      <th>Total Cost</th>
                    </tr>
                  </thead>
                  <tbody id="raffleItemsTableBody">
                    <!-- Items will be populated dynamically -->
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Ticket Sales Table -->
            <div class="mt-4">
              <h4>Ticket Sales</h4>
              <div class="table-responsive">
                <table class="table table-sm table-bordered" id="raffleTicketsTable">
                  <thead>
                    <tr>
                      <th>Ticket #</th>
                      <th>Buyer</th>
                      <th>Purchase Date</th>
                      <th>Price</th>
                      <th>Payment Method</th>
                      <th>Status</th>
                      <th>Seller</th>
                    </tr>
                  </thead>
                  <tbody id="raffleTicketsTableBody">
                    <!-- Tickets will be populated dynamically -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  <?php endif; ?>
</div>

<!-- Include Modal Partials -->
<?php include 'inc/partials/modals/add_raffle_modal.php'; ?>
<?php include 'inc/partials/modals/edit_raffle_modal.php'; ?>
<?php include 'inc/partials/modals/sell_raffle_ticket_modal.php'; ?>

<!-- JavaScript for Raffle Management -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  // DataTable for raffles is initialized in main.js
  
  // View Raffle Details
  $('.view-raffle-btn').on('click', function() {
    const raffleId = $(this).data('raffle-id');
    loadRaffleDetails(raffleId);
  });
  
  // Edit Raffle
  $('.edit-raffle-btn').on('click', function() {
    const raffleId = $(this).data('raffle-id');
    const raffleData = $(this).closest('tr').data('raffle');
    populateEditRaffleModal(raffleData);
    $('#editRaffleModal').modal('show');
  });
  
  // Delete Raffle
  $('.delete-raffle-btn').on('click', function() {
    const raffleId = $(this).data('raffle-id');
    if (confirm('Are you sure you want to delete this raffle? This action cannot be undone.')) {
      deleteRaffle(raffleId);
    }
  });
  
  // Sell Ticket
  $('.sell-ticket-btn').on('click', function() {
    const raffleId = $(this).data('raffle-id');
    const raffleName = $(this).data('raffle-name');
    $('#sellTicketRaffleId').val(raffleId);
    $('#sellTicketRaffleName').text(raffleName);
    $('#sellRaffleTicketModal').modal('show');
  });
  
  // Function to load raffle details
  function loadRaffleDetails(raffleId) {
    $.ajax({
      url: 'ajax/raffles_ajax.php',
      type: 'GET',
      data: {
        action: 'get_raffle_details',
        raffle_id: raffleId
      },
      dataType: 'json',
      success: function(response) {
        if (response.success) {
          displayRaffleDetails(response.data);
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: function() {
        alert('An error occurred while loading raffle details.');
      }
    });
  }
  
  // Function to display raffle details
  function displayRaffleDetails(data) {
    // Populate raffle information
    $('#detailRaffleName').text(data.raffle.name);
    $('#detailRaffleDescription').text(data.raffle.description);
    $('#detailRaffleStatus').text(data.raffle.status.charAt(0).toUpperCase() + data.raffle.status.slice(1));
    $('#detailRaffleDates').text(data.raffle.start_date + ' to ' + data.raffle.end_date);
    $('#detailRaffleTicketPrice').text('$' + parseFloat(data.raffle.ticket_price).toFixed(2));
    $('#detailRaffleCreator').text(data.raffle.creator_name || data.raffle.created_by);
    
    // Populate financial summary
    $('#detailRaffleTicketsSold').text(data.tickets_sold);
    $('#detailRaffleRevenue').text('$' + parseFloat(data.total_revenue).toFixed(2));
    $('#detailRaffleCost').text('$' + parseFloat(data.total_cost).toFixed(2));
    
    const profit = parseFloat(data.total_revenue) - parseFloat(data.total_cost);
    $('#detailRaffleProfit').text('$' + Math.abs(profit).toFixed(2));
    $('#detailRaffleProfit').removeClass('text-success text-danger');
    $('#detailRaffleProfit').addClass(profit >= 0 ? 'text-success' : 'text-danger');
    if (profit < 0) {
      $('#detailRaffleProfit').append(' (Loss)');
    }
    
    // Populate raffle items table
    let itemsHtml = '';
    data.items.forEach(function(item) {
      // Capitalize first letter of category
      const displayCategory = item.category ? 
        (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 
        (item.product_name || 'Unknown');
      
      itemsHtml += `
        <tr>
          <td>${displayCategory}</td>
          <td>${item.quantity}</td>
          <td>$${parseFloat(item.avg_cost || item.cost).toFixed(2)}</td>
          <td>$${parseFloat(item.total_cost).toFixed(2)}</td>
        </tr>
      `;
    });
    $('#raffleItemsTableBody').html(itemsHtml);
    
    // Populate tickets table
    let ticketsHtml = '';
    data.tickets.forEach(function(ticket) {
      ticketsHtml += `
        <tr>
          <td>${ticket.ticket_number}</td>
          <td>${ticket.buyer_name}</td>
          <td>${ticket.purchase_date}</td>
          <td>$${parseFloat(ticket.price).toFixed(2)}</td>
          <td>${ticket.payment_method}</td>
          <td>${ticket.payment_status}</td>
          <td>${ticket.seller_name || ticket.seller}</td>
        </tr>
      `;
    });
    $('#raffleTicketsTableBody').html(ticketsHtml);
    
    // Show the details container first
    $('#raffleDetailsContainer').removeClass('d-none');
    
    // Delay chart creation slightly to ensure container is visible and sized
    setTimeout(function() {
      // Create financial chart
      createFinancialChart(data);
      
      // Create items chart
      createItemsChart(data.items);
    }, 100);
    
    // Scroll to details
    $('html, body').animate({
      scrollTop: $('#raffleDetailsContainer').offset().top - 100
    }, 500);
  }
  
  // Function to create financial chart
  function createFinancialChart(data) {
    const ctx = document.getElementById('raffleFinancialChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.financialChart) {
      window.financialChart.destroy();
    }
    
    window.financialChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Revenue', 'Cost', 'Profit/Loss'],
        datasets: [{
          label: 'Amount ($)',
          data: [
            parseFloat(data.total_revenue),
            parseFloat(data.total_cost),
            parseFloat(data.total_revenue) - parseFloat(data.total_cost)
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.5)',
            'rgba(255, 99, 132, 0.5)',
            parseFloat(data.total_revenue) - parseFloat(data.total_cost) >= 0 ? 
              'rgba(54, 162, 235, 0.5)' : 'rgba(255, 159, 64, 0.5)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            parseFloat(data.total_revenue) - parseFloat(data.total_cost) >= 0 ? 
              'rgba(54, 162, 235, 1)' : 'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount ($)'
            }
          }
        }
      }
    });
  }
  
  // Function to create items chart
  function createItemsChart(items) {
    const ctx = document.getElementById('raffleItemsChart').getContext('2d');
    
    // Prepare data
    const labels = items.map(item => {
      // Capitalize first letter of category
      return item.category ? 
        (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 
        (item.product_name || 'Unknown');
    });
    const costs = items.map(item => parseFloat(item.total_cost));
    
    // Generate colors
    const backgroundColors = items.map((_, index) => {
      const hue = (index * 137) % 360; // Golden angle approximation for good distribution
      return `hsla(${hue}, 70%, 60%, 0.5)`;
    });
    
    const borderColors = backgroundColors.map(color => color.replace('0.5', '1'));
    
    // Destroy existing chart if it exists
    if (window.itemsChart) {
      window.itemsChart.destroy();
    }
    
    window.itemsChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: 'Item Cost',
          data: costs,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: $${value.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  }
  
  // Function to delete a raffle
  function deleteRaffle(raffleId) {
    $.ajax({
      url: 'ajax/raffles_ajax.php',
      type: 'POST',
      data: {
        action: 'delete_raffle',
        raffle_id: raffleId
      },
      dataType: 'json',
      success: function(response) {
        if (response.success) {
          alert('Raffle deleted successfully.');
          location.reload();
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: function() {
        alert('An error occurred while deleting the raffle.');
      }
    });
  }
  
  // Function to populate edit raffle modal
  function populateEditRaffleModal(raffleData) {
    $('#editRaffleId').val(raffleData.raffle_id);
    $('#editRaffleName').val(raffleData.name);
    $('#editRaffleDescription').val(raffleData.description);
    $('#editRaffleStartDate').val(raffleData.start_date);
    $('#editRaffleEndDate').val(raffleData.end_date);
    $('#editRaffleTicketPrice').val(raffleData.ticket_price);
    $('#editRaffleStatus').val(raffleData.status);
    
    // Load raffle items
    $.ajax({
      url: 'ajax/raffles_ajax.php',
      type: 'GET',
      data: {
        action: 'get_raffle_items',
        raffle_id: raffleData.raffle_id
      },
      dataType: 'json',
      success: function(response) {
        if (response.success) {
          populateRaffleItemsTable(response.data);
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: function() {
        alert('An error occurred while loading raffle items.');
      }
    });
  }
  
  // Function to populate raffle items table in edit modal
  function populateRaffleItemsTable(items) {
    let html = '';
    items.forEach(function(item, index) {
      html += `
        <tr>
          <td>
            <input type="hidden" name="item_ids[]" value="${item.raffle_item_id}">
            <select name="categories[]" class="form-select form-select-sm" required>
              <option value="">Select Category</option>
              <!-- Categories will be populated dynamically -->
            </select>
          </td>
          <td>
            <input type="number" name="quantities[]" class="form-control form-control-sm" value="${item.quantity}" min="1" required>
          </td>
          <td>
            <button type="button" class="btn btn-sm btn-danger remove-item-btn">
              <i class="bi bi-trash3"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    $('#editRaffleItemsTableBody').html(html);
    
    // Load categories for each select
    loadCategoriesForSelects();
    
    // Set selected category for each row
    items.forEach(function(item, index) {
      if (item.category) {
        $(`#editRaffleItemsTableBody select`).eq(index).val(item.category);
      } else if (item.product_id) {
        // For backward compatibility - get category from product_id
        $.ajax({
          url: 'ajax/raffles_ajax.php',
          type: 'GET',
          data: {
            action: 'get_product_category',
            product_id: item.product_id
          },
          dataType: 'json',
          success: function(response) {
            if (response.success && response.data.category) {
              $(`#editRaffleItemsTableBody select`).eq(index).val(response.data.category);
            }
          }
        });
      }
    });
  }
  
  // Function to load categories for selects
  function loadCategoriesForSelects() {
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
            // Capitalize first letter of category
            const displayCategory = category.category.charAt(0).toUpperCase() + category.category.slice(1);
            options += `<option value="${category.category}">${displayCategory}</option>`;
          });
          
          $('select[name="categories[]"]').each(function() {
            const selectedValue = $(this).val();
            $(this).html(options);
            $(this).val(selectedValue);
          });
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: function() {
        alert('An error occurred while loading categories.');
      }
    });
  }
  
  // Add item button in edit modal
  $('#addItemBtn').on('click', function() {
    const html = `
      <tr>
        <td>
          <input type="hidden" name="item_ids[]" value="new">
          <select name="categories[]" class="form-select form-select-sm" required>
            <option value="">Select Category</option>
            <!-- Categories will be populated dynamically -->
          </select>
        </td>
        <td>
          <input type="number" name="quantities[]" class="form-control form-control-sm" value="1" min="1" required>
        </td>
        <td>
          <button type="button" class="btn btn-sm btn-danger remove-item-btn">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      </tr>
    `;
    
    $('#editRaffleItemsTableBody').append(html);
    loadCategoriesForSelects();
  });
  
  // Remove item button in edit modal
  $(document).on('click', '.remove-item-btn', function() {
    $(this).closest('tr').remove();
  });
  
  // Initialize buyer autocomplete for sell ticket modal
  $("#ticketBuyerName").autocomplete({
    source: "pages/customers_autocomplete.php",
    minLength: 2,
    appendTo: "body",
    select: function(event, ui) {
      $("#ticketBuyerName").val(ui.item.value);
      return false;
    }
  });
});
</script>