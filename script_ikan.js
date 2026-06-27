// ==========================================
// DEFAULT DEMO PRODUCTS
// ==========================================
const DEFAULT_PRODUCTS = [
  { id: 1, name: "Ikan Lele Mutiara", category: "Ikan Hidup", price: 26000, unit: "kg", desc: "Isi 6–8 ekor per kg", status: "ready", emoji: "🐟" },
  { id: 2, name: "Ikan Nila Merah", category: "Ikan Hidup", price: 34000, unit: "kg", desc: "Isi 3–4 ekor per kg", status: "ready", emoji: "🐠" },
  { id: 3, name: "Ikan Mas Segar", category: "Ikan Hidup", price: 36000, unit: "kg", desc: "Isi 2–3 ekor per kg", status: "ready", emoji: "🐟" },
  { id: 4, name: "Ikan Gurame Hidup", category: "Ikan Hidup", price: 25000, unit: "ekor", desc: "Ukuran Sedang per ekor (~500gr)", status: "ready", emoji: "🐡" },
  { id: 5, name: "Ikan Patin Super", category: "Ikan Hidup", price: 28000, unit: "kg", desc: "Isi 1–2 ekor per kg", status: "ready", emoji: "🐋" },
  { id: 6, name: "Salmon Fillet Fresh", category: "Segar & Fillet", price: 145000, unit: "pack (500g)", desc: "Fillet sashimi-grade premium bebas duri", status: "ready", emoji: "🍣" },
  { id: 7, name: "Fillet Kakap Merah", category: "Segar & Fillet", price: 75000, unit: "pack (500g)", desc: "Fillet segar tanpa tulang kulit bersih", status: "ready", emoji: "🥩" },
  { id: 8, name: "Udang Vaname Super", category: "Seafood", price: 85000, unit: "kg", desc: "Isi 30–40 ekor per kg kualitas ekspor", status: "ready", emoji: "🦐" },
  { id: 9, name: "Cumi Bangka Segar", category: "Seafood", price: 95000, unit: "kg", desc: "Cumi segar kenyal langsung dari kapal nelayan", status: "ready", emoji: "🦑" }
];

// ==========================================
// SUPABASE CLIENT INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://atgnarzxvnckfloygfsa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Z25hcnp4dm5ja2Zsb3lnZnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTg0MzUsImV4cCI6MjA5ODAzNDQzNX0.iFi_4coJhPC4oBStmkVbEHAJ8PLfRCEnEne_3IXpL_s";
let supabaseClient = null;
try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("Supabase client initialized successfully.");
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
}

// State
let products = [];
let cart = JSON.parse(localStorage.getItem("nala_cart")) || [];
let activeCategory = "semua";
let searchQuery = "";

// Update Database Connection Status Badge
function updateDbBadge() {
  const dbBadge = document.getElementById("db-badge");
  if (dbBadge) {
    if (supabaseClient) {
      dbBadge.textContent = "Cloud";
      dbBadge.style.backgroundColor = "#d1fae5"; // Green light
      dbBadge.style.color = "#065f46"; // Green dark
    } else {
      dbBadge.textContent = "Lokal";
      dbBadge.style.backgroundColor = "#e2e8f0";
      dbBadge.style.color = "#475569";
    }
  }
}

// Fetch products based on mode
async function loadProducts() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      products = data || [];
    } catch (e) {
      console.error("Error fetching products from Supabase:", e);
      // Fallback to localStorage or default
      products = JSON.parse(localStorage.getItem("products")) || DEFAULT_PRODUCTS;
    }
  } else {
    // Mode Lokal
    products = JSON.parse(localStorage.getItem("products")) || DEFAULT_PRODUCTS;
    if (!localStorage.getItem("products")) {
      localStorage.setItem("products", JSON.stringify(DEFAULT_PRODUCTS));
    }
  }
  renderProducts();
}

