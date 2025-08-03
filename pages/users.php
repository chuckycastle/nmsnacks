<?php
// pages/users.php - User listing content only.
// This file is included by index.php, which already loads the header, navbar, and footer.
$roleFilter = isset($_GET['role']) ? $_GET['role'] : 'all';
?>
<div class="container mt-2">
  <h1 class="mb-4">Manage Users</h1>

  <!-- Filter Buttons -->
  <div class="mb-3">
    <a href="index.php?page=users&role=all" class="btn btn-outline-primary <?php echo ($roleFilter=='all') ? 'active' : ''; ?>">All</a>
    <a href="index.php?page=users&role=admin" class="btn btn-outline-primary <?php echo ($roleFilter=='admin') ? 'active' : ''; ?>">Admins</a>
    <a href="index.php?page=users&role=seller" class="btn btn-outline-primary <?php echo ($roleFilter=='seller') ? 'active' : ''; ?>">Sellers</a>
    <a href="index.php?page=users&role=customer" class="btn btn-outline-primary <?php echo ($roleFilter=='customer') ? 'active' : ''; ?>">Customers</a>
  </div>

  <!-- Button to trigger Add User Modal -->
  <button class="btn btn-primary mb-3" data-bs-toggle="modal" data-bs-target="#addUserModal">Add New User</button>
  
  <!-- User Listing Table -->
  <div class="table-responsive">
    <table class="table table-bordered table-striped datatable" id="usersTable">
      <thead>
        <tr>
          <th>Name</th>
          <th>Username</th>
          <th>Email</th>
          <th>Role</th>
          <th>Created At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php
        if ($roleFilter == 'all') {
            // Using UNION ALL with a common key "user_id"
            $stmt = $pdo->query("
              SELECT user_id AS user_id, name, username, email, role, created_at FROM users
              UNION ALL
              SELECT customer_id AS user_id, name, '' AS username, '' AS email, 'customer' AS role, created_at FROM customers
              ORDER BY created_at DESC
            ");
        } elseif ($roleFilter == 'customer') {
            $stmt = $pdo->query("SELECT customer_id AS user_id, name, '' AS username, '' AS email, 'customer' AS role, created_at FROM customers ORDER BY created_at DESC");
        } else {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE role = ? ORDER BY created_at DESC");
            $stmt->execute([$roleFilter]);
        }
        while ($user = $stmt->fetch()):
            // Normalize the record: if the record is a customer, ensure missing fields are set.
            if ($roleFilter == 'customer' || (isset($user['role']) && $user['role'] == 'customer')) {
                $userData = [
                    'user_id'    => $user['user_id'],
                    'name'       => $user['name'],
                    'username'   => '',
                    'email'      => '',
                    'role'       => 'customer',
                    'created_at' => $user['created_at']
                ];
            } else {
                $userData = $user;
            }
        ?>
        <tr data-user='<?php echo json_encode($userData); ?>'>
          <td><?php echo htmlspecialchars($userData['name']); ?></td>
          <td><?php echo htmlspecialchars($userData['username']); ?></td>
          <td><?php echo htmlspecialchars($userData['email']); ?></td>
          <td><?php echo htmlspecialchars($userData['role']); ?></td>
          <td><?php echo htmlspecialchars($userData['created_at']); ?></td>
          <td>
            <!-- Edit button: triggers the Edit User modal -->
            <button class="btn btn-sm btn-warning edit-user-btn" data-user='<?php echo json_encode($userData); ?>'>Edit</button>
            <!-- Delete button: triggers AJAX deletion -->
            <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="<?php echo $userData['user_id']; ?>">Delete</button>
          </td>
        </tr>
        <?php endwhile; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Include the modal partials -->
<?php include 'inc/partials/modals/add_user_modal.php'; ?>
<?php include 'inc/partials/modals/edit_user_modal.php'; ?>
