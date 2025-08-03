// js/charts.js

// ------------------------------
// Define color arrays.
var profitColors = [
  'rgba(255, 99, 132, 0.6)',
  'rgba(54, 162, 235, 0.6)',
  'rgba(255, 206, 86, 0.6)',
  'rgba(75, 192, 192, 0.6)',
  'rgba(153, 102, 255, 0.6)'
];
var profitBorderColors = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)'
];

var sellerColors = [
  'rgba(255, 159, 64, 0.6)',
  'rgba(255, 99, 132, 0.6)',
  'rgba(54, 162, 235, 0.6)',
  'rgba(75, 192, 192, 0.6)',
  'rgba(153, 102, 255, 0.6)',
  'rgba(255, 205, 86, 0.6)'
];
var sellerBorderColors = [
  'rgba(255, 159, 64, 1)',
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 205, 86, 1)'
];

// ------------------------------
// Register custom plugin to draw center text in doughnut charts.
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
      
      // For multi-line text, split by newline.
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

// ------------------------------
// Preset Filter Listener.
document.getElementById('presetFilter').addEventListener('change', function() {
  const preset = this.value;
  let startDate, endDate;
  const today = new Date();
  
  if (preset === 'this_week') {
    const dayOfWeek = today.getDay();
    startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek);
    endDate = today;
  } else if (preset === 'last_week') {
    const dayOfWeek = today.getDay();
    endDate = new Date(today);
    endDate.setDate(today.getDate() - dayOfWeek - 1);
    startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
  } else if (preset === 'this_month') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = today;
  } else if (preset === 'last_month') {
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth(), 0);
  } else if (preset === 'ytd') {
    startDate = new Date(today.getFullYear(), 0, 1);
    endDate = today;
  } else if (preset === 'all') {
    startDate = '';
    endDate = '';
  } else {
    return;
  }
  
  // Helper to format a date as YYYY-MM-DD.
  const formatDate = date => {
    if (!date) return '';
    let month = '' + (date.getMonth() + 1),
        day = '' + date.getDate(),
        year = date.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  };
  
  document.getElementById('start_date').value = formatDate(startDate);
  document.getElementById('end_date').value = formatDate(endDate);
});

