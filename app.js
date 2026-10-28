
"use strict";

// =====================================
// 1. AKUN DEMO
// =====================================
// Hanya untuk latihan lokal.
// Password plaintext seperti ini TIDAK aman
// untuk aplikasi yang digunakan secara nyata.

const demoUsers = [
  {
    username: "admin",
    password: "admin123",
    name: "Administrator",
    role: "admin"
  },
  {
    username: "staff",
    password: "staff123",
    name: "Staff Toko",
    role: "staff"
  }
];

// =====================================
// 2. DATA CONTOH
// =====================================


const initialProducts = [
  {
    id: "BRG001",
    name: "Beras",
    category: "Sembako",
    price: 17000,
    stock: 12,
    minStock: 5
  },
  {
    id: "BRG002",
    name: "Indomie ",
    category: "Sembako",
    price: 4000,
    stock: 4,
    minStock: 10
  },
  {
    id: "BRG003",
    name: "Aqua",
    category: "Minuman",
    price: 3000,
    stock: 18,
    minStock: 5
  },
  {
    id: "BRG004",
    name: "Kacang",
    category: "Snack",
    price: 5000,
    stock: 3,
    minStock: 5
  },
  {
    id: "BRG005",
    name: "Masako",
    category: "Bahan Dapur",
    price: 3000,
    stock: 24,
    minStock: 10
  }
];


function loadArray(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

let products = loadArray("ik_products", initialProducts);
let transactions = loadArray("ik_transactions", []);
let suppliers = loadArray("ik_suppliers", []);
let staff = loadArray("ik_staff", []);

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Simpan data awal hanya saat key belum tersedia.
if (localStorage.getItem("ik_products") === null) {
  saveArray("ik_products", initialProducts);
}

// =====================================
// 3. ELEMEN HALAMAN
// =====================================

const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const pageContainer = document.getElementById("pageContainer");
const pageTitle = document.getElementById("pageTitle");

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuToggle = document.getElementById("menuToggle");

let currentUser = null;
let currentPage = "dashboard";

const pageInfo = {
  dashboard: {
    title: "Dashboard",
    description: "Ringkasan kondisi inventori toko."
  },
  stok: {
    title: "Lihat Stok",
    description: "Daftar barang, jumlah stok, dan batas minimum."
  },
  transaksi: {
    title: "Barang Masuk/Keluar",
    description: "Pencatatan perubahan jumlah stok."
  },
  staff: {
    title: "Data Staff",
    description: "Pengelolaan data staff oleh admin."
  },
  supplier: {
    title: "Data Supplier",
    description: "Pengelolaan data supplier oleh admin."
  },
  rekap: {
    title: "Rekap Laporan",
    description: "Ringkasan dan riwayat transaksi inventori."
  }
};

const adminOnlyPages = ["staff", "supplier"];

// =====================================
// 4. LOGIN DAN LOGOUT
// =====================================

loginForm.addEventListener("submit", event => {
  event.preventDefault();

  const username = document
    .getElementById("username").value.trim();

  const password = document
    .getElementById("password").value;

  const user = demoUsers.find(item =>
    item.username === username &&
    item.password === password
  );

  if (!user) {
    loginError.textContent =
      "Username atau password tidak sesuai.";
    loginError.hidden = false;
    return;
  }

  currentUser = {
    username: user.username,
    name: user.name,
    role: user.role
  };

  // Simpan sesi demo agar refresh tidak langsung logout.
  // Ini bukan mekanisme autentikasi yang aman.
  localStorage.setItem(
    "ik_demo_session",
    JSON.stringify(currentUser)
  );

  loginError.hidden = true;
  loginForm.reset();

  openApplication();
});

function logout() {
  currentUser = null;
  localStorage.removeItem("ik_demo_session");

  appPage.hidden = true;
  loginPage.hidden = false;

  closeSidebar();
  document.getElementById("username").focus();
}

document.getElementById("logoutButton")
  .addEventListener("click", logout);

// =====================================
// 5. BUKA APLIKASI
// =====================================

function openApplication() {
  if (!currentUser) return;

  loginPage.hidden = true;
  appPage.hidden = false;

  const isAdmin = currentUser.role === "admin";

  document.getElementById("adminMenu").hidden = !isAdmin;
  document.getElementById("sidebarName").textContent =
    currentUser.name;

  document.getElementById("sidebarRole").textContent =
    isAdmin ? "Administrator" : "Staff";

  document.getElementById("userAvatar").textContent =
    currentUser.name.charAt(0).toUpperCase();

  document.getElementById("topbarName").textContent =
    currentUser.name;

  navigateTo("dashboard");
}

// =====================================
// 6. NAVIGASI MENU
// =====================================

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    navigateTo(button.dataset.page);
  });
});

function navigateTo(page) {
  if (!currentUser || !pageInfo[page]) return;

  currentPage = page;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  pageTitle.textContent = pageInfo[page].title;

  renderPage();
  closeSidebar();
}

menuToggle.addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  sidebarOverlay.classList.toggle("visible", isOpen);
});

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("visible");
  menuToggle.setAttribute("aria-expanded", "false");
}

sidebarOverlay.addEventListener("click", closeSidebar);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeSidebar();
});

// =====================================
// 7. DASHBOARD
// =====================================

