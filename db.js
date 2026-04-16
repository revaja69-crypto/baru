// Inisialisasi Database
const db = new Dexie('CashflowUMKMPro_DB');

// Skema Tabel
db.version(1).stores({
  categories: '++id, name, icon', 
  inventory: '++id, name, categoryId, stock, buyPrice, sellPrice',
  transactions: '++id, type, amount, date, description, relatedItemId' 
});
