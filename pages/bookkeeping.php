<?php
// pages/bookkeeping.php - Bookkeeping Dashboard
$pageTitle = "Bookkeeping Dashboard - NMSnacks";
$activePage = "bookkeeping";

// Get date filter parameters from GET request
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
$end_date   = isset($_GET['end_date']) ? $_GET['end_date'] : '';

// Build date filter SQL conditions and parameter arrays
$date_filter_transactions = "";
$date_filter_sales = "";
$params_transactions = [];
$params_sales = [];

if (!empty($start_date) && !empty($end_date)) {
    // Validate dates (basic check)
    if (strtotime($start_date) !== false && strtotime($end_date) !== false) {
        $date_filter_transactions = " WHERE created_at BETWEEN ? AND ? ";
        $params_transactions[] = $start_date . ' 00:00:00'; // Start of day
        $params_transactions[] = $end_date . ' 23:59:59';   // End of day

        $date_filter_sales = " WHERE sale_date BETWEEN ? AND ? ";
        $params_sales[] = $start_date; // Assumes sale_date is DATE type
        $params_sales[] = $end_date;
    } else {
        // Reset dates if invalid format
        $start_date = '';
        $end_date = '';
    }
}

// ----- Transactions Aggregation -----
$sql = "
SELECT
   batch_id, -- Explicitly select batch_id
   MIN(id) AS id,
   MIN(type) AS type,
   SUM(amount) AS total_amount,
   MIN(created_at) AS created_at,
   GROUP_CONCAT(description SEPARATOR ' | ') AS descriptions,
   GROUP_CONCAT(product_id SEPARATOR ',') AS product_ids,
   GROUP_CONCAT(quantity SEPARATOR ',') AS quantities,
   GROUP_CONCAT(template_id SEPARATOR ',') AS template_ids,
   MIN(admin_user) AS admin_user
FROM transactions
" . $date_filter_transactions . "
GROUP BY batch_id
ORDER BY created_at DESC
";
$stmt = $pdo->prepare($sql);
$stmt->execute($params_transactions);
$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate overall totals and averages.
$totalIn = 0;
$totalOut = 0;
$countIn = 0;
$countOut = 0;
$dailyOutTotals = []; // Array to hold total 'out' amount per day

foreach ($transactions as $trans) {
    if ($trans['type'] === 'in') {
        $totalIn += floatval($trans['total_amount']);
        $countIn++;
    } else { // type === 'out'
        $totalOut += floatval($trans['total_amount']);
        $countOut++; // Still count batches if needed elsewhere

        // Sum amounts per day for daily average calculation
        $date = substr($trans['created_at'], 0, 10);
        if (!isset($dailyOutTotals[$date])) {
            $dailyOutTotals[$date] = 0;
        }
        $dailyOutTotals[$date] += floatval($trans['total_amount']);
    }
}
$netTotal = $totalIn - $totalOut;
$avgIn = $countIn > 0 ? $totalIn / $countIn : 0;

// Calculate average cost per day for 'out' transactions
$totalOutGroupedByDay = array_sum($dailyOutTotals); // This sum should equal $totalOut
$countOutDays = count($dailyOutTotals);
$avg_restock_cost_per_day = ($countOutDays > 0) ? $totalOutGroupedByDay / $countOutDays : 0;

// ----- Fetch Restock Budget ----- 
$stmtBudget = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
$stmtBudget->execute(['restock_budget']);
$restock_budget_row = $stmtBudget->fetch();
$restock_budget = $restock_budget_row ? floatval($restock_budget_row['setting_value']) : 0.00; // Default to 0 if not set

// ----- Calculate Splits ----- 
$splits_amount = ($netTotal - $restock_budget) / 2;

// ----- Cash Flow Chart Data -----
$sqlChart = "
SELECT DATE(created_at) AS day, -- Group by Day
       SUM(CASE WHEN type='in' THEN amount ELSE 0 END) AS total_in,
       SUM(CASE WHEN type='out' THEN amount ELSE 0 END) AS total_out
