import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Edit2, X, Package, ShoppingCart, ListTree } from 'lucide-react';
import { useAppContext } from '../store';
import { Product } from '../types';

const CATEGORIES = ['Integratori', 'Abbigliamento', 'Accessori', 'Bevande', 'Altro'];

const emptyForm = { name: '', category: CATEGORIES[0], price: '', cost: '', stock: '0', active: true };

export const Shop: React.FC = () => {
  const { products, sales, addProduct, updateProduct, deleteProduct, sellProduct, deleteSale, clients } = useAppContext();
  const [tab, setTab] = useState<'catalogo' | 'vendite'>('catalogo');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const openModal = (p?: Product) => {
    if (p) {
      setEditing(p);
      setFormData({ name: p.name, category: p.category, price: String(p.price), cost: p.cost !== undefined ? String(p.cost) : '', stock: String(p.stock), active: p.active });
    } else {
      setEditing(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setFormData(emptyForm); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name, category: formData.category,
      price: parseFloat(formData.price) || 0,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      stock: parseInt(formData.stock) || 0,
      active: formData.active,
    };
    if (editing) updateProduct({ ...editing, ...payload });
    else addProduct(payload);
    closeModal();
  };

  /* ─── Vendita rapida ─── */
  const [sellProductId, setSellProductId] = useState('');
  const [sellQuantity, setSellQuantity] = useState('1');
  const [sellClientId, setSellClientId] = useState('');
  const [sellError, setSellError] = useState('');

  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    setSellError('');
    const qty = parseInt(sellQuantity) || 0;
    if (!sellProductId || qty <= 0) return;
    const ok = sellProduct(sellProductId, qty, sellClientId || undefined);
    if (!ok) { setSellError('Scorte insufficienti per questa quantità.'); return; }
    setSellProductId('');
    setSellQuantity('1');
    setSellClientId('');
  };

  const todaySales = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return sales.filter(s => s.date.startsWith(todayStr));
  }, [sales]);

  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Negozio</h1>
          <p className="text-neutral-500">Catalogo prodotti e vendite</p>
        </div>
        {tab === 'catalogo' && (
          <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" /> Nuovo Prodotto
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0"><ShoppingCart className="w-5 h-5" /></div>
          <div>
            <p className="text-neutral-500 text-xs font-medium">Vendite Oggi</p>
            <h3 className="text-2xl font-bold text-emerald-700">€{todayTotal.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0"><Package className="w-5 h-5" /></div>
          <div>
            <p className="text-neutral-500 text-xs font-medium">Prodotti a Catalogo</p>
            <h3 className="text-2xl font-bold text-neutral-900">{products.length}</h3>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-neutral-200">
        <button onClick={() => setTab('catalogo')} className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${tab === 'catalogo' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
          <ListTree className="w-4 h-4" /> Catalogo
        </button>
        <button onClick={() => setTab('vendite')} className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${tab === 'vendite' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
          <ShoppingCart className="w-4 h-4" /> Vendite
        </button>
      </div>

      {tab === 'catalogo' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium border-b border-neutral-200">Prodotto</th>
                  <th className="p-4 font-medium border-b border-neutral-200">Categoria</th>
                  <th className="p-4 font-medium border-b border-neutral-200">Prezzo</th>
                  <th className="p-4 font-medium border-b border-neutral-200">Scorte</th>
                  <th className="p-4 font-medium border-b border-neutral-200">Stato</th>
                  <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {products.length > 0 ? products.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 font-medium text-neutral-900">{p.name}</td>
                    <td className="p-4 text-neutral-600">{p.category}</td>
                    <td className="p-4 text-neutral-600 font-semibold">€{p.price.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : p.stock < 5 ? 'text-amber-600' : 'text-neutral-700'}`}>{p.stock}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.active ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {p.active ? 'Attivo' : 'Non in vendita'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(p)} className="p-2 text-neutral-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (window.confirm('Eliminare questo prodotto?')) deleteProduct(p.id); }} className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Nessun prodotto a catalogo.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'vendite' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Vendita Rapida</h2>
            <form onSubmit={handleSell} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Prodotto</label>
                <select value={sellProductId} onChange={(e) => setSellProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Seleziona...</option>
                  {products.filter(p => p.active && p.stock > 0).map(p => (
                    <option key={p.id} value={p.id}>{p.name} (€{p.price.toFixed(2)}, {p.stock} in stock)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Quantità</label>
                <input type="number" min="1" value={sellQuantity} onChange={(e) => { if (e.target.value.includes('-')) return; setSellQuantity(e.target.value); }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Cliente (opz.)</label>
                <select value={sellClientId} onChange={(e) => setSellClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Nessuno</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-4">
                <button type="submit" disabled={!sellProductId} className="px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Registra Vendita
                </button>
                {sellError && <span className="ml-3 text-sm text-red-600 font-medium">{sellError}</span>}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900">Storico Vendite</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium border-b border-neutral-200">Data</th>
                    <th className="p-4 font-medium border-b border-neutral-200">Prodotto</th>
                    <th className="p-4 font-medium border-b border-neutral-200">Cliente</th>
                    <th className="p-4 font-medium border-b border-neutral-200 text-center">Qtà</th>
                    <th className="p-4 font-medium border-b border-neutral-200 text-right">Totale</th>
                    <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {sales.length > 0 ? sales.map(s => {
                    const product = products.find(p => p.id === s.productId);
                    const client = clients.find(c => c.id === s.clientId);
                    return (
                      <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-4 text-neutral-600">{new Date(s.date).toLocaleDateString('it-IT')}</td>
                        <td className="p-4 font-medium text-neutral-900">{product?.name || 'Prodotto eliminato'}</td>
                        <td className="p-4 text-neutral-600">{client?.name || '—'}</td>
                        <td className="p-4 text-center text-neutral-600">{s.quantity}</td>
                        <td className="p-4 text-right font-semibold text-emerald-700">€{s.total.toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => { if (window.confirm('Eliminare questa vendita dallo storico? (non ripristina le scorte)')) deleteSale(s.id); }} className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Nessuna vendita registrata.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-900">{editing ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Prodotto</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. Proteine Whey 1kg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Categoria</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Scorte</label>
                  <input type="number" min="0" required value={formData.stock}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setFormData({ ...formData, stock: e.target.value }); }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Prezzo di Vendita (€)</label>
                  <input type="number" min="0" step="0.01" required value={formData.price}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setFormData({ ...formData, price: e.target.value }); }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. 29.90" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Costo di Acquisto (€)</label>
                  <input type="number" min="0" step="0.01" value={formData.cost}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setFormData({ ...formData, cost: e.target.value }); }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="opzionale" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-neutral-700">Disponibile per la vendita</span>
              </label>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
