const API_URL = 'https://script.google.com/macros/s/AKfycbweaRGbyHhZkvgpSl80opRnLnG9GeF93Uy4BFTzOtHgHNEC_4DHDrJ7643pSy__A2YFWA/exec'; // Replace with your Apps Script URL

let cart = JSON.parse(localStorage.getItem('cart')) || [];
updateCartNoti();

// Fetch Products
async function fetchProducts() {
  const res = await fetch(`${API_URL}?action=getProducts`);
  const products = await res.json();
  const list = document.getElementById('productList');
  list.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'col';
    card.innerHTML = `
      <div class="card h-100">
        <img src="${p.image}" class="card-img-top" onclick="zoomImage('${p.image}')">
        <div class="card-body">
          <h5>${p.title}</h5>
          <p>${p.price} MMK</p>
          <button class="btn btn-primary" onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>
        </div>
      </div>`;
    list.appendChild(card);
  });
}

// Zoom Image
function zoomImage(url) {
  document.getElementById('modalImg').src = url;
  new bootstrap.Modal(document.getElementById('imgModal')).show();
}

// Add to Cart
function addToCart(product) {
  const existing = cart.find(i => i.itemCode === product.itemCode && i.size === product.size);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartNoti();
}

// Cart Count Notification
function updateCartNoti() {
  const noti = document.getElementById('cartNoti');
  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  if (total > 0) {
    noti.innerText = total;
    noti.style.display = 'inline-block';
  } else {
    noti.style.display = 'none';
  }
}

// Show Cart Modal
function showCart() {
  const summary = cart.map(item =>
    `<li>${item.title} x ${item.qty} = ${item.price * item.qty} MMK</li>`).join('');
  const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0);
  document.getElementById('checkoutSummary').innerHTML = `
    <ul>${summary}</ul>
    <p>Total: ${total} MMK</p>
    <p id="discountLine"></p>
    <p id="netLine"></p>`;
  new bootstrap.Modal(document.getElementById('checkoutModal')).show();
}

// Check Discount
async function checkDiscount() {
  const phone = document.getElementById('cPhone').value;
  const res = await fetch(`${API_URL}?action=checkDiscount&phone=${phone}`);
  const json = await res.json();
  const discount = json.discount || 0;
  const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0);
  const discountAmt = (total * discount) / 100;
  const net = total - discountAmt;
  document.getElementById('discountLine').innerText = `Discount: ${discountAmt} MMK`;
  document.getElementById('netLine').innerText = `Net Total: ${net} MMK`;
  window.orderSummary = { discountAmt, total, net, discount };
}

// Submit Order
async function submitOrder() {
  const ordId = 'ORD-' + Math.random().toString().slice(2, 10);
  const name = document.getElementById('cName').value;
  const phone = document.getElementById('cPhone').value;
  const email = document.getElementById('cEmail').value;
  const address = document.getElementById('cAddress').value;

  for (let item of cart) {
    const data = {
      action: 'submitOrder',
      ordId,
      name,
      phone,
      email,
      address,
      itemCode: item.itemCode,
      productName: item.title,
      size: item.size,
      price: item.price,
      discountPrice: window.orderSummary.discountAmt,
      totalPrice: window.orderSummary.net,
    };

    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  alert('Order placed! Confirmation email sent.');
  cart = [];
  localStorage.removeItem('cart');
  updateCartNoti();
}

fetchProducts();
setInterval(fetchProducts, 15000);