FROM transactions
" . $date_filter_transactions . " -- Apply filter
GROUP BY day -- Group by Day
ORDER BY day ASC -- Order by Day
";
$stmt = $pdo->prepare($sqlChart);
$stmt->execute($params_transactions);
$dailyData = $stmt->fetchAll(PDO::FETCH_ASSOC); // Renamed from monthlyData
$chartLabels = [];
$chartInData = [];
$chartOutData = [];
foreach ($dailyData as $row) { // Use dailyData
    $chartLabels[] = $row['day']; // Use day
    $chartInData[] = floatval($row['total_in']);
    $chartOutData[] = floatval($row['total_out']);
}

// ----- Build Mappings from Products and Users -----
$stmtCat = $pdo->query("SELECT product_id, category FROM products");
$productCategories = [];
while ($row = $stmtCat->fetch(PDO::FETCH_ASSOC)) {
    $productCategories[$row['product_id']] = $row['category'];
}

$stmtUser = $pdo->query("SELECT username, name FROM users");
$userMap = [];
while ($row = $stmtUser->fetch(PDO::FETCH_ASSOC)) {
    $userMap[$row['username']] = $row['name'];
}

$stmtProd = $pdo->query("SELECT product_id, name FROM products");
$prodMap = [];
while ($row = $stmtProd->fetch(PDO::FETCH_ASSOC)) {
    $prodMap[$row['product_id']] = $row['name'];
}

// ----- Product Category Breakdown (Sales only) -----
$categoryBreakdown = [];
foreach ($transactions as $trans) {
  if ($trans['type'] === 'in' && !empty($trans['product_ids']) && !empty($trans['quantities'])) {
    $prodIds = explode(',', $trans['product_ids']);
    $qtys = explode(',', $trans['quantities']);
    foreach ($prodIds as $i => $pid) {
      $qty = isset($qtys[$i]) ? (int)$qtys[$i] : 0;
      $cat = isset($productCategories[$pid]) ? $productCategories[$pid] : 'Unknown';
      if (!isset($categoryBreakdown[$cat])) {
          $categoryBreakdown[$cat] = 0;
      }
      $categoryBreakdown[$cat] += $qty;
    }
  }
}
$categoryLabels = array_keys($categoryBreakdown);
$categoryData = array_values($categoryBreakdown);

// ----- Sales Aggregated Data -----
$sqlSalesAgg = "SELECT SUM(quantity * unit_sale_price) AS total_sales, COUNT(sale_id) AS sale_count, AVG(unit_sale_price) AS avg_sale_price FROM sales" . $date_filter_sales;
$stmtSalesAgg = $pdo->prepare($sqlSalesAgg);
$stmtSalesAgg->execute($params_sales);
$salesAgg = $stmtSalesAgg->fetch(PDO::FETCH_ASSOC);

// ----- Sales Trend Data -----
$sqlSalesTrend = "SELECT DATE(sale_date) AS day, SUM(quantity * unit_sale_price) AS total_sales FROM sales" . $date_filter_sales . " GROUP BY day ORDER BY day ASC"; // Group/Order by Day
$stmtSalesTrend = $pdo->prepare($sqlSalesTrend);
$stmtSalesTrend->execute($params_sales);
$salesTrendData = $stmtSalesTrend->fetchAll(PDO::FETCH_ASSOC);
$salesTrendLabels = [];
$salesTrendValues = [];
foreach ($salesTrendData as $row) {
    $salesTrendLabels[] = $row['day']; // Use day
    $salesTrendValues[] = floatval($row['total_sales']);
}

// ----- Replenishment Data Derived from Transactions (type 'out') -----
// Remove the specific SQL query for replenishment aggregation ($sqlReplenAgg)
// Use the $totalOut and $countOut calculated earlier from the aggregated transactions.
$replenAgg = [
    'total_replenishment' => $totalOut,
    'replen_count_batches' => $countOut,
    'replen_count_days' => $countOutDays,
    'avg_restock_cost_per_day' => $avg_restock_cost_per_day
];

