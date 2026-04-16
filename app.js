// 1. Daftarkan Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker terdaftar!', reg.scope))
      .catch(err => console.log('Service Worker gagal:', err));
  });
}

// 2. Tangani Tombol Install di Desktop Chrome
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  // Cegah prompt muncul otomatis
  e.preventDefault();
  deferredPrompt = e;
  // Munculkan tombol install custom kita
  installBtn.style.display = 'block';

  installBtn.addEventListener('click', () => {
    installBtn.style.display = 'none';
    // Munculkan prompt instalasi bawaan Chrome
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User menerima instalasi PWA');
      }
      deferredPrompt = null;
    });
  });
});
// Fungsi untuk memproses transaksi penjualan
async function processSale(itemId, qty, paymentType) {
  const item = await db.inventory.get(itemId);
  
  if (item.stock < qty) {
    alert("Stok tidak mencukupi!");
    return;
  }

  // 1. Kurangi Stok
  await db.inventory.update(itemId, {
    stock: item.stock - qty
  });

  // 2. Tambah Arus Kas (Pendapatan)
  const totalIncome = item.sellPrice * qty;
  await db.transactions.add({
    type: 'cash_in',
    method: paymentType, // 'cash' atau 'transfer'
    amount: totalIncome,
    date: new Date().toISOString(),
    description: `Penjualan ${qty}x ${item.name}`,
    relatedItemId: itemId
  });

  alert("Transaksi Berhasil!");
  updateUI(); // Fungsi untuk refresh tampilan dashboard
}

// Fungsi CRUD Kategori dengan Dexie
async function saveCategory() {
  const id = document.getElementById('categoryId').value;
  const name = document.getElementById('catName').value;
  const icon = document.getElementById('catIcon').value;

  if (id) {
    await db.categories.update(parseInt(id), { name, icon });
  } else {
    await db.categories.add({ name, icon });
  }
  
  closeModal();
  renderCategories();
}
// Fungsi untuk memuat dan menampilkan kategori
async function renderCategories() {
  const categoryList = document.getElementById('categoryList');
  categoryList.innerHTML = ''; // Kosongkan sebelum render ulang

  const categories = await db.categories.toArray();

  categories.forEach(cat => {
    const div = document.createElement('div');
    div.className = 'category-badge';
    div.innerHTML = `
      <span class="category-icon">${cat.icon}</span>
      <span class="category-name">${cat.name}</span>
      <button onclick="deleteCategory(${cat.id})" style="background:transparent; border:none; color:#FF2A85; margin-top:5px; cursor:pointer;">Hapus</button>
    `;
    categoryList.appendChild(div);
  });
}

// Fungsi Hapus Kategori
async function deleteCategory(id) {
  if(confirm("Hapus kategori ini?")) {
    await db.categories.delete(id);
    renderCategories(); // Render ulang setelah dihapus
  }
}
// Fungsi untuk menghitung dan memperbarui Dashboard
async function updateDashboard() {
  // 1. Hitung Total Kas Masuk
  const transactions = await db.transactions.toArray();
  
  // Menggunakan fungsi reduce untuk menjumlahkan semua 'amount' yang bertipe 'cash_in'
  const totalIncome = transactions
    .filter(tx => tx.type === 'cash_in')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Format ke Rupiah
  const formattedIncome = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(totalIncome);

  // 2. Hitung Total Item Stok
  const inventory = await db.inventory.toArray();
  const totalItems = inventory.length; // Atau bisa dijumlahkan total kuantitas stoknya

  // 3. Update DOM (Pastikan id elemen ini ada di index.html)
  // Ubah struktur dashboard di HTML sebelumnya menjadi menggunakan ID:
  // <div class="card neon-blue"><h3 id="kasMasukTxt">...</h3></div>
  const kasMasukEl = document.getElementById('kasMasukTxt');
  const totalStokEl = document.getElementById('totalStokTxt');

  if (kasMasukEl) kasMasukEl.innerText = formattedIncome;
  if (totalStokEl) totalStokEl.innerText = `${totalItems} Jenis Item`;
}
async function renderTransactions() {
  const filterType = document.getElementById('filterType').value;
  const tbody = document.getElementById('transactionTableBody');
  tbody.innerHTML = '';

  let transactions = await db.transactions.orderBy('date').reverse().toArray();

  if (filterType !== 'all') {
    transactions = transactions.filter(tx => tx.type === filterType);
  }

  transactions.forEach(tx => {
    const isIncome = tx.type === 'cash_in';
    const amountClass = isIncome ? 'text-green' : 'text-red';
    const sign = isIncome ? '+' : '-';
    
    // Format uang
    const amountStr = new Intl.NumberFormat('id-ID').format(tx.amount);
    
    // Format tanggal sederhana
    const dateObj = new Date(tx.date);
    const dateStr = `${dateObj.getDate()}/${dateObj.getMonth()+1}/${dateObj.getFullYear()}`;

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
// Jalankan saat halaman selesai dimuat
window.addEventListener('DOMContentLoaded', () => {
  renderCategories();
  updateDashboard();
  renderTransactions();
});