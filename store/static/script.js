// ===============================
// LILLY SKIN CARE - EDIT PRODUCTS
// ===============================
// Replace the sample products below with your real products.
// image: put your image inside assets/products/ and write its filename.
// Example: image: "assets/products/cleanser.jpg"

// ===============================

const defaultProducts = [
  {
    id: 1,
    name: "Lilly Product 01",
    category: "Cosmetics",
    price: 0,
    oldPrice: 0,
    image: "",
    gallery: [],
    sizes: ["S", "M", "L"],
    colors: ["Pink", "White", "Black"],
    description: "Add your product description here.",
    bestseller: true
  },
  {
    id: 2,
    name: "Lilly Product 02",
    category: "Skincare",
    price: 0,
    oldPrice: 0,
    image: "",
    gallery: [],
    sizes: ["S", "M", "L"],
    colors: ["Pink", "White", "Black"],
    description: "Add your product description here.",
    bestseller: true
  },
  {
    id: 3,
    name: "Lilly Product 03",
    category: "Makeup",
    price: 0,
    oldPrice: 0,
    image: "",
    gallery: [],
    sizes: ["S", "M", "L"],
    colors: ["Pink", "White", "Black"],
    description: "Add your product description here.",
    bestseller: true
  },
  {
    id: 4,
    name: "Lilly Product 04",
    category: "Lip Care",
    price: 0,
    oldPrice: 0,
    image: "",
    gallery: [],
    sizes: ["S", "M", "L"],
    colors: ["Pink", "White", "Black"],
    description: "Add your product description here.",
    bestseller: true
  },
  {
    id: 5,
    name: "Lilly Product 05",
    category: "Body Care",
    price: 0,
    oldPrice: 0,
    image: "",
    gallery: [],
    sizes: ["S", "M", "L"],
    colors: ["Pink", "White", "Black"],
    description: "Add your product description here."
  },
  {
    id: 6,
    name: "Lilly Product 06",
    category: "Makeup",
    price: 0,
    oldPrice: 0,
    image: "",
    gallery: [],
    sizes: ["S", "M", "L"],
    colors: ["Pink", "White", "Black"],
    description: "Add your product description here."
  },
  {
    id: 7,
    name: "Lilly Product 07",
    category: "Bundles",
    price: 0,
    oldPrice: 0,
    image: "",
    gallery: [],
    sizes: ["S", "M", "L"],
    colors: ["Pink", "White", "Black"],
    description: "Add your product description here."
  },
  {
    id: 8,
    name: "Lilly Product 08",
    category: "Body care",
    price: 0,
    oldPrice: 0,
    image: "",
    gallery: [],
    sizes: ["S", "M", "L"],
    colors: ["Pink", "White", "Black"],
    description: "Add your product description here."
  }
];

// Products are managed by the JS Admin Panel.



const products = Array.isArray(window.LILLY_PRODUCTS) ? window.LILLY_PRODUCTS : JSON.parse(JSON.stringify(defaultProducts));

const SHIPPING_STORAGE_KEY = "lillyShippingRates";
const DEFAULT_SHIPPING_RATES = {
  "Cairo": 0, "Giza": 0, "Alexandria": 0, "Qalyubia": 0, "Port Said": 0,
  "Suez": 0, "Damietta": 0, "Dakahlia": 0, "Sharqia": 0, "Kafr El Sheikh": 0,
  "Gharbia": 0, "Monufia": 0, "Beheira": 0, "Ismailia": 0, "Faiyum": 0,
  "Beni Suef": 0, "Minya": 0, "Asyut": 0, "Sohag": 0, "Qena": 0,
  "Luxor": 0, "Aswan": 0, "Red Sea": 0, "New Valley": 0, "Matrouh": 0,
  "North Sinai": 0, "South Sinai": 0
};

function getShippingRates() {
  const serverRates = window.LILLY_SHIPPING || {};
  return {...DEFAULT_SHIPPING_RATES, ...serverRates};
}