// Render product catalog
function renderProducts() {
  const grid = document.getElementById("produk-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "semua" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-catalog" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
      <p style="font-size: 1.2rem; font-weight: 600;">Produk tidak ditemukan 🐟</p>
      <p>Coba kata kunci lain atau pilih kategori yang berbeda.</p>
    </div>`;
    return;
  }

  filtered.forEach(p => {
    const isReady = p.status === "ready";
    const card = document.createElement("div");
    card.className = `produk-card ${!isReady ? "out-of-stock" : ""}`;
    card.innerHTML = `
      <div class="produk-emoji">${p.emoji || "🐟"}</div>
      <div class="produk-info">
        <h3>${p.name}</h3>
        <p class="satuan">${p.desc || ""}</p>
        <p class="harga">Rp ${p.price.toLocaleString("id-ID")} <span class="per">/ ${p.unit}</span></p>
      </div>
      <button class="btn-tambah" data-id="${p.id}" ${!isReady ? "disabled" : ""}>
        ${isReady ? "Tambah ke Keranjang 🛒" : "Stok Habis ❌"}
      </button>
    `;
    grid.appendChild(card);
  });

  // Attach event listener to add buttons
  grid.querySelectorAll(".btn-tambah").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"));
      addToCart(id);
    });
  });
}

// Cart operations
function addToCart(productId) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      unit: prod.unit,
      emoji: prod.emoji,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  openCartDrawer();
}

function updateCartUI() {
  const cartCount = document.getElementById("cart-count");
  const cartBody = document.getElementById("cart-body");
  const cartTotalPrice = document.getElementById("cart-total-price");
  const btnCheckout = document.getElementById("btn-checkout");

  // Update navbar count
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCount) cartCount.textContent = totalItems;

  if (!cartBody) return;
  cartBody.innerHTML = "";

  if (cart.length === 0) {
    cartBody.innerHTML = `<div class="empty-cart" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
      <p style="font-size: 3rem; margin-bottom: 10px;">🛒</p>
      <p style="font-weight: 600;">Keranjang Anda masih kosong</p>
      <p style="font-size: 0.85rem; margin-top: 5px;">Ayo tambahkan ikan segar favorit Anda!</p>
    </div>`;
    if (cartTotalPrice) cartTotalPrice.textContent = "Rp 0";
    if (btnCheckout) btnCheckout.disabled = true;
    return;
  }

  let total = 0;
  cart.forEach(item => {
    const itemSubtotal = item.price * item.qty;
    total += itemSubtotal;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span class="cart-item-emoji">${item.emoji || "🐟"}</span>
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>Rp ${item.price.toLocaleString("id-ID")} / ${item.unit}</p>
      </div>
      <div class="cart-item-qty">
        <button class="btn-qty btn-minus" data-id="${item.id}">-</button>
        <span class="qty-val">${item.qty}</span>
        <button class="btn-qty btn-plus" data-id="${item.id}">+</button>
      </div>
      <div class="cart-item-price">Rp ${itemSubtotal.toLocaleString("id-ID")}</div>
      <button class="btn-remove-item" data-id="${item.id}">&times;</button>
    `;
    cartBody.appendChild(div);
  });

  if (cartTotalPrice) cartTotalPrice.textContent = `Rp ${total.toLocaleString("id-ID")}`;
  if (btnCheckout) btnCheckout.disabled = false;

  // Add listeners
  cartBody.querySelectorAll(".btn-minus").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"));
      updateQty(id, -1);
    });
  });

  cartBody.querySelectorAll(".btn-plus").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"));
      updateQty(id, 1);
    });
  });

  cartBody.querySelectorAll(".btn-remove-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"));
      removeItem(id);
    });
  });
}

function updateQty(id, delta) {
  const item = cart.find(item => item.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeItem(id);
  } else {
    saveCart();
    updateCartUI();
  }
}

function removeItem(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("nala_cart", JSON.stringify(cart));
}

