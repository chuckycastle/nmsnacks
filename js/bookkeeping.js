// js/bookkeeping.js

// Helper to format a date as YYYY-MM-DD.
const formatDateForInput = date => {
  if (!date) return '';
  let month = '' + (date.getMonth() + 1),
      day = '' + date.getDate(),
      year = date.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
};

document.addEventListener("DOMContentLoaded", function() {

  // ----- Date Filter Logic -----
  const presetFilter = document.getElementById('presetFilter');
  const startDateInput = document.getElementById('start_date');
  const endDateInput = document.getElementById('end_date');

  // Function to set dates based on preset
  function applyPreset() {
    const preset = presetFilter.value;
    let startDate, endDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    switch (preset) {
        case 'today':
            startDate = today;
            endDate = today;
            break;
        case 'this_week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay()); // Assuming Sunday is start of week (0)
            endDate = today;
            break;
        case 'last_week':
            endDate = new Date(today);
            endDate.setDate(today.getDate() - today.getDay() - 1); // End of last week (Saturday)
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6); // Start of last week (Sunday)
            break;
        case 'this_month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;
        case 'last_month':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
            break;
        case 'ytd':
            startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
            endDate = today;
            break;
        case 'all':
            startDate = ''; // Indicate all time
            endDate = '';
            break;
        case 'custom':
        default:
            // Keep existing custom dates or clear if switching from 'all'
            if (startDateInput.value === '' && endDateInput.value === '') {
              // Optionally set a default custom range or leave blank
            }
             // No automatic change needed for custom, user sets manually
            return; 
    }

    startDateInput.value = formatDateForInput(startDate);
    endDateInput.value = formatDateForInput(endDate);
  }

  // Add event listener to preset dropdown
  if (presetFilter) {
    presetFilter.addEventListener('change', applyPreset);
    // Optional: Set initial dropdown value based on loaded dates if needed
    // (More complex logic to map date ranges back to presets)
  }
  
  // Prevent DataTables search from interfering with date filter form submission
  // (If using DataTables search input)
  $('.dataTables_filter input').off('.DT'); 

  // ----- End Date Filter Logic -----

  // ----- Edit Budget Logic ----- 
  const editBudgetBtn = document.getElementById('editBudgetBtn');
  const editBudgetModalEl = document.getElementById('editBudgetModal');
  const editBudgetForm = document.getElementById('editBudgetForm');
  
  if (editBudgetBtn && editBudgetModalEl && editBudgetForm) {
      const budgetInput = document.getElementById('edit_restock_budget');
      const budgetDisplay = document.getElementById('restockBudgetValue');
      let editBudgetModal = null; 
      try {
        editBudgetModal = new bootstrap.Modal(editBudgetModalEl); 
      } catch (initError) {
        console.error("Error creating Bootstrap Modal instance:", initError);
      }

      if (editBudgetModal) { 
          editBudgetBtn.addEventListener('click', function() {
              if (budgetInput) {
                  budgetInput.value = restockBudget.toFixed(2); 
              } else {
                  console.error("Budget input element (#edit_restock_budget) not found inside click handler!"); 
              }
              try {
                  editBudgetModal.show(); 
              } catch (showError) {
                 console.error("Error caught attempting to show modal:", showError); 
              }
          });
      } else {
          console.error("Modal instance could not be created, listener not added.");
      }

      // Handle form submission
      editBudgetForm.addEventListener('submit', function(e) {
          e.preventDefault();
          if (!budgetInput) return; 
          
          const newBudgetValue = parseFloat(budgetInput.value).toFixed(2);
          
          if (isNaN(newBudgetValue) || newBudgetValue < 0) {
              showAlert('danger', 'Please enter a valid, non-negative budget amount.');
              return;
          }
          
          fetch('ajax/settings_ajax.php', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                  setting_key: 'restock_budget',
                  setting_value: newBudgetValue 
              })
          })
          .then(response => response.json())
          .then(data => {
              if (data.success) {
                  showAlert('success', 'Budget updated successfully!');
                  restockBudget = parseFloat(newBudgetValue); 
                  if (budgetDisplay) {
                      budgetDisplay.textContent = `$${restockBudget.toFixed(2)}`;
                  }
                  if (editBudgetModal) { // Check if instance exists before hiding
                      editBudgetModal.hide(); 
                  }
              } else {
                  showAlert('danger', 'Error updating budget: ' + data.message);
              }
          })
          .catch(err => {
              console.error('Error updating budget:', err);
              showAlert('danger', 'An unexpected error occurred while saving the budget.');
          });
      });
  } else {
      if (!editBudgetBtn) console.error("Initialization Error: Edit budget button (#editBudgetBtn) not found.");
      if (!editBudgetModalEl) console.error("Initialization Error: Edit budget modal element (#editBudgetModal) not found.");
      if (!editBudgetForm) console.error("Initialization Error: Edit budget form (#editBudgetForm) not found.");
  } 
  // ----- End Edit Budget Logic ----- 

  // ----- Payout Logic ----- 
  const payoutBtn = document.getElementById('payoutBtn');
  if (payoutBtn) {
      payoutBtn.addEventListener('click', function() {
          // Use the splits amount passed from PHP
          const payoutAmount = currentSplitsAmount;
          
          if (payoutAmount <= 0) {
              showAlert('warning', 'Payout amount must be positive.');
              return;
          }
          
          const confirmationMessage = `Are you sure you want to record a profit payout of $${payoutAmount.toFixed(2)}? This will add an 'out' transaction.`;
          if (confirm(confirmationMessage)) {
              // Disable button to prevent double-click
              payoutBtn.disabled = true;
              payoutBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Recording...';
              
              const transactionData = {
                  type: 'out',
                  amount: payoutAmount,
                  description: `$${payoutAmount.toFixed(2)} paid out as profits`,
                  // Optional: Add product/quantity if needed, otherwise null/empty
                  product_ids: null,
                  quantities: null,
                  template_id: null // Or a specific template ID for payouts if you have one
                  // admin_user will be set server-side based on session
              };
              
              fetch('ajax/transactions_ajax.php', {
                  method: 'POST', // Use POST to create a new transaction
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(transactionData)
              })
              .then(response => response.json())
              .then(data => {
                  if (data.success) {
                      showAlert('success', 'Payout recorded successfully!');
                      // Reload the page to see the new transaction and updated totals
                      window.location.reload(); 
                  } else {
                      showAlert('danger', 'Error recording payout: ' + data.message);
                      payoutBtn.disabled = false; // Re-enable button on error
                      payoutBtn.innerHTML = '<i class="bi bi-cash-coin"></i> Payout';
                  }
              })
              .catch(err => {
                  console.error('Error recording payout:', err);
                  showAlert('danger', 'An unexpected error occurred while recording the payout.');
                  payoutBtn.disabled = false; // Re-enable button on error
                  payoutBtn.innerHTML = '<i class="bi bi-cash-coin"></i> Payout';
              });
          }
      });
  }
  // ----- End Payout Logic -----

  // Helper to format date to YYYY-MM-DD.
  function formatDate(dateStr) {
    return dateStr ? dateStr.substring(0, 10) : "";
  }

  // Helper: Parse comma-separated string into an array.
  function parseCSV(value) {
    return value ? value.split(',') : [];
  }

  // Helper: Compute sum of an array of numbers.
  function sumArray(arr) {
    return arr.reduce((sum, val) => sum + parseFloat(val), 0);
  }

  // ----------------------------
  // View Transaction Modal Handler
  // ----------------------------
  document.querySelectorAll('.view-transaction-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const tr = btn.closest('tr');
      const data = tr.getAttribute('data-transaction');
      if (!data) return;
      const transaction = JSON.parse(data);
      
      document.getElementById('viewTransactionType').innerText = transaction.type;
      document.getElementById('viewTransactionAggregatePrice').innerText = "$" + parseFloat(transaction.total_amount).toFixed(2);
      document.getElementById('viewTransactionDate').innerText = formatDate(transaction.created_at);
      
      if (transaction.type === 'in') {
        document.getElementById('viewTransactionSellerLabel').innerText = "Seller";
        document.getElementById('viewTransactionProductsLabel').innerText = "Products Sold";
      } else {
        document.getElementById('viewTransactionSellerLabel').innerText = "Restocked by";
        document.getElementById('viewTransactionProductsLabel').innerText = "Products Restocked";
      }
      
      document.getElementById('viewTransactionSeller').innerText = userMapping[transaction.admin_user] || transaction.admin_user;
      document.getElementById('viewTransactionBatchId').innerText = transaction.batch_id || "N/A";
      document.getElementById('viewTransactionTemplateId').innerText = transaction.template_ids || "N/A";
      
      const productIds = parseCSV(transaction.product_ids);
      const quantities = parseCSV(transaction.quantities);
      
      const totalAmount = parseFloat(transaction.total_amount);
      const totalQuantity = sumArray(quantities);
      const avgUnitPrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
      const displayUnitPrice = (transaction.type === 'out' && totalAmount == 0) ? "N/A" : "$" + avgUnitPrice.toFixed(2);
      
      const tbody = document.getElementById('viewTransactionProductsTableBody');
      tbody.innerHTML = "";
      for (let i = 0; i < productIds.length; i++) {
        const prodId = productIds[i];
        const qty = parseFloat(quantities[i]) || 0;
        const lineTotal = (displayUnitPrice === "N/A") ? "N/A" : "$" + (avgUnitPrice * qty).toFixed(2);
        const prodName = productMapping[prodId] || prodId;
        const row = document.createElement('tr');
        row.innerHTML = `<td>${prodName}</td>
                         <td>${qty}</td>
                         <td>${displayUnitPrice}</td>
                         <td>${lineTotal}</td>`;
        tbody.appendChild(row);
      }
    });
  });

  // ----------------------------
  // Edit Transaction Modal Handler
  // ----------------------------
  document.querySelectorAll('.edit-transaction-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const tr = btn.closest('tr');
      const data = tr.getAttribute('data-transaction');
      if (!data) return;
      const transaction = JSON.parse(data);
      
      document.getElementById('editTransactionBatchId').value = transaction.batch_id;
      document.getElementById('editTransactionType').value = transaction.type;
      document.getElementById('editTransactionSeller').value = userMapping[transaction.admin_user] || transaction.admin_user;
      document.getElementById('editTransactionAggregatePrice').value = parseFloat(transaction.total_amount).toFixed(2);
      document.getElementById('editTransactionDescription').value = transaction.descriptions || "";
      document.getElementById('editTransactionDate').value = formatDate(transaction.created_at);
      document.getElementById('editTransactionTemplateId').value = transaction.template_ids || "N/A";
      
      const productIds = parseCSV(transaction.product_ids);
      const quantities = parseCSV(transaction.quantities);
      const totalAmount = parseFloat(transaction.total_amount);
      const totalQuantity = sumArray(quantities);
      const avgUnitPrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
      
      const tbody = document.getElementById('editTransactionProductsTableBody');
      tbody.innerHTML = "";
      for (let i = 0; i < productIds.length; i++) {
        const prodId = productIds[i];
        const qty = parseFloat(quantities[i]) || 0;
        const lineTotal = avgUnitPrice * qty;
        const prodName = productMapping[prodId] || prodId;
        const row = document.createElement('tr');
        row.innerHTML = `<td>${prodName}</td>
                         <td>${qty}</td>
                         <td>$${avgUnitPrice.toFixed(2)}</td>
                         <td>$${lineTotal.toFixed(2)}</td>`;
        tbody.appendChild(row);
      }
    });
  });

  // ----------------------------
  // Delete Transaction Handler
  // ----------------------------
  document.querySelectorAll('.delete-transaction-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const transactionId = btn.getAttribute('data-transaction-id');
      if (!confirm("Are you sure you want to delete this transaction?")) return;
      
      fetch('ajax/transactions_ajax.php?transaction_id=' + encodeURIComponent(transactionId), {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const tr = btn.closest('tr');
          tr.parentNode.removeChild(tr);
          showAlert('success', data.message);
        } else {
          showAlert('danger', data.message);
        }
      })
      .catch(err => {
        console.error(err);
        showAlert('danger', "An unexpected error occurred.");
      });
    });
  });

  // ----------------------------
  // Export CSV Functionality
  // ----------------------------
  document.getElementById('exportCsvBtn').addEventListener('click', function() {
    const rows = [];
    const headers = [];
    document.querySelectorAll("#transactionsTable thead th").forEach(th => {
      headers.push(th.innerText);
    });
    rows.push(headers.join(','));
    document.querySelectorAll("#transactionsTable tbody tr").forEach(tr => {
      const cells = [];
      tr.querySelectorAll("td").forEach(td => {
        cells.push(td.innerText.trim());
      });
      rows.push(cells.join(','));
    });
    const csvString = rows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "transactions_export.csv");
    link.click();
  });
});

// Function to display Bootstrap alerts (assuming it exists or add it)
function showAlert(type, message) {
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    // Ensure an alert container exists, prepending if necessary
    let container = document.getElementById('alertContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'container mt-3 position-fixed top-0 start-50 translate-middle-x p-3'; // Example positioning
        container.style.zIndex = '1050'; // Ensure it's above modals
        document.body.prepend(container);
    }
    container.innerHTML = alertHtml;
    // Auto-dismiss
    setTimeout(() => {
        const alert = bootstrap.Alert.getOrCreateInstance(container.firstChild);
        if (alert) {
            alert.close();
        }
    }, 5000);
}
