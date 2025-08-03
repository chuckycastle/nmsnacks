// js/sales.js

// ------------------------------
// Register custom plugin to draw center text in donut charts.
const centerTextPlugin = {
  id: 'centerTextPlugin',
  beforeDraw: function(chart) {
    if (chart.config.options.plugins && chart.config.options.plugins.centerTextPlugin) {
      const centerConfig = chart.config.options.plugins.centerTextPlugin;
      const txt = centerConfig.text;
      const fontStyle = centerConfig.fontStyle || 'Arial';
      const color = centerConfig.color || '#000';
      const maxFontSize = centerConfig.maxFontSize || 16;
      const sidePadding = centerConfig.sidePadding || 20;
      
      const ctx = chart.ctx;
      const centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
      const centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.font = "bold " + maxFontSize + "px " + fontStyle;
      
      // Split text into lines for multi-line support.
      const lines = txt.split("\n");
      const lineHeight = maxFontSize * 1.2;
      const textHeight = lines.length * lineHeight;
      let startY = centerY - (textHeight / 2) + (lineHeight / 2);
      lines.forEach(function(line) {
        ctx.fillText(line, centerX, startY);
        startY += lineHeight;
      });
      ctx.restore();
    }
  }
};
Chart.register(centerTextPlugin);

// ------------------------------
// Helper function to display Bootstrap alerts.
function showAlert(type, message) {
  const alertHtml = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  if ($('#alertContainer').length) {
    $('#alertContainer').html(alertHtml);
  } else {
    $('body').prepend('<div id="alertContainer" class="container mt-3"></div>');
    $('#alertContainer').html(alertHtml);
  }
  setTimeout(function() {
    $('.alert').alert('close');
  }, 5000);
}

