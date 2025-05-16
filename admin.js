// admin.js
const API_URL = "https://script.google.com/macros/s/AKfycbweaRGbyHhZkvgpSl80opRnLnG9GeF93Uy4BFTzOtHgHNEC_4DHDrJ7643pSy__A2YFWA/exec";

function loginAdmin() {
  const email = document.getElementById("adminEmail").value.trim();
  const pass = document.getElementById("adminPassword").value.trim();

  fetch(API_URL + `?action=verifyUser&email=${encodeURIComponent(email)}&password=${encodeURIComponent(pass)}`)
    .then(res => res.json())
    .then(resp => {
      if (resp.valid) {
        document.getElementById("loginSection").classList.add("hidden");
        document.getElementById("dashboardSection").classList.remove("hidden");
        loadProducts();
        setInterval(loadProducts, 15000);
        loadOrders();
      } else {
        alert("Invalid login credentials");
      }
    })
    .catch(() => alert("Login error. Please try again later."));
}

function logout() {
  document.getElementById("loginSection").classList.remove("hidden");
  document.getElementById("dashboardSection").classList.add("hidden");
}

function uploadProduct() {
  const data = {
    action: "uploadProduct",
    imgURL: document.getElementById("imgURL").value,
    title: document.getElementById("title").value,
    code: document.getElementById("itemCode").value,
    size: document.getElementById("size").value,
    price: document.getElementById("price").value,
    stock: document.getElementById("stock").value
  };

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  }).then(res => res.json()).then(resp => {
    alert("Product Uploaded");
    clearForm();
    loadProducts();
  });
}

function clearForm() {
  ["imgURL", "title", "itemCode", "size", "price", "stock"].forEach(id => document.getElementById(id).value = "");
}

function loadProducts() {
  fetch(API_URL + "?action=getProducts")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("productTable");
      container.innerHTML = data.map((item, i) => `
        <div class="d-flex align-items-center border p-2 mb-2">
          <img src="${item.imgURL}" class="me-3" width="80" height="80">
          <div class="flex-grow-1">
            <div><b>${item.title}</b></div>
            <div>Code: ${item.code}</div>
            <div>
              Size: <input value="${item.size}" onchange="updateProduct(${i}, 'size', this.value)">
              Price: <input value="${item.price}" onchange="updateProduct(${i}, 'price', this.value)">
              Stock: <input value="${item.stock}" onchange="updateProduct(${i}, 'stock', this.value)">
            </div>
          </div>
          <button class="btn btn-danger ms-3" onclick="deleteProduct(${i})">Delete</button>
        </div>
      `).join('');
    });
}

function updateProduct(index, field, value) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "updateProduct", index, field, value })
  });
}

function deleteProduct(index) {
  if (confirm("Are you sure to delete this product?")) {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteProduct", index })
    }).then(() => loadProducts());
  }
}

function loadOrders() {
  fetch(API_URL + "?action=getOrders")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("ordersTable");
      container.innerHTML = data.map((order, i) => `
        <div class="d-flex justify-content-between align-items-center border p-2 mb-2">
          <div>Order ID: ${order.id} | Name: ${order.name} | Status: ${order.status}</div>
          <div>
            <button class="btn btn-sm btn-info" onclick='viewOrder(${JSON.stringify(order)})'>View</button>
            <button class="btn btn-sm btn-danger" onclick="deleteOrder(${i})">Delete</button>
          </div>
        </div>`).join('');
    });
}

function viewOrder(order) {
  document.getElementById("orderDetailsBody").innerHTML = `
    <p>Order ID: ${order.id}</p>
    <p>Name: ${order.name}</p>
    <p>Phone: ${order.phone}</p>
    <p>Email: ${order.email}</p>
    <p>Item Code: ${order.code}</p>
    <p>Total: ${order.total}</p>
    <p>Discount: ${order.discount}</p>
    <p>Net Total: ${order.netTotal}</p>
  `;
  new bootstrap.Modal(document.getElementById("orderDetailsModal")).show();
}

function deleteOrder(index) {
  if (confirm("Are you sure to delete this order?")) {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteOrder", index })
    }).then(() => loadOrders());
  }
}