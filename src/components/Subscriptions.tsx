import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, X, Ticket } from 'lucide-react';
import { useAppContext } from '../store';
import { Subscription } from '../types';

export const Subscriptions: React.FC = () => {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  
  // Aggiunto durationDays allo state del form
  const [formData, setFormData] = useState({ 
    name: '', 
    durationMonths: '1', 
    durationDays: '0', 
    cost: '', 
    defaultInstallments: '1' 
  });

  const filteredSubscriptions = subscriptions.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convertiamo i valori. Se i mesi sono 0, leggiamo i giorni.
    const months = parseInt(formData.durationMonths) || 0;
    const days = parseInt(formData.durationDays) || 0;

    const payload = {
      name: formData.name,
      durationMonths: months,
      durationDays: days,
      cost: parseFloat(formData.cost) || 0,
      defaultInstallments: parseInt(formData.defaultInstallments) || 1,
    };

    if (editingSubscription) {
      updateSubscription({ ...editingSubscription, ...payload });
    } else {
      addSubscription(payload);
    }
    
    setIsModalOpen(false);
    setEditingSubscription(null);
    setFormData({ name: '', durationMonths: '1', durationDays: '0', cost: '', defaultInstallments: '1' });
  };

  const openModal = (sub?: Subscription) => {
    if (sub) {
      setEditingSubscription(sub);
      setFormData({ 
        name: sub.name, 
        durationMonths: String(sub.durationMonths), 
        durationDays: String(sub.durationDays || 0), 
        cost: String(sub.cost), 
        defaultInstallments: String(sub.defaultInstallments ?? 1) 
      });
    } else {
      setEditingSubscription(null);
      setFormData({ name: '', durationMonths: '1', durationDays: '0', cost: '', defaultInstallments: '1' });
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingSubscription(null);
    setFormData({ name: '', durationMonths: '1', durationDays: '0', cost: '', defaultInstallments: '1' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Abbonamenti</h1>
          <p className="text-neutral-500">Gestisci i tipi di abbonamento della palestra</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Aggiungi Abbonamento
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cerca per nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-neutral-200">Nome Abbonamento</th>
                <th className="p-4 font-medium border-b border-neutral-200">Durata</th>
                <th className="p-4 font-medium border-b border-neutral-200">Costo (€)</th>
                <th className="p-4 font-medium border-b border-neutral-200">Rate Default</th>
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredSubscriptions.length > 0 ? (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 font-medium text-neutral-900">{sub.name}</td>
                    <td className="p-4 text-neutral-600">
                      {/* Logica di visualizzazione: Mesi o Giorni */}
                      {sub.durationMonths > 0 
                        ? `${sub.durationMonths} ${sub.durationMonths === 1 ? 'Mese' : 'Mesi'}`
                        : `${sub.durationDays || 0} Giorni`
                      }
                    </td>
                    <td className="p-4 text-neutral-600 font-semibold">€{sub.cost.toFixed(2)}</td>
                    <td className="p-4 text-neutral-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {sub.defaultInstallments ?? 1} {(sub.defaultInstallments ?? 1) === 1 ? 'rata' : 'rate'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(sub)}
                          className="p-2 text-neutral-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Sei sicuro di voler eliminare questo abbonamento?')) {
                              deleteSubscription(sub.id);
                            }
                          }}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500">
                    Nessun abbonamento trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingSubscription ? 'Modifica Abbonamento' : 'Nuovo Abbonamento'}
              </h2>
              <button onClick={handleCancel} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Abbonamento</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="es. Annuale, Ingresso Singolo, Settimanale..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Durata (Mesi)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.durationMonths}
                    onChange={(e) => {
                      if (e.target.value.includes('-')) return;
                      // Se imposta i mesi > 0, azzeriamo i giorni per chiarezza
                      const val = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        durationMonths: val,
                        durationDays: Number(val) > 0 ? '0' : prev.durationDays 
                      }));
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="es. 12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Oppure in Giorni</label>
                  <input
                    type="number"
                    min="0"
                    required
                    disabled={Number(formData.durationMonths) > 0} // Disabilita se ci sono già mesi impostati
                    value={formData.durationDays}
                    onChange={(e) => {
                      if (e.target.value.includes('-')) return;
                      setFormData({ ...formData, durationDays: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-neutral-100 disabled:text-neutral-400"
                    placeholder="es. 1, 7, 15"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block leading-tight">
                    *Metti "0" sui mesi per abilitare i giorni.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Costo (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.cost}
                    onChange={(e) => {
                      if (e.target.value.includes('-')) return;
                      setFormData({ ...formData, cost: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="es. 299.90"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">N° Rate</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.defaultInstallments}
                    onChange={(e) => {
                      if (e.target.value.includes('-')) return;
                      setFormData({ ...formData, defaultInstallments: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="es. 3"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};