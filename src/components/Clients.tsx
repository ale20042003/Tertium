import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, ChevronRight, X, ArrowUpDown } from 'lucide-react';
import { useAppContext } from '../store';
import { Client } from '../types';
import { ClientDetails } from './ClientDetails';

export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', birthDate: '' });
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } else if (sortBy === 'newest') {
      return clients.indexOf(b) - clients.indexOf(a);
    } else if (sortBy === 'oldest') {
      return clients.indexOf(a) - clients.indexOf(b);
    }
    return 0;
  });

  /* ─── Client modal ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailExists = clients.some(c =>
      c.email.toLowerCase() === formData.email.toLowerCase() &&
      (!editingClient || c.id !== editingClient.id)
    );
    if (emailExists) { setError('Un cliente con questa email è già presente.'); return; }

    // Il salvataggio passa dal database: se fallisce, la modale resta aperta con il motivo.
    try {
      if (editingClient) { await updateClient({ ...editingClient, ...formData }); }
      else { await addClient(formData); }
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito.');
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        birthDate: client.birthDate || '',
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', birthDate: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', birthDate: '' });
    setError(null);
  };

  if (selectedClientId) {
    const client = clients.find(c => c.id === selectedClientId);
    if (client) return <ClientDetails client={client} onBack={() => setSelectedClientId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Clienti</h1>
          <p className="text-neutral-500">Gestisci i tuoi clienti e le loro schede</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-950 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-800 transition-colors flex items-center gap-2"
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
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <ArrowUpDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm text-neutral-700 font-medium cursor-pointer"
            >
              <option value="alphabetical">Ordine Alfabetico (A-Z)</option>
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
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sortedClients.length > 0 ? (
                sortedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-neutral-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-600">
                      <div>{client.email}</div>
                      {client.phone && <div className="text-xs text-neutral-400 mt-0.5">{client.phone}</div>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedClientId(client.id)}
                          className="p-2 text-brand-600 hover:bg-brand-50 transition-colors rounded-lg font-medium flex items-center gap-1"
                        >
                          Scheda <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(client)}
                          className="p-2 text-neutral-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
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
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-neutral-500">
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
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="es. Mario Rossi" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="mario@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Telefono</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="es. 333 1234567" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Data di Nascita</label>
                <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-brand-950 text-white font-medium hover:bg-brand-800 rounded-lg transition-colors">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
