// =====================================================
// LILLY SKIN CARE - DJANGO DATABASE ADMIN PANEL
// =====================================================
// The visual admin panel is intentionally kept the same.
// Data is now stored in Django's database instead of localStorage.
// =====================================================

const PRODUCTS_KEY = "lillyProducts";
const SHIPPING_KEY = "lillyShippingRates";
const API = window.LILLY_API_BASE || "/api";

const GOVERNORATES = [
  "Cairo","Giza","Alexandria","Qalyubia","Port Said","Suez","Damietta",
  "Dakahlia","Sharqia","Kafr El Sheikh","Gharbia","Monufia","Beheira",
  "Ismailia","Faiyum","Beni Suef","Minya","Asyut","Sohag","Qena","Luxor",
  "Aswan","Red Sea","New Valley","Matrouh","North Sinai","South Sinai"
];

const $ = id => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(API + path, {
    credentials: "same-origin",
    headers: {"Content-Type": "application/json", ...(options.headers || {})},
    ...options
  });
  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function showMsg(id,text,type="success"){
  const el=$(id); el.textContent=text; el.className=`msg ${type} show`;
  setTimeout(()=>el.classList.remove("show"),2500);
}
function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

let productsCache = [];
let shippingCache = {};

async function getProducts(){
  const data = await api("/products/");
  productsCache = Array.isArray(data.products) ? data.products : [];
  return productsCache;
}

async function getShipping(){
  const data = await api("/shipping/");
  shippingCache = data.shipping || {};
  return shippingCache;
}

async function renderProducts(){
  const products=await getProducts();
  $("productsTable").innerHTML = products.length ? products.map(p => `
    <tr>
      <td><b>${escapeHtml(p.name)}</b></td>
      <td>${escapeHtml(p.category)}</td>
      <td>EGP ${Number(p.price||0).toLocaleString("en-EG")}</td>
      <td><div class="table-actions">
        <button type="button" class="secondary" onclick="editProduct('${String(p.id).replace(/'/g,"\\'")}')">Edit</button>
        <button type="button" class="danger" onclick="deleteProduct('${String(p.id).replace(/'/g,"\\'")}')">Delete</button>
      </div></td>
    </tr>`).join("") :
    `<tr><td colspan="4" style="text-align:center;color:#888;padding:25px">No products yet. Add your first product above.</td></tr>`;
}

window.editProduct = async function(id){
  const p=productsCache.find(x=>String(x.id)===String(id));
  if(!p) return;
  $("productId").value=p.id;
  $("name").value=p.name||"";
  $("category").value=p.category||"Skincare";
  $("price").value=p.price??0;
  $("oldPrice").value=p.oldPrice||"";
  $("image").value=p.image||"";
  $("gallery").value=(p.gallery||[]).join(", ");
  $("sizes").value=(p.sizes||[]).join(", ");
  $("colors").value=(p.colors||[]).join(", ");
  $("description").value=p.description||"";
  $("bestseller").checked=!!p.bestseller;
  $("formTitle").textContent="Edit Product";
  window.scrollTo({top:0,behavior:"smooth"});
};

window.deleteProduct = async function(id){
  if(!confirm("Delete this product?")) return;
  try {
    await api(`/products/${encodeURIComponent(id)}/`, {method:"DELETE"});
    await renderProducts();
    showMsg("productMsg","Product deleted.");
  } catch(e) {
    showMsg("productMsg",e.message,"error");
  }
};

$("productForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const id=$("productId").value;
  const product={
    name:$("name").value.trim(),
    category:$("category").value.trim() || "Skincare",
    price:Number($("price").value)||0,
    oldPrice:Number($("oldPrice").value)||0,
    image:$("image").value.trim(),
    gallery:$("gallery").value.split(",").map(x=>x.trim()).filter(Boolean),
    sizes:$("sizes").value.split(",").map(x=>x.trim()).filter(Boolean),
    colors:$("colors").value.split(",").map(x=>x.trim()).filter(Boolean),
    description:$("description").value.trim(),
    bestseller:$("bestseller").checked
  };

  try {
    if(id) {
      await api(`/products/${encodeURIComponent(id)}/`, {method:"PUT", body:JSON.stringify(product)});
    } else {
      await api("/products/", {method:"POST", body:JSON.stringify(product)});
    }
    await renderProducts();
    showMsg("productMsg",id ? "Product updated ✓" : "Product added ✓");
    clearForm();
  } catch(e) {
    showMsg("productMsg",e.message,"error");
  }
});

function clearForm(){
  $("productForm").reset();
  $("productId").value="";
  $("category").value="Skincare";
  $("formTitle").textContent="Add Product";
}
$("clearForm").addEventListener("click",clearForm);

async function renderShipping(){
  const rates=await getShipping();
  $("shippingGrid").innerHTML=GOVERNORATES.map(city=>`
    <div class="ship-item">
      <label>${city}</label>
      <input class="shipping-input" data-city="${city}" type="number" min="0" step="0.01" value="${Number(rates[city]||0)}" placeholder="0">
    </div>`).join("");
}
$("saveShipping").addEventListener("click",async()=>{
  const rates={};
  document.querySelectorAll(".shipping-input").forEach(input=>{
    rates[input.dataset.city]=Number(input.value)||0;
  });
  try {
    await api("/shipping/", {method:"POST", body:JSON.stringify({shipping:rates})});
    shippingCache = rates;
    showMsg("shippingMsg","Shipping rates saved ✓");
  } catch(e) {
    showMsg("shippingMsg",e.message,"error");
  }
});

