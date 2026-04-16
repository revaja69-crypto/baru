import Dexie from 'dexie';

export const db = new Dexie('CashflowInventoryDB');
db.version(1).stores({
  categories: '++id, name, icon',
  inventory: '++id, name, categoryId, stock, price',
  transactions: '++id, type, amount, method, date, description'
});
