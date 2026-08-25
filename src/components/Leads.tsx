import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, X, UserPlus, ArrowRightCircle } from 'lucide-react';
import { useAppContext } from '../store';
import { Lead, LeadStatus } from '../types';

const SOURCES = ['Walk-in', 'Social Media', 'Passaparola', 'Sito Web', 'Volantino', 'Altro'];
const STATUS_OPTIONS: { value: LeadStatus; label: string; className: string }[] = [
  { value: 'nuovo', label: 'Nuovo', className: 'bg-blue-50 text-blue-700' },
  { value: 'contattato', label: 'Contattato', className: 'bg-purple-50 text-purple-700' },
  { value: 'prova_fissata', label: 'Prova Fissata', className: 'bg-amber-50 text-amber-700' },
  { value: 'convertito', label: 'Convertito', className: 'bg-green-50 text-green-700' },
  { value: 'perso', label: 'Perso', className: 'bg-neutral-100 text-neutral-500' },
];

const emptyForm = { name: '', email: '', phone: '', source: SOURCES[0], status: 'nuovo' as LeadStatus, trialDate: '', notes: '' };

export const Leads: React.FC = () => {
  const { leads, addLead, updateLead, deleteLead, convertLeadToClient } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const filtered = leads
    .filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(l => statusFilter === 'all' || l.status === statusFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const conversionRate = leads.length > 0 ? Math.round((leads.filter(l => l.status === 'convertito').length / leads.length) * 100) : 0;

  const openModal = (l?: Lead) => {
    if (l) {
      setEditing(l);
      setFormData({ name: l.name, email: l.email || '', phone: l.phone || '', source: l.source, status: l.status, trialDate: l.trialDate || '', notes: l.notes || '' });
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
      name: formData.name, email: formData.email || undefined, phone: formData.phone || undefined,
      source: formData.source, status: formData.status, trialDate: formData.trialDate || undefined, notes: formData.notes || undefined,
    };
    if (editing) updateLead({ ...editing, ...payload });
    else addLead(payload);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lead / Prospect</h1>
          <p className="text-neutral-500">Contatti potenziali e pipeline di conversione</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Aggiungi Lead
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATUS_OPTIONS.slice(0, 4).map(s => (
          <div key={s.value} className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-xs font-medium mb-1">{s.label}</p>
            <h3 className="text-xl font-bold text-neutral-900">{leads.filter(l => l.status === s.value).length}</h3>
          </div>
        ))}
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4 w-full sm:w-auto sm:inline-flex">
        <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0"><UserPlus className="w-5 h-5" /></div>
        <div>
          <p className="text-neutral-500 text-xs font-medium">Tasso di Conversione</p>
          <h3 className="text-2xl font-bold text-emerald-700">{conversionRate}%</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Cerca per nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-neutral-700 font-medium">
            <option value="all">Tutti gli stati</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-neutral-200">Nome</th>
                <th className="p-4 font-medium border-b border-neutral-200">Contatti</th>
                <th className="p-4 font-medium border-b border-neutral-200">Fonte</th>
                <th className="p-4 font-medium border-b border-neutral-200">Stato</th>
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.length > 0 ? filtered.map(l => {
                const statusInfo = STATUS_OPTIONS.find(s => s.value === l.status)!;
                return (
                  <tr key={l.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 font-medium text-neutral-900">{l.name}</td>
                    <td className="p-4 text-neutral-600 text-sm">
                      {l.email && <div>{l.email}</div>}
                      {l.phone && <div className="text-xs text-neutral-400">{l.phone}</div>}
                      {!l.email && !l.phone && '—'}
                    </td>
                    <td className="p-4 text-neutral-600">{l.source}</td>
                    <td className="p-4">
                      <select value={l.status} onChange={(e) => updateLead({ ...l, status: e.target.value as LeadStatus })}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer ${statusInfo.className}`}>
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {l.status !== 'convertito' && (
                          <button onClick={() => { if (window.confirm(`Convertire "${l.name}" in cliente?`)) convertLeadToClient(l.id); }}
                            title="Converti in cliente" className="p-2 text-emerald-600 hover:bg-emerald-50 transition-colors rounded-lg">
                            <ArrowRightCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openModal(l)} className="p-2 text-neutral-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (window.confirm('Eliminare questo lead?')) deleteLead(l.id); }} className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} className="p-8 text-center text-neutral-500">Nessun lead trovato.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-neutral-900">{editing ? 'Modifica Lead' : 'Nuovo Lead'}</h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Completo</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. Anna Verdi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="anna@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Telefono</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="333 1234567" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Fonte</label>
                  <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Stato</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Data Prova</label>
                <input type="date" value={formData.trialDate} onChange={(e) => setFormData({ ...formData, trialDate: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Note</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Note aggiuntive..." />
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