function renderDashboard() {
  const totalUnits = products.reduce(
    (sum, item) => sum + item.stock, 0
  );

  const lowStock = products.filter(
    item => item.stock <= item.minStock
  );

  const today = new Date().toLocaleDateString("id-ID");

  const recentTransactions = [...transactions]
    .reverse()
    .slice(0, 5);

  pageContainer.innerHTML = `
    <div class="page-heading">
      <h1>Selamat datang, ${escapeHTML(currentUser.name)}!</h1>
      <p>Berikut ringkasan inventori toko per ${today}.</p>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon">▣</div>
        <p>Jenis Barang</p>
        <h2>${products.length}</h2>
        <small>Jumlah barang terdaftar</small>
      </article>

      <article class="stat-card">
        <div class="stat-icon">▤</div>
        <p>Total Unit Stok</p>
        <h2>${totalUnits}</h2>
        <small>Akumulasi seluruh stok</small>
      </article>

      <article class="stat-card">
        <div class="stat-icon">⚠</div>
        <p>Stok Menipis</p>
        <h2>${lowStock.length}</h2>
        <small>Stok ≤ batas minimum</small>
      </article>

      <article class="stat-card">
        <div class="stat-icon">⇄</div>
        <p>Total Transaksi</p>
        <h2>${transactions.length}</h2>
        <small>Seluruh riwayat transaksi</small>
      </article>
    </div>

    <section class="panel">
      <div class="panel-heading">
        <h2>Perlu Restock</h2>
        <button class="btn-secondary"
          data-go="stok">Lihat Semua Stok</button>
      </div>

      ${lowStock.length ? `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Stok Saat Ini</th>
                <th>Batas Minimum</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${lowStock.map(item => `
                <tr>
                  <td>${escapeHTML(item.id)}</td>
                  <td>${escapeHTML(item.name)}</td>
                  <td>${item.stock}</td>
                  <td>${item.minStock}</td>
                  <td><span class="status low">Restock</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state">
          Semua stok berada di atas batas minimum.
        </div>
      `}
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h2>Transaksi Terbaru</h2>
        <button class="btn-secondary"
          data-go="rekap">Lihat Rekap</button>
      </div>

      ${recentTransactions.length ? `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Barang</th>
                <th>Jenis</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${recentTransactions.map(tx => `
                <tr>
                  <td>${escapeHTML(tx.date || "-")}</td>
                  <td>${escapeHTML(tx.productName || "-")}</td>
                  <td>${escapeHTML(tx.type || "-")}</td>
                  <td>${Number(tx.quantity) || 0}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state">
          Belum ada transaksi yang dicatat.
        </div>
      `}
    </section>
  `;

  pageContainer.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
      navigateTo(button.dataset.go);
    });
  });
}

// =====================================
// 8. HALAMAN SEMENTARA
// =====================================

function renderPlaceholder(page) {
  const info = pageInfo[page];

  const descriptions = {
  };
}

/* =====================================
   CRUD BARANG / LIHAT STOK
===================================== */

// let editingProductId = null;
let editingProductId = null;
let stockSearch = "";
let stockCategory ="all";
// let stockCategory = "all";


