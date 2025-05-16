const API_URL = "https://script.google.com/macros/s/AKfycbweaRGbyHhZkvgpSl80opRnLnG9GeF93Uy4BFTzOtHgHNEC_4DHDrJ7643pSy__A2YFWA/exec";
let cart = {};

// Display products
function loadCustomerProducts() {
  fetch(API_URL + "?action=getProducts")
    .then(res => res.json())
    .then(products => {
      const container = document.getElementById("productContainer");
      container.innerHTML = "";
      products.forEach(p => {
        const card = document.createElement("div");
        card.className = "card m-2 p-2 border shadow w-72";
        card.innerHTML = `
          <img src="${p.imgURL}" class="w-full h-40 object-cover cursor-pointer" onclick="openImageModal('${p.imgURL}')" />
          <h4 class="font-bold mt-2">${p.title}</h4>
          <p>Code: ${p.code}</p>
          <p>Size: ${p.size}</p>
          <p>Price: ${p.price} MMK</p>
          <p>Stock: ${p.stock}</p>
          <button class="bg-blue-500 text-white w-full py-1 mt-2" onclick="addToCart('${p.title}', '${p.code}', ${p.price})">Add to Cart</button>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Error loading products:", err);
      document.getElementById("productContainer").innerHTML = "<p class='text-red-500'>Failed to load products. Please try again later.</p>";
    });
}

// Add to cart
function addToCart(title, code, price) {
  if (cart[code]) {
    cart[code].qty++;
  } else {
    cart[code] = { title, price, qty: 1 };
  }
  // Instead of alert, you can implement a nicer UI notification
  alert(`${title} added to cart.`);
}

// Open image in modal
function openImageModal(url) {
  const modalImg = document.getElementById("fullImage");
  modalImg.src = url;
  const imageModal = new bootstrap.Modal(document.getElementById("imageModal"));
  imageModal.show();
}

// Show cart modal
function openCartModal() {
  const cartItems = document.getElementById("cartItems");
  cartItems.innerHTML = "";  // FIXED from 'list.innerHTML = ""' to correct variable

  let total = 0;
  for (let code in cart) {
    const item = cart[code];
    total += item.price * item.qty;

    const div = document.createElement("div");
    div.className = "d-flex justify-content-between align-items-center mb-2";
    div.innerHTML = `
      <span>${item.title} (${code}) x${item.qty} - ${item.price * item.qty} MMK</span>
      <button onclick="removeFromCart('${code}')" class="btn btn-sm btn-danger">Remove</button>
    `;
    cartItems.appendChild(div);
  }

  document.getElementById("cartTotal").innerText = `Total: ${total} MMK`;

  const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
  cartModal.show();
}

function removeFromCart(code) {
  delete cart[code];
  openCartModal();
}

function clearCart() {
  cart = {};
  const cartModalEl = document.getElementById('cartModal');
  const modalInstance = bootstrap.Modal.getInstance(cartModalEl);
  if (modalInstance) modalInstance.hide();
}

// Proceed to checkout
function checkout() {
  // Hide cart modal
  const cartModalEl = document.getElementById('cartModal');
  const cartModalInstance = bootstrap.Modal.getInstance(cartModalEl);
  if (cartModalInstance) cartModalInstance.hide();

  // Show checkout modal
  const checkoutModal = new bootstrap.Modal(document.getElementById("checkoutModal"));
  checkoutModal.show();

  calculateDiscount();
}

function cancelCheckout() {
  const checkoutModalEl = document.getElementById('checkoutModal');
  const checkoutModalInstance = bootstrap.Modal.getInstance(checkoutModalEl);
  if (checkoutModalInstance) checkoutModalInstance.hide();
}

function calculateDiscount() {
  let total = 0;
  for (let code in cart) total += cart[code].price * cart[code].qty;
  const discount = total > 50000 ? 5000 : 0;
  const net = total - discount;

  document.getElementById("checkoutTotalAmount").innerText = total;
  document.getElementById("checkoutDiscount").innerText = discount;
  document.getElementById("checkoutNet").innerText = net;
}


function placeOrder() {
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const email = document.getElementById("custEmail").value.trim();
  const address = document.getElementById("custAddress").value.trim();

  if (!name || !phone || !email || !address) {
    alert("Please fill all the checkout fields.");
    return;
  }

  let total = 0;
  let codeList = [];
  for (let code in cart) {
    const item = cart[code];
    total += item.price * item.qty;
    codeList.push(`${code} x${item.qty}`);
  }
  if (codeList.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const discount = total > 50000 ? 5000 : 0;
  const netTotal = total - discount;

  // Prepare data object to send
  const orderData = {
    action: "placeOrder",
    name,
    phone,
    email,
    address,
    code: codeList.join(", "),
    total,
    discount,
    netTotal
  };

  console.log("Sending order data:", orderData);

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(orderData),
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      if (data && data.id) {
        alert("Order Placed! Your Order ID: " + data.id);
        cart = {};
        // Hide checkout modal using Bootstrap modal API
        const checkoutModalEl = document.getElementById("checkoutModal");
        const checkoutModal = bootstrap.Modal.getInstance(checkoutModalEl);
        if (checkoutModal) checkoutModal.hide();

        loadCustomerProducts(); // Refresh products
      } else {
        alert("Unexpected response from server.");
        console.error("Unexpected server response:", data);
      }
    })
    .catch(error => {
      alert("Failed to place order. Please try again.");
      console.error("Error placing order:", error);
    });
}


// Initial load and periodic refresh
document.addEventListener("DOMContentLoaded", () => {
  loadCustomerProducts();
  setInterval(loadCustomerProducts, 30000); // Refresh every 30 seconds
});