// Drawer visibility toggles
function openCartDrawer() {
  const overlay = document.getElementById("cart-overlay");
  const drawer = document.getElementById("cart-drawer");
  if (overlay && drawer) {
    overlay.classList.add("active");
    drawer.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent background scroll
  }
}

function closeCartDrawer() {
  const overlay = document.getElementById("cart-overlay");
  const drawer = document.getElementById("cart-drawer");
  if (overlay && drawer) {
    overlay.classList.remove("active");
    drawer.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// Checkout Modal
function openCheckoutModal() {
  closeCartDrawer();
  const modal = document.getElementById("checkout-modal");
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkout-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// Form Checkout Submission
async function handleCheckout(event) {
  event.preventDefault();

  const name = document.getElementById("checkout-nama").value.trim();
  const phone = document.getElementById("checkout-telepon").value.trim();
  const address = document.getElementById("checkout-alamat").value.trim();
  const cleanOption = document.getElementById("checkout-opsi-bersih").value;
  const paymentMethod = document.getElementById("checkout-payment").value;
  const notes = document.getElementById("checkout-catatan").value.trim();

  if (!name || !phone || !address) {
    alert("Harap lengkapi semua isian wajib!");
    return;
  }

  // Generate Unique Order ID: NALA-XXXXXX
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const orderId = `NALA-${randNum}`;

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const orderData = {
    id: orderId,
    name,
    phone,
    address,
    cleanOption,
    paymentMethod,
    notes,
    items: cart,
    total,
    status: "pending",
    date: new Date().toISOString()
  };

  // Save to DB
  let saveSuccess = false;
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from("orders").insert([{
        id: orderData.id,
        name: orderData.name,
        phone: orderData.phone,
        address: orderData.address,
        clean_option: orderData.cleanOption,
        payment_method: orderData.paymentMethod,
        notes: orderData.notes,
        items: orderData.items,
        total: orderData.total,
        status: orderData.status,
        created_at: orderData.date
      }]);
      if (error) throw error;
      saveSuccess = true;
      console.log("Order saved to Supabase cloud database.");
    } catch (e) {
      console.error("Failed to save order to Supabase:", e);
      alert("Gagal mengirim pesanan ke cloud. Menyimpan secara lokal...");
    }
  }

  if (!saveSuccess) {
    // Save to LocalStorage
    const localOrders = JSON.parse(localStorage.getItem("orders")) || [];
    localOrders.push(orderData);
    localStorage.setItem("orders", JSON.stringify(localOrders));
    console.log("Order saved to localStorage database.");
  }

  // Construct WA Message text
  let itemsText = "";
  cart.forEach((item, index) => {
    itemsText += `${index + 1}. ${item.emoji || "🐟"} *${item.name}* (${item.qty} ${item.unit}) - Rp ${(item.price * item.qty).toLocaleString("id-ID")}\n`;
  });

  const waText = `*PESANAN BARU - NALA FRESH FISH* 🌊\n` +
    `--------------------------------------\n` +
    `*ID Pesanan:* ${orderId}\n` +
    `*Tanggal:* ${new Date(orderData.date).toLocaleString("id-ID")}\n\n` +
    `*DATA PENGIRIMAN:*\n` +
    `• Nama: ${name}\n` +
    `• Telepon: ${phone}\n` +
    `• Alamat: ${address}\n\n` +
    `*RINCIAN PESANAN:*\n` +
    `${itemsText}\n` +
    `• *Opsi Penanganan:* ${cleanOption}\n` +
    `• *Metode Bayar:* ${paymentMethod}\n` +
    `• *Catatan:* ${notes || "-"}\n\n` +
    `--------------------------------------\n` +
    `*TOTAL BAYAR:* *Rp ${total.toLocaleString("id-ID")}*\n\n` +
    `_Mohon segera diproses ya min, terima kasih!_ 🙏`;

  const waUrl = `https://api.whatsapp.com/send?phone=6281234567890&text=${encodeURIComponent(waText)}`;

  // Close checkout and open payment modal
  closeCheckoutModal();
  openPaymentModal(orderData, waUrl);
}

// Direct Payment Modal Handling
function openPaymentModal(orderData, waUrl) {
  const paymentModal = document.getElementById("payment-modal");
  const payOrderId = document.getElementById("pay-order-id");
  const payOrderTotal = document.getElementById("pay-order-total");
  const container = document.getElementById("payment-details-container");
  const loadingScreen = document.getElementById("payment-loading-screen");

  if (!paymentModal || !container) return;

  // Reset loading screen state
  loadingScreen.classList.remove("active");

  payOrderId.textContent = orderData.id;
  payOrderTotal.textContent = `Rp ${orderData.total.toLocaleString("id-ID")}`;

  const method = orderData.paymentMethod;
  container.innerHTML = "";

  if (method === "COD (Bayar di Tempat)") {
    container.innerHTML = `
      <div style="text-align: center; padding: 10px 0;">
        <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px; color: var(--text-main);">
          Anda memilih metode pembayaran <strong>Cash On Delivery (COD)</strong>.<br>
          Silakan siapkan uang tunai sebesar <strong style="color: var(--primary-hover); font-size: 1.15rem; font-weight: 800;">Rp ${orderData.total.toLocaleString("id-ID")}</strong> saat kurir mengantarkan ikan Anda ke alamat tujuan.
        </p>
        <button type="button" class="tombol" id="btn-pay-cod-confirm" style="width: 100%;">Selesaikan Pemesanan 🏁</button>
      </div>
    `;
    document.getElementById("btn-pay-cod-confirm").addEventListener("click", () => {
      completePaymentFlow(orderData, waUrl);
    });

  } else if (method === "Transfer Bank (Mandiri/BCA)") {
    container.innerHTML = `
      <div>
        <p style="font-size: 0.88rem; margin-bottom: 12px; color: var(--text-muted);">Transfer total tagihan ke salah satu rekening Nala Fresh Fish berikut:</p>
        
        <div class="bank-detail-row">
          <span>🏦 <strong>Bank BCA</strong><br>812-739-4819<br><small>a.n. Nala Fresh Fish</small></span>
          <button type="button" class="bank-detail-copy" id="btn-copy-bca">Salin</button>
        </div>
        
        <div class="bank-detail-row">
          <span>🏦 <strong>Bank Mandiri</strong><br>129-004-812-739<br><small>a.n. Nala Fresh Fish</small></span>
          <button type="button" class="bank-detail-copy" id="btn-copy-mandiri">Salin</button>
        </div>
        
        <div style="margin-top: 15px; margin-bottom: 20px;">
          <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 6px; color: var(--text-main);">Unggah Bukti Transfer</label>
          <div class="upload-proof-box" id="upload-proof-box-el">
            <span class="upload-icon" id="upload-proof-icon">📁</span>
            <p id="upload-proof-status-text">Klik atau seret gambar bukti transfer di sini</p>
            <input type="file" id="upload-proof-file" accept="image/*" />
          </div>
        </div>
        
        <button type="button" class="tombol" id="btn-pay-transfer-confirm" style="width: 100%;">Konfirmasi Pembayaran 💳</button>
      </div>
    `;

    document.getElementById("btn-copy-bca").addEventListener("click", () => {
      navigator.clipboard.writeText("8127394819");
      alert("Nomor rekening BCA disalin!");
    });
    document.getElementById("btn-copy-mandiri").addEventListener("click", () => {
      navigator.clipboard.writeText("129004812739");
      alert("Nomor rekening Mandiri disalin!");
    });

    const uploadFileEl = document.getElementById("upload-proof-file");
    const uploadBoxEl = document.getElementById("upload-proof-box-el");
    const uploadIconEl = document.getElementById("upload-proof-icon");
    const uploadTextEl = document.getElementById("upload-proof-status-text");

    let fileUploaded = false;

    uploadFileEl.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        fileUploaded = true;
        uploadBoxEl.classList.add("uploaded");
        uploadIconEl.textContent = "✅";
        uploadTextEl.textContent = `Bukti Transfer: ${e.target.files[0].name} (Siap)`;
      }
    });

    document.getElementById("btn-pay-transfer-confirm").addEventListener("click", async () => {
      if (!fileUploaded) {
        alert("Harap unggah gambar bukti transfer Anda terlebih dahulu!");
        return;
      }

      // Show loader simulation
      loadingScreen.classList.add("active");
      document.getElementById("payment-loading-title").textContent = "Mengunggah Bukti Transfer...";
      document.getElementById("payment-loading-desc").textContent = "Sedang mengunggah dan menyinkronkan bukti pembayaran Anda ke sistem...";

      setTimeout(async () => {
        const paymentNotes = "[Transfer Bank - Bukti Diunggah]";
        await updateOrderPaymentStatus(orderData.id, "proses", paymentNotes);
        
        loadingScreen.classList.remove("active");
        completePaymentFlow(orderData, waUrl);
      }, 2500);
    });

  } else if (method === "QRIS (Scan Mandiri)") {
    container.innerHTML = `
      <div style="text-align: center;">
        <p style="font-size: 0.88rem; margin-bottom: 12px; color: var(--text-muted);">Silakan pindai QRIS untuk menyelesaikan pembayaran:</p>
        
        <div class="qris-container">
          <div class="qris-image-wrapper">
            <img src="qris_mockup.png" alt="QRIS Mockup" />
            <div class="qris-scan-laser"></div>
          </div>
        </div>
        
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; line-height: 1.5;">
          Buka aplikasi e-wallet Anda (GoPay, OVO, DANA, LinkAja, Mobile Banking). Pindai kode QR di atas, bayar sebesar tagihan, kemudian klik tombol konfirmasi.
        </p>
        
        <button type="button" class="tombol" id="btn-pay-qris-confirm" style="width: 100%;">Saya Sudah Bayar 📱</button>
      </div>
    `;

    document.getElementById("btn-pay-qris-confirm").addEventListener("click", () => {
      loadingScreen.classList.add("active");
      document.getElementById("payment-loading-title").textContent = "Memverifikasi Pembayaran QRIS...";
      document.getElementById("payment-loading-desc").textContent = "Sedang memverifikasi mutasi e-wallet Anda secara real-time. Mohon tidak menutup jendela ini...";

      setTimeout(async () => {
        const paymentNotes = "[QRIS - LUNAS]";
        await updateOrderPaymentStatus(orderData.id, "proses", paymentNotes);

        loadingScreen.classList.remove("active");
        completePaymentFlow(orderData, waUrl);
      }, 3000);
    });

  } else if (method === "E-Wallet (Otomatis)") {
    container.innerHTML = `
      <div>
        <p style="font-size: 0.88rem; margin-bottom: 15px; color: var(--text-muted);">Pilih salah satu e-wallet dan masukkan nomor HP terdaftar Anda:</p>
        
        <div class="payment-options-grid">
          <div class="payment-option-card active" data-wallet="GoPay" id="card-wallet-gopay">
            <span class="wallet-icon">🟩</span>
            <span>GoPay</span>
          </div>
          <div class="payment-option-card" data-wallet="OVO" id="card-wallet-ovo">
            <span class="wallet-icon">🟪</span>
            <span>OVO</span>
          </div>
          <div class="payment-option-card" data-wallet="DANA" id="card-wallet-dana">
            <span class="wallet-icon">🟦</span>
            <span>DANA</span>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 6px; color: var(--text-main);">Nomor HP Terdaftar</label>
          <input type="tel" id="ewallet-phone-input" class="wallet-tel-input" placeholder="Contoh: 081234567890" value="${orderData.phone}" required />
        </div>
        
        <button type="button" class="tombol" id="btn-pay-ewallet-confirm" style="width: 100%;">Bayar Sekarang ⚡</button>
      </div>
    `;

    let selectedWallet = "GoPay";
    const cards = ["card-wallet-gopay", "card-wallet-ovo", "card-wallet-dana"];

    cards.forEach(id => {
      const card = document.getElementById(id);
      if (card) {
        card.addEventListener("click", () => {
          cards.forEach(c => document.getElementById(c).classList.remove("active"));
          card.classList.add("active");
          selectedWallet = card.getAttribute("data-wallet");
        });
      }
    });

    document.getElementById("btn-pay-ewallet-confirm").addEventListener("click", () => {
      const phoneInput = document.getElementById("ewallet-phone-input").value.trim();
      if (!phoneInput) {
        alert("Harap masukkan nomor HP e-wallet Anda!");
        return;
      }

      loadingScreen.classList.add("active");
      document.getElementById("payment-loading-title").textContent = `Menghubungkan ke ${selectedWallet}...`;
      document.getElementById("payment-loading-desc").textContent = `Mengirim permintaan pembayaran ke nomor ${phoneInput}. Silakan buka aplikasi ${selectedWallet} di handphone Anda dan lakukan konfirmasi...`;

      let countdown = 4;
      const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          document.getElementById("payment-loading-desc").textContent = `Mengirim permintaan pembayaran ke nomor ${phoneInput}. Silakan buka aplikasi ${selectedWallet} di handphone Anda dan lakukan konfirmasi... (${countdown}s)`;
        } else {
          clearInterval(interval);
        }
      }, 1000);

      setTimeout(async () => {
        clearInterval(interval);
        const paymentNotes = `[E-Wallet ${selectedWallet} (${phoneInput}) - LUNAS]`;
        await updateOrderPaymentStatus(orderData.id, "proses", paymentNotes);

        loadingScreen.classList.remove("active");
        completePaymentFlow(orderData, waUrl);
      }, 4000);
    });
  }

  paymentModal.classList.add("active");
}

