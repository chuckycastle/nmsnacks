<?php
// inc/partials/header.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- Mobile-friendly meta tag -->
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title><?php echo isset($pageTitle) ? $pageTitle : "NMSnacks"; ?></title>

  <!-- Favicon & App Icons -->
  <link rel="icon" type="image/png" sizes="32x32" href="img/logo/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="img/logo/favicon-16x16.png">
  <link rel="shortcut icon" href="img/logo/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="img/logo/apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">

  <!-- CSS Files -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
  <link rel="stylesheet" href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.css">
  <link rel="stylesheet" href="https://cdn.datatables.net/1.11.5/css/jquery.dataTables.min.css">
  <link rel="stylesheet" href="css/style.css"> <!-- Custom styles -->

  <!-- JavaScript Files -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js"></script>
  <script src="https://code.jquery.com/ui/1.13.2/jquery-ui.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.js"></script>
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top shadow-sm">
    <div class="container-fluid">
      <a class="navbar-brand" href="index.php?page=dashboard">
        <img src="img/logo/nms-logo.png" alt="NMSnacks Logo" height="40">
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
              aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
         <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
         <ul class="navbar-nav me-auto">
            <li class="nav-item">
               <a class="nav-link" href="index.php?page=dashboard">Dashboard</a>
            </li>
            <li class="nav-item">
               <a class="nav-link" href="index.php?page=users">Users</a>
            </li>
            <li class="nav-item">
               <a class="nav-link" href="index.php?page=sales">Sales</a>
            </li>
            <li class="nav-item">
               <a class="nav-link" href="index.php?page=inventory">Inventory</a>
            </li>
            <li class="nav-item">
               <a class="nav-link" href="index.php?page=charts">Charts</a>
            </li>
         </ul>
         <ul class="navbar-nav">
           <li class="nav-item">
             <span class="nav-link">Welcome, <?php echo $_SESSION['username'] ?? 'User'; ?></span>
           </li>
           <li class="nav-item">
             <a class="nav-link" href="logout.php">Logout</a>
           </li>
         </ul>
      </div>
    </div>
  </nav>
  <!-- Start of page-specific content; the content-wrapper applies top padding from style.css -->
  <div class="content-wrapper">
