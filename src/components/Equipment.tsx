import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, X, Wrench, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../store';
import { Equipment as EquipmentType, EquipmentStatus } from '../types';

const CATEGORIES = ['Cardio', 'Pesi Liberi', 'Macchine Isotoniche', 'Funzionale', 'Altro'];
const STATUS_OPTIONS: { value: EquipmentStatus; label: string; className: string }[] = [
  { value: 'operativo', label: 'Operativo', className: 'bg-green-50 text-green-700' },
  { value: 'manutenzione', label: 'In Manutenzione', className: 'bg-amber-50 text-amber-700' },
  { value: 'guasto', label: 'Guasto', className: 'bg-red-50 text-red-700' },
  { value: 'dismesso', label: 'Dismesso', className: 'bg-neutral-100 text-neutral-500' },
];

const emptyForm = { name: '', category: CATEGORIES[0], status: 'operativo' as EquipmentStatus, purchaseDate: '', lastMaintenanceDate: '', nextMaintenanceDate: '', notes: '' };

export const Equipment: React.FC = () => {
  const { equipment, addEquipment, updateEquipment, deleteEquipment } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentType | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today); in7Days.setDate(in7Days.getDate() + 7);

  const filtered = equipment.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maintenanceDue = equipment.filter(e => e.nextMaintenanceDate && new Date(e.nextMaintenanceDate + 'T00:00:00') <= in7Days && e.status !== 'dismesso');
  const brokenCount = equipment.filter(e => e.status === 'guasto').length;

  const openModal = (e?: EquipmentType) => {
    if (e) {
      setEditing(e);
      setFormData({
        name: e.name, category: e.category, status: e.status,
        purchaseDate: e.purchaseDate || '', lastMaintenanceDate: e.lastMaintenanceDate || '', nextMaintenanceDate: e.nextMaintenanceDate || '',
        notes: e.notes || '',
      });
    } else {
      setEditing(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setFormData(emptyForm); };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const payload = {
      name: formData.name, category: formData.category, status: formData.status,
      purchaseDate: formData.purchaseDate || undefined,
      lastMaintenanceDate: formData.lastMaintenanceDate || undefined,
      nextMaintenanceDate: formData.nextMaintenanceDate || undefined,
      notes: formData.notes || undefined,
    };
    if (editing) updateEquipment({ ...editing, ...payload });
    else addEquipment(payload);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Attrezzature</h1>
          <p className="text-neutral-500">Inventario e manutenzione degli attrezzi</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Aggiungi Attrezzo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <p className="text-neutral-500 text-xs font-medium">Guasti</p>
            <h3 className="text-2xl font-bold text-neutral-900">{brokenCount}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0"><Wrench className="w-5 h-5" /></div>
          <div>
            <p className="text-neutral-500 text-xs font-medium">Manutenzioni in scadenza (7gg)</p>
            <h3 className="text-2xl font-bold text-neutral-900">{maintenanceDue.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Cerca per nome o categoria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-neutral-200">Nome</th>
                <th className="p-4 font-medium border-b border-neutral-200">Categoria</th>
                <th className="p-4 font-medium border-b border-neutral-200">Stato</th>
                <th className="p-4 font-medium border-b border-neutral-200">Prossima Manutenzione</th>
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.length > 0 ? filtered.map(e => {
                const statusInfo = STATUS_OPTIONS.find(s => s.value === e.status)!;
                const isDue = e.nextMaintenanceDate && new Date(e.nextMaintenanceDate + 'T00:00:00') <= in7Days && e.status !== 'dismesso';
                return (
                  <tr key={e.id} className={`hover:bg-neutral-50 transition-colors ${isDue ? 'bg-amber-50/40' : ''}`}>
                    <td className="p-4 font-medium text-neutral-900">{e.name}</td>
                    <td className="p-4 text-neutral-600">{e.category}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
                    </td>
                    <td className="p-4 text-neutral-600">
                      {e.nextMaintenanceDate ? (
                        <span className={`inline-flex items-center gap-1 ${isDue ? 'text-amber-700 font-semibold' : ''}`}>
                          {isDue && <AlertTriangle className="w-3.5 h-3.5" />}
                          {new Date(e.nextMaintenanceDate + 'T00:00:00').toLocaleDateString('it-IT')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(e)} className="p-2 text-neutral-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (window.confirm('Eliminare questo attrezzo?')) deleteEquipment(e.id); }} className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} className="p-8 text-center text-neutral-500">Nessun attrezzo trovato.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-neutral-900">{editing ? 'Modifica Attrezzo' : 'Nuovo Attrezzo'}</h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Attrezzo</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. Tapis Roulet 3" />
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Stato</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Acquisto</label>
                  <input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Ultima Manut.</label>
                  <input type="date" value={formData.lastMaintenanceDate} onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Prossima Manut.</label>
                  <input type="date" value={formData.nextMaintenanceDate} onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
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