function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function createProductId() {
  const nextNumber = products.reduce((max, item) => {
    const match = String(item.id).match(/^BRG(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0) + 1;

  return "BRG" + String(nextNumber).padStart(3, "0");
}

/* ==========================================
   LIHAT STOK: EDIT IDENTITAS SAJA
========================================== */

function renderStock() {
  const categories = [...new Set(
    products.map(p => p.category).filter(Boolean)
  )];

  const keyword = stockSearch.toLowerCase();

  const filtered = products.filter(p => {
    const matchesText = [p.id, p.name, p.category].some(value =>
      String(value || "").toLowerCase().includes(keyword)
    );

    return matchesText &&
      (stockCategory === "all" || p.category === stockCategory);
  });

  const totalUnits = products.reduce(
    (sum, p) => sum + Number(p.stock || 0), 0
  );

  const totalValue = products.reduce(
    (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0), 0
  );

  const lowCount = products.filter(
    p => Number(p.stock) <= Number(p.minStock)
  ).length;

  pageContainer.innerHTML = `
    <div class="page-heading">
      <h1>Lihat Stok</h1>
      <p>Data barang hanya dapat diedit pada bagian identitas,
      harga, kategori, dan batas minimum. Perubahan stok dicatat
      melalui transaksi.</p>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <p>Jenis Barang</p>
        <h2>${products.length}</h2>
      </article>
      <article class="stat-card">
        <p>Total Unit Stok</p>
        <h2>${totalUnits}</h2>
      </article>
      <article class="stat-card">
        <p>Nilai Persediaan</p>
        <h2 class="value-heading">${formatRupiah(totalValue)}</h2>
      </article>
      <article class="stat-card">
        <p>Perlu Restock</p>
        <h2>${lowCount}</h2>
      </article>
    </div>

    <section class="panel">
      <div class="panel-heading">
        <h2>Daftar Barang</h2>
      </div>

      <div class="inline-tools">
        <input id="stockSearch" type="search"
          placeholder="Cari kode, nama, atau kategori..."
          value="${escapeHTML(stockSearch)}">

        <select id="stockCategory">
          <option value="all">Semua kategori</option>
          ${categories.map(c => `
            <option value="${escapeHTML(c)}"
              ${c === stockCategory ? "selected" : ""}>
              ${escapeHTML(c)}
            </option>
          `).join("")}
        </select>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID Barang</th>
              <th>Nama Barang</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Batas Minimum</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(p => {
              const low = Number(p.stock) <= Number(p.minStock);

              return `
                <tr>
                  <td>${escapeHTML(p.id)}</td>
                  <td>${escapeHTML(p.name)}</td>
                  <td>${escapeHTML(p.category)}</td>
                  <td>${formatRupiah(p.price)}</td>
                  <td>${Number(p.stock)}</td>
                  <td>${Number(p.minStock)}</td>
                  <td><span class="status ${low ? "low" : ""}">
                    ${low ? "Perlu Restock" : "Tersedia"}
                  </span></td>
                  <td>
                    <button class="btn-small"
                      data-edit-product="${escapeHTML(p.id)}">
                      Edit Identitas
                    </button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>

      ${filtered.length === 0
        ? '<div class="empty-state">Barang tidak ditemukan.</div>'
        : ""}
    </section>

    <section id="productFormPanel" class="panel" hidden>
      <div class="panel-heading">
        <h2>Edit Identitas Barang</h2>
        <button id="cancelProductButton" class="btn-secondary">
          Batal
        </button>
      </div>

      <form id="productForm">
        <div class="form-grid">
          <div class="form-field">
            <label>ID Barang</label>
            <input id="productId" readonly>
          </div>
          <div class="form-field">
            <label for="productName">Nama Barang *</label>
            <input id="productName" maxlength="100" required>
          </div>
          <div class="form-field">
            <label for="productCategory">Kategori *</label>
            <input id="productCategory" maxlength="60" required>
            <small class="muted">
              ID barang tetap meskipun kategori diubah.
            </small>
          </div>
          <div class="form-field">
            <label for="productPrice">Harga Satuan (Rp) *</label>
            <input id="productPrice" type="number"
              min="0" max="1000000000000" step="1" required>
          </div>
          <div class="form-field">
            <label for="productMinStock">Batas Minimum Stok *</label>
            <input id="productMinStock" type="number"
              min="0" max="1000000000" step="1" required>
          </div>
        </div>

        <p class="muted small-text">
          Jumlah stok tidak dapat diubah dari formulir ini.
          Gunakan menu Barang Masuk/Keluar untuk mencatat pergerakan stok.
        </p>

        <p id="productFormError" class="error-message" hidden></p>

        <div class="form-actions">
          <button type="submit" class="btn-primary">Simpan Perubahan</button>
          <button type="button" id="cancelProductButton2"
            class="btn-secondary">Batal</button>
        </div>
      </form>
    </section>
  `;

  document.getElementById("stockSearch").addEventListener("input", e => {
    stockSearch = e.target.value;
    renderStock();
    const input = document.getElementById("stockSearch");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });

  document.getElementById("stockCategory").addEventListener("change", e => {
    stockCategory = e.target.value;
    renderStock();
  });

  pageContainer.querySelectorAll("[data-edit-product]").forEach(button => {
    button.addEventListener("click", () =>
      openProductForm(button.dataset.editProduct)
    );
  });

  document.getElementById("cancelProductButton")
    .addEventListener("click", resetProductForm);

  document.getElementById("cancelProductButton2")
    .addEventListener("click", resetProductForm);

  document.getElementById("productForm")
    .addEventListener("submit", saveProduct);
}

function openProductForm(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  editingProductId = id;

  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productPrice").value = Number(product.price) || 0;
  document.getElementById("productMinStock").value =
    Number(product.minStock) || 0;

  const panel = document.getElementById("productFormPanel");
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetProductForm() {
  editingProductId = null;
  const panel = document.getElementById("productFormPanel");
  if (panel) panel.hidden = true;
}

function saveProduct(event) {
  event.preventDefault();

  const product = products.find(p => p.id === editingProductId);
  if (!product) return;

  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const priceText = document.getElementById("productPrice").value;
  const minText = document.getElementById("productMinStock").value;
  const price = Number(priceText);
  const minStock = Number(minText);

  const error = document.getElementById("productFormError");

  if (
    !name || !category || priceText === "" || minText === "" ||
    !Number.isSafeInteger(price) || price < 0 ||
    price > 1000000000000 ||
    !Number.isSafeInteger(minStock) || minStock < 0 ||
    minStock > 1000000000
  ) {
    error.textContent = "Periksa kembali data yang dimasukkan.";
    error.hidden = false;
    return;
  }

  // Hanya mengubah identitas dan batas minimum.
  // ID dan jumlah stok tidak disentuh.
  product.name = name;
  product.category = category;
  product.price = price;
  product.minStock = minStock;

  try {
    saveArray("ik_products", products);
  } catch {
    error.textContent = "Gagal menyimpan perubahan ke browser.";
    error.hidden = false;
    return;
  }

  // Sinkronkan nama barang pada catatan transaksi.
  transactions.forEach(tx => {
    if (tx.productId === product.id) {
      tx.productName = product.name;
    }
  });

  saveArray("ik_transactions", transactions);

  editingProductId = null;
  renderStock();
}


function focusStockSearch() {
  const input = document.getElementById("stockSearch");
  if (!input) return;

  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function openProductForm(id = null) {
  editingProductId = id;

  const panel = document.getElementById("productFormPanel");
  const form = document.getElementById("productForm");

  form.reset();

  const item = id
    ? products.find(product => product.id === id)
    : null;

  if (id && !item) {
    editingProductId = null;
    return;
  }

  document.getElementById("productFormTitle").textContent =
    item ? "Edit Barang" : "Tambah Barang Baru";

  if (item) {
    document.getElementById("productName").value = item.name;
    document.getElementById("productCategory").value = item.category;
    document.getElementById("productPrice").value = item.price;
    document.getElementById("productStock").value = item.stock;
    document.getElementById("productMinStock").value = item.minStock;
  }

  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });

  document.getElementById("productName").focus();
}

function resetProductForm() {
  editingProductId = null;

  const panel = document.getElementById("productFormPanel");
  if (panel) panel.hidden = true;

  const form = document.getElementById("productForm");
  if (form) form.reset();
}

function saveProduct(event) {
  event.preventDefault();

  const name = document.getElementById("productName")
    .value.trim();

  const category = document.getElementById("productCategory")
    .value.trim();

  const priceInput = document.getElementById("productPrice").value;
  const stockInput = document.getElementById("productStock").value;
  const minInput = document.getElementById("productMinStock").value;

  const price = Number(priceInput);
  const stock = Number(stockInput);
  const minStock = Number(minInput);

  const error = document.getElementById("productFormError");

  const validInteger = value =>
    Number.isSafeInteger(value) && value >= 0;

  if (
    !name || !category ||
    priceInput === "" || stockInput === "" || minInput === "" ||
    !validInteger(price) ||
    !validInteger(stock) ||
    !validInteger(minStock)
  ) {
    error.textContent =
      "Lengkapi semua kolom. Harga, stok, dan batas minimum harus bilangan bulat nonnegatif.";
    error.hidden = false;
    return;
  }

  if (
    price > 1000000000000 ||
    stock > 1000000000 ||
    minStock > 1000000000
  ) {
    error.textContent = "Nilai yang dimasukkan melebihi batas.";
    error.hidden = false;
    return;
  }

  if (editingProductId) {
    const item = products.find(
      product => product.id === editingProductId
    );

    if (!item) {
      error.textContent = "Barang tidak ditemukan.";
      error.hidden = false;
      return;
    }

    // Stok disunting langsung pada tahap CRUD ini.
    item.name = name;
    item.category = category;
    item.price = price;
    item.stock = stock;
    item.minStock = minStock;
  } else {
    products.push({
      id: createProductId(),
      name,
      category,
      price,
      stock,
      minStock
    });
  }

  saveArray("ik_products", products);

  // Perbarui dashboard ketika data barang berubah.
  resetProductForm();
  renderStock();
}

function deleteProduct(id) {
  const item = products.find(product => product.id === id);
  if (!item) return;

  const confirmed = confirm(
    `Apakah kamu yakin ingin menghapus "${item.name}"?`
  );

  if (!confirmed) return;

  products = products.filter(product => product.id !== id);
  saveArray("ik_products", products);

  if (editingProductId === id) {
    editingProductId = null;
  }

  renderStock();
}

// =====================================
// 9. RENDER HALAMAN
// =====================================

function renderPage() {
  if (currentPage === "dashboard") {
    renderDashboard();
  } else if (currentPage === "stok") {
    renderStock();
  } else if (currentPage === "transaksi") {
    renderTransactions();
  } else if (currentPage === "staff") {
    renderDirectory("staff");
  } else if (currentPage === "supplier") {
    renderDirectory("supplier");
  } else if (currentPage === "rekap") {
    renderPlaceholder("rekap");
  }
}


// Escape teks sebelum memasukkannya ke HTML.
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// =====================================
// 10. PULIHKAN SESI DEMO
// =====================================

try {
  const savedSession = JSON.parse(
    localStorage.getItem("ik_demo_session")
  );

  if (
    savedSession &&
    demoUsers.some(user =>
      user.username === savedSession.username &&
      user.role === savedSession.role &&
      user.name === savedSession.name
    )
  ) {
    currentUser = {
      username: savedSession.username,
      name: savedSession.name,
      role: savedSession.role
    };
  }
} catch {
  localStorage.removeItem("ik_demo_session");
}

if (currentUser) {
  openApplication();
} else {
  loginPage.hidden = false;
  appPage.hidden = true;
}

/* ==========================================
   TRANSAKSI: TAMBAH DAN EDIT RIWAYAT
========================================== */

let editingTransactionId = null;
let transactionFilter = "semua";

function renderTransactions() {
  const totalMasuk = transactions
    .filter(tx => tx.type === "Masuk")
    .reduce((sum, tx) => sum + Number(tx.quantity), 0);

  const totalKeluar = transactions
    .filter(tx => tx.type === "Keluar")
    .reduce((sum, tx) => sum + Number(tx.quantity), 0);

  const visibleTransactions = [...transactions]
    .reverse()
    .filter(tx =>
      transactionFilter === "semua" ||
      tx.type === transactionFilter
    );

  const editing = transactions.find(
    tx => tx.id === editingTransactionId
  );

  pageContainer.innerHTML = `
    <div class="page-heading">
      <h1>Barang Masuk/Keluar</h1>
      <p>
        Catat pergerakan stok dan edit riwayat transaksi
        jika terjadi kesalahan input.
      </p>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <p>Total Unit Masuk</p>
        <h2>${totalMasuk}</h2>
      </article>
      <article class="stat-card">
        <p>Total Unit Keluar</p>
        <h2>${totalKeluar}</h2>
      </article>
      <article class="stat-card">
        <p>Jenis Barang</p>
        <h2>${products.length}</h2>
      </article>
      <article class="stat-card">
        <p>Total Transaksi</p>
        <h2>${transactions.length}</h2>
      </article>
    </div>

    <section class="panel" id="transactionFormPanel">
      <div class="panel-heading">
        <h2>${editing ? "Edit Riwayat Transaksi" : "Input Transaksi Baru"}</h2>
        ${editing ? `
          <button type="button" id="cancelTransactionEdit"
            class="btn-secondary">Batal Edit</button>
        ` : ""}
      </div>

      ${products.length === 0 ? `
        <div class="empty-state">
          Belum ada barang yang dapat ditransaksikan.
        </div>
      ` : `
        <form id="transactionForm">
          <div class="form-grid">
            <div class="form-field">
              <label for="transactionType">Jenis Transaksi *</label>
              <select id="transactionType" required>
                <option value="Masuk"
                  ${editing?.type === "Masuk" ? "selected" : ""}>
                  Barang Masuk (+)
                </option>
                <option value="Keluar"
                  ${editing?.type === "Keluar" ? "selected" : ""}>
                  Barang Keluar (-)
                </option>
              </select>
            </div>

            <div class="form-field">
              <label for="transactionProduct">Pilih Barang *</label>
              <select id="transactionProduct" required>
                <option value="">-- Pilih Barang --</option>
                ${products.map(p => `
                  <option value="${escapeHTML(p.id)}"
                    ${editing?.productId === p.id ? "selected" : ""}>
                    ${escapeHTML(p.id)} - ${escapeHTML(p.name)}
                    (Stok sekarang: ${Number(p.stock)})
                  </option>
                `).join("")}
              </select>
            </div>

            <div class="form-field">
              <label for="transactionQuantity">Jumlah Barang *</label>
              <input id="transactionQuantity" type="number"
                min="1" max="1000000000" step="1" required
                value="${editing ? Number(editing.quantity) : ""}">
            </div>

            <div class="form-field">
              <label for="transactionNote">Deskripsi/Keterangan</label>
              <input id="transactionNote" maxlength="250"
                value="${escapeHTML(editing?.note || "")}"
                placeholder="Contoh: Barang diterima dari supplier">
            </div>
          </div>

          <p id="transactionStockInfo" class="stock-info muted small-text">
            Pilih barang untuk melihat stok saat ini.
          </p>

          ${editing ? `
            <p class="muted small-text">
              Tanggal asli transaksi dipertahankan saat diedit.
              Perubahan jumlah atau jenis akan menghitung ulang stok.
            </p>
          ` : ""}

          <p id="transactionError" class="error-message" hidden></p>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              ${editing ? "Simpan Perubahan" : "Simpan Transaksi"}
            </button>
            ${editing ? "" : `
              <button type="reset" class="btn-secondary">Reset Form</button>
            `}
          </div>
        </form>
      `}
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h2>Riwayat Transaksi</h2>
      </div>

      <div class="inline-tools">
        <select id="transactionFilter">
          <option value="semua">Semua transaksi</option>
          <option value="Masuk">Barang masuk</option>
          <option value="Keluar">Barang keluar</option>
        </select>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID Transaksi</th>
              <th>Tanggal</th>
              <th>ID Barang</th>
              <th>Nama Barang</th>
              <th>Jenis</th>
              <th>Jumlah</th>
              <th>Stok Sebelum</th>
              <th>Stok Sesudah</th>
              <th>Deskripsi</th>
              <th>Petugas</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${visibleTransactions.map(tx => `
              <tr>
                <td>${escapeHTML(tx.id)}</td>
                <td>${escapeHTML(tx.date || "-")}</td>
                <td>${escapeHTML(tx.productId)}</td>
                <td>${escapeHTML(tx.productName || "-")}</td>
                <td>
                  <span class="status ${tx.type === "Keluar" ? "low" : ""}">
                    ${escapeHTML(tx.type)}
                  </span>
                </td>
                <td>${Number(tx.quantity)}</td>
                <td>${Number.isFinite(Number(tx.stockBefore))
                  ? Number(tx.stockBefore) : "-"}</td>
                <td>${Number.isFinite(Number(tx.stockAfter))
                  ? Number(tx.stockAfter) : "-"}</td>
                <td>${escapeHTML(tx.note || "-")}</td>
                <td>${escapeHTML(tx.operator || "-")}</td>
                <td>
                  <button class="btn-small"
                    data-edit-transaction="${escapeHTML(tx.id)}">
                    Edit
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      ${visibleTransactions.length === 0
        ? '<div class="empty-state">Belum ada transaksi.</div>'
        : ""}
    </section>
  `;

  const filter = document.getElementById("transactionFilter");
  filter.value = transactionFilter;

  filter.addEventListener("change", e => {
    transactionFilter = e.target.value;
    renderTransactions();
  });

  pageContainer.querySelectorAll("[data-edit-transaction]")
    .forEach(button => {
      button.addEventListener("click", () => {
        editingTransactionId = button.dataset.editTransaction;
        renderTransactions();
        document.getElementById("transactionFormPanel")
          .scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

  const cancelEdit = document.getElementById("cancelTransactionEdit");

  if (cancelEdit) {
    cancelEdit.addEventListener("click", () => {
      editingTransactionId = null;
      renderTransactions();
    });
  }

  const form = document.getElementById("transactionForm");

  if (form) {
    document.getElementById("transactionProduct")
      .addEventListener("change", updateTransactionStockInfo);

    document.getElementById("transactionType")
      .addEventListener("change", updateTransactionStockInfo);

    form.addEventListener("submit", saveTransaction);
    updateTransactionStockInfo();
  }
}

function updateTransactionStockInfo() {
  const productId =
    document.getElementById("transactionProduct").value;

  const type =
    document.getElementById("transactionType").value;

  const info = document.getElementById("transactionStockInfo");
  const product = products.find(p => p.id === productId);

  if (!product) {
    info.textContent = "Pilih barang untuk melihat stok saat ini.";
    return;
  }

  info.textContent =
    `Stok saat ini: ${product.stock} unit. ` +
    (type === "Masuk"
      ? "Transaksi ini akan menambah stok."
      : "Transaksi ini akan mengurangi stok.");
}

function saveTransaction(event) {
  event.preventDefault();

  const error = document.getElementById("transactionError");
  const type = document.getElementById("transactionType").value;
  const productId = document.getElementById("transactionProduct").value;
  const quantityText = document.getElementById("transactionQuantity").value;
  const quantity = Number(quantityText);
  const note = document.getElementById("transactionNote").value.trim();

  const product = products.find(p => p.id === productId);
  const editing = transactions.find(
    tx => tx.id === editingTransactionId
  );

  if (
    !product ||
    !["Masuk", "Keluar"].includes(type) ||
    quantityText === "" ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 1000000000
  ) {
    error.textContent =
      "Pilih barang dan masukkan jumlah bilangan bulat positif.";
    error.hidden = false;
    return;
  }

  const previousProducts = JSON.parse(JSON.stringify(products));
  const previousTransactions = JSON.parse(JSON.stringify(transactions));

  let updatedTransactions;

  if (editing) {
    // Pertahankan ID, waktu, dan petugas pembuat transaksi.
    updatedTransactions = transactions.map(tx =>
      tx.id === editingTransactionId
        ? {
            ...tx,
            productId: product.id,
            productName: product.name,
            type,
            quantity,
            note,
            unitPrice: Number(product.price) || 0
          }
        : tx
    );
  } else {
    updatedTransactions = [
      ...transactions,
      {
        id: "TRX-" + Date.now() + "-" +
          Math.random().toString(36).slice(2, 7).toUpperCase(),
        timestamp: Date.now(),
        date: new Date().toLocaleString("id-ID"),
        productId: product.id,
        productName: product.name,
        type,
        quantity,
        note,
        unitPrice: Number(product.price) || 0,
        operator: currentUser ? currentUser.name : "Tidak diketahui"
      }
    ];
  }

  // Simulasikan seluruh transaksi terlebih dahulu.
  // Jangan simpan jika transaksi menyebabkan stok negatif.
  const ledger = calculateLedger(updatedTransactions);

  if (!ledger.ok) {
    error.textContent = ledger.message;
    error.hidden = false;
    return;
  }

  try {
    transactions = updatedTransactions;
    applyLedger(ledger, transactions);

    saveArray("ik_products", products);
    saveArray("ik_transactions", transactions);
  } catch {
    // Pulihkan data jika penyimpanan gagal.
    products = previousProducts;
    transactions = previousTransactions;

    try {
      saveArray("ik_products", products);
      saveArray("ik_transactions", transactions);
    } catch {
      // Browser mungkin tidak mengizinkan penulisan storage.
    }

    error.textContent =
      "Gagal menyimpan perubahan. Data transaksi dipulihkan jika memungkinkan.";
    error.hidden = false;
    return;
  }

  editingTransactionId = null;
  renderTransactions();
}


  
/* ==========================================
   MIGRASI ID BARANG BERDASARKAN KATEGORI
========================================== */

function categoryPrefix(category) {
  const normalized = String(category || "")
    .trim()
    .toLowerCase();

  const knownPrefixes = {
    pangan: "PGN",
    snack: "SNK",
    elektronik: "ELK",
    aksesori: "AKS",
    aksesoris: "AKS",
    kabel: "KBL",
    minuman: "MNM",
    pakaian: "PKN",
    kebersihan: "KBR"
  };

  if (knownPrefixes[normalized]) {
    return knownPrefixes[normalized];
  }

  const letters = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "")
    .toUpperCase();

  return (letters.slice(0, 3) || "BRG").padEnd(3, "X");
}

function migrateInventoryOnce() {
  const migrationKey = "ik_category_id_migration_v1";

  if (localStorage.getItem(migrationKey) === "done") {
    return;
  }

  const oldIds = new Map();
  const usedIds = new Set();

  // Pertahankan ID yang sudah sesuai kategori dan unik.
  for (const product of products) {
    const prefix = categoryPrefix(product.category);
    const id = String(product.id || "");
    const matches = id.match(/^([A-Z]{3})(\d+)$/);

    if (matches && matches[1] === prefix && !usedIds.has(id)) {
      usedIds.add(id);
      oldIds.set(id, id);
    }
  }

  const counters = {};

  for (const product of products) {
    const oldId = String(product.id || "");
    if (oldIds.has(oldId)) continue;

    const prefix = categoryPrefix(product.category);
    counters[prefix] = counters[prefix] || 0;

    let newId;

    do {
      counters[prefix]++;
      newId = prefix + String(counters[prefix]).padStart(3, "0");
    } while (usedIds.has(newId));

    usedIds.add(newId);
    oldIds.set(oldId, newId);
    product.id = newId;
  }

  // Perbarui referensi barang dalam riwayat.
  for (const tx of transactions) {
    const oldId = String(tx.productId || "");

    if (oldIds.has(oldId)) {
      tx.productId = oldIds.get(oldId);
    }

    const product = products.find(p => p.id === tx.productId);

    if (product) {
      tx.productName = product.name;
    }

    if (!Number.isFinite(Number(tx.timestamp))) {
      tx.timestamp = Date.now();
    }
  }

  // Stok saat ini dikurangi efek transaksi historis
  // untuk memperoleh saldo awal sebelum transaksi.
  for (const product of products) {
    let netEffect = 0;

    for (const tx of transactions) {
      if (tx.productId !== product.id) continue;

      const quantity = Number(tx.quantity) || 0;

      if (tx.type === "Masuk") netEffect += quantity;
      if (tx.type === "Keluar") netEffect -= quantity;
    }

    if (!Number.isFinite(Number(product.openingStock))) {
      product.openingStock = Number(product.stock || 0) - netEffect;
    }
  }

  saveArray("ik_products", products);
  saveArray("ik_transactions", transactions);
  localStorage.setItem(migrationKey, "done");
}

migrateInventoryOnce();


/* ==========================================
   DATA STAFF DAN SUPPLIER
========================================== */

let editingDirectoryId = null;
let viewingDirectoryRecord = null;

function renderDirectory(type) {
  const isStaff = type === "staff";
  const dataKey = isStaff ? "ik_staff" : "ik_suppliers";
  const data = isStaff ? staff : suppliers;
  const title = isStaff ? "Data Staff" : "Data Supplier";
  const singular = isStaff ? "Staff" : "Supplier";
  const isAdmin = currentUser && currentUser.role === "admin";

  const fields = isStaff
    ? [
        { key: "name", label: "Nama Staff", required: true },
        { key: "position", label: "Jabatan", required: true },
        { key: "phone", label: "Nomor Telepon" },
        { key: "email", label: "Email" }
      ]
    : [
        { key: "name", label: "Nama Supplier", required: true },
        { key: "contact", label: "Nama Kontak" },
        { key: "phone", label: "Nomor Telepon" },
        { key: "address", label: "Alamat" }
      ];

  const esc = escapeHTML;

  pageContainer.innerHTML = `
    <div class="page-heading">
      <h1>${title}</h1>
      <p>
        ${isAdmin
          ? "Admin dapat mengelola data. Staff hanya dapat melihat data."
          : "Mode lihat saja. Kamu tidak dapat mengubah data."}
      </p>
    </div>

    <section class="panel">
      <div class="panel-heading">
        <h2>Daftar ${title}</h2>
        ${isAdmin ? `
          <button id="addDirectoryButton" class="btn-primary">
            + Tambah ${singular}
          </button>
        ` : ""}
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              ${fields.map(f => `<th>${f.label}</th>`).join("")}
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(record => `
              <tr>
                <td>${esc(record.id)}</td>
                ${fields.map(f => `
                  <td>${esc(record[f.key] || "-")}</td>
                `).join("")}
                <td>
                  <div class="stock-actions">
                    <button class="btn-small"
                      data-view-directory="${esc(record.id)}">
                      Lihat
                    </button>
                    ${isAdmin ? `
                      <button class="btn-secondary"
                        data-edit-directory="${esc(record.id)}">
                        Edit
                      </button>
                      <button class="btn-danger"
                        data-delete-directory="${esc(record.id)}">
                        Hapus
                      </button>
                    ` : ""}
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      ${data.length === 0 ? `
        <div class="empty-state">
          Belum ada data ${singular.toLowerCase()}.
          ${isAdmin ? "Klik tombol tambah untuk membuat data." : ""}
        </div>
      ` : ""}
    </section>

    <section class="panel" id="directoryFormPanel" hidden>
      <div class="panel-heading">
        <h2 id="directoryFormTitle">Tambah ${singular}</h2>
        <button id="cancelDirectory" class="btn-secondary">Batal</button>
      </div>

      <form id="directoryForm">
        <div class="form-grid">
          ${fields.map(f => `
            <div class="form-field">
              <label for="dir_${f.key}">${f.label}${f.required ? " *" : ""}</label>
              <input id="dir_${f.key}" maxlength="250"
                ${f.required ? "required" : ""}>
            </div>
          `).join("")}
        </div>
        <p id="directoryError" class="error-message" hidden></p>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Simpan</button>
          <button type="button" id="cancelDirectory2"
            class="btn-secondary">Batal</button>
        </div>
      </form>
    </section>

    <section class="panel" id="directoryViewPanel" hidden>
      <div class="panel-heading">
        <h2>Detail ${singular}</h2>
        <button id="closeDirectoryView" class="btn-secondary">
          Tutup
        </button>
      </div>
      <div id="directoryDetails"></div>
    </section>
  `;

  const getCurrentData = () => isStaff ? staff : suppliers;

  function closeForm() {
    editingDirectoryId = null;
    document.getElementById("directoryFormPanel").hidden = true;
  }

  function openForm(id = null) {
    if (!isAdmin) return;

    editingDirectoryId = id;
    const record = id
      ? getCurrentData().find(r => r.id === id)
      : null;

    if (id && !record) return;

    document.getElementById("directoryForm").reset();
    document.getElementById("directoryFormTitle").textContent =
      record ? `Edit ${singular}` : `Tambah ${singular}`;

    fields.forEach(f => {
      document.getElementById(`dir_${f.key}`).value =
        record ? record[f.key] || "" : "";
    });

    const panel = document.getElementById("directoryFormPanel");
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function saveDirectory(event) {
    event.preventDefault();
    if (!isAdmin) return;

    const record = {};
    for (const f of fields) {
      record[f.key] = document.getElementById(`dir_${f.key}`)
        .value.trim();

      if (f.required && !record[f.key]) {
        const error = document.getElementById("directoryError");
        error.textContent = `${f.label} wajib diisi.`;
        error.hidden = false;
        return;
      }
    }

    const list = getCurrentData();

    if (editingDirectoryId) {
      const existing = list.find(r => r.id === editingDirectoryId);
      if (!existing) return;

      Object.assign(existing, record);
    } else {
      const next = list.reduce((max, r) => {
        const match = String(r.id || "").match(/\d+$/);
        return match ? Math.max(max, Number(match[0])) : max;
      }, 0) + 1;

      record.id = (isStaff ? "STF" : "SUP") +
        String(next).padStart(3, "0");

      list.push(record);
    }

    try {
      saveArray(dataKey, list);
    } catch {
      const error = document.getElementById("directoryError");
      error.textContent = "Data gagal disimpan ke browser.";
      error.hidden = false;
      return;
    }

    editingDirectoryId = null;
    renderDirectory(type);
  }

  document.getElementById("directoryForm")
    .addEventListener("submit", saveDirectory);

  document.getElementById("cancelDirectory")
    .addEventListener("click", closeForm);

  document.getElementById("cancelDirectory2")
    .addEventListener("click", closeForm);

  if (isAdmin) {
    document.getElementById("addDirectoryButton")
      .addEventListener("click", () => openForm());
  }

  pageContainer.querySelectorAll("[data-view-directory]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const record = getCurrentData().find(
          r => r.id === button.dataset.viewDirectory
        );

        if (!record) return;

        const panel = document.getElementById("directoryViewPanel");
        const details = document.getElementById("directoryDetails");

        details.innerHTML = `
          <dl class="directory-details">
            <dt>ID</dt><dd>${esc(record.id)}</dd>
            ${fields.map(f => `
              <dt>${f.label}</dt>
              <dd>${esc(record[f.key] || "-")}</dd>
            `).join("")}
          </dl>
        `;

        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

  pageContainer.querySelectorAll("[data-edit-directory]")
    .forEach(button => {
      button.addEventListener("click", () =>
        openForm(button.dataset.editDirectory)
      );
    });

  pageContainer.querySelectorAll("[data-delete-directory]")
    .forEach(button => {
      button.addEventListener("click", () => {
        if (!isAdmin) return;

        const id = button.dataset.deleteDirectory;
        const record = getCurrentData().find(r => r.id === id);
        if (!record) return;

        if (!confirm(`Hapus data "${record.name}"?`)) return;

        const remaining = getCurrentData().filter(r => r.id !== id);

        if (isStaff) {
          staff = remaining;
        } else {
          suppliers = remaining;
        }

        try {
          saveArray(dataKey, remaining);
        } catch {
          alert("Data gagal dihapus dari penyimpanan browser.");
        }

        renderDirectory(type);
      });
    });

  document.getElementById("closeDirectoryView")
    .addEventListener("click", () => {
      document.getElementById("directoryViewPanel").hidden = true;
    });
}


/* ==========================================
   PERHITUNGAN ULANG STOK DARI RIWAYAT
========================================== */

function calculateLedger(transactionList) {
  const balances = new Map();
  const snapshots = new Map();

  for (const product of products) {
    const opening = Number(product.openingStock);

    if (!Number.isSafeInteger(opening)) {
      return {
        ok: false,
        message: `Saldo awal ${product.name} tidak valid.`
      };
    }

    balances.set(product.id, opening);
  }

  const ordered = transactionList
    .map((tx, index) => ({ tx, index }))
    .sort((a, b) =>
      (Number(a.tx.timestamp) - Number(b.tx.timestamp)) ||
      (a.index - b.index)
    );

  for (const entry of ordered) {
    const tx = entry.tx;
    const product = products.find(p => p.id === tx.productId);

    if (!product) {
      return {
        ok: false,
        message: `Barang ${tx.productId} tidak ditemukan.`
      };
    }

    const quantity = Number(tx.quantity);
    const before = balances.get(product.id);

    if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      !Number.isSafeInteger(before)
    ) {
      return {
        ok: false,
        message: "Terdapat jumlah transaksi atau saldo yang tidak valid."
      };
    }

    let after;

    if (tx.type === "Masuk") {
      after = before + quantity;
    } else if (tx.type === "Keluar") {
      after = before - quantity;
    } else {
      return {
        ok: false,
        message: `Jenis transaksi ${tx.id} tidak valid.`
      };
    }

    if (!Number.isSafeInteger(after) || after < 0) {
      return {
        ok: false,
        message:
          `Perubahan membuat stok ${product.name} negatif ` +
          `pada transaksi ${tx.id}. Periksa transaksi berikutnya.`
      };
    }

    balances.set(product.id, after);

    snapshots.set(tx.id, {
      stockBefore: before,
      stockAfter: after
    });
  }

  return { ok: true, balances, snapshots };
}

function applyLedger(result, transactionList) {
  for (const product of products) {
    product.stock = result.balances.get(product.id);
  }

  for (const tx of transactionList) {
    const snapshot = result.snapshots.get(tx.id);

    if (snapshot) {
      tx.stockBefore = snapshot.stockBefore;
      tx.stockAfter = snapshot.stockAfter;
    }
  }
}
