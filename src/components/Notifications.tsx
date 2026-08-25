import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Edit2, X, Pin, PinOff, Bell, AlertTriangle, CreditCard, Cake, FileWarning, Wrench, Clock3 } from 'lucide-react';
import { useAppContext } from '../store';
import { Announcement } from '../types';

const emptyForm = { title: '', message: '', pinned: false };

export const Notifications: React.FC = () => {
  const { clients, subscriptions, equipment, announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const alerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);

    const items: { id: string; icon: React.ReactNode; text: string; tone: 'red' | 'amber' | 'blue' }[] = [];

    clients.forEach(c => {
      if (c.subscriptionEnd) {
        const end = new Date(c.subscriptionEnd);
        if (end < today) {
          items.push({ id: `sub-expired-${c.id}`, icon: <CreditCard className="w-4 h-4" />, text: `Abbonamento di ${c.name} è scaduto`, tone: 'red' });
        } else if (end <= in7) {
          items.push({ id: `sub-soon-${c.id}`, icon: <CreditCard className="w-4 h-4" />, text: `Abbonamento di ${c.name} scade entro 7 giorni`, tone: 'amber' });
        }
      }
      if (c.payment) {
        c.payment.installments.forEach(inst => {
          if (!inst.paid && inst.dueDate && new Date(inst.dueDate + 'T00:00:00') < today) {
            items.push({ id: `inst-${inst.id}`, icon: <Clock3 className="w-4 h-4" />, text: `Rata scaduta per ${c.name} (€${inst.amount.toFixed(2)})`, tone: 'red' });
          }
        });
      }
      if (c.medicalCertificateExpiry) {
        const exp = new Date(c.medicalCertificateExpiry + 'T00:00:00');
        if (exp < today) {
          items.push({ id: `cert-expired-${c.id}`, icon: <FileWarning className="w-4 h-4" />, text: `Certificato medico di ${c.name} è scaduto`, tone: 'red' });
        } else if (exp <= in30) {
          items.push({ id: `cert-soon-${c.id}`, icon: <FileWarning className="w-4 h-4" />, text: `Certificato medico di ${c.name} scade entro 30 giorni`, tone: 'amber' });
        }
      }
      if (c.birthDate) {
        const bd = new Date(c.birthDate + 'T00:00:00');
        const thisYearBd = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
        const diffDays = Math.round((thisYearBd.getTime() - today.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays <= 7) {
          items.push({ id: `bday-${c.id}`, icon: <Cake className="w-4 h-4" />, text: diffDays === 0 ? `Oggi è il compleanno di ${c.name}!` : `${c.name} compie gli anni tra ${diffDays} giorni`, tone: 'blue' });
        }
      }
    });

    equipment.forEach(e => {
      if (e.status === 'guasto') {
        items.push({ id: `eq-broken-${e.id}`, icon: <Wrench className="w-4 h-4" />, text: `${e.name} risulta guasto`, tone: 'red' });
      }
      if (e.nextMaintenanceDate && e.status !== 'dismesso') {
        const due = new Date(e.nextMaintenanceDate + 'T00:00:00');
        if (due < today) {
          items.push({ id: `eq-maint-expired-${e.id}`, icon: <Wrench className="w-4 h-4" />, text: `Manutenzione di ${e.name} è scaduta`, tone: 'red' });
        } else if (due <= in7) {
          items.push({ id: `eq-maint-soon-${e.id}`, icon: <Wrench className="w-4 h-4" />, text: `Manutenzione di ${e.name} entro 7 giorni`, tone: 'amber' });
        }
      }
    });

    const toneOrder = { red: 0, amber: 1, blue: 2 };
    return items.sort((a, b) => toneOrder[a.tone] - toneOrder[b.tone]);
  }, [clients, equipment, subscriptions]);

  const toneClasses: Record<string, string> = {
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

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
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Avvisi</h1>
        <p className="text-neutral-500">Scadenze automatiche e bacheca interna</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-neutral-900">Scadenze ({alerts.length})</h2>
        </div>
        {alerts.length === 0 ? (
          <p className="text-sm text-neutral-400 italic">Nessuna scadenza da segnalare.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alerts.map(alert => (
              <div key={alert.id} className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium ${toneClasses[alert.tone]}`}>
                {alert.icon}
                {alert.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-neutral-900">Bacheca</h2>
          </div>
          <button onClick={() => openModal()} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Nuovo Annuncio
          </button>
        </div>
        <div className="p-4">
          {sortedAnnouncements.length === 0 ? (
            <p className="text-sm text-neutral-400 italic text-center py-6">Nessun annuncio in bacheca.</p>
          ) : (
            <div className="space-y-3">
              {sortedAnnouncements.map(a => (
                <div key={a.id} className={`p-4 rounded-xl border ${a.pinned ? 'border-blue-300 bg-blue-50/40' : 'border-neutral-200'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-2">
                      {a.pinned && <Pin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                      <div>
                        <h3 className="font-semibold text-neutral-900">{a.title}</h3>
                        <p className="text-sm text-neutral-600 mt-1 whitespace-pre-wrap">{a.message}</p>
                        <p className="text-xs text-neutral-400 mt-2">{new Date(a.createdAt).toLocaleString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => updateAnnouncement({ ...a, pinned: !a.pinned })} className="p-1.5 text-neutral-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title={a.pinned ? 'Rimuovi da in evidenza' : 'Metti in evidenza'}>
                        {a.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openModal(a)} className="p-1.5 text-neutral-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
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
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. Corso di martedì spostato" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Messaggio</label>
                <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Dettagli dell'annuncio..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.pinned} onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-neutral-700">Metti in evidenza</span>
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