// ------------------------------
// Function to update all charts via AJAX.
function updateCharts() {
  const startDate = document.getElementById('start_date').value;
  const endDate = document.getElementById('end_date').value;
  
  // AJAX call to our charts endpoint.
  fetch('ajax/charts_ajax.php?start_date=' + encodeURIComponent(startDate) + '&end_date=' + encodeURIComponent(endDate))
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Build the charts container HTML.
        let html = `
          <div class="card mb-4">
            <div class="card-header">Best Selling Products (Top 10 by Quantity)</div>
            <div class="card-body">
              <canvas id="bestSellingChart"></canvas>
            </div>
          </div>
          <div class="row mb-4">
            <div class="col-md-12">
              <div class="card">
                <div class="card-header">Profit Margin by Category (Horizontal Bar Chart)</div>
                <div class="card-body">
                  <canvas id="profitMarginBarChart"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="card mb-4">
            <div class="card-header">Daily Revenue Trend</div>
            <div class="card-body">
              <canvas id="dailyRevenueChart"></canvas>
            </div>
          </div>
          <div class="card mb-4">
            <div class="card-header">Sales by Product (Selected Range)</div>
            <div class="card-body">
              <table id="productSalesTable" class="table table-striped table-bordered" style="width:100%">
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Quantity Sold</th>
                        <th>Total Revenue ($)</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Data will be populated here -->
                </tbody>
              </table>
            </div>
          </div>
        `;
        document.getElementById('chartsContainer').innerHTML = html;
        
        // Initialize Best Selling Products Chart.
        const ctxBestSelling = document.getElementById('bestSellingChart').getContext('2d');
        new Chart(ctxBestSelling, {
          type: 'bar',
          data: {
            labels: data.data.bestSellingProducts,
            datasets: [{
              label: 'Quantity Sold',
              data: data.data.bestSellingQuantities,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            },
            {
              label: 'Total Revenue ($)',
              data: data.data.bestSellingRevenues,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              type: 'line',
              fill: false
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Quantity / Revenue' }
              }
            },
            plugins: {
              title: { display: true, text: 'Best Selling Products' }
            }
          }
        });
        
        // Initialize Profit Margin by Category - Horizontal Bar Chart.
        const ctxProfitBar = document.getElementById('profitMarginBarChart').getContext('2d');
        new Chart(ctxProfitBar, {
          type: 'bar',
          data: {
            labels: data.data.profitMarginCategories,
            datasets: [{
              label: 'Profit Margin (%)',
              data: data.data.profitMarginValues,
              backgroundColor: profitColors.slice(0, data.data.profitMarginCategories.length),
              borderColor: profitBorderColors.slice(0, data.data.profitMarginCategories.length),
              borderWidth: 1
            }]
          },
          options: {
            indexAxis: 'y',
            scales: {
              x: {
                beginAtZero: true,
                title: { display: true, text: 'Profit Margin (%)' }
              }
            },
            plugins: {
              title: { display: true, text: 'Profit Margin by Category' }
            }
          }
        });
        
        // Initialize Daily Revenue Trend Chart - Mixed Chart with Dual Axes.
        const ctxDailyRevenue = document.getElementById('dailyRevenueChart').getContext('2d');
        new Chart(ctxDailyRevenue, {
          type: 'bar',
          data: {
            labels: data.data.dailyDates,
            datasets: [
              {
                type: 'bar',
                label: 'Total Sales',
                data: data.data.dailySales,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                yAxisID: 'ySales'
              },
              {
                type: 'line',
                label: 'Daily Revenue ($)',
                data: data.data.dailyRevenues,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                yAxisID: 'yRevenue'
              }
            ]
          },
          options: {
            scales: {
              yRevenue: {
                type: 'linear',
                position: 'left',
                beginAtZero: true,
                title: { display: true, text: 'Revenue ($)' }
              },
              ySales: {
                type: 'linear',
                position: 'right',
                beginAtZero: true,
                title: { display: true, text: 'Total Sales' },
                grid: { drawOnChartArea: false }
              },
              x: {
                title: { display: true, text: 'Date' },
                stacked: true
              }
            },
            plugins: {
              title: { display: true, text: 'Daily Revenue Trend' }
            }
          }
        });
        
        // Populate and Initialize Product Sales Table
        const productTableBody = document.querySelector('#productSalesTable tbody');
        productTableBody.innerHTML = '';
        data.data.productSalesByDate.forEach(product => {
            const row = productTableBody.insertRow();
            row.insertCell().textContent = product.product_name;
            row.insertCell().textContent = product.quantity_sold;
            // Format revenue as currency
            row.insertCell().textContent = parseFloat(product.total_revenue).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        });
        
        // Destroy previous DataTable instance if it exists, then initialize
        if ($.fn.DataTable.isDataTable('#productSalesTable')) {
            $('#productSalesTable').DataTable().destroy();
        }
        $('#productSalesTable').DataTable({
            "order": [[ 2, "desc" ]],
            "pageLength": 10
        });
        
      } else {
        document.getElementById('chartsContainer').innerHTML = `<p class="text-danger">Error: ${data.message}</p>`;
      }
    })
    .catch(err => {
      console.error("Error:", err);
      document.getElementById('chartsContainer').innerHTML = '<p class="text-danger">An unexpected error occurred.</p>';
    });
}

// Bind the filter form submission to updateCharts.
$(document).ready(function() {
  $('#chartsFilterForm').on('submit', function(e) {
    e.preventDefault();
    updateCharts();
  });
  
  // Optionally trigger updateCharts on page load for default data.
  updateCharts();
});