async function updateOrderPaymentStatus(orderId, newStatus, paymentNotes) {
  if (supabaseClient) {
    try {
      const { data: currentOrder, error: fetchErr } = await supabaseClient.from("orders").select("notes").eq("id", orderId).maybeSingle();
      let mergedNotes = paymentNotes;
      if (!fetchErr && currentOrder && currentOrder.notes) {
        mergedNotes = currentOrder.notes + " | " + paymentNotes;
      }
      
      const { error } = await supabaseClient
        .from("orders")
        .update({ status: newStatus, notes: mergedNotes })
        .eq("id", orderId);
      if (error) throw error;
      console.log(`Order status updated to ${newStatus} in Supabase with payment detail.`);
    } catch (e) {
      console.error("Failed to update status in Supabase:", e);
    }
  }

  const localOrders = JSON.parse(localStorage.getItem("orders")) || [];
  const idx = localOrders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    localOrders[idx].status = newStatus;
    localOrders[idx].notes = localOrders[idx].notes ? localOrders[idx].notes + " | " + paymentNotes : paymentNotes;
    localStorage.setItem("orders", JSON.stringify(localOrders));
    console.log(`Order status updated to ${newStatus} in localStorage.`);
  }
}

function completePaymentFlow(orderData, waUrl) {
  // Clear Cart
  cart = [];
  saveCart();
  updateCartUI();

  // Close Payment Modal
  const paymentModal = document.getElementById("payment-modal");
  if (paymentModal) paymentModal.classList.remove("active");

  // Open Success Modal
  openSuccessModal(orderData, waUrl);
}

