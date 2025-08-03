<?php
// pages/charts.php
$pageTitle = "Sales Dashboard - Charts";
$activePage = "charts";
?>
<div class="container mt-4">
  <h1 class="mb-4">Sales Dashboard - Charts</h1>
  
  <!-- Date Filter Form with Preset Options -->
  <form id="chartsFilterForm" class="row g-3 mb-4">
    <input type="hidden" name="page" value="charts">
    
    <!-- Preset Dropdown -->
    <div class="col-auto">
      <label for="presetFilter" class="col-form-label">Preset:</label>
    </div>
    <div class="col-auto">
      <select id="presetFilter" class="form-select">
        <option value="custom" selected>Custom</option>
        <option value="this_week">This Week</option>
        <option value="last_week">Last Week</option>
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="ytd">Year to Date</option>
        <option value="all">All</option>
      </select>
    </div>
    
    <!-- Custom Date Inputs -->
    <div class="col-auto">
      <label for="start_date" class="col-form-label">Start Date:</label>
    </div>
    <div class="col-auto">
      <input type="date" class="form-control" name="start_date" id="start_date">
    </div>
    <div class="col-auto">
      <label for="end_date" class="col-form-label">End Date:</label>
    </div>
    <div class="col-auto">
      <input type="date" class="form-control" name="end_date" id="end_date">
    </div>
    <div class="col-auto">
      <button type="submit" class="btn btn-primary">Filter</button>
    </div>
  </form>
  
  <!-- Container for Charts (will be populated dynamically) -->
  <div id="chartsContainer"></div>
</div>
