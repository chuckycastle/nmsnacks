<?php
// inc/partials/navbar.php
// $activePage should be set by the front controller (e.g. "dashboard", "users", "sales", "inventory", "charts", "replenishment")
?>
<nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top shadow-sm">
  <div class="container-fluid">
    <a class="navbar-brand" href="index.php?page=dashboard">NMSnacks</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link <?php echo ($activePage == 'dashboard' ? 'active' : ''); ?>" href="index.php?page=dashboard">Dashboard</a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?php echo ($activePage == 'users' ? 'active' : ''); ?>" href="index.php?page=users">Users</a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?php echo ($activePage == 'sales' ? 'active' : ''); ?>" href="index.php?page=sales">Sales</a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?php echo ($activePage == 'inventory' ? 'active' : ''); ?>" href="index.php?page=inventory">Inventory</a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?php echo ($activePage == 'charts' ? 'active' : ''); ?>" href="index.php?page=charts">Charts</a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?php echo ($activePage == 'bookkeeping' ? 'active' : ''); ?>" href="index.php?page=bookkeeping">Bookkeeping</a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?php echo ($activePage == 'raffles' ? 'active' : ''); ?>" href="index.php?page=raffles">Raffles</a>
        </li>
      </ul>
      <ul class="navbar-nav">
        <li class="nav-item">
          <span class="nav-link">Welcome, <?php echo htmlspecialchars($_SESSION['username']); ?>!</span>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="logout.php">Logout</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