// Start with an empty cart once for this version, then keep cart items normally.
const CART_VERSION = "2";
if (localStorage.getItem("lillyCartVersion") !== CART_VERSION) {
  localStorage.removeItem("lillyCart");
  localStorage.setItem("lillyCartVersion", CART_VERSION);
}
let cart = JSON.parse(localStorage.getItem("lillyCart") || "[]");

const bestSellerGrid = document.getElementById("bestSellerGrid");
const allProductGrid = document.getElementById("allProductGrid");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");

function money(value) {
  return "EGP " + Number(value || 0).toLocaleString("en-EG");
}

function productCard(p) {
  const visual = p.image
    ? `<img src="${p.image}" alt="${p.name}">`
    : `<div class="product-placeholder">${p.name}</div>`;

  return `
    <article class="product-card">
      <a class="product-link" href="product.html?id=${p.id}" aria-label="View ${p.name}">
        <div class="product-image">
          ${p.bestseller ? '<span class="badge">BEST SELLER</span>' : ''}
          ${visual}
        </div>
      </a>
      <button class="add-btn" onclick="event.preventDefault(); event.stopPropagation(); addToCart(${p.id})">ADD TO CART</button>
      <div class="product-info">
        <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div>
          <span class="price">${money(p.price)}</span>
          ${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

let allProductsExpanded = false;

function renderProducts(list = products) {
  if (bestSellerGrid) bestSellerGrid.innerHTML = products.filter(p => p.bestseller).map(productCard).join("");

  if (allProductGrid) {
    const visibleProducts = allProductsExpanded ? list : list.slice(0, 4);
    allProductGrid.innerHTML = visibleProducts.map(productCard).join("");

    const showMoreBtn = document.getElementById("showMoreProducts");
    if (showMoreBtn) {
      showMoreBtn.style.display = list.length > 4 ? "inline-flex" : "none";
      showMoreBtn.textContent = allProductsExpanded ? "Show Less" : "Show More";
    }
  }
}

function saveCart() {
  localStorage.setItem("lillyCart", JSON.stringify(cart));
  renderCart();
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const existing = cart.find(item => item.id === id && !item.size && !item.color);
  if (existing) existing.qty++;
  else cart.push({id, qty: 1});
  saveCart();
  openCart();
}



function changeQty(index, amount) {
  const item = cart[index];
  if (!item) return;
  item.qty += amount;
  if (item.qty <= 0) cart.splice(index, 1);
  saveCart();
}

// Remove only the selected cart line. This also works when the same
// product was added with different size/color options.
function removeFromCart(index) {
  if (index < 0 || index >= cart.length) return;
  cart.splice(index, 1);
  saveCart();
}

function renderCart() {
  if (!cartItems || !cartTotal || !cartCount) return;
  cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);

  if (!cart.length) {
    cartItems.innerHTML = `<div style="padding:40px 5px;text-align:center;color:#888">Your cart is empty.</div>`;
    cartTotal.textContent = money(0);
    return;
  }

  let total = 0;
  cartItems.innerHTML = cart.map((item, index) => {
    const p = products.find(x => x.id === item.id);
    if (!p) return "";
    total += p.price * item.qty;
    const image = p.image
      ? `<img src="${p.image}" alt="${p.name}">`
      : `<div style="width:75px;height:75px;background:#fff4f8;border-radius:5px;display:flex;align-items:center;justify-content:center;color:#d55b8d;font-size:10px;text-align:center">${p.name}</div>`;
    return `
      <div class="cart-item">
        ${image}
        <div>
          <b>${p.name}</b>
          <div class="price">${money(p.price)}</div>
          <div class="qty">
            <button onclick="changeQty(${index},-1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${index},1)">+</button>
          </div>
        </div>
        <button class="remove" onclick="removeFromCart(${index})">Remove</button>
      </div>
    `;
  }).join("");

  cartTotal.textContent = money(total);
}

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
}

if (bestSellerGrid || allProductGrid) {
  document.getElementById("cartBtn")?.addEventListener("click", openCart);
  document.getElementById("closeCart")?.addEventListener("click", closeCart);
  overlay?.addEventListener("click", closeCart);

  document.getElementById("searchBtn")?.addEventListener("click", () => {
    document.getElementById("searchBox").classList.toggle("active");
    document.getElementById("searchInput").focus();
  });

  document.getElementById("searchInput")?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
    allProductsExpanded = false;
    if (allProductGrid) renderProducts(filtered);
  });

  document.getElementById("categoryFilter")?.addEventListener("change", e => {
    const value = e.target.value;
    allProductsExpanded = false;
    renderProducts(value === "All" ? products : products.filter(p => p.category === value));
  });

  document.getElementById("showMoreProducts")?.addEventListener("click", () => {
  allProductsExpanded = !allProductsExpanded;

  const value = document.getElementById("categoryFilter")?.value || "All";

  const filteredProducts =
    value === "All"
      ? products
      : products.filter(p => p.category === value);

  renderProducts(filteredProducts);
});

  document.querySelectorAll(".category-card").forEach(btn => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      document.getElementById("categoryFilter").value = category;
      renderProducts(products.filter(p => p.category === category));
      document.getElementById("all-products").scrollIntoView({behavior:"smooth"});
    });
  });

  document.getElementById("menuBtn")?.addEventListener("click", () => {
    document.getElementById("nav").classList.toggle("open");
  });

  document.querySelectorAll(".nav a").forEach(a => {
    a.addEventListener("click", () => document.getElementById("nav").classList.remove("open"));
  });

  function getCheckoutTotals() {
    let subtotal = 0;
    cart.forEach(item => {
      const p = products.find(x => x.id === item.id);
      if (p) subtotal += Number(p.price || 0) * Number(item.qty || 0);
    });
    const city = document.getElementById("checkoutCity")?.value || "";
    const shipping = Number(getShippingRates()[city] || 0);
    return { subtotal, shipping, total: subtotal + shipping };
  }

  function renderCheckoutTotals() {
    const totals = getCheckoutTotals();
    const sub = document.getElementById("checkoutSubtotal");
    const ship = document.getElementById("checkoutShipping");
    const total = document.getElementById("checkoutTotal");
    if (sub) sub.textContent = money(totals.subtotal);
    if (ship) ship.textContent = money(totals.shipping);
    if (total) total.textContent = money(totals.total);
  }

  document.getElementById("checkoutBtn")?.addEventListener("click", () => {
    if (!cart.length) { alert("Your cart is empty."); return; }
    document.getElementById("checkoutModal").classList.add("show");
    renderCheckoutTotals();
  });

  document.getElementById("checkoutCity")?.addEventListener("change", renderCheckoutTotals);

  document.getElementById("closeModal")?.addEventListener("click", () => {
    document.getElementById("checkoutModal").classList.remove("show");
  });

  document.getElementById("checkoutForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!cart.length) { alert("Your cart is empty."); return; }

    const data = new FormData(e.target);
    const totals = getCheckoutTotals();
    const city = data.get("city") || "-";

    // IMPORTANT: save a complete snapshot of the order.
    // This means changing a product later will NOT change old orders.
    const items = cart.map(item => {
      const p = products.find(x => x.id === item.id);
      if (!p) return null;
      return {
        productId: p.id,
        name: p.name,
        price: Number(p.price || 0),
        quantity: Number(item.qty || 0),
        size: item.size || "",
        color: item.color || "",
        lineTotal: Number(p.price || 0) * Number(item.qty || 0)
      };
    }).filter(Boolean);

    if (!items.length) {
      alert("Your cart has no valid products.");
      return;
    }

    const payload = {
      customer: {
        name: data.get("name") || "",
        phone: data.get("phone") || "",
        address: data.get("address") || "",
        governorate: city,
        notes: data.get("notes") || ""
      },
      items,
      subtotal: Number(totals.subtotal || 0),
      shipping: Number(totals.shipping || 0),
      total: Number(totals.total || 0)
    };

    try {
      const response = await fetch("/api/orders/", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create order.");

      document.getElementById("orderMessage").innerText =
        `Order #${result.orderNumber} confirmed ✓.`;

      cart = [];
      saveCart();
      e.target.reset();
      renderCheckoutTotals();
    } catch (err) {
      alert(err.message || "Could not place the order. Please try again.");
    }
  });}
