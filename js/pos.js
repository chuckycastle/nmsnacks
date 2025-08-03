/*
 * js/pos.js - JavaScript for the Point of Sale (POS) page with enhancements:
 *  - Dynamically updates the remaining inventory count on the pill badges.
 *  - Uses secondary color for 1–3 items left.
 *  - When no more stock is available, triggers a red highlight animation 
 *    (identical in timing to the normal blue highlight) and updates the badge to 0.
 *  - Handles cart management (adding items, plus/minus controls).
 *  - Initializes buyer autocomplete.
 */

$(document).ready(function() {
  var cart = [];
  var selectedCustomer = null; // To store selected customer data {id, name, balance}

  function updateCartCount() {
      $('#cartCount').text(cart.reduce(function(sum, item) {
          return sum + item.quantity;
      }, 0));
  }

  // Update the badge on a product card to reflect remaining stock and appropriate color.
  function updateBadge(card, product) {
      var badge = card.find('.badge');
      var addedQuantity = 0;
      var found = cart.find(function(item) {
          return item.product_id == product.product_id;
      });
      if (found) {
          addedQuantity = found.quantity;
      }
      var remaining = product.stock - addedQuantity;
      badge.text(remaining);
      if (remaining <= 0) {
          badge.removeClass('bg-primary bg-secondary').addClass('bg-danger');
          badge.text('0 in stock');
      } else if (remaining <= 3) {
          badge.removeClass('bg-primary bg-danger').addClass('bg-secondary');
          badge.text(remaining + ' in stock');
      } else {
          badge.removeClass('bg-secondary bg-danger').addClass('bg-primary');
          badge.text(remaining + ' in stock');
      }
  }

  // Product card click event: add product to cart and update badge.
  $('.product-card').on('click', function() {
      var card = $(this);
      var product = card.data('product');
      
      // Get current cart quantity for this product.
      var found = cart.find(function(item) {
          return item.product_id == product.product_id;
      });
      var currentQuantity = found ? found.quantity : 0;
      
      // If no more stock is available, trigger red highlight animation and update badge.
      if (currentQuantity >= product.stock) {
          card.addClass('no-stock-animation'); // Expect CSS to mirror 'highlight' but with red color.
          setTimeout(function() { card.removeClass('no-stock-animation'); }, 100); // 100ms to match the normal highlight timing.
          updateBadge(card, product);
          return;
      }
      
      // Normal add-to-cart behavior.
      card.addClass('highlight');
      setTimeout(function() { card.removeClass('highlight'); }, 100);
      
      if (found) {
          found.quantity += 1;
      } else {
          product.quantity = 1;
          cart.push(product);
      }
      updateCartCount();
      updateBadge(card, product);
  });

  // Plus button in the cart: increment quantity if stock permits.
  $(document).on('click', '.btn-plus', function() {
      var index = $(this).data('index');
      var product = cart[index];
      if (product.quantity < product.stock) {
          product.quantity += 1;
          updateCartCount();
          // Update badge for the corresponding product card.
          $('.product-card').each(function() {
              var cardProduct = $(this).data('product');
              if (cardProduct.product_id == product.product_id) {
                  updateBadge($(this), cardProduct);
              }
          });
          renderCart();
      } else {
          var card = $('.product-card').filter(function() {
              return $(this).data('product').product_id == product.product_id;
          });
          card.addClass('no-stock-animation');
          setTimeout(function() { card.removeClass('no-stock-animation'); }, 100);
          updateBadge(card, product);
      }
  });

  // Minus button in the cart: decrement quantity or remove the product.
  $(document).on('click', '.btn-minus', function() {
      var index = $(this).data('index');
      var product = cart[index];
      if (product.quantity > 1) {
          product.quantity -= 1;
      } else {
          cart.splice(index, 1);
      }
      updateCartCount();
      // Update badge on the corresponding product card.
      $('.product-card').each(function() {
          var cardProduct = $(this).data('product');
          if (cardProduct.product_id == product.product_id) {
              updateBadge($(this), cardProduct);
          }
      });
      renderCart();
  });

  // Render cart contents in the modal.
  function renderCart() {
      var html = '';
      if (cart.length === 0) {
          html = '<p>Your cart is empty.</p>';
      } else {
          html += '<table class="table table-sm"><thead><tr><th>Product</th><th>Quantity</th><th>Price</th></tr></thead><tbody>';
          cart.forEach(function(item, index) {
              html += '<tr>';
              html += '<td>' + item.name + '</td>';
              html += '<td>';
              html += '<div class="d-flex align-items-center justify-content-center">';
              html += '<button type="button" class="btn btn-lg btn-danger btn-minus" data-index="' + index + '"><i class="bi bi-dash-circle"></i></button>';
              html += '<span class="mx-2 quantity-text">' + item.quantity + '</span>';
              html += '<button type="button" class="btn btn-lg btn-success btn-plus" data-index="' + index + '"><i class="bi bi-plus-circle"></i></button>';
              html += '</div>';
              html += '</td>';
              html += '<td>' + item.sale_price + '</td>';
              html += '</tr>';
          });
          html += '</tbody></table>';
          html += '<p class="mt-2">Total Price: $' + computeTotalPrice().toFixed(2) + '</p>';
      }
      $('#cartItems').html(html);
      $('#cartInput').val(JSON.stringify(cart));
      
      // Display credit balance and check sufficiency if a customer is selected
      if (selectedCustomer && selectedCustomer.id) {
          const currentBalance = parseFloat(selectedCustomer.balance);
          const totalPrice = computeTotalPrice();
          let creditStatusHtml = `<p class="mt-2">Available Credit: <strong>$${currentBalance.toFixed(2)}</strong></p>`;
          
          if (totalPrice > currentBalance) {
              creditStatusHtml += `<p class="text-danger fw-bold">Insufficient credit for this purchase!</p>`;
          } else {
              creditStatusHtml += `<p class="text-success fw-bold">Sufficient credit available.</p>`;
          }
          $('#cartItems').append(creditStatusHtml);
      } else {
           // Ensure any previous credit status message is cleared if no customer is selected
           // This case might occur if the buyer input is manually cleared after selecting a customer
      }

      // Re-evaluate payment method state after cart changes
      handlePaymentMethodChange(); 
  }

/*
  // Compute total price with bundle discount logic for drinks.
  function computeTotalPrice() {
      var total = 0;
      var grouped = {};
      cart.forEach(function(item) {
          if (!grouped[item.category]) {
              grouped[item.category] = { quantity: 0, unitPrice: item.sale_price };
          }
          grouped[item.category].quantity += item.quantity;
      });
      for (var cat in grouped) {
          var qty = grouped[cat].quantity;
          var unitPrice = grouped[cat].unitPrice;
          if (cat.toLowerCase() === 'drinks') {
              var bundleQty = 3;
              var bundlePrice = 6;
              var bundles = Math.floor(qty / bundleQty);
              var remainder = qty % bundleQty;
              total += bundles * bundlePrice + remainder * unitPrice;
          } else {
              total += qty * unitPrice;
          }
      }
      return total;
  }
*/

  function computeTotalPrice() {
    return cart.reduce(function(total, item) {
      return total + (item.sale_price * item.quantity);
    }, 0);
  }

  // Open the cart modal.
  $(document).on('click', '#openCartBtn', function() {
      renderCart(); // Render cart first to calculate total
      var cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
      cartModal.show();
  });

  // Initialize buyer autocomplete using jQuery UI.
  $("#buyer").autocomplete({
      source: "pages/customers_autocomplete.php",
      minLength: 1, // Start searching after 1 character
      appendTo: "#cartModal .modal-body", // Append dropdown within the modal
      select: function(event, ui) {
          event.preventDefault(); // Prevent default behavior (filling input with label)
          $("#buyer").val(ui.item.value); // Set input field to the customer's name
          selectedCustomer = { // Store selected customer data
              id: ui.item.customer_id,
              name: ui.item.value,
              balance: parseFloat(ui.item.credit_balance)
          };
          console.log("Customer selected:", selectedCustomer);
          
          // Check if customer has enough credit for current cart total
          const totalPrice = computeTotalPrice();
          if (selectedCustomer.balance >= totalPrice) {
              console.log("Sufficient credit found, setting payment method.");
              $('#payment_method').val('Account Credit');
          } else {
              // Optional: If not enough credit, ensure it doesn't default to Account Credit 
              // if it was selected previously for another customer.
              if ($('#payment_method').val() === 'Account Credit') {
                   $('#payment_method').val('Cash'); // Revert to Cash
              }
          }

          renderCart(); // Re-render cart (displays balance, triggers handlePaymentMethodChange)
          return false;
      },
      focus: function(event, ui) {
          // Optional: Prevent filling input on focus, keep it user-friendly
          event.preventDefault(); 
      },
      // Handle case where user clears the input after selecting someone
      change: function(event, ui) {
          if (!ui.item) {
              // If the input is cleared or doesn't match an item
              selectedCustomer = null;
              console.log("Customer selection cleared.");
              renderCart(); // Re-render cart to remove credit balance info
          }
      },
      response: function(event, ui) {
          console.log("Autocomplete response:", ui.content);
      },
      error: function(xhr, status, error) {
          console.error("Autocomplete error:", error);
      }
  });

  // Function to handle payment method logic (disable/enable buttons/checkboxes)
  function handlePaymentMethodChange() {
      const paymentMethod = $('#payment_method').val();
      const notPaidCheckbox = $('#notPaidCheckbox');
      const completeSaleBtn = $('#cartForm button[type="submit"]');
      const totalPrice = computeTotalPrice();

      if (paymentMethod === 'Account Credit') {
          notPaidCheckbox.prop('checked', false).prop('disabled', true); // Disable and uncheck "Not Paid"
          
          if (!selectedCustomer || !selectedCustomer.id) {
              // If Account Credit is selected but no customer is chosen from autocomplete
              showAlert('warning', 'Please select a customer from the list to use Account Credit.');
              completeSaleBtn.prop('disabled', true);
              $('#payment_method').val('Cash'); // Revert to default
          } else if (totalPrice > selectedCustomer.balance) {
              // Customer selected, but insufficient credit
              showAlert('danger', 'Insufficient account credit for this purchase.');
              completeSaleBtn.prop('disabled', true); // Disable checkout
          } else {
              // Sufficient credit
               $('.alert').alert('close'); // Close any existing alerts
              completeSaleBtn.prop('disabled', false); // Enable checkout
          }
      } else {
          // For any other payment method
          notPaidCheckbox.prop('disabled', false); // Re-enable "Not Paid"
          completeSaleBtn.prop('disabled', false); // Ensure checkout is enabled
          $('.alert').alert('close'); // Close any credit-related alerts
      }
  }

  // Event listener for payment method changes
  $('#payment_method').on('change', handlePaymentMethodChange);

  // Also call handler when modal is shown, in case values are pre-filled or changed
  $('#cartModal').on('shown.bs.modal', handlePaymentMethodChange);
});