// Replenishment trend data.
$sqlReplenTrendBase = "
  SELECT DATE(created_at) AS day, SUM(amount) AS total_cost 
  FROM transactions";
$whereClausesReplen = ["type = 'out'"]; // Start with type filter
if (!empty($params_transactions)) {
    // $date_filter_transactions includes the WHERE keyword already
    // We need to extract the condition part after WHERE
    $dateCondition = substr($date_filter_transactions, strpos(strtolower($date_filter_transactions), 'where') + 5);
    $whereClausesReplen[] = "(" . trim($dateCondition) . ")"; // Add date condition
}
$sqlReplenTrend = $sqlReplenTrendBase . " WHERE " . implode(' AND ', $whereClausesReplen) . " GROUP BY day ORDER BY day ASC";

$stmtReplenTrend = $pdo->prepare($sqlReplenTrend);
$stmtReplenTrend->execute($params_transactions);
$replenTrendData = $stmtReplenTrend->fetchAll(PDO::FETCH_ASSOC);
$replenTrendLabels = []; // Use this for labels
$replenTrendValues = []; // Use this for values
foreach ($replenTrendData as $row) {
    $replenTrendLabels[] = $row['day']; // Use day
    $replenTrendValues[] = floatval($row['total_cost']);
}

// ----- Product-Level Average Unit Cost from Transactions (type 'out') -----
$sqlProductCostBase = "
  SELECT product_id, SUM(amount) AS total_cost, SUM(quantity) AS total_quantity 
  FROM transactions";
// Use the same $whereClausesReplen as it has the same filters (type='out' + dates)
$sqlProductCost = $sqlProductCostBase . " WHERE " . implode(' AND ', $whereClausesReplen) . " GROUP BY product_id";

$stmtProdCost = $pdo->prepare($sqlProductCost);
$stmtProdCost->execute($params_transactions); // Use same date params
$productCostsData = $stmtProdCost->fetchAll(PDO::FETCH_ASSOC);
$productCostMap = [];
foreach ($productCostsData as $row) {
    $qty = $row['total_quantity'];
    $total = $row['total_cost'];
    $productCostMap[$row['product_id']] = ($qty > 0) ? $total / $qty : 0;
}

// ----- Product-Level Average Sale Price -----
$sqlProductSale = "SELECT product_id, AVG(unit_sale_price) AS avg_unit_sale FROM sales" . $date_filter_sales . " GROUP BY product_id";
$stmtProdSale = $pdo->prepare($sqlProductSale);
$stmtProdSale->execute($params_sales);
$productSales = $stmtProdSale->fetchAll(PDO::FETCH_ASSOC);
$productSaleMap = [];
foreach ($productSales as $row) {
    $productSaleMap[$row['product_id']] = floatval($row['avg_unit_sale']);
}

// Build arrays for Product Profit Margin Chart.
$productMarginLabels = [];
$productAvgSales = [];
$productAvgCosts = [];
$productMargins = [];
foreach ($productSaleMap as $pid => $avgSale) {
    $productMarginLabels[] = isset($prodMap[$pid]) ? $prodMap[$pid] : $pid;
    $avgCost = isset($productCostMap[$pid]) ? $productCostMap[$pid] : 0;
    $productAvgSales[] = $avgSale;
    $productAvgCosts[] = $avgCost;
    $productMargins[] = $avgSale - $avgCost;
}

// ----- User-Centric Metrics -----
$sqlUserMetrics = "
  SELECT admin_user, 
         COUNT(*) AS trans_count, 
         SUM(amount) AS total_amount,
         SUM(CASE WHEN type='in' THEN amount ELSE 0 END) AS sales_amount,
         SUM(CASE WHEN type='out' THEN amount ELSE 0 END) AS restock_amount
  FROM transactions
