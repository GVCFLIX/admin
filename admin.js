const API_URL = "https://script.google.com/macros/s/AKfycbweaRGbyHhZkvgpSl80opRnLnG9GeF93Uy4BFTzOtHgHNEC_4DHDrJ7643pSy__A2YFWA/exec";

// Common fetch function with CORS handling
async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`Network response was not ok (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

function loginAdmin() {
  const email = document.getElementById("adminEmail").value.trim();
  const pass = document.getElementById("adminPassword").value.trim();

  if (!email || !pass) {
    alert("Please enter both email and password");
    return;
  }

  fetchData(`${API_URL}?action=verifyUser&email=${encodeURIComponent(email)}&password=${encodeURIComponent(pass)}`)
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

  // Validate required fields
  if (!data.imgURL || !data.title || !data.code) {
    alert("Please fill in all required fields");
    return;
  }

  fetchData(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  })
  .then(resp => {
    alert("Product Uploaded Successfully");
    clearForm();
    loadProducts();
  })
  .catch(() => alert("Failed to upload product. Please try again."));
}

function clearForm() {
  ["imgURL", "title", "itemCode", "size", "price", "stock"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

function loadProducts() {
  fetchData(`${API_URL}?action=getProducts`)
    .then(data => {
      const container = document.getElementById("productTable");
      container.innerHTML = data.map((item, i) => `
        <div class="d-flex align-items-center border p-2 mb-2">
          <img src="${item.imgURL}" class="me-3" width="80" height="80" onerror="this.src='https://via.placeholder.com/80'">
          <div class="flex-grow-1">
            <div><b>${item.title}</b></div>
            <div>Code: ${item.code}</div>
            <div>
              Size: <input value="${item.size}" onchange="updateProduct(${i}, 'size', this.value)">
              Price: <input type="number" value="${item.price}" onchange="updateProduct(${i}, 'price', this.value)">
              Stock: <input type="number" value="${item.stock}" onchange="updateProduct(${i}, 'stock', this.value)">
            </div>
          </div>
          <button class="btn btn-danger ms-3" onclick="deleteProduct(${i})">Delete</button>
        </div>
      `).join('');
    })
    .catch(() => {
      document.getElementById("productTable").innerHTML = `
        <div class="alert alert-danger">Failed to load products. Please try again later.</div>
      `;
    });
}

function updateProduct(index, field, value) {
  fetchData(API_URL, {
    method: "POST",
    body: JSON.stringify({ 
      action: "updateProduct", 
      index, 
      field, 
      value: field === 'price' || field === 'stock' ? Number(value) : value
    })
  })
  .catch(() => alert("Failed to update product. Please try again."));
}

function deleteProduct(index) {
  if (confirm("Are you sure you want to delete this product?")) {
    fetchData(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteProduct", index })
    })
    .then(() => loadProducts())
    .catch(() => alert("Failed to delete product. Please try again."));
  }
}

function loadOrders() {
  fetchData(`${API_URL}?action=getOrders`)
    .then(data => {
      const container = document.getElementById("ordersTable");
      container.innerHTML = data.map((order, i) => `
        <div class="d-flex justify-content-between align-items-center border p-2 mb-2">
          <div>
            <span class="badge bg-${order.status === 'Pending' ? 'warning' : 'success'}">${order.status}</span>
            Order #${order.id} | ${order.name} | ${order.netTotal} MMK
          </div>
          <div>
            <button class="btn btn-sm btn-info" onclick='viewOrder(${JSON.stringify(order)})'>View</button>
            <button class="btn btn-sm btn-danger" onclick="deleteOrder(${i})">Delete</button>
          </div>
        </div>`
      ).join('');
    })
    .catch(() => {
      document.getElementById("ordersTable").innerHTML = `
        <div class="alert alert-danger">Failed to load orders. Please try again later.</div>
      `;
    });
}

function viewOrder(order) {
  document.getElementById("orderDetailsBody").innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h5>Customer Details</h5>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Address:</strong> ${order.address}</p>
      </div>
      <div class="col-md-6">
        <h5>Order Details</h5>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Items:</strong> ${order.code}</p>
        <p><strong>Total:</strong> ${order.total} MMK</p>
        <p><strong>Discount:</strong> ${order.discount} MMK</p>
        <p><strong>Net Total:</strong> ${order.netTotal} MMK</p>
      </div>
    </div>
  `;
  new bootstrap.Modal(document.getElementById("orderDetailsModal")).show();
}

function deleteOrder(index) {
  if (confirm("Are you sure you want to delete this order?")) {
    fetchData(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "deleteOrder", index })
    })
    .then(() => loadOrders())
    .catch(() => alert("Failed to delete order. Please try again."));
  }
}
