// Pastikan Dexie di-load di HTML melalui CDN atau NPM
const db = new Dexie('CashflowUMKMPro_DB');

// Definisikan Skema Database
db.version(1).stores({
  // ++id = auto increment. Sisanya adalah index yang bisa dicari.
  categories: '++id, name, icon', 
  inventory: '++id, name, categoryId, stock, buyPrice, sellPrice',
  transactions: '++id, type, amount, date, description, relatedItemId' 
  // type: 'cash_in', 'cash_out', 'transfer'
});

// Contoh Fungsi Smooth untuk Tambah Kategori
async function addCategory(name, iconSvg) {
  try {
    await db.categories.add({
      name: name,
      icon: iconSvg
    });
    console.log("Kategori berhasil ditambahkan!");
    // Panggil fungsi render UI di sini
  } catch (error) {
    console.error("Gagal menambah kategori:", error);
  }
}