// ===============================
// HOME AUTO-PLAYING IMAGE SLIDER
// ===============================
(function initHomeSlider() {
  const slider = document.getElementById("homeSlider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".home-slide"));
  const dotsWrap = document.getElementById("sliderDots");
  const prev = document.getElementById("sliderPrev");
  const next = document.getElementById("sliderNext");
  let current = 0;
  let timer;

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
    dotsWrap?.querySelectorAll("button").forEach((dot, i) => {
      dot.classList.toggle("active", i === current);
      dot.setAttribute("aria-current", i === current ? "true" : "false");
    });
  }

  if (dotsWrap) {
    dotsWrap.innerHTML = slides.map((_, i) =>
      `<button type="button" class="slider-dot ${i === 0 ? "active" : ""}" aria-label="Go to image ${i + 1}" aria-current="${i === 0 ? "true" : "false"}"></button>`
    ).join("");
    dotsWrap.querySelectorAll("button").forEach((dot, i) => {
      dot.addEventListener("click", () => {
        goTo(i);
        restart();
      });
    });
  }

  prev?.addEventListener("click", () => { goTo(current - 1); restart(); });
  next?.addEventListener("click", () => { goTo(current + 1); restart(); });

  function start() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 4000);
  }
  function restart() { start(); }

  // Pause while the customer is interacting with the slider.
  slider.addEventListener("mouseenter", () => clearInterval(timer));
  slider.addEventListener("mouseleave", start);
  slider.addEventListener("touchstart", () => clearInterval(timer), {passive: true});
  slider.addEventListener("touchend", start, {passive: true});

  goTo(0);
  start();
})();