function openSuccessModal(orderData, waUrl) {
  const successModal = document.getElementById("success-modal");
  const successOrderId = document.getElementById("success-order-id");
  const btnTrack = document.getElementById("btn-success-track");
  const btnWa = document.getElementById("btn-success-wa");
  const btnClose = document.getElementById("btn-success-close");

  if (!successModal) return;

  successOrderId.textContent = orderData.id;

  // Track button listener
  btnTrack.onclick = () => {
    successModal.classList.remove("active");
    const trackInput = document.getElementById("tracker-input");
    if (trackInput) {
      trackInput.value = orderData.id;
      trackOrder(orderData.id);
    }
  };

  // WhatsApp click handler
  btnWa.onclick = () => {
    window.open(waUrl, "_blank");
  };

  // Close button listener
  btnClose.onclick = () => {
    successModal.classList.remove("active");
  };

  successModal.classList.add("active");
}

function closePaymentModal() {
  const paymentModal = document.getElementById("payment-modal");
  if (paymentModal) paymentModal.classList.remove("active");
}

// Order Tracking System
async function handleTrackClick() {
  const val = document.getElementById("tracker-input").value.trim();
  if (!val) {
    alert("Silakan masukkan Kode Pesanan Anda!");
    return;
  }
  trackOrder(val);
}

