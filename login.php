<?php
session_start();
require 'inc/config.php';
if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}
$error = '';
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    if ($user && password_verify($password, $user['password'])) {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        header("Location: index.php");
        exit;
    } else {
        $error = "Invalid credentials. Please try again.";
    }
}
$pageTitle = "Login - NMSnacks";
require 'inc/partials/header.php';
?>
<div class="container mt-5" style="max-width: 400px;">
  <h2 class="mb-4 text-center">Login</h2>
  <?php if ($error != ''): ?>
    <div class="alert alert-danger" role="alert">
      <?php echo htmlspecialchars($error); ?>
    </div>
  <?php endif; ?>
  <form action="login.php" method="post">
       <div class="mb-3">
            <label for="username" class="form-label">Username</label>
            <input type="text" class="form-control" name="username" id="username" required>
       </div>
       <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" class="form-control" name="password" id="password" required>
       </div>
       <button type="submit" class="btn btn-primary w-100">Login</button>
  </form>
</div>
<?php require 'inc/partials/footer.php'; ?>