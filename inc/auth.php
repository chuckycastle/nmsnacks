<?php
// inc/auth.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
// Block customers from accessing the application.
if ($_SESSION['role'] === 'customer') {
    header("Location: no_access.php");
    exit;
}
?>
