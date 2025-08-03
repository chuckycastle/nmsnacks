// js/main.js

// Standardized function to create charts using Chart.js.
// If a chart already exists on the canvas, destroy it before creating a new one.
function createChart(canvasId, chartType, data, options) {
  var existingChart = Chart.getChart(canvasId);
  if (existingChart) {
    existingChart.destroy();
  }
  var ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: chartType,
    data: data,
    options: options
  });
}

// Helper function to show Bootstrap alerts.
function showAlert(type, message) {
  // 'type' can be 'success', 'danger', 'warning', or 'info'
  var alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  // If an alert container exists, update its content; otherwise, create one at the top of the body.
  if ($('#alertContainer').length) {
    $('#alertContainer').html(alertHtml);
  } else {
    $('body').prepend('<div id="alertContainer" class="container mt-3"></div>');
    $('#alertContainer').html(alertHtml);
  }
}

$(document).ready(function() {
  // Auto-collapse navbar on mobile when a nav link is clicked.
  $('.navbar-nav a').on('click', function() {
    $('.navbar-collapse').collapse('hide');
  });
  
  // Initialize DataTables for every table with the class 'datatable'
  if ($('.datatable').length) {
    $('.datatable').each(function() {
      // Base configuration for all DataTables.
      var options = {
        paging: true,
        ordering: true,
        searching: true,
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]]
      };
      // If this table has id 'salesTable', add sorting by sale date descending (column index 4)
      if ($(this).attr('id') === 'salesTable') {
        options.order = [[4, 'desc']];
      }
      // If this table has id 'inventoryTable', sort by product name ascending (column index 1)
      if ($(this).attr('id') === 'inventoryTable') {
        options.order = [[1, 'asc']];
      }
      // If this table has id 'transactionsTable', sort by transaction date descending (column index 3)
      if ($(this).attr('id') === 'transactionsTable') {
        options.order = [[3, 'desc']];
      }
      // If this table has id 'rafflesTable', sort by start date descending (column index 2)
      if ($(this).attr('id') === 'rafflesTable') {
        options.order = [[2, 'desc']];
        options.responsive = true;
      }
      $(this).DataTable(options);
    });
  }
});
