<?php
// index.php - Front Controller for authenticated pages
require 'inc/auth.php';
require 'inc/config.php';
require 'inc/functions.php';

// Determine which page to display; default is dashboard.
$page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';

// Set page title and active page for navbar.
switch ($page) {
    case 'users':
        if (isset($_GET['action']) && $_GET['action'] == 'create') {
            $pageTitle = "Add New User - NMSnacks";
        } else {
            $pageTitle = "Manage Users - NMSnacks";
        }
        $activePage = "users";
        break;
    case 'sales':
        $pageTitle = "Manage Sales - NMSnacks";
        $activePage = "sales";
        break;
    case 'inventory':
        $pageTitle = "Manage Inventory - NMSnacks";
        $activePage = "inventory";
        break;
    case 'bundles':
        $pageTitle = "Manage Bundles - NMSnacks";
        $activePage = "bundles";
        break;
    case 'restock':
        $pageTitle = "Restock Inventory - NMSnacks";
        $activePage = "inventory";
        break;
    case 'add_product':
        $pageTitle = "Add New Product - NMSnacks";
        $activePage = "inventory";
        break;
    case 'edit_product':
        $pageTitle = "Edit Product - NMSnacks";
        $activePage = "inventory";
        break;
    case 'pos':
        $pageTitle = "Point of Sale - NMSnacks";
        $activePage = "dashboard";
        break;
    case 'charts':
        $pageTitle = "Sales Dashboard - Charts";
        $activePage = "charts";
        break;
    case 'bookkeeping':
        $pageTitle = "Bookkeeping Dashboard - NMSnacks";
        $activePage = "bookkeeping";
        break;
    case 'raffles':
        $pageTitle = "Manage Raffles - NMSnacks";
        $activePage = "raffles";
        break;
    case 'dashboard':
    default:
        $pageTitle = "NMSnacks Admin Dashboard";
        $activePage = "dashboard";
        $page = 'dashboard';
        break;
}

// Determine if this is an AJAX request.
$isAjax = isset($_GET['ajax']) || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
            strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest');

// For non-AJAX requests, include header and navbar from partials.
if (!$isAjax) {
    require 'inc/partials/header.php';
    require 'inc/partials/navbar.php';
    echo "<div id='alertContainer' class='container mt-3'></div>";
}

// Determine the page file from the pages directory.
$pageFile = "pages/{$page}.php";
if (file_exists($pageFile)) {
    require $pageFile;
} else {
    echo "<div class='container content-wrapper mt-2'><div class='alert alert-danger'>Page not found.</div></div>";
}

// For non-AJAX requests, include the footer.
if (!$isAjax) {
    require 'inc/partials/footer.php';
}
?>