" . $date_filter_transactions . "
  GROUP BY admin_user
";
$stmtUserMetrics = $pdo->prepare($sqlUserMetrics);
$stmtUserMetrics->execute($params_transactions);
$userMetrics = $stmtUserMetrics->fetchAll(PDO::FETCH_ASSOC);
?>

<!-- Output mappings and additional data for use in JS -->
<script>
// Pass current filter dates to JavaScript
var currentStartDate = <?php echo json_encode($start_date); ?>;
var currentEndDate = <?php echo json_encode($end_date); ?>;

var productMapping = <?php echo json_encode($prodMap, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var userMapping = <?php echo json_encode($userMap, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var salesAgg = <?php echo json_encode($salesAgg, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var replenAgg = <?php echo json_encode($replenAgg, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var salesTrendLabels = <?php echo json_encode($salesTrendLabels, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var salesTrendValues = <?php echo json_encode($salesTrendValues, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var replenTrendLabels = <?php echo json_encode($replenTrendLabels, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var replenTrendValues = <?php echo json_encode($replenTrendValues, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var productMarginLabels = <?php echo json_encode($productMarginLabels, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var productAvgSales = <?php echo json_encode($productAvgSales, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var productAvgCosts = <?php echo json_encode($productAvgCosts, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var productMargins = <?php echo json_encode($productMargins, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var userPerformanceData = <?php echo json_encode($userMetrics, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
var cashFlowLabels = <?php echo json_encode($chartLabels); ?>; // Pass daily labels
var cashFlowInData = <?php echo json_encode($chartInData); ?>;
var cashFlowOutData = <?php echo json_encode($chartOutData); ?>;
var restockBudget = <?php echo json_encode($restock_budget); ?>; // Pass budget to JS
var currentSplitsAmount = <?php echo json_encode($splits_amount); ?>; // Pass calculated splits to JS
</script>

<div class="container mt-4">
  <h1 class="mb-4">Bookkeeping Dashboard</h1>
  
  <!-- Date Filter Form -->
  <form id="bookkeepingFilterForm" class="row g-3 mb-4 align-items-center" method="GET">
    <input type="hidden" name="page" value="bookkeeping"> <!-- Set page value -->
    
    <!-- Preset Dropdown -->
    <div class="col-auto">
      <label for="presetFilter" class="col-form-label">Preset:</label>
    </div>
    <div class="col-auto">
      <select id="presetFilter" class="form-select">
        <option value="custom" selected>Custom</option>
        <option value="today">Today</option>
        <option value="this_week">This Week</option>
        <option value="last_week">Last Week</option>
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="ytd">Year to Date</option>
        <option value="all">All Time</option>
      </select>
    </div>
    
    <!-- Custom Date Inputs -->
    <div class="col-auto">
      <label for="start_date" class="col-form-label">Start:</label>
    </div>
    <div class="col-auto">
      <input type="date" class="form-control" name="start_date" id="start_date" value="<?php echo htmlspecialchars($start_date); ?>">
    </div>
    <div class="col-auto">
      <label for="end_date" class="col-form-label">End:</label>
    </div>
    <div class="col-auto">
      <input type="date" class="form-control" name="end_date" id="end_date" value="<?php echo htmlspecialchars($end_date); ?>">
    </div>
    <div class="col-auto">
      <button type="submit" class="btn btn-primary">Filter</button>
    </div>
     <div class="col-auto">
      <a href="index.php?page=bookkeeping" class="btn btn-secondary">Clear</a> <!-- Clear button -->
    </div>
  </form>
  
  <!-- Dashboard Widgets -->
  <div class="row my-4">
    <!-- Transaction KPIs -->
    <div class="col-md-3"> <!-- Adjusted width to 3 -->
      <div class="card text-bg-success mb-3">
        <div class="card-body">
          <h5 class="card-title">Total Money In</h5>
          <p class="card-text fs-4 fw-bold">$<?php echo number_format($totalIn, 2); ?></p> <!-- Added formatting classes -->
        </div>
      </div>
    </div>
    <div class="col-md-3"> <!-- Adjusted width to 3 -->
      <div class="card text-bg-danger mb-3">
        <div class="card-body">
          <h5 class="card-title">Total Money Out</h5>
          <p class="card-text fs-4 fw-bold">$<?php echo number_format($totalOut, 2); ?></p> <!-- Added formatting classes -->
        </div>
      </div>
    </div>
    <div class="col-md-3"> <!-- Adjusted width to 3 -->
      <div class="card text-bg-info mb-3">
        <div class="card-body">
          <h5 class="card-title">Net Total</h5>
          <p class="card-text fs-4 fw-bold">$<?php echo number_format($netTotal, 2); ?></p> <!-- Added formatting classes -->
        </div>
      </div>
    </div>
    <div class="col-md-3"> <!-- Moved Restock Budget Card Here -->
      <div class="card text-bg-secondary mb-3">
        <div class="card-body">
          <h5 class="card-title d-flex justify-content-between align-items-center">
            Restock Budget
            <button id="editBudgetBtn" class="btn btn-sm btn-light p-1" title="Edit Budget">
              <i class="bi bi-pencil-square"></i>
            </button>
          </h5>
          <p class="card-text fs-4 fw-bold" id="restockBudgetValue">$<?php echo number_format($restock_budget, 2); ?></p> <!-- Ensured formatting classes -->
        </div>
      </div>
    </div>
  </div>
  
  <!-- Sales & Restock Widgets -->
  <div class="row my-4">
    <div class="col-md-4"> <!-- Adjusted width to 4 -->
      <div class="card text-bg-primary mb-3">
        <div class="card-body">
          <h5 class="card-title">Total Sales Revenue</h5>
          <p class="card-text fs-4 fw-bold">$<?php echo number_format($salesAgg['total_sales'] ?? 0, 2); ?></p> <!-- Added formatting classes -->
        </div>
      </div>
    </div>
    <div class="col-md-4"> <!-- Adjusted width to 4 -->
      <div class="card text-bg-warning mb-3">
        <div class="card-body">
          <h5 class="card-title"># of Sales</h5>
          <p class="card-text fs-4 fw-bold"><?php echo number_format($salesAgg['sale_count'] ?? 0); ?></p> <!-- Added formatting classes -->
        </div>
      </div>
    </div>
    <div class="col-md-4"> <!-- Adjusted width to 4 -->
       <div class="card text-bg-dark mb-3">
         <div class="card-body">
           <h5 class="card-title d-flex justify-content-between align-items-center">
             Splits (Net - Budget)/2
             <button id="payoutBtn" class="btn btn-sm btn-success p-1" title="Record Payout" <?php echo ($splits_amount <= 0) ? 'disabled' : ''; ?>> <!-- Add Payout Btn, disable if <= 0 -->
                <i class="bi bi-cash-coin"></i> Payout
             </button>
           </h5>
           <p class="card-text fs-4 fw-bold">$<?php echo number_format($splits_amount, 2); ?></p> 
         </div>
       </div>
     </div>
  </div>
  
  <!-- User-Centric Metrics Table -->
  <h3>User Performance Metrics</h3>
  <table class="table table-bordered" id="userMetricsTable">
    <thead>
      <tr>
         <th>Admin User</th>
         <th># Transactions</th>
         <th>Sales Revenue</th>
         <th>Restock Cost</th>
         <th>Net Impact</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($userMetrics as $metric): ?>
         <tr>
            <td><?php echo isset($userMap[$metric['admin_user']]) ? $userMap[$metric['admin_user']] : $metric['admin_user']; ?></td>
            <td><?php echo $metric['trans_count']; ?></td>
            <td>$<?php echo number_format($metric['sales_amount'], 2); ?></td>
            <td>$<?php echo number_format($metric['restock_amount'], 2); ?></td>
            <td>$<?php echo number_format($metric['sales_amount'] - $metric['restock_amount'], 2); ?></td>
         </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  
  <!-- Vertical Bar Chart for User Performance -->
  <div class="mb-5" id="chartContainerUserPerformance">
    <canvas id="userPerformanceChart" width="400" height="200"></canvas>
  </div>
  
  <!-- Chart Options -->
  <div id="chartOptions" class="mb-3">
    <label><input type="checkbox" id="toggleCashFlow" checked> Cash Flow Chart</label>
    <label><input type="checkbox" id="toggleSalesTrend" checked> Sales Trend Chart</label>
    <label><input type="checkbox" id="toggleReplenTrend" checked> Replenishment Trend Chart</label>
    <label><input type="checkbox" id="toggleProductMargin" checked> Product Margin Chart</label>
  </div>
  
  <!-- Other Charts -->
  <div class="mb-5" id="chartContainerCashFlow">
    <canvas id="cashFlowChart" width="400" height="200"></canvas>
  </div>
  <div class="mb-5" id="chartContainerSalesTrend">
    <canvas id="salesTrendChart" width="400" height="200"></canvas>
  </div>
  <div class="mb-5" id="chartContainerReplenTrend">
    <canvas id="replenTrendChart" width="400" height="200"></canvas>
  </div>
  <div class="mb-5" id="chartContainerProductMargin">
    <canvas id="productMarginChart" width="400" height="200"></canvas>
  </div>
  
  <!-- Export CSV Button -->
  <div class="mb-3">
    <button id="exportCsvBtn" class="btn btn-outline-primary">Export Transactions CSV</button>
  </div>
  
  <!-- Transactions Table -->
  <h3 class="mt-5">Recent Transactions</h3>
  <table class="table table-bordered datatable" id="transactionsTable">
    <thead>
      <tr>
        <th>Type</th>
        <th>Total Amount</th>
        <th>Description</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($transactions as $trans): ?>
        <?php 
          $shortDate = substr($trans['created_at'], 0, 10);
          $summary = ''; // Initialize summary
          if ($trans['type'] === 'in') {
              $descParts = explode(" | ", $trans['descriptions'] ?? '');
              $firstDesc = $descParts[0];
              $buyerName = "Unknown";
              if (preg_match('/\(Buyer:\s*([^)]+)\)/', $firstDesc, $matches)) {
                  $buyerName = trim($matches[1]);
              }
              // Handle cases where buyer name might be empty if transaction wasn't from POS
              if (empty($buyerName) && isset($trans['admin_user'])) {
                   // Fallback or alternative description if buyer is unknown but admin exists
                   $adminName = isset($userMap[$trans['admin_user']]) ? $userMap[$trans['admin_user']] : $trans['admin_user'];
                   $prefix = "Sale recorded by $adminName "; 
              } else if (empty($buyerName)){
                   $prefix = "Sale ";
              } else {
                   $prefix = "$buyerName purchased ";
              }
              
              // Add item details similar to restock
              if (!empty($trans['product_ids']) && !empty($trans['quantities'])) {
                  $prodIds = explode(',', $trans['product_ids']);
                  $qtys = explode(',', $trans['quantities']);
                  $catTotals = [];
                  foreach ($prodIds as $i => $pid) {
                      $qty = isset($qtys[$i]) ? (int)$qtys[$i] : 0;
                      $cat = isset($productCategories[$pid]) ? $productCategories[$pid] : 'Unknown';
                      if (!isset($catTotals[$cat])) {
                          $catTotals[$cat] = 0;
                      }
                      $catTotals[$cat] += $qty;
                  }
                  $parts = [];
                  foreach ($catTotals as $cat => $totalQty) {
                      $parts[] = "$totalQty $cat";
                  }
                  $summary = $prefix . implode(' and ', $parts);
              } else {
                   // Fallback description if no product details for 'in' type
                   $summary = $prefix . "(Details unavailable)"; 
                   if (!empty($trans['descriptions'])) $summary = $trans['descriptions']; // Or use raw description
              }

          } else { // type === 'out'
              if (isset($trans['batch_id']) && strpos($trans['batch_id'], 'payout_') === 0) {
                  $summary = "Profit payout"; 
              } else {
                  $sellerName = isset($userMap[$trans['admin_user']]) ? $userMap[$trans['admin_user']] : "Unknown";
                  $prefix = "$sellerName restocked ";
                  if (!empty($trans['product_ids']) && !empty($trans['quantities'])) {
                      $prodIds = explode(',', $trans['product_ids']);
                      $qtys = explode(',', $trans['quantities']);
                      $catTotals = [];
                      foreach ($prodIds as $i => $pid) {
                          $qty = isset($qtys[$i]) ? (int)$qtys[$i] : 0;
                          $cat = isset($productCategories[$pid]) ? $productCategories[$pid] : 'Unknown';
                          if (!isset($catTotals[$cat])) {
                              $catTotals[$cat] = 0;
                          }
                          $catTotals[$cat] += $qty;
                      }
                      $parts = [];
                      foreach ($catTotals as $cat => $totalQty) {
                          $parts[] = "$totalQty $cat";
                      }
                      $summary = $prefix . implode(' and ', $parts);
                  } else {
                      $summary = $prefix . "(Details unavailable)"; 
                      if (!empty($trans['descriptions'])) $summary = $trans['descriptions'];
                  }
              }
          }
          $transactionData = json_encode($trans, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
        ?>
        <tr data-transaction='<?php echo $transactionData; ?>'>
          <td><?php echo htmlspecialchars($trans['type']); ?></td>
          <td>$<?php echo number_format($trans['total_amount'], 2); ?></td>
          <td><?php echo htmlspecialchars($summary); ?></td>
          <td><?php echo $shortDate; ?></td>
          <td>
            <button class="btn btn-sm btn-info view-transaction-btn" data-transaction-id="<?php echo $trans['id']; ?>" data-bs-toggle="modal" data-bs-target="#viewTransactionModal">
              <i class="bi bi-eye"></i>
            </button>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<?php //include 'inc/partials/modals/edit_transaction_modal.php'; ?>
<?php include 'inc/partials/modals/view_transaction_modal.php'; ?>
<?php include 'inc/partials/modals/edit_budget_modal.php'; // Include the new modal ?>

<!-- Dynamic Chart Rendering with Chart.js -->
<script>
document.addEventListener("DOMContentLoaded", function() {
  // ----- Cash Flow Chart with Drill-Down -----
  const ctxCashFlow = document.getElementById('cashFlowChart').getContext('2d');
  const cashFlowChart = new Chart(ctxCashFlow, {
    type: 'line',
    data: {
      labels: cashFlowLabels, // Use daily labels passed from PHP
      datasets: [
        {
          label: 'Money In',
          data: cashFlowInData, // Use daily data
          borderColor: 'green',
          backgroundColor: 'rgba(0, 128, 0, 0.1)',
          fill: true
        },
        {
          label: 'Money Out',
          data: cashFlowOutData, // Use daily data
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      onClick: function(evt, elements) {
        if (elements.length > 0) {
          const index = elements[0].index;
          const selectedDate = this.data.labels[index];
          $('#transactionsTable').DataTable().search('^' + selectedDate, true, false).draw();
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Amount (USD)' }
        },
        x: { title: { display: true, text: 'Date' } } // Changed from Month to Date
      }
    }
  });
  
  // ----- Sales Trend Chart -----
  const ctxSalesTrend = document.getElementById('salesTrendChart').getContext('2d');
  const salesTrendChart = new Chart(ctxSalesTrend, {
    type: 'line',
    data: {
      labels: salesTrendLabels, // Use daily labels
      datasets: [{
        label: 'Total Sales Revenue',
        data: salesTrendValues, // Use daily values
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Sales Revenue (USD)' } },
        x: { title: { display: true, text: 'Date' } } // Changed from Month to Date
      }
    }
  });
  
  // ----- Replenishment Trend Chart -----
  const ctxReplenTrend = document.getElementById('replenTrendChart').getContext('2d');
  const replenTrendChart = new Chart(ctxReplenTrend, {
    type: 'line',
    data: {
      labels: replenTrendLabels, // Use daily labels
      datasets: [{
        label: 'Total Replenishment Cost',
        data: replenTrendValues, // Use daily values
        borderColor: 'orange',
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Cost (USD)' } },
        x: { title: { display: true, text: 'Date' } } // Changed from Month to Date
      }
    }
  });
  
  // ----- Product Margin Chart -----
  const ctxProductMargin = document.getElementById('productMarginChart').getContext('2d');
  const productMarginChart = new Chart(ctxProductMargin, {
    type: 'bar',
    data: {
      labels: productMarginLabels,
      datasets: [
        {
          label: 'Avg. Unit Sale Price',
          data: productAvgSales,
          backgroundColor: 'rgba(54, 162, 235, 0.3)'
        },
        {
          label: 'Avg. Unit Cost',
          data: productAvgCosts,
          backgroundColor: 'rgba(255, 99, 132, 0.3)'
        },
        {
          label: 'Profit Margin',
          data: productMargins,
          backgroundColor: 'rgba(75, 192, 192, 0.3)'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Product Profit Margins' },
        legend: { position: 'bottom' }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'USD' } }
      }
    }
  });
  
  // ----- User Performance Chart (Vertical Bar Chart) -----
  var userNames = [];
  var salesRevenues = [];
  var restockCosts = [];
  var netImpacts = [];
  userPerformanceData.forEach(function(metric) {
      var fullName = userMapping[metric.admin_user] || metric.admin_user;
      userNames.push(fullName);
      var sales = parseFloat(metric.sales_amount) || 0;
      var restock = parseFloat(metric.restock_amount) || 0;
      salesRevenues.push(sales);
      restockCosts.push(restock);
      netImpacts.push(sales - restock);
  });
  
  var ctxUser = document.getElementById('userPerformanceChart').getContext('2d');
  var userPerformanceChart = new Chart(ctxUser, {
      type: 'bar',
      data: {
          labels: userNames,
          datasets: [
              {
                  label: 'Sales Revenue',
                  data: salesRevenues,
                  backgroundColor: 'rgba(54, 162, 235, 0.5)'
              },
              {
                  label: 'Restock Cost',
                  data: restockCosts,
                  backgroundColor: 'rgba(255, 99, 132, 0.5)'
              },
              {
                  label: 'Net Impact',
                  data: netImpacts,
                  backgroundColor: 'rgba(75, 192, 192, 0.5)'
              }
          ]
      },
      options: {
          responsive: true,
          scales: {
              y: {
                  beginAtZero: true,
                  title: { display: true, text: 'Amount (USD)' }
              }
          },
          plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: 'User Performance Metrics' }
          }
      }
  });
  
  // ----- Chart Options: Toggle Visibility -----
  document.getElementById('toggleCashFlow').addEventListener('change', function() {
    document.getElementById('chartContainerCashFlow').style.display = this.checked ? 'block' : 'none';
  });
  document.getElementById('toggleSalesTrend').addEventListener('change', function() {
    document.getElementById('chartContainerSalesTrend').style.display = this.checked ? 'block' : 'none';
  });
  document.getElementById('toggleReplenTrend').addEventListener('change', function() {
    document.getElementById('chartContainerReplenTrend').style.display = this.checked ? 'block' : 'none';
  });
  document.getElementById('toggleProductMargin').addEventListener('change', function() {
    document.getElementById('chartContainerProductMargin').style.display = this.checked ? 'block' : 'none';
  });
});
</script>

<?php include 'inc/partials/modals/edit_budget_modal.php'; ?>