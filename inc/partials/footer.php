<?php
// inc/partials/footer.php
?>
  </div> <!-- End content-wrapper -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <?php
  // Conditionally load page-specific JavaScript files based on the active page.
  if (isset($activePage)) {
    if ($activePage === 'charts') {
        echo '<script src="js/charts.js"></script>';
    } elseif ($activePage === 'inventory') {
        echo '<script src="js/inventory.js"></script>';
    } elseif ($activePage === 'pos') {
        echo '<script src="js/pos.js"></script>';
    } elseif ($activePage === 'sales') {
        echo '<script src="js/sales.js"></script>';
    } elseif ($activePage === 'users') {
        echo '<script src="js/users.js"></script>';
    } elseif ($activePage === 'bookkeeping') {
      echo '<script src="js/bookkeeping.js"></script>';
    }
  }
  ?>
  <script src="js/main.js"></script>
</body>
</html>
