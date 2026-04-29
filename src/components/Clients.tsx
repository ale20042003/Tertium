import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, ChevronRight, X, Euro, CheckCircle2, Circle, ArrowUpDown } from 'lucide-react';
import { useAppContext } from '../store';
import { Client, ClientPayment, PaymentInstallment } from '../types';
import { ClientDetails } from './ClientDetails';

export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, subscriptions, updateClientPayment } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subscriptionId: '', subscriptionStart: '' });
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Payment modal state
  const [paymentClientId, setPaymentClientId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<{ amountPaid: string; installments: { id: string; dueDate: string; amount: string; paid: boolean }[] }>({
    amountPaid: '',
    installments: [],
  });

  // 1. Filtro ricerca
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  // 2. Ordinamento
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'expiration') {
      if (!a.subscriptionEnd && !b.subscriptionEnd) return 0;
      if (!a.subscriptionEnd) return 1;
      if (!b.subscriptionEnd) return -1;
      return new Date(a.subscriptionEnd).getTime() - new Date(b.subscriptionEnd).getTime();
    } else if (sortBy === 'newest') {
      return clients.indexOf(b) - clients.indexOf(a);
    } else if (sortBy === 'oldest') {
      return clients.indexOf(a) - clients.indexOf(b);
    }
    return 0;
  });

  /* ─── Client modal ─── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailExists = clients.some(c =>
      c.email.toLowerCase() === formData.email.toLowerCase() &&
      (!editingClient || c.id !== editingClient.id)
    );
    if (emailExists) { setError('Un cliente con questa email è già presente.'); return; }

    let end = '';
    if (formData.subscriptionId && formData.subscriptionStart) {
      const sub = subscriptions.find(s => s.id === formData.subscriptionId);
      if (sub) {
        const startDate = new Date(formData.subscriptionStart);
        if (sub.durationMonths > 0) {
          startDate.setMonth(startDate.getMonth() + sub.durationMonths);
        } else if (sub.durationDays && sub.durationDays > 0) {
          startDate.setDate(startDate.getDate() + sub.durationDays);
        }
        end = startDate.toISOString().split('T')[0];
      }
    }
    const submitData = { ...formData, subscriptionEnd: end };
    if (editingClient) { updateClient({ ...editingClient, ...submitData }); }
    else { addClient(submitData); }
    closeModal();
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({ 
        name: client.name, 
        email: client.email, 
        phone: client.phone || '', 
        subscriptionId: client.subscriptionId || '', 
        subscriptionStart: client.subscriptionStart || '' 
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', subscriptionId: '', subscriptionStart: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', subscriptionId: '', subscriptionStart: '' });
    setError(null);
  };

  /* ─── Payment modal ─── */
  const openPaymentModal = (client: Client) => {
    const sub = subscriptions.find(s => s.id === client.subscriptionId);
    const existing = client.payment;
    if (existing) {
      setPaymentForm({
        amountPaid: String(existing.amountPaid),
        installments: existing.installments.map(i => ({ ...i, amount: String(i.amount) })),
      });
    } else {
      const numRate = sub?.defaultInstallments ?? 1;
      const rataCost = sub ? (sub.cost / numRate) : 0;
      const startDate = client.subscriptionStart ? new Date(client.subscriptionStart + 'T00:00:00') : new Date();
      const installments = Array.from({ length: numRate }, (_, i) => {
        const due = new Date(startDate);
        due.setMonth(due.getMonth() + i + 1);
        return {
          id: crypto.randomUUID(),
          dueDate: due.toISOString().split('T')[0],
          amount: rataCost.toFixed(2),
          paid: false,
        };
      });
      setPaymentForm({ amountPaid: '', installments });
    }
    setPaymentClientId(client.id);
  };

  const closePaymentModal = () => { setPaymentClientId(null); };

  const addInstallment = () => {
    setPaymentForm(prev => ({
      ...prev,
      installments: [...prev.installments, { id: crypto.randomUUID(), dueDate: '', amount: '', paid: false }],
    }));
  };

  const removeInstallment = (id: string) => {
    setPaymentForm(prev => ({ ...prev, installments: prev.installments.filter(i => i.id !== id) }));
  };

  const updateInstallment = (id: string, field: string, value: string | boolean) => {
    if (typeof value === 'string' && value.includes('-')) return;

    setPaymentForm(prev => {
      const updated = prev.installments.map(i => i.id === id ? { ...i, [field]: value } : i);
      if (field === 'paid' || field === 'amount') {
        const newAmountPaid = updated
          .filter(i => i.paid)
          .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
        return { installments: updated, amountPaid: newAmountPaid.toFixed(2) };
      }
      return { ...prev, installments: updated };
    });
  };

  const handleSavePayments = () => {
    if (!paymentClientId) return;
    const client = clients.find(c => c.id === paymentClientId);
    if (!client) return;
    const sub = subscriptions.find(s => s.id === client.subscriptionId);
    const payment: ClientPayment = {
      totalCost: sub?.cost ?? 0,
      amountPaid: parseFloat(paymentForm.amountPaid) || 0,
      installments: paymentForm.installments.map(i => ({
        id: i.id,
        dueDate: i.dueDate,
        amount: parseFloat(i.amount) || 0,
        paid: i.paid,
      })),
    };
    updateClientPayment(paymentClientId, payment);
    closePaymentModal();
  };

  if (selectedClientId) {
    const client = clients.find(c => c.id === selectedClientId);
    if (client) return <ClientDetails client={client} onBack={() => setSelectedClientId(null)} />;
  }

  const paymentClient = paymentClientId ? clients.find(c => c.id === paymentClientId) : null;
  const paymentSub = paymentClient ? subscriptions.find(s => s.id === paymentClient.subscriptionId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Clienti</h1>
          <p className="text-neutral-500">Gestisci i tuoi clienti e le loro schede</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Aggiungi Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cerca per nome, email o telefono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <ArrowUpDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-neutral-700 font-medium cursor-pointer"
            >
              <option value="alphabetical">Ordine Alfabetico (A-Z)</option>
              <option value="expiration">Scadenza Abbonamento</option>
              <option value="newest">Dal più recente al meno recente</option>
              <option value="oldest">Dal meno recente al più recente</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-neutral-200">Cliente</th>
                <th className="p-4 font-medium border-b border-neutral-200">Contatti</th>
                <th className="p-4 font-medium border-b border-neutral-200">Abbonamento</th>
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sortedClients.length > 0 ? (
                sortedClients.map((client) => {
                  const sub = subscriptions.find(s => s.id === client.subscriptionId);
                  const pay = client.payment;
                  return (
                    <tr key={client.id} className="hover:bg-neutral-50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-neutral-900">{client.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-neutral-600">
                        <div>{client.email}</div>
                        {client.phone && <div className="text-xs text-neutral-400 mt-0.5">{client.phone}</div>}
                      </td>
                      <td className="p-4">
                        {client.subscriptionId || client.subscriptionStart || client.subscriptionEnd ? (
                          <div className="text-sm">
                            {client.subscriptionId && (
                              <div className="font-semibold text-neutral-900 truncate max-w-[150px]">
                                {sub?.name || 'Abbonamento'}
                              </div>
                            )}
                            <div className="text-neutral-500">
                              {client.subscriptionStart ? new Date(client.subscriptionStart).toLocaleDateString() : '-'}
                              {' - '}
                              {client.subscriptionEnd ? new Date(client.subscriptionEnd).toLocaleDateString() : '-'}
                            </div>
                            {pay && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <div className="w-20 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-green-500"
                                    style={{ width: `${Math.min(100, (pay.amountPaid / pay.totalCost) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-neutral-500">
                                  €{pay.amountPaid.toFixed(0)}/{pay.totalCost.toFixed(0)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-sm italic">Non impostato</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedClientId(client.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 transition-colors rounded-lg font-medium flex items-center gap-1"
                          >
                            Scheda <ChevronRight className="w-4 h-4" />
                          </button>
                          {client.subscriptionId && (
                            <button
                              onClick={() => openPaymentModal(client)}
                              title="Gestisci pagamenti"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 transition-colors rounded-lg"
                            >
                              <Euro className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openModal(client)}
                            className="p-2 text-neutral-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Sei sicuro di voler eliminare questo cliente?')) {
                                deleteClient(client.id);
                              }
                            }}
                            className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">
                    Nessun cliente trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal Cliente ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingClient ? 'Modifica Cliente' : 'Nuovo Cliente'}
              </h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Completo</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. Mario Rossi" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mario@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Telefono</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. 333 1234567" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo Abbonamento</label>
                  <select value={formData.subscriptionId} onChange={(e) => setFormData({ ...formData, subscriptionId: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Nessun abbonamento</option>
                    {subscriptions.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.durationMonths > 0 ? `${sub.durationMonths} mesi` : `${sub.durationDays || 0} giorni`})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Inizio Abbonamento</label>
                  <input type="date" value={formData.subscriptionStart} onChange={(e) => setFormData({ ...formData, subscriptionStart: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={!formData.subscriptionId} />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Pagamenti ─── */}
      {paymentClientId && paymentClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Gestione Pagamenti</h2>
                <p className="text-sm text-neutral-500 mt-0.5">{paymentClient.name}</p>
              </div>
              <button onClick={closePaymentModal} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {paymentSub && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-800">{paymentSub.name}</div>
                    <div className="text-xs text-blue-600 mt-0.5">
                      {paymentSub.durationMonths > 0 ? `${paymentSub.durationMonths} mesi` : `${paymentSub.durationDays || 0} giorni`} · Costo totale
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">€{paymentSub.cost.toFixed(2)}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Importo già saldato (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.amountPaid}
                  onChange={(e) => {
                    if (e.target.value.includes('-')) return;
                    setPaymentForm(prev => ({ ...prev, amountPaid: e.target.value }));
                  }}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="es. 150.00"
                />
                {paymentSub && paymentForm.amountPaid !== '' && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Rimanente: <span className="font-semibold text-red-600">€{(paymentSub.cost - (parseFloat(paymentForm.amountPaid) || 0)).toFixed(2)}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-neutral-700">Rate di pagamento</label>
                  <button
                    type="button"
                    onClick={addInstallment}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Aggiungi Rata
                  </button>
                </div>

                {paymentForm.installments.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-neutral-300 rounded-xl text-neutral-400 text-sm">
                    Nessuna rata configurata
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentForm.installments.map((inst, idx) => (
                      <div key={inst.id} className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-xs font-bold text-neutral-400 w-5 flex-shrink-0">#{idx + 1}</span>
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="relative w-28 flex-shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">€</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={inst.amount}
                            onChange={(e) => updateInstallment(inst.id, 'amount', e.target.value)}
                            className="w-full pl-6 pr-2 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0.00"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => updateInstallment(inst.id, 'paid', !inst.paid)}
                          className={`p-1 rounded-lg transition-colors flex-shrink-0 ${inst.paid ? 'text-green-600 hover:bg-green-50' : 'text-neutral-400 hover:bg-neutral-100'}`}
                        >
                          {inst.paid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeInstallment(inst.id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex gap-3 justify-end flex-shrink-0">
              <button type="button" onClick={closePaymentModal} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors">Annulla</button>
              <button type="button" onClick={handleSavePayments} className="px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg transition-colors">
                Salva Pagamenti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};