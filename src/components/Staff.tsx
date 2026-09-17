import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, X, UserCog } from 'lucide-react';
import { useAppContext } from '../store';
import { StaffMember } from '../types';

const ROLES = ['Istruttore', 'Personal Trainer', 'Segreteria', 'Manutenzione', 'Amministrazione', 'Altro'];

const emptyForm = {
  name: '', email: '', phone: '', role: ROLES[0], active: true, hourlyRate: '', hireDate: '', notes: '',
};

export const Staff: React.FC = () => {
  const { staff, addStaff, updateStaff, deleteStaff } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (s?: StaffMember) => {
    if (s) {
      setEditing(s);
      setFormData({
        name: s.name, email: s.email, phone: s.phone || '', role: s.role, active: s.active,
        hourlyRate: s.hourlyRate !== undefined ? String(s.hourlyRate) : '', hireDate: s.hireDate || '', notes: s.notes || '',
      });
    } else {
      setEditing(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setFormData(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      role: formData.role,
      active: formData.active,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      hireDate: formData.hireDate || undefined,
      notes: formData.notes || undefined,
    };
    if (editing) updateStaff({ ...editing, ...payload });
    else addStaff(payload);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Personale</h1>
          <p className="text-neutral-500">Anagrafica istruttori e staff, usata per assegnare i corsi</p>
        </div>
        <button onClick={() => openModal()} className="bg-brand-950 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-800 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Aggiungi Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Cerca per nome o ruolo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-neutral-200">Nome</th>
                <th className="p-4 font-medium border-b border-neutral-200">Ruolo</th>
                <th className="p-4 font-medium border-b border-neutral-200">Contatti</th>
                <th className="p-4 font-medium border-b border-neutral-200">Compenso</th>
                <th className="p-4 font-medium border-b border-neutral-200">Stato</th>
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.length > 0 ? filtered.map(s => (
                <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 flex-shrink-0">
                        <UserCog className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-neutral-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-600">{s.role}</td>
                  <td className="p-4 text-neutral-600">
                    <div>{s.email}</div>
                    {s.phone && <div className="text-xs text-neutral-400 mt-0.5">{s.phone}</div>}
                  </td>
                  <td className="p-4 text-neutral-600">{s.hourlyRate ? `€${s.hourlyRate.toFixed(2)}/h` : '—'}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                      {s.active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(s)} className="p-2 text-neutral-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (window.confirm('Eliminare questo membro dello staff?')) deleteStaff(s.id); }} className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Nessun membro dello staff trovato.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-neutral-900">{editing ? 'Modifica Staff' : 'Nuovo Membro Staff'}</h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Completo</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="es. Laura Bianchi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="laura@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Telefono</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="333 1234567" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Ruolo</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Compenso (€/h)</label>
                  <input type="number" min="0" step="0.01" value={formData.hourlyRate}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setFormData({ ...formData, hourlyRate: e.target.value }); }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="es. 15.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Data Assunzione</label>
                  <input type="date" value={formData.hireDate} onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <label className="flex items-center gap-2 pb-2 cursor-pointer">
                  <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-medium text-neutral-700">Attivo</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Note</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Note aggiuntive..." />
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