$(document).ready(function() {

  // ------------------------------
  // AJAX: Edit Sale via modal.
  $('#editSaleForm').on('submit', function(e) {
    e.preventDefault();
    const formData = {
      sale_id: $('#editSaleModal #sale_id').val(),
      buyer: $('#editSaleModal #buyer').val().trim(),
      product_id: $('#editSaleModal #product_id').val(),
      quantity: $('#editSaleModal #quantity').val(),
      unit_sale_price: $('#editSaleModal #unit_sale_price').val(),
      payment_status: $('#editSaleModal #payment_status').val(),
      sale_date: $('#editSaleModal #sale_date').val(),
      payment_received_by: $('#editSaleModal #payment_received_by').val().trim(),
      payment_method: $('#editSaleModal #payment_method').val(),
      notes: $('#editSaleModal #notes').val().trim()
    };
    fetch('ajax/sales_ajax.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('success', data.message);
        var editModal = bootstrap.Modal.getInstance(document.getElementById('editSaleModal'));
        editModal.hide();
        // Optionally, update the sale row in the table dynamically.
      } else {
        showAlert('danger', "Error: " + data.message);
      }
    })
    .catch(err => {
      console.error("Error:", err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });

  // Populate Edit Sale modal when Edit button is clicked.
  $(document).on('click', '.edit-sale-btn', function() {
    const saleData = $(this).data('sale');
    $('#editSaleModal #sale_id').val(saleData.sale_id);
    $('#editSaleModal #buyer').val(saleData.buyer);
    $('#editSaleModal #product_id').val(saleData.product_id);
    $('#editSaleModal #quantity').val(saleData.quantity);
    $('#editSaleModal #unit_sale_price').val(saleData.unit_sale_price);
    $('#editSaleModal #payment_status').val(saleData.payment_status);
    $('#editSaleModal #sale_date').val(saleData.sale_date);
    $('#editSaleModal #payment_method').val(saleData.payment_method);
    $('#editSaleModal #payment_received_by').val(saleData.payment_received_by);
    $('#editSaleModal #notes').val(saleData.notes);
    var editModal = new bootstrap.Modal(document.getElementById('editSaleModal'));
    editModal.show();
  });

  // ------------------------------
  // AJAX: Delete Sale.
  $(document).on('click', '.delete-sale-btn', function() {
    const saleId = $(this).data('sale-id');
    if (!confirm("Are you sure you want to delete this sale?")) return;
    fetch('ajax/sales_ajax.php?sale_id=' + encodeURIComponent(saleId), {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('success', data.message);
        var table = $('#salesTable').DataTable();
        table.rows().every(function() {
          var rowNode = this.node();
          var storedSale = $(rowNode).data('sale');
          if (storedSale && storedSale.sale_id == saleId) {
            this.remove();
          }
        });
        table.draw(false);
      } else {
        showAlert('danger', "Error: " + data.message);
      }
    })
    .catch(err => {
      console.error("Error:", err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });

  // ------------------------------
  // AJAX: View Receipt.
  $(document).on('click', '.view-receipt-btn', function() {
    const batch = $(this).data('batch');
    if (!batch) {
      showAlert('warning', "No batch information available.");
      return;
    }
    var receiptModal = new bootstrap.Modal(document.getElementById('viewReceiptModal'));
    $('#receiptContent').html('<div class="text-center"><span class="spinner-border" role="status"></span></div>');
    receiptModal.show();
    fetch('ajax/sales_receipt_ajax.php?batch=' + encodeURIComponent(batch))
    .then(response => response.json())
    .then(data => {
      if(data.success) {
        let html = `<h2>Receipt</h2>
          <p><strong>Buyer:</strong> ${data.data.buyer}</p>
          <p><strong>Date:</strong> ${data.data.sale_date}</p>
          <p><strong>Seller:</strong> ${data.data.seller_name}</p>
          <p><strong>Payment Method:</strong> ${data.data.payment_method}</p>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>`;
        data.data.items.forEach(item => {
          html += `<tr>
              <td>${item.product_name}</td>
              <td>${item.quantity}</td>
              <td>${item.unit_sale_price}</td>
              <td>${item.total.toFixed(2)}</td>
            </tr>`;
        });
        html += `</tbody></table>
          <p class="total">Grand Total: $${data.data.grand_total.toFixed(2)}</p>
          <p style="text-align:center;">Thank you for your purchase!</p>`;
        $('#receiptContent').html(html);
      } else {
        $('#receiptContent').html(`<p class="text-danger">Error: ${data.message}</p>`);
      }
    })
    .catch(err => {
      console.error("Error:", err);
      $('#receiptContent').html('<p class="text-danger">An unexpected error occurred.</p>');
    });
  });

  // ------------------------------
  // AJAX: View Metrics.
  // This handler now renders a grouped bar chart that compares the current sale
  // to all purchases made by the same buyer, and displays the donut chart below.
  $(document).on('click', '.view-metrics-btn', function() {
    const batch = $(this).data('batch');
    if (!batch) {
      showAlert('warning', "No batch information available.");
      return;
    }
    var metricsModal = new bootstrap.Modal(document.getElementById('viewMetricsModal'));
    $('#metricsContent').html('<div class="text-center"><span class="spinner-border" role="status"></span></div>');
    metricsModal.show();
    fetch('ajax/sales_metrics_ajax.php?batch=' + encodeURIComponent(batch))
    .then(response => response.json())
    .then(data => {
      if(data.success) {
        let html = `<h2>Sale Metrics</h2>
          <p><strong>Buyer:</strong> ${data.data.buyer}</p>
          <p><strong>Date:</strong> ${data.data.sale_date}</p>
          <p><strong>Seller:</strong> ${data.data.seller_name}</p>
          <p><strong>Payment Method:</strong> ${data.data.payment_method}</p>
          <div class="row">
            <div class="col-12 mb-4">
              <canvas id="verticalBarChart"></canvas>
            </div>
            <div class="col-12">
              <canvas id="donutChart"></canvas>
            </div>
          </div>`;
        $('#metricsContent').html(html);
        
        // Initialize grouped vertical bar chart.
        const verticalCtx = document.getElementById('verticalBarChart').getContext('2d');
        new Chart(verticalCtx, {
          type: 'bar',
          data: {
            labels: data.data.verticalChartLabels, // ["Total Spent", "Overall Profit"]
            datasets: [
              {
                label: 'This Sale',
                data: data.data.verticalChartData[0],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              },
              {
                label: 'All Purchases',
                data: data.data.verticalChartData[1],
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Amount ($)' }
              }
            },
            plugins: {
              title: { display: true, text: 'Aggregate Metrics Comparison' }
            }
          }
        });
        
        // Initialize donut chart with custom center text.
        const donutCtx = document.getElementById('donutChart').getContext('2d');
        new Chart(donutCtx, {
          type: 'doughnut',
          data: {
            labels: data.data.donutLabels,
            datasets: [{
              data: data.data.donutData,
              backgroundColor: data.data.donutColors
            }]
          },
          options: {
            plugins: {
              title: { display: true, text: 'Purchase Distribution' },
              centerTextPlugin: {
                text: data.data.centerText,
                fontStyle: 'Arial',
                color: '#000',
                maxFontSize: 16,
                sidePadding: 20
              }
            }
          }
        });
        
      } else {
        $('#metricsContent').html(`<p class="text-danger">Error: ${data.message}</p>`);
      }
    })
    .catch(err => {
      console.error("Error:", err);
      $('#metricsContent').html('<p class="text-danger">An unexpected error occurred.</p>');
    });
  });
});