async function trackOrder(orderId) {
  let foundOrder = null;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        foundOrder = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          address: data.address,
          cleanOption: data.clean_option,
          paymentMethod: data.payment_method,
          notes: data.notes,
          items: data.items,
          total: parseInt(data.total),
          status: data.status,
          date: data.created_at
        };
      }
    } catch (e) {
      console.error("Error fetching tracking order from Supabase:", e);
    }
  }

  // Fallback to local
  if (!foundOrder) {
    const localOrders = JSON.parse(localStorage.getItem("orders")) || [];
    foundOrder = localOrders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
  }

  const resultContainer = document.getElementById("tracker-result");
  if (!resultContainer) return;

  if (!foundOrder) {
    alert(`Kode Pesanan "${orderId}" tidak ditemukan. Pastikan format penulisan benar (contoh: NALA-812739).`);
    resultContainer.style.display = "none";
    return;
  }

  // Fill details
  document.getElementById("track-id").textContent = foundOrder.id;
  
  const statusBadge = document.getElementById("track-status");
  statusBadge.className = `tracker-status-badge status-${foundOrder.status}`;
  statusBadge.textContent = foundOrder.status.toUpperCase();

  // Reset steps
  const steps = ["pending", "proses", "dikirim", "selesai"];
  const currentIdx = steps.indexOf(foundOrder.status);

  steps.forEach((step, idx) => {
    const stepEl = document.getElementById(`step-${step}`);
    if (stepEl) {
      stepEl.className = "tracker-step";
      if (idx < currentIdx) {
        stepEl.classList.add("completed");
      } else if (idx === currentIdx) {
        stepEl.classList.add("active");
      }
    }
  });

  // Render items list in tracker
  const detailsItems = document.getElementById("track-details");
  if (detailsItems) {
    let itemsHtml = `<h4 style="margin-bottom: 12px; color: var(--text-main); font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">Detail Pengiriman</h4>`;
    itemsHtml += `<p style="font-size: 0.9rem; margin-bottom: 4px;"><strong>Penerima:</strong> ${foundOrder.name}</p>`;
    itemsHtml += `<p style="font-size: 0.9rem; margin-bottom: 12px;"><strong>Alamat:</strong> ${foundOrder.address}</p>`;
    itemsHtml += `<h4 style="margin-bottom: 8px; color: var(--text-main); font-weight: 700;">Produk yang Dibeli</h4>`;
    
    foundOrder.items.forEach(item => {
      itemsHtml += `<div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 6px; color: #475569;">
        <span>${item.emoji || "🐟"} ${item.name} (${item.qty} ${item.unit})</span>
        <strong>Rp ${(item.price * item.qty).toLocaleString("id-ID")}</strong>
      </div>`;
    });
    
    itemsHtml += `<div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1rem; border-top: 1px dashed var(--border-color); margin-top: 12px; padding-top: 10px; color: var(--primary-hover);">
      <span>Total Bayar (${foundOrder.paymentMethod || "COD"}):</span>
      <span>Rp ${foundOrder.total.toLocaleString("id-ID")}</span>
    </div>`;

    detailsItems.innerHTML = itemsHtml;
  }

  resultContainer.style.display = "block";
  // Smooth scroll to results
  resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Contact form inquiry submission
