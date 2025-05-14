const API_URL = 'https://script.google.com/macros/s/AKfycbweaRGbyHhZkvgpSl80opRnLnG9GeF93Uy4BFTzOtHgHNEC_4DHDrJ7643pSy__A2YFWA/exec'; // Replace with your Apps Script Web App URL

// Upload Product
async function uploadProduct() {
  const data = {
    action: 'uploadProduct',
    image: document.getElementById('imgUrl').value,
    title: document.getElementById('title').value,
    itemCode: document.getElementById('itemCode').value,
    size: document.getElementById('size').value,
    price: document.getElementById('price').value,
    stock: document.getElementById('stock').value,
    info: document.getElementById('details').value,
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(data)
  });

  const json = await res.json();
  alert(json.message);
  loadProducts();
}

// Load Product List
async function loadProducts() {
  const res = await fetch(`${API_URL}?action=getProducts`);
  const products = await res.json();
  const list = document.getElementById('productList');
  list.innerHTML = '';

  products.forEach((p, index) => {
    const card = document.createElement('div');
    card.className = 'col';
    card.innerHTML = `
      <div class="card h-100">
        <img src="${p.image}" class="card-img-top">
        <div class="card-body">
          <h5>${p.title}</h5>
          <p>Item Code: ${p.itemCode}</p>
          <p>Size: ${p.size}</p>
          <input type="number" class="form-control mb-2" value="${p.price}" onchange="updateProduct(${index}, 'price', this.value)">
          <input type="number" class="form-control" value="${p.stock}" onchange="updateProduct(${index}, 'stock', this.value)">
        </div>
      </div>`;
    list.appendChild(card);
  });
}

// Update Product Price/Stock
async function updateProduct(index, field, value) {
  const res = await fetch(`${API_URL}?action=getProducts`);
  const products = await res.json();
  const data = {
    action: 'updateProduct',
    row: index + 2,
    field,
    value
  };
  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Load Orders
async function loadOrders() {
  const res = await fetch(`${API_URL}?action=getOrders`);
  const orders = await res.json();
  const list = document.getElementById('orderList');
  list.innerHTML = '';

  orders.forEach((o, index) => {
    const card = document.createElement('div');
    card.className = 'col';
    card.innerHTML = `
      <div class="card p-3">
        <h6>${o.ordId}</h6>
        <p><b>${o.productName}</b></p>
        <p>Code: ${o.itemCode}</p>
        <p>Name: ${o.name}</p>
        <p>Phone: ${o.phone}</p>
        <button class="btn btn-outline-primary" onclick="viewOrder(${index})">View Details</button>
      </div>`;
    list.appendChild(card);
  });

  window.orderCache = orders;
}

// View Order Details
function viewOrder(index) {
  const o = window.orderCache[index];
  document.getElementById('orderDetails').innerHTML = `
    <p><b>Order ID:</b> ${o.ordId}</p>
    <p><b>Title:</b> ${o.productName}</p>
    <p><b>Item Code:</b> ${o.itemCode}</p>
    <p><b>Size:</b> ${o.size}</p>
    <p><b>Total:</b> ${o.totalPrice} MMK</p>
    <p><b>Name:</b> ${o.name}</p>
    <p><b>Phone:</b> ${o.phone}</p>
    <p><b>Email:</b> ${o.email}</p>
    <p><b>Address:</b> ${o.address}</p>`;
  document.getElementById('orderStatus').value = o.status;
  window.currentOrderIndex = index;
  new bootstrap.Modal(document.getElementById('orderModal')).show();
}

// Update Order Status
async function updateOrderStatus() {
  const o = window.orderCache[window.currentOrderIndex];
  const newStatus = document.getElementById('orderStatus').value;

  const data = {
    action: 'updateOrderStatus',
    ordId: o.ordId,
    newStatus
  };

  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(data)
  });

  alert('Order status updated');
  loadOrders();
}

// Initial load
loadProducts();
loadOrders();
setInterval(() => {
  loadProducts();
  loadOrders();
}, 15000);
