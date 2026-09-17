import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Pin, PinOff, Megaphone } from 'lucide-react';
import { useAppContext } from '../store';
import { Announcement } from '../types';

const emptyForm = { title: '', message: '', pinned: false };

export const Announcements: React.FC = () => {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const openModal = (a?: Announcement) => {
    if (a) {
      setEditing(a);
      setFormData({ title: a.title, message: a.message, pinned: !!a.pinned });
    } else {
      setEditing(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setFormData(emptyForm); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateAnnouncement({ ...editing, ...formData });
    else addAnnouncement(formData);
    closeModal();
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Bacheca</h1>
          <p className="text-neutral-500">Avvisi e comunicazioni per i clienti</p>
        </div>
        <button onClick={() => openModal()} className="bg-brand-950 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-800 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nuovo Annuncio
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-neutral-900">Annunci ({announcements.length})</h2>
        </div>
        <div className="p-4">
          {sortedAnnouncements.length === 0 ? (
            <p className="text-sm text-neutral-400 italic text-center py-6">Nessun annuncio in bacheca.</p>
          ) : (
            <div className="space-y-3">
              {sortedAnnouncements.map(a => (
                <div key={a.id} className={`p-4 rounded-xl border ${a.pinned ? 'border-brand-200 bg-brand-50/40' : 'border-neutral-200'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-2">
                      {a.pinned && <Pin className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />}
                      <div>
                        <h3 className="font-semibold text-neutral-900">{a.title}</h3>
                        <p className="text-sm text-neutral-600 mt-1 whitespace-pre-wrap">{a.message}</p>
                        <p className="text-xs text-neutral-400 mt-2">{new Date(a.createdAt).toLocaleString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => updateAnnouncement({ ...a, pinned: !a.pinned })} className="p-1.5 text-neutral-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors" title={a.pinned ? 'Rimuovi da in evidenza' : 'Metti in evidenza'}>
                        {a.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openModal(a)} className="p-1.5 text-neutral-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (window.confirm('Eliminare questo annuncio?')) deleteAnnouncement(a.id); }} className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-900">{editing ? 'Modifica Annuncio' : 'Nuovo Annuncio'}</h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Titolo</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="es. Corso di martedì spostato" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Messaggio</label>
                <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Dettagli dell'annuncio..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.pinned} onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm font-medium text-neutral-700">Metti in evidenza</span>
              </label>
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
