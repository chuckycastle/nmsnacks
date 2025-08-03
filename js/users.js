// js/users.js

$(document).ready(function() {
  // Validate the Create User form
  function validateCreateForm() {
    let valid = true;
    const name = $('#addUserModal #name').val().trim();
    const role = $('#addUserModal #role').val();
    
    if (name === '') {
      $('#addUserModal #name').addClass('is-invalid').removeClass('is-valid');
      valid = false;
    } else {
      $('#addUserModal #name').removeClass('is-invalid').addClass('is-valid');
    }
    
    if (role === '') {
      $('#addUserModal #role').addClass('is-invalid').removeClass('is-valid');
      valid = false;
    } else {
      $('#addUserModal #role').removeClass('is-invalid').addClass('is-valid');
    }
    
    if (role === 'admin' || role === 'seller') {
      $('#usernameDiv').show();
      $('#passwordDiv').show();
      
      const username = $('#addUserModal #username').val().trim();
      const password = $('#addUserModal #password').val().trim();
      
      if (username === '') {
        $('#addUserModal #username').addClass('is-invalid').removeClass('is-valid');
        valid = false;
      } else {
        $('#addUserModal #username').removeClass('is-invalid').addClass('is-valid');
      }
      if (password === '') {
        $('#addUserModal #password').addClass('is-invalid').removeClass('is-valid');
        valid = false;
      } else {
        $('#addUserModal #password').removeClass('is-invalid').addClass('is-valid');
      }
    } else {
      $('#usernameDiv').hide();
      $('#passwordDiv').hide();
      $('#addUserModal #username, #addUserModal #password').removeClass('is-invalid is-valid');
    }
    
    // Validate email if provided
    const email = $('#addUserModal #email').val().trim();
    if (email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        $('#addUserModal #email').addClass('is-invalid').removeClass('is-valid');
        valid = false;
      } else {
        $('#addUserModal #email').removeClass('is-invalid').addClass('is-valid');
      }
    } else {
      $('#addUserModal #email').removeClass('is-invalid is-valid');
    }
    
    $('#createUserBtn').prop('disabled', !valid);
    return valid;
  }

  $('#createUserForm input, #createUserForm select').on('input change', validateCreateForm);
  validateCreateForm();

  // Function to display Bootstrap alerts
  function showAlert(type, message) {
    // 'type' can be 'success', 'danger', 'warning', or 'info'
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

  // Function to add a new user row to the DataTable
  function addUserToTable(newUser) {
    var table = $('#usersTable').DataTable();
    newUser.created_at = new Date().toLocaleString();
    const actionButtons = `
      <button class="btn btn-sm btn-warning edit-user-btn" data-user='${JSON.stringify(newUser)}'>Edit</button>
      <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${newUser.user_id}">Delete</button>
    `;
    var newRowNode = table.row.add([
      newUser.name,
      newUser.username,
      newUser.email,
      newUser.role,
      newUser.created_at,
      actionButtons
    ]).draw().node();
    $(newRowNode).attr('data-user', JSON.stringify(newUser));
  }

  // AJAX: Create User (Add New User) without reloading the page
  $('#createUserForm').on('submit', function(e) {
    e.preventDefault();
    if (!validateCreateForm()) return;
    const formData = {
      name: $('#addUserModal #name').val().trim(),
      username: $('#addUserModal #username').val().trim(),
      email: $('#addUserModal #email').val().trim(),
      password: $('#addUserModal #password').val(),
      role: $('#addUserModal #role').val()
    };
    fetch('ajax/users_ajax.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      if(data.success) {
          showAlert('success', data.message);
          const newUser = {
            user_id: data.data.user_id,
            name: formData.name,
            username: formData.username,
            email: formData.email,
            role: formData.role
          };
          addUserToTable(newUser);
          $('#createUserForm')[0].reset();
          $('#createUserForm input, #createUserForm select').removeClass('is-valid');
          var addModal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
          addModal.hide();
      } else {
          showAlert('danger', "Error: " + data.message);
      }
    })
    .catch(err => {
        console.error("Error:", err);
        showAlert('danger', "An unexpected error occurred.");
    });
  });

  // When clicking an edit button, populate the edit modal with user data fetched fresh from the server.
  $(document).on('click', '.edit-user-btn', function() {
    const button = $(this);
    const userId = button.data('user').user_id; // Get user_id from the potentially stale data-user attribute

    // Show a simple loading state on the button
    button.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');

    // Fetch the latest user data from the server
    fetch('ajax/users_ajax.php?user_id=' + encodeURIComponent(userId))
      .then(response => response.json())
      .then(data => {
        button.prop('disabled', false).html('Edit'); // Restore button

        if (data.success) {
          const userData = data.data; // Use the fresh data from the server

          // Populate the modal fields
          $('#editUserModal #edit_user_id').val(userData.user_id);
          $('#editUserModal #edit_name').val(userData.name);
          $('#editUserModal #edit_role').val(userData.role);
          
          // Show/hide fields based on role and populate them
          if (userData.role === 'customer') {
            $('#editUserModal #edit_username').val('').closest('.mb-3').hide(); // Clear and hide
            $('#editUserModal #edit_email').val('').closest('.mb-3').hide();    // Clear and hide
            $('#editUserModal #edit_password').val('').closest('.mb-3').hide(); // Clear and hide
            $('#editCreditBalanceDiv').show();
            $('#editUserModal #edit_credit_balance').val(userData.credit_balance !== undefined ? parseFloat(userData.credit_balance).toFixed(2) : '0.00');
          } else { // Admin or Seller
            $('#editUserModal #edit_username').val(userData.username).closest('.mb-3').show();
            $('#editUserModal #edit_email').val(userData.email).closest('.mb-3').show();
            $('#editUserModal #edit_password').val('').closest('.mb-3').show(); // Clear password field, show parent
            $('#editCreditBalanceDiv').hide();
            $('#editUserModal #edit_credit_balance').val(''); // Clear credit balance
          }

          // Show the modal
          var editModal = new bootstrap.Modal(document.getElementById('editUserModal'));
          editModal.show();
          
        } else {
          showAlert('danger', "Error fetching user data: " + data.message);
        }
      })
      .catch(err => {
        button.prop('disabled', false).html('Edit'); // Restore button on error
        console.error("Error fetching user data:", err);
        showAlert('danger', "An unexpected error occurred while fetching user details.");
      });
  });

  // Add change listener for the role dropdown in the edit modal to toggle fields
  $('#editUserModal #edit_role').on('change', function() {
    const selectedRole = $(this).val();
    if (selectedRole === 'customer') {
      $('#editUserModal #edit_username').closest('.mb-3').hide();
      $('#editUserModal #edit_password').closest('.mb-3').hide();
      $('#editCreditBalanceDiv').show();
      // You might want to fetch and set the current credit balance if switching TO customer
      // For now, just show the field, maybe default to 0
      if ($('#editUserModal #edit_credit_balance').val() === '') {
          $('#editUserModal #edit_credit_balance').val('0.00');
      }
    } else {
      $('#editUserModal #edit_username').closest('.mb-3').show();
      $('#editUserModal #edit_password').closest('.mb-3').show();
      $('#editCreditBalanceDiv').hide();
      $('#editUserModal #edit_credit_balance').val(''); // Clear credit balance if switching FROM customer
    }
  });

  // Function to update a user row in the DataTable after an edit.
  function updateUserInTable(updatedUser) {
    var table = $('#usersTable').DataTable();
    table.rows().every(function() {
      var rowData = this.data();
      var rowNode = this.node();
      var storedUser = $(rowNode).data('user');
      if (storedUser && storedUser.user_id == updatedUser.user_id) {
        // Update stored user data
        storedUser.name = updatedUser.name;
        storedUser.username = updatedUser.username; // May be empty for customers
        storedUser.email = updatedUser.email;     // May be empty for customers
        storedUser.role = updatedUser.role;
        storedUser.credit_balance = updatedUser.credit_balance; // Update credit balance
        
        // Prepare new row data for DataTables
        var newRowData = [
          updatedUser.name,
          updatedUser.username, // Display potentially empty username
          updatedUser.email,    // Display potentially empty email
          updatedUser.role,
          storedUser.created_at, // retain the original created_at
          `<button class="btn btn-sm btn-warning edit-user-btn" data-user='${JSON.stringify(storedUser)}'>Edit</button>
           <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${updatedUser.user_id}">Delete</button>`
        ];
        this.data(newRowData).draw(false);
        $(rowNode).attr('data-user', JSON.stringify(storedUser)); // Update the data attribute
      }
    });
  }

  // AJAX: Edit User without reloading the page
  $('#editUserForm').on('submit', function(e) {
    e.preventDefault();
    const role = $('#editUserModal #edit_role').val();
    const formData = {
      user_id: $('#editUserModal #edit_user_id').val(),
      name: $('#editUserModal #edit_name').val().trim(),
      role: role
    };
    
    // Include fields based on role
    if (role === 'customer') {
      formData.credit_balance = $('#editUserModal #edit_credit_balance').val().trim();
    } else { // Admin or Seller
      formData.username = $('#editUserModal #edit_username').val().trim();
      formData.email = $('#editUserModal #edit_email').val().trim();
      formData.password = $('#editUserModal #edit_password').val(); // Optional
    }
    
    fetch('ajax/users_ajax.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      if(data.success) {
          showAlert('success', data.message);
          var updatedUser = {
            user_id: formData.user_id,
            name: formData.name,
            username: formData.username || '', // Ensure username is set, default to empty if customer
            email: formData.email || '',     // Ensure email is set, default to empty if customer
            role: formData.role,
            credit_balance: formData.credit_balance !== undefined ? formData.credit_balance : 0.00 // Ensure credit balance is set
          };
          updateUserInTable(updatedUser);
          var editModal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
          editModal.hide();
          $('#editUserForm')[0].reset();
      } else {
          showAlert('danger', "Error: " + data.message);
      }
    })
    .catch(err => {
        console.error("Error:", err);
        showAlert('danger', "An unexpected error occurred.");
    });
  });

  // AJAX: Delete User without reloading the page
  $(document).on('click', '.delete-user-btn', function() {
    const userId = $(this).data('user-id');
    if (!confirm("Are you sure you want to delete this user?")) return;
    fetch('ajax/users_ajax.php?user_id=' + encodeURIComponent(userId), {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if(data.success) {
          showAlert('success', data.message);
          var table = $('#usersTable').DataTable();
          table.rows().every(function() {
            var rowNode = this.node();
            var storedUser = $(rowNode).data('user');
            if (storedUser && storedUser.user_id == userId) {
              this.remove();
            }
          });
          table.draw(false);
      } else {
          showAlert('danger', "Error: " + data.message);
      }
    })
    .catch(err => {
      console.error("Error:", err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });
});
