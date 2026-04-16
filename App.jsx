import React, { useState, useEffect } from 'react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { LayoutDashboard, Package, ArrowUpCircle, ArrowDownCircle, Plus, Trash2 } from 'lucide-react';

export default function App() {
  const categories = useLiveQuery(() => db.categories.toArray());
  const inventory = useLiveQuery(() => db.inventory.toArray());
  const transactions = useLiveQuery(() => db.transactions.toArray());

  const [stats, setStats] = useState({ masuk: 0, keluar: 0, stokTotal: 0 });

  useEffect(() => {
    if (transactions && inventory) {
      const masuk = transactions.filter(t => t.type === 'cash_in').reduce((a, b) => a + b.amount, 0);
      const keluar = transactions.filter(t => t.type === 'cash_out').reduce((a, b) => a + b.amount, 0);
      const stok = inventory.reduce((a, b) => a + (parseInt(b.stock) || 0), 0);
      setStats({ masuk, keluar, stokTotal: stok });
    }
  }, [transactions, inventory]);

  const addCategory = async () => {
    const name = prompt("Nama Kategori:");
    const icon = prompt("Emoji Icon (misal: 📱):");
    if (name && icon) await db.categories.add({ name, icon });
  };

  const deleteCategory = async (id) => {
    if (confirm("Hapus kategori ini?")) await db.categories.delete(id);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex justify-between items-center mb-10 p-6 glass-card">
        <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">CASHFLOW PRO</h1>
        <button className="px-6 py-2 rounded-full border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 transition-all">
          Install App
        </button>
      </header>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 glass-card neon-border-blue">
          <div className="flex items-center gap-3 text-cyan-400 mb-2">
            <ArrowUpCircle size={20} /> <span className="text-sm font-semibold uppercase">Kas Masuk</span>
          </div>
          <h2 className="text-3xl font-bold">Rp {stats.masuk.toLocaleString()}</h2>
        </div>
        <div className="p-6 glass-card neon-border-pink">
          <div className="flex items-center gap-3 text-pink-500 mb-2">
            <ArrowDownCircle size={20} /> <span className="text-sm font-semibold uppercase">Kas Keluar</span>
          </div>
          <h2 className="text-3xl font-bold">Rp {stats.keluar.toLocaleString()}</h2>
        </div>
        <div className="p-6 glass-card border-yellow-400/50 shadow-lg shadow-yellow-400/10">
          <div className="flex items-center gap-3 text-yellow-400 mb-2">
            <Package size={20} /> <span className="text-sm font-semibold uppercase">Total Stok</span>
          </div>
          <h2 className="text-3xl font-bold">{stats.stokTotal} Unit</h2>
        </div>
      </div>

      {/* Categories & Stock */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Kategori & Inventaris</h3>
          <button onClick={addCategory} className="flex items-center gap-2 btn-neon px-5 py-2 rounded-full text-white">
            <Plus size={18} /> Kategori
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories?.map(cat => (
            <div key={cat.id} className="p-4 glass-card hover:border-cyan-400/50 transition-all group relative">
              <span className="text-4xl block mb-2 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">{cat.icon}</span>
              <h4 className="font-bold">{cat.name}</h4>
              <p className="text-xs text-slate-400">
                {inventory?.filter(i => i.categoryId === cat.id).length || 0} Produk
              </p>
              <button 
                onClick={() => deleteCategory(cat.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-pink-500 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