async function handleContactSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("nama").value.trim();
  const phone = document.getElementById("telepon").value.trim();
  const message = document.getElementById("pesan").value.trim();

  if (!name || !phone || !message) {
    alert("Harap lengkapi semua isian formulir!");
    return;
  }

  const inquiryData = {
    name,
    phone,
    message,
    date: new Date().toISOString()
  };

  let saveSuccess = false;
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from("inquiries").insert([{
        name: inquiryData.name,
        phone: inquiryData.phone,
        message: inquiryData.message,
        created_at: inquiryData.date
      }]);
      if (error) throw error;
      saveSuccess = true;
      console.log("Inquiry saved to Supabase database.");
    } catch (e) {
      console.error("Failed to save inquiry to Supabase:", e);
    }
  }

  if (!saveSuccess) {
    const localInquiries = JSON.parse(localStorage.getItem("inquiries")) || [];
    localInquiries.push({
      id: (localInquiries.length + 1).toString(),
      ...inquiryData
    });
    localStorage.setItem("inquiries", JSON.stringify(localInquiries));
    console.log("Inquiry saved to localStorage database.");
  }

  const successMsg = document.getElementById("pesan-sukses");
  if (successMsg) {
    successMsg.style.display = "block";
    document.getElementById("form-kontak").reset();
    setTimeout(() => {
      successMsg.style.display = "none";
    }, 5000);
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  updateDbBadge();
  loadProducts();
  updateCartUI();

  // Search & Filter Category Events
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  const filterCats = document.getElementById("filter-categories");
  if (filterCats) {
    filterCats.querySelectorAll(".btn-filter").forEach(btn => {
      btn.addEventListener("click", () => {
        filterCats.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.getAttribute("data-category");
        renderProducts();
      });
    });
  }

  // Cart Drawer Toggles
  const btnCartNav = document.getElementById("btn-cart-nav");
  const btnCloseCart = document.getElementById("btn-close-cart");
  const cartOverlay = document.getElementById("cart-overlay");

  if (btnCartNav) btnCartNav.addEventListener("click", openCartDrawer);
  if (btnCloseCart) btnCloseCart.addEventListener("click", closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);

  // Checkout Modal Events
  const btnCheckout = document.getElementById("btn-checkout");
  const btnCloseCheckout = document.getElementById("btn-close-checkout");
  const btnCancelCheckout = document.getElementById("btn-cancel-checkout");
  const formCheckout = document.getElementById("form-checkout");

  if (btnCheckout) btnCheckout.addEventListener("click", openCheckoutModal);
  if (btnCloseCheckout) btnCloseCheckout.addEventListener("click", closeCheckoutModal);
  if (btnCancelCheckout) btnCancelCheckout.addEventListener("click", closeCheckoutModal);
  if (formCheckout) formCheckout.addEventListener("submit", handleCheckout);

  // Tracker events
  const btnTrack = document.getElementById("btn-track");
  const trackerInput = document.getElementById("tracker-input");

  if (btnTrack) btnTrack.addEventListener("click", handleTrackClick);
  if (trackerInput) {
    trackerInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleTrackClick();
      }
    });
  }

  // Contact form submission
  const formKontak = document.getElementById("form-kontak");
  if (formKontak) formKontak.addEventListener("submit", handleContactSubmit);
});