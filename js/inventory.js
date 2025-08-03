// js/inventory.js

document.addEventListener("DOMContentLoaded", function() {
  // ------------------------------
  // Toggle between Single and Bulk Replenishment.
  const modeRadios = document.getElementsByName("replenMode");
  const singleForm = document.getElementById("singleReplenForm");
  const bulkForm = document.getElementById("bulkRestockForm");
  if (modeRadios) {
    modeRadios.forEach(radio => {
      radio.addEventListener("change", function() {
        if (this.value === "single") {
          if (singleForm) singleForm.style.display = "block";
          if (bulkForm) bulkForm.style.display = "none";
        } else {
          if (singleForm) singleForm.style.display = "none";
          if (bulkForm) bulkForm.style.display = "block";
        }
      });
    });
  }

  // ------------------------------
  // Inventory Cart Management for Bulk Restock.
  var cart = [];

  function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
      cartCount.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
  }

  function computeTotalCost() {
    let total = 0;
    cart.forEach(function(item) {
      total += (parseFloat(item.cost) || 0) * item.quantity;
    });
    return total;
  }  

  function updateBadge(card, product) {
    var badge = card.querySelector('.badge');
    var addedQuantity = 0;
    var found = cart.find(item => !item.is_template && item.product_id == product.product_id);
    if (found) {
      addedQuantity = found.quantity;
    }
    if (addedQuantity > 0) {
      badge.innerText = addedQuantity;
      badge.classList.remove('bg-primary', 'bg-secondary', 'bg-danger');
      badge.classList.add('bg-success');
    } else {
      badge.innerText = product.stock;
      if (product.stock == 0) {
        badge.classList.remove('bg-primary', 'bg-secondary', 'bg-success');
        badge.classList.add('bg-danger');
      } else if (product.stock <= 3) {
        badge.classList.remove('bg-primary', 'bg-danger', 'bg-success');
        badge.classList.add('bg-secondary');
      } else {
        badge.classList.remove('bg-secondary', 'bg-danger', 'bg-success');
        badge.classList.add('bg-primary');
      }
    }
  }

  function renderCart() {
    let html = '';
    if (cart.length === 0) {
      html = '<p>Your bulk restock cart is empty.</p>';
    } else {
      cart.forEach(function(item, index) {
        if (!item.is_template) {
          let cost = (typeof item.cost !== 'undefined') ? parseFloat(item.cost) : 0;
          let lineTotal = cost * item.quantity;
          html += '<div class="d-flex align-items-center justify-content-between mb-2">';
          html += '  <div>' + item.name + ' (Product)</div>';
          html += '  <div>';
          html += '    <button type="button" class="btn btn-sm btn-danger btn-minus" data-index="' + index + '"><i class="bi bi-dash-circle"></i></button>';
          html += '    <span class="mx-2">' + item.quantity + '</span>';
          html += '    <input type="number" step="0.01" value="' + cost.toFixed(2) + '" class="form-control cost-input" data-index="' + index + '" style="width:80px; display:inline-block; margin-left:10px;">';
          html += '    <button type="button" class="btn btn-sm btn-success btn-plus" data-index="' + index + '"><i class="bi bi-plus-circle"></i></button>';
          html += '  </div>';
          html += '  <div class="ms-2">Line Total: $' + lineTotal.toFixed(2) + '</div>';
          html += '</div>';
        } else {
          // Template branch remains unchanged.
          html += '<div class="card mb-2">';
          html += '  <div class="card-header" data-bs-toggle="collapse" data-bs-target="#templateCollapse' + index + '" style="cursor:pointer;">';
          html +=      item.name + ' (Template) - Qty: ' + item.quantity + ' - Cost: $<input type="number" step="0.01" class="template-cost-input" data-index="' + index + '" value="' + parseFloat(item.cost).toFixed(2) + '" style="width:80px;">';
          html += '  </div>';
          html += '  <div id="templateCollapse' + index + '" class="collapse">';
          html += '    <div class="card-body">';
          html += '      <ul>';
          item.box_contents.forEach(function(prod) {
            html += '<li>' + prod.name + ' - Qty: ' + prod.quantity + '</li>';
          });
          html += '      </ul>';
          html += '      <div class="mt-2">';
          html += '        <button type="button" class="btn btn-sm btn-danger btn-template-minus" data-index="' + index + '"><i class="bi bi-dash-circle"></i></button>';
          html += '        <span class="mx-2 template-quantity">' + item.quantity + '</span>';
          html += '        <button type="button" class="btn btn-sm btn-success btn-template-plus" data-index="' + index + '"><i class="bi bi-plus-circle"></i></button>';
          html += '      </div>';
          html += '    </div>';
          html += '  </div>';
          html += '</div>';
        }
      });
    }
    const cartItemsEl = document.getElementById('cartItems');
    if (cartItemsEl) {
      cartItemsEl.innerHTML = html;
    }
    const cartInput = document.getElementById('cartInput');
    if (cartInput) {
      cartInput.value = JSON.stringify(cart);
    }
    const totalCostInput = document.getElementById('total_cost');
    if (totalCostInput) {
      totalCostInput.value = computeTotalCost().toFixed(2);
    }
    console.log("Current cart state:", cart); // Debug: log current cart
  }  
  
  // ------------------------------
  // Event Listeners for Cart Management
  // ------------------------------
  
  // When a product card is clicked, add product to cart.
  document.querySelectorAll('.product-card:not(.template-card)').forEach(function(card) {
    card.addEventListener('click', function() {
      const templateField = document.getElementById('template_id');
      if (templateField && templateField.value !== "") {
        alert("A template is loaded. To add products manually, please clear the template selection.");
        return;
      }
      let product = card.dataset.product ? JSON.parse(card.dataset.product) : null;
      if (!product) return;
      console.log("Product clicked:", product); // Debug log

      card.classList.add('highlight');
      setTimeout(() => { card.classList.remove('highlight'); }, 250);
      
      let found = cart.find(item => !item.is_template && item.product_id == product.product_id);
      if (found) {
        found.quantity += 1;
        console.log("Updated quantity:", found.quantity);
      } else {
        product.quantity = 1;
        // Debug: Log the cost and sale_price properties
        console.log("Initial product cost:", product.cost, "sale_price:", product.sale_price);
        if ((typeof product.cost === 'undefined' || parseFloat(product.cost) === 0) &&
            product.sale_price !== undefined && parseFloat(product.sale_price) > 0) {
          product.cost = parseFloat(product.sale_price);
          console.log("Falling back to sale_price:", product.cost);
        } else if (typeof product.cost !== 'undefined' && parseFloat(product.cost) > 0) {
          product.cost = parseFloat(product.cost);
          console.log("Using product.cost:", product.cost);
        } else {
          product.cost = 0;
          console.log("No cost found; defaulting cost to 0");
        }
        cart.push(product);
        console.log("Added new product to cart:", product);
      }
      updateCartCount();
      updateBadge(card, product);
      renderCart();
    });
  });
  
  // Attach click event to template cards.
  document.querySelectorAll('.template-card').forEach(function(card) {
    card.addEventListener('click', function() {
      let template = card.dataset.template ? JSON.parse(card.dataset.template) : null;
      if (!template) return;
      template.is_template = true;
      template.cost = parseFloat(template.default_cost_per_box) || 0;
      let found = cart.find(item => item.is_template && item.template_id == template.template_id);
      if (found) {
        found.quantity += 1;
      } else {
        template.quantity = 1;
        cart.push(template);
      }
      updateCartCount();
      renderCart();
    });
  });
  
  // Event delegation for plus/minus on product items.
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-plus') && !e.target.closest('.btn-template-plus')) {
      const btn = e.target.closest('.btn-plus');
      const index = btn.getAttribute('data-index');
      cart[index].quantity += 1;
      updateCartCount();
      renderCart();
    }
  });
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-minus') && !e.target.closest('.btn-template-minus')) {
      const btn = e.target.closest('.btn-minus');
      const index = btn.getAttribute('data-index');
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
      } else {
        cart.splice(index, 1);
      }
      updateCartCount();
      renderCart();
    }
  });
  
  // Event delegation for plus/minus on template items.
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-template-plus')) {
      const btn = e.target.closest('.btn-template-plus');
      const index = btn.getAttribute('data-index');
      cart[index].quantity += 1;
      updateCartCount();
      renderCart();
    }
  });
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-template-minus')) {
      const btn = e.target.closest('.btn-template-minus');
      const index = btn.getAttribute('data-index');
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
      } else {
        cart.splice(index, 1);
      }
      updateCartCount();
      renderCart();
    }
  });
  
  // Listen for changes in template cost inputs.
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('template-cost-input')) {
      const index = e.target.getAttribute('data-index');
      cart[index].cost = parseFloat(e.target.value) || 0;
      renderCart();
    }
  });

  // Add the event listener for individual product cost inputs here:
  $(document).on('change', '.cost-input', function() {
    const index = $(this).data('index');
    const newCost = parseFloat($(this).val());
    if (!isNaN(newCost)) {
      cart[index].cost = newCost;
      renderCart();
    }
  });
  
  // ------------------------------
  // Bulk Cart Modal and Restock Submission
  // ------------------------------
  
  // Open Bulk Cart Modal.
  const openCartBtn = document.getElementById('openCartBtn');
  if (openCartBtn) {
    openCartBtn.addEventListener('click', function() {
      renderCart();
      var cartModalEl = document.getElementById('cartModal');
      if (cartModalEl) {
        var myModal = new bootstrap.Modal(cartModalEl);
        myModal.show();
      }
    });
  }
  
  // Updated Submit Bulk Restock.
  $(document).on('click', '#submitBulkBtn', function(e) {
    e.preventDefault();
    console.log('Submit Bulk Restock button clicked');
    const totalCostInput = document.getElementById('total_cost');
    const totalCostForm = document.getElementById('totalCostForm');
    if (totalCostInput && totalCostForm) {
      totalCostForm.value = totalCostInput.value;
    }
    const boxesPurchasedForm = document.getElementById('boxesPurchasedForm');
    const boxesPurchased = document.getElementById('boxesPurchased');
    if (boxesPurchased && boxesPurchasedForm) {
      boxesPurchasedForm.value = boxesPurchased.value;
    }
    const costPerBoxForm = document.getElementById('costPerBoxForm');
    const costPerBox = document.getElementById('costPerBox');
    if (costPerBox && costPerBoxForm) {
      costPerBoxForm.value = costPerBox.value;
    }
    $("#bulkRestockForm").trigger("submit");
  });  
  
  $(document).on('click', '#createTemplateFromCart', function(e) {
    e.preventDefault();
  
    // Extract non-template items from the cart.
    const templateBoxContents = cart.filter(item => !item.is_template).map(item => {
      return {
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity
      };
    });
  
    // Populate the hidden input field for box contents.
    const templateBoxContentsInput = document.getElementById('template_box_contents');
    if (templateBoxContentsInput) {
      templateBoxContentsInput.value = JSON.stringify(templateBoxContents);
    }
  
    // Populate the box contents table.
    // Target the table body of the table with id "templateContentsTable".
    const tableBody = document.querySelector('#templateContentsTable tbody');
    if (tableBody) {
      let tableHtml = '';
      templateBoxContents.forEach(function(item) {
        tableHtml += `<tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td><button type="button" class="btn btn-sm btn-danger remove-row-btn" onclick="this.parentElement.parentElement.remove()">X</button></td>
                      </tr>`;
      });
      tableBody.innerHTML = tableHtml;
    }
  
    // Populate the default cost field with the current total cost.
    const totalCostInput = document.getElementById('total_cost');
    const defaultCostInput = document.getElementById('default_cost_per_template');
    if (totalCostInput && defaultCostInput) {
      defaultCostInput.value = totalCostInput.value;
    }
  
    // Hide the cart modal and show the Add Template modal.
    $('#cartModal').modal('hide');
    $('#addTemplateModal').modal('show');
  });
  
  // ------------------------------
  // PRODUCTS AJAX Workflows
  // ------------------------------
  $('#addProductForm').on('submit', function(e) {
    e.preventDefault();
    var form = this;
    var formData = new FormData(form);
    $('#uploadProgressContainer').show();
    
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'ajax/products_ajax.php', true);
  
    xhr.upload.onprogress = function(event) {
      if (event.lengthComputable) {
        var percentComplete = (event.loaded / event.total) * 100;
        $('#uploadProgressBar').css('width', percentComplete + '%').attr('aria-valuenow', percentComplete);
      }
    };
  
    xhr.onload = function() {
      $('#uploadProgressContainer').hide();
      try {
        var data = JSON.parse(xhr.responseText);
        if (data.success) {
          showAlert('success', data.message);
          $('#addProductModal').modal('hide');
          $('#itemsTableContainer').load(location.href + " #itemsTableContainer > *", function() {
            if ($.fn.DataTable.isDataTable('#inventoryTable')) {
              $('#inventoryTable').DataTable().destroy();
            }
            $('#inventoryTable').DataTable({
              paging: true,
              ordering: true,
              searching: true,
              pageLength: 10,
              lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]]
            });
          });
        } else {
          showAlert('danger', data.message);
        }
      } catch (err) {
        console.error(err);
        showAlert('danger', "An unexpected error occurred.");
      }
    };
  
    xhr.onerror = function() {
      $('#uploadProgressContainer').hide();
      showAlert('danger', "An unexpected error occurred.");
    };
  
    xhr.send(formData);
  });
  
  // Edit Product AJAX submission.
  $('#editProductForm').on('submit', function(e) {
    e.preventDefault();
    const productData = {
      product_id: $('#edit_product_id').val(),
      name: $('#edit_product_name').val().trim(),
      sale_price: $('#edit_sale_price').val().trim(),
      cost: $('#edit_cost').val().trim(),
      stock: $('#edit_stock').val().trim(),
      category: $('#edit_category').val(),
      image_url: $('#edit_image_url').val().trim()
    };
    if (productData.category === 'Other') {
      productData.category = $('#edit_new_category').val().trim();
    }
    fetch('ajax/products_ajax.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('success', data.message);
        $('#editProductModal').modal('hide');
        $('#itemsTableContainer').load(location.href + " #itemsTableContainer > *", function() {
          if ($.fn.DataTable.isDataTable('#inventoryTable')) {
            $('#inventoryTable').DataTable().destroy();
          }
          $('#inventoryTable').DataTable({
            paging: true,
            ordering: true,
            searching: true,
            pageLength: 10,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]]
          });
        });
      } else {
        showAlert('danger', data.message);
      }
    })
    .catch(err => {
      console.error(err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });
  
  // Delete Product.
  $(document).on('click', '.delete-product-btn', function() {
    const productId = $(this).data('product-id');
    if (!confirm("Are you sure you want to delete this product?")) return;
    fetch('ajax/products_ajax.php?product_id=' + encodeURIComponent(productId), {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('success', data.message);
        $(this).closest('tr').remove();
      } else {
        showAlert('danger', data.message);
      }
    })
    .catch(err => {
      console.error(err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });
  
  // Open Edit Product Modal.
  document.addEventListener('click', function(e) {
    const editBtn = e.target.closest('.edit-product-btn');
    if (editBtn) {
      const productData = editBtn.getAttribute('data-product');
      if (!productData) return;
      const product = JSON.parse(productData);
      document.getElementById('edit_product_id').value = product.product_id;
      document.getElementById('edit_product_name').value = product.name;
      document.getElementById('edit_sale_price').value = product.sale_price;
      document.getElementById('edit_cost').value = product.cost;
      document.getElementById('edit_stock').value = product.stock;
      document.getElementById('edit_image_url').value = product.image_link || '';
      
      const categorySelect = document.getElementById('edit_category');
      const newCatDiv = document.getElementById('editNewCategoryDiv');
      categorySelect.value = product.category;
      if (categorySelect.value !== product.category) {
        categorySelect.value = "Other";
        newCatDiv.style.display = "block";
        document.getElementById('edit_new_category').value = product.category;
      } else {
        newCatDiv.style.display = "none";
      }
      var editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
      editModal.show();
    }
  });
  
  // Open Edit Template Modal.
  document.addEventListener('click', function(e) {
    const editTemplateBtn = e.target.closest('.edit-template-btn');
    if (editTemplateBtn) {
      const templateData = editTemplateBtn.getAttribute('data-template');
      if (!templateData) return;
      const template = JSON.parse(templateData);
      document.getElementById('edit_template_id').value = template.template_id;
      document.getElementById('edit_template_name').value = template.name;
      document.getElementById('edit_template_description').value = template.description;
      document.getElementById('edit_default_cost_per_box').value = template.default_cost_per_box;
      document.getElementById('edit_template_image').value = template.image || '';
      
      populateEditTemplateBoxContents(template.box_contents);
      
      const categorySelect = document.getElementById('edit_template_category');
      const newCatDiv = document.getElementById('edit_templateNewCategoryDiv');
      const templateCat = (template.category || "").trim().toLowerCase();
      const optionFound = Array.from(categorySelect.options).find(opt => opt.value.trim().toLowerCase() === templateCat);
      if (optionFound) {
        categorySelect.value = optionFound.value;
        newCatDiv.style.display = "none";
      } else {
        categorySelect.value = "other";
        newCatDiv.style.display = "block";
        document.getElementById('edit_template_new_category').value = template.category;
      }
      
      var editTemplateModal = new bootstrap.Modal(document.getElementById('editTemplateModal'));
      editTemplateModal.show();
    }
  });
  
  // Open Edit Bundle Modal.
  document.addEventListener('click', function(e) {
    const editBundleBtn = e.target.closest('.edit-bundle-btn');
    if (editBundleBtn) {
      const bundleData = editBundleBtn.getAttribute('data-bundle');
      if (!bundleData) return;
      const bundle = JSON.parse(bundleData);
      document.getElementById('edit_bundle_id').value = bundle.bundle_id;
      document.getElementById('edit_bundle_name').value = bundle.name;
      document.getElementById('edit_bundle_price').value = bundle.bundle_price;
      const tbody = document.getElementById('editBundleItemsTable').getElementsByTagName('tbody')[0];
      tbody.innerHTML = '';
      var items = [];
      try {
        items = JSON.parse(bundle.items);
      } catch (e) {
        console.error("Error parsing bundle items JSON", e);
      }
      if (items && items.length > 0) {
        items.forEach(function(item) {
          addEditBundleItemRow(item);
        });
      }
      var editModal = new bootstrap.Modal(document.getElementById('editBundleModal'));
      editModal.show();
    }
  });
  
  // Helper for populating dynamic list of box contents in Edit Template Modal.
  function populateTemplateBoxContents(boxContents) {
    const tbody = document.getElementById('editBoxContentsTbody');
    tbody.innerHTML = '';
    if (typeof editAvailableProducts === 'undefined') {
      editAvailableProducts = [];
    }
    boxContents.forEach(function(item) {
      const tr = document.createElement('tr');
      const tdProduct = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'form-select product-select';
      editAvailableProducts.forEach(function(prod) {
        const option = document.createElement('option');
        option.value = prod.product_id;
        option.textContent = prod.name;
        if (prod.product_id == item.product_id) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      tdProduct.appendChild(select);
      tr.appendChild(tdProduct);
      
      const tdQty = document.createElement('td');
      const inputQty = document.createElement('input');
      inputQty.type = 'number';
      inputQty.min = '1';
      inputQty.value = item.quantity;
      inputQty.className = 'form-control quantity-input';
      tdQty.appendChild(inputQty);
      tr.appendChild(tdQty);
      
      const tdAction = document.createElement('td');
      tdAction.style.width = '50px';
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-sm btn-danger remove-row-btn';
      removeBtn.textContent = 'X';
      removeBtn.onclick = function() { tbody.removeChild(tr); };
      tdAction.appendChild(removeBtn);
      tr.appendChild(tdAction);
      
      tbody.appendChild(tr);
    });
  }
  
  // ------------------------------
  // TEMPLATES AJAX Workflows
  // ------------------------------
  $('#addTemplateForm').on('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    fetch('ajax/templates_ajax.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('success', data.message);
        $('#addTemplateModal').modal('hide');
        $('#templatesTableContainer').load(location.href + " #templatesTableContainer > *", function() {
          if ($.fn.DataTable.isDataTable('#templatesTable')) {
            $('#templatesTable').DataTable().destroy();
          }
          $('#templatesTable').DataTable({
            paging: true,
            ordering: true,
            searching: true,
            pageLength: 10,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]]
          });
        });
      } else {
        showAlert('danger', data.message);
      }
    })
    .catch(err => {
      console.error(err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });
  
  $('#editTemplateForm').on('submit', function(e) {
    e.preventDefault();
    const templateData = {
      template_id: $('#edit_template_id').val(),
      name: $('#edit_template_name').val().trim(),
      description: $('#edit_template_description').val().trim(),
      default_cost_per_box: $('#edit_default_cost_per_box').val().trim(),
      category: $('#edit_template_category').val(),
      image: $('#edit_template_image').val().trim(),
      box_contents: $('#edit_template_box_contents').val()
    };
    if (templateData.category.toLowerCase() === 'other') {
      templateData.category = $('#edit_template_new_category').val().trim();
    }
    fetch('ajax/templates_ajax.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('success', data.message);
        $('#editTemplateModal').modal('hide');
        location.reload();
      } else {
        showAlert('danger', data.message);
      }
    })
    .catch(err => {
      console.error(err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });
  
  $(document).on('click', '.delete-template-btn', function() {
    const templateId = $(this).data('template-id');
    if (!confirm("Are you sure you want to delete this template?")) return;
    fetch('ajax/templates_ajax.php?template_id=' + encodeURIComponent(templateId), {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('success', data.message);
        $(this).closest('tr').remove();
      } else {
        showAlert('danger', data.message);
      }
    })
    .catch(err => {
      console.error(err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });
  
  // ------------------------------
  // BUNDLES AJAX Workflows
  // ------------------------------
  $('#addBundleForm').on('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    fetch('ajax/bundles_ajax.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('success', data.message);
        $('#addBundleModal').modal('hide');
        $('#bundles').load(location.href + " #bundles .table-responsive", function() {
          if ($.fn.DataTable.isDataTable('#bundlesTable')) {
            $('#bundlesTable').DataTable().destroy();
          }
          $('#bundlesTable').DataTable({
            paging: true,
            ordering: true,
            searching: true,
            pageLength: 10,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]]
          });
        });
      } else {
        showAlert('danger', data.message);
      }
    })
    .catch(err => {
      console.error(err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });

  $(document).on('click', '.delete-bundle-btn', function() {
    const bundleId = $(this).data('bundle-id');
    if (!confirm("Are you sure you want to delete this bundle?")) return;
    fetch('ajax/bundles_ajax.php?bundle_id=' + encodeURIComponent(bundleId), {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('success', data.message);
        $(this).closest('tr').remove();
      } else {
        showAlert('danger', data.message);
      }
    })
    .catch(err => {
      console.error(err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });
  
  // ------------------------------
  // RESTOCK AJAX Workflows
  // ------------------------------
  // RESTOCK: Load Template.
  $('#loadTemplateForm').on('submit', function(e) {
    e.preventDefault();
    const templateId = $('#templateSelect').val();
    if (!templateId) {
      showAlert('warning', "Please select a template.");
      return;
    }
    
    // Disable the submit button to prevent multiple submissions.
    const submitBtn = $(this).find('button[type="submit"]');
    submitBtn.prop('disabled', true);
    
    fetch('ajax/restock_ajax.php?action=load_template&template_id=' + encodeURIComponent(templateId))
    .then(response => response.json())
    .then(data => {
      console.log("Load template response:", data); // Debug log.
      if (data.success) {
        showAlert('success', "Template loaded successfully.");
        // Access the template from data.data.template
        let template = data.data ? data.data.template : null;
        if (template) {
          // Attach product name for each item in box_contents.
          if (template.box_contents && Array.isArray(template.box_contents)) {
            template.box_contents = template.box_contents.map(item => {
              // Look up the product using window.addTemplateProducts.
              const prod = window.addTemplateProducts ? window.addTemplateProducts.find(p => p.product_id == item.product_id) : null;
              return {
                product_id: item.product_id,
                quantity: item.quantity,
                name: prod ? prod.name : "Unknown Product"
              };
            });
          } else {
            template.box_contents = [];
          }
          template.is_template = true;
          template.cost = parseFloat(template.default_cost_per_box) || 0;
          // Check if this template is already in the cart.
          let found = cart.find(item => item.is_template && item.template_id == template.template_id);
          if (found) {
            found.quantity += 1;
          } else {
            template.quantity = 1;
            cart.push(template);
          }
          updateCartCount();
          renderCart();
        } else {
          console.error("Template data is missing in the response.");
        }
        $('#loadTemplateModal').modal('hide');
      } else {
        showAlert('danger', data.message);
      }
      submitBtn.prop('disabled', false);
    })
    .catch(err => {
      console.error("Error loading template:", err);
      showAlert('danger', "An unexpected error occurred.");
      submitBtn.prop('disabled', false);
    });
  });
  
  // RESTOCK: Submit Bulk Restock.
  $('#bulkRestockForm').on('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    fetch('ajax/restock_ajax.php?action=submit', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('success', data.message);
        window.location.href = 'index.php?page=inventory';
      } else {
        showAlert('danger', data.message);
      }
    })
    .catch(err => {
      console.error(err);
      showAlert('danger', "An unexpected error occurred.");
    });
  });
});
