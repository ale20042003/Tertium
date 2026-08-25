import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Edit2, X, Receipt, Repeat } from 'lucide-react';
import { useAppContext } from '../store';
import { Expense } from '../types';

const CATEGORIES = ['Affitto', 'Utenze', 'Stipendi', 'Manutenzione', 'Marketing', 'Attrezzatura', 'Altro'];

const emptyForm = { date: new Date().toISOString().split('T')[0], category: CATEGORIES[0], description: '', amount: '', recurring: false };

export const Expenses: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const filtered = [...expenses]
    .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const summary = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const totalMonth = expenses.filter(e => e.date.startsWith(monthKey)).reduce((s, e) => s + e.amount, 0);
    const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    return { totalMonth, totalAll, byCategory };
  }, [expenses]);

  const openModal = (e?: Expense) => {
    if (e) {
      setEditing(e);
      setFormData({ date: e.date, category: e.category, description: e.description, amount: String(e.amount), recurring: !!e.recurring });
    } else {
      setEditing(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setFormData(emptyForm); };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const payload = { date: formData.date, category: formData.category, description: formData.description, amount: parseFloat(formData.amount) || 0, recurring: formData.recurring };
    if (editing) updateExpense({ ...editing, ...payload });
    else addExpense(payload);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Spese</h1>
          <p className="text-neutral-500">Traccia le uscite della palestra</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Aggiungi Spesa
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0"><Receipt className="w-5 h-5" /></div>
          <div>
            <p className="text-neutral-500 text-xs font-medium">Spese Mese Corrente</p>
            <h3 className="text-2xl font-bold text-red-700">€{summary.totalMonth.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
          <p className="text-neutral-500 text-xs font-medium mb-2">Spese per Categoria</p>
          {Object.keys(summary.byCategory).length === 0 ? (
            <p className="text-sm text-neutral-400 italic">Nessuna spesa registrata</p>
          ) : (
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between items-center text-sm">
                  <span className="text-neutral-700">{cat}</span>
                  <span className="font-semibold text-neutral-900">€{amt.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Cerca per descrizione o categoria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-neutral-200">Data</th>
                <th className="p-4 font-medium border-b border-neutral-200">Categoria</th>
                <th className="p-4 font-medium border-b border-neutral-200">Descrizione</th>
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Importo</th>
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.length > 0 ? filtered.map(e => (
                <tr key={e.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4 text-neutral-600">{new Date(e.date + 'T00:00:00').toLocaleDateString('it-IT')}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">{e.category}</span>
                  </td>
                  <td className="p-4 text-neutral-900 font-medium">
                    <div className="flex items-center gap-1.5">
                      {e.description}
                      {e.recurring && <Repeat className="w-3.5 h-3.5 text-blue-400" aria-label="Spesa ricorrente" />}
                    </div>
                  </td>
                  <td className="p-4 text-right font-semibold text-red-600">€{e.amount.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(e)} className="p-2 text-neutral-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (window.confirm('Eliminare questa spesa?')) deleteExpense(e.id); }} className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="p-8 text-center text-neutral-500">Nessuna spesa trovata.</td></tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-neutral-50 border-t-2 border-neutral-200">
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-neutral-700">Totale</td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-red-600">€{filtered.reduce((s, e) => s + e.amount, 0).toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-900">{editing ? 'Modifica Spesa' : 'Nuova Spesa'}</h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Descrizione</label>
                <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. Bolletta elettrica" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Data</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Categoria</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Importo (€)</label>
                  <input type="number" min="0" step="0.01" required value={formData.amount}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setFormData({ ...formData, amount: e.target.value }); }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. 120.00" />
                </div>
                <label className="flex items-center gap-2 pb-2 cursor-pointer">
                  <input type="checkbox" checked={formData.recurring} onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-neutral-700">Ricorrente</span>
                </label>
              </div>
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