async function login(){
  const email=$("email").value.trim();
  const password=$("password").value;
  try {
    await api("/auth/login/", {
      method:"POST",
      body:JSON.stringify({email,password})
    });
    $("login").hidden=true;
    $("panel").hidden=false;
    await renderProducts();
    await renderShipping();
    await renderOrders();
  } catch(e) {
    showMsg("loginMsg","Wrong email or password.","error");
  }
}
$("loginForm").addEventListener("submit",e=>{e.preventDefault();login();});
$("logout").addEventListener("click",async()=>{
  try { await api("/auth/logout/", {method:"POST"}); } catch(_) {}
  location.reload();
});

async function checkSession(){
  try {
    const data = await api("/auth/session/");
    if(data.authenticated){
      $("login").hidden=true; $("panel").hidden=false;
      await renderProducts(); await renderShipping(); await renderOrders();
    }
  } catch(_) {}
}

// =====================================================
// ORDERS
// =====================================================
const ORDER_STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

async function getOrders(){
  const data = await api("/orders/");
  return Array.isArray(data.orders) ? data.orders : [];
}

function formatOrderDate(value){
  try {
    return new Date(value).toLocaleString("en-EG", {
      year:"numeric", month:"short", day:"numeric",
      hour:"2-digit", minute:"2-digit"
    });
  } catch(e){ return value || ""; }
}

function statusButtons(order){
  return `
    <div class="order-status-actions">
      <button class="${order.status === "Confirmed" ? "active" : ""}" onclick="updateOrderStatus('${order.id}','Confirmed')">✅ Accept / Confirm</button>
      <button class="${order.status === "Processing" ? "active" : ""}" onclick="updateOrderStatus('${order.id}','Processing')">📦 Processing</button>
      <button class="${order.status === "Shipped" ? "active" : ""}" onclick="updateOrderStatus('${order.id}','Shipped')">🚚 Shipped</button>
      <button class="${order.status === "Delivered" ? "active" : ""}" onclick="updateOrderStatus('${order.id}','Delivered')">✔️ Delivered</button>
      <button type="button" class="cancel" onclick="deleteOrder('${String(order.id).replace(/'/g,"\\'")}')">❌ Delete Order</button>
    </div>`;
}

async function renderOrders(){
  const box = $("ordersList");
  if(!box) return;

  let orders=[];
  try { orders = await getOrders(); }
  catch(e) {
    box.innerHTML = `<div class="empty-orders">${escapeHtml(e.message)}</div>`;
    return;
  }

  if(!orders.length){
    box.innerHTML = '<div class="empty-orders">No orders yet. When a customer clicks Confirm Order, the order will appear here.</div>';
    return;
  }

  box.innerHTML = orders.map(order => {
    const customer = order.customer || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsHtml = items.map(item => `
      <div class="order-item">
        <b>${escapeHtml(item.name)}</b>
        × ${Number(item.quantity || 0)} — EGP ${Number(item.lineTotal || 0).toLocaleString("en-EG")}
        ${item.size ? `<div class="hint">Size: ${escapeHtml(item.size)}</div>` : ""}
        ${item.color ? `<div class="hint">Color: ${escapeHtml(item.color)}</div>` : ""}
      </div>
    `).join("");

    return `
      <div class="order-card">
        <div class="order-top">
          <div>
            <div class="order-number">Order #${escapeHtml(order.orderNumber)}</div>
            <div class="order-date">${escapeHtml(formatOrderDate(order.createdAt))}</div>
          </div>
          <span class="status-badge">${escapeHtml(order.status || "Pending")}</span>
        </div>

        <div class="order-grid">
          <div class="order-box">
            <h4>Customer</h4>
            <div><b>Name:</b> ${escapeHtml(customer.name)}</div>
            <div><b>Phone:</b> ${escapeHtml(customer.phone)}</div>
            <div><b>Governorate:</b> ${escapeHtml(customer.governorate)}</div>
            <div><b>Address:</b> ${escapeHtml(customer.address)}</div>
            <div><b>Notes:</b> ${escapeHtml(customer.notes || "-")}</div>
          </div>

          <div class="order-box">
            <h4>Products</h4>
            ${itemsHtml || '<div class="hint">No products found.</div>'}
            <div class="order-total">
              <div>Subtotal: <b>EGP ${Number(order.subtotal || 0).toLocaleString("en-EG")}</b></div>
              <div>Shipping: <b>EGP ${Number(order.shipping || 0).toLocaleString("en-EG")}</b></div>
              <div>Total: <b>EGP ${Number(order.total || 0).toLocaleString("en-EG")}</b></div>
            </div>
          </div>
        </div>
        ${statusButtons(order)}
      </div>`;
  }).join("");
}

window.updateOrderStatus = async function(id, status){
  try {
    await api(`/orders/${encodeURIComponent(id)}/`, {
      method:"PATCH", body:JSON.stringify({status})
    });
    await renderOrders();
  } catch(e) {
    showMsg("ordersMsg",e.message,"error");
  }
};

window.deleteOrder = async function(id){
  try {
    const orders = await getOrders();
    const order = orders.find(o=>String(o.id)===String(id));
    if(!order) {
      showMsg("ordersMsg","Order not found.","error");
      return;
    }
    const number = order.orderNumber ? `#${order.orderNumber}` : "";
    if(!confirm(`Delete order ${number}? This cannot be undone.`)) return;

    await api(`/orders/${encodeURIComponent(id)}/`, {method:"DELETE"});
    await renderOrders();
    showMsg("ordersMsg","Order deleted successfully.");
  } catch(e) {
    showMsg("ordersMsg",e.message,"error");
  }
};

$("refreshOrders")?.addEventListener("click", renderOrders);
checkSession();