renderProducts();
renderCart();


// ===============================
// OUR CUSTOMERS AUTO-PLAYING SLIDER
// ===============================
(function initReviewSlider() {
  const slider = document.getElementById("reviewSlider");
  const track = document.getElementById("reviewTrack");
  if (!slider || !track) return;

  const cards = Array.from(track.querySelectorAll("article"));
  const dotsWrap = document.getElementById("reviewDots");
  const prev = document.getElementById("reviewPrev");
  const next = document.getElementById("reviewNext");
  let current = 0;
  let timer;

  function getStep() {
    const card = cards[0];
    if (!card) return 0;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return card.getBoundingClientRect().width + gap;
  }

  function goTo(index) {
    current = (index + cards.length) % cards.length;
    track.style.transform = `translateX(-${current * getStep()}px)`;
    dotsWrap?.querySelectorAll("button").forEach((dot, i) => {
      dot.classList.toggle("active", i === current);
      dot.setAttribute("aria-current", i === current ? "true" : "false");
    });
  }

  if (dotsWrap) {
    dotsWrap.innerHTML = cards.map((_, i) =>
      `<button class="review-dot ${i === 0 ? "active" : ""}" aria-label="Review ${i + 1}" aria-current="${i === 0 ? "true" : "false"}"></button>`
    ).join("");
    dotsWrap.querySelectorAll("button").forEach((dot, i) => {
      dot.addEventListener("click", () => { goTo(i); restart(); });
    });
  }

  prev?.addEventListener("click", () => { goTo(current - 1); restart(); });
  next?.addEventListener("click", () => { goTo(current + 1); restart(); });

  function start() {
    timer = setInterval(() => goTo(current + 1), 3500);
  }
  function restart() {
    clearInterval(timer);
    start();
  }

  window.addEventListener("resize", () => goTo(current));
  start();
})();
