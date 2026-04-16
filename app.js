// ==================== 1. PWA & INSTALL ====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Error:', err));
  });
}

let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'block';
});
installBtn.addEventListener('click', () => {
  installBtn.style.display = 'none';
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
});

// ==================== 2. MODAL & UI UTILS ====================
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}
function selectIcon(icon) {
  document.getElementById('catIcon').value = icon;
}

// ==================== 3. LOGIKA KATEGORI ====================
async function saveCategory() {
  const name = document.getElementById('catName').value;
  const icon = document.getElementById('catIcon').value;
  if (!name || !icon) return alert('Isi nama dan pilih ikon!');

  await db.categories.add({ name, icon });
  
  document.getElementById('catName').value = '';
  document.getElementById('catIcon').value = '';
  closeModal('categoryModal');
  
  renderCategories();
  updateDashboard();
}

async function renderCategories() {
  const list = document.getElementById('categoryList');
  list.innerHTML = '';
  const categories = await db.categories.toArray();

  categories.forEach(cat => {
    const div = document.createElement('div');
    div.className = 'category-badge';
    div.innerHTML = `
      <span class="category-icon">${cat.icon}</span>
      <span class="category-name" style="display:block; font-weight:bold;">${cat.name}</span>
      <button onclick="deleteCategory(${cat.id})" style="background:none; border:none; color:#f87171; margin-top:10px; cursor:pointer; font-size:12px;">Hapus</button>
    `;
    list.appendChild(div);
  });
}

async function deleteCategory(id) {
  if (confirm("Hapus kategori ini?")) {
    await db.categories.delete(id);
    renderCategories();
    updateDashboard();
  }
}

// ==================== 4. TRANSAKSI & DASHBOARD ====================
async function saveTransaction() {
  const type = document.getElementById('txType').value;
  const amount = parseInt(document.getElementById('txAmount').value);
  const description = document.getElementById('txDesc').value;

  if (!amount || !description) return alert('Isi jumlah dan keterangan!');

  await db.transactions.add({
    type: type,
    amount: amount,
    date: new Date().toISOString(),
    description: description
  });

  document.getElementById('txAmount').value = '';
  document.getElementById('txDesc').value = '';
  closeModal('transactionModal');

  renderTransactions();
  updateDashboard();
}

async function renderTransactions() {
  const filterType = document.getElementById('filterType').value;
  const tbody = document.getElementById('transactionTableBody');
  tbody.innerHTML = '';

  let transactions = await db.transactions.orderBy('date').reverse().toArray();
  if (filterType !== 'all') transactions = transactions.filter(tx => tx.type === filterType);

  transactions.forEach(tx => {
    const isIncome = tx.type === 'cash_in';
    const amountClass = isIncome ? 'text-green' : 'text-red';
    const sign = isIncome ? '+' : '-';
    const amountStr = new Intl.NumberFormat('id-ID').format(tx.amount);
    const dateObj = new Date(tx.date);
    const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${dateStr}</td>
      <td>${tx.description}</td>
      <td>${isIncome ? 'Masuk' : 'Keluar'}</td>
      <td class="${amountClass}">${sign} Rp ${amountStr}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function updateDashboard() {
  // Hitung Kas Masuk
  const transactions = await db.transactions.toArray();
  const totalIncome = transactions
    .filter(tx => tx.type === 'cash_in')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const formattedIncome = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(totalIncome);

  // Hitung Kategori
  const categoriesCount = await db.categories.count();

  document.getElementById('kasMasukTxt').innerText = formattedIncome;
  document.getElementById('totalStokTxt').innerText = `${categoriesCount} Kategori`;
}

// ==================== 5. INITIALIZE ====================
window.addEventListener('DOMContentLoaded', () => {
  renderCategories();
  renderTransactions();
  updateDashboard();
});
