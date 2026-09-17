import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Edit2, X, CalendarDays, ListTree, Users, Clock, UserPlus, CheckCircle2, Circle } from 'lucide-react';
import { useAppContext } from '../store';
import { GymClass, ClassSlot } from '../types';

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const DAYS_FULL = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const emptyForm = {
  name: '', description: '', staffId: '', roomId: '', capacity: '10', durationMinutes: '60', color: COLORS[0],
  schedule: [] as ClassSlot[],
};

export const Classes: React.FC = () => {
  const { gymClasses, addGymClass, updateGymClass, deleteGymClass, classBookings, bookClass, cancelBooking, markAttendance, staff, rooms, clients } = useAppContext();
  const [tab, setTab] = useState<'catalogo' | 'calendario'>('catalogo');

  /* ─── Catalogo ─── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<GymClass | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const openModal = (c?: GymClass) => {
    if (c) {
      setEditing(c);
      setFormData({
        name: c.name, description: c.description || '', staffId: c.staffId || '', roomId: c.roomId || '',
        capacity: String(c.capacity), durationMinutes: String(c.durationMinutes), color: c.color, schedule: [...c.schedule],
      });
    } else {
      setEditing(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setFormData(emptyForm); };

  const addSlot = () => setFormData(prev => ({ ...prev, schedule: [...prev.schedule, { dayOfWeek: 1, startTime: '18:00' }] }));
  const removeSlot = (idx: number) => setFormData(prev => ({ ...prev, schedule: prev.schedule.filter((_, i) => i !== idx) }));
  const updateSlot = (idx: number, field: keyof ClassSlot, value: string | number) => {
    setFormData(prev => ({ ...prev, schedule: prev.schedule.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name, description: formData.description || undefined,
      staffId: formData.staffId || undefined, roomId: formData.roomId || undefined,
      capacity: parseInt(formData.capacity) || 1, durationMinutes: parseInt(formData.durationMinutes) || 60,
      color: formData.color, schedule: formData.schedule,
    };
    if (editing) updateGymClass({ ...editing, ...payload });
    else addGymClass(payload);
    closeModal();
  };

  /* ─── Calendario ─── */
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rosterClassId, setRosterClassId] = useState<string | null>(null);
  const [addClientId, setAddClientId] = useState('');

  const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay();

  const occurrences = useMemo(() => {
    return gymClasses
      .flatMap(c => c.schedule.filter(s => s.dayOfWeek === dayOfWeek).map(s => ({ gymClass: c, startTime: s.startTime })))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [gymClasses, dayOfWeek]);

  const bookingsFor = (classId: string) => classBookings.filter(b => b.classId === classId && b.date === selectedDate && b.status !== 'cancellata');

  const rosterClass = rosterClassId ? gymClasses.find(c => c.id === rosterClassId) : null;
  const rosterBookings = rosterClassId ? bookingsFor(rosterClassId) : [];
  const confirmedBookings = rosterBookings.filter(b => b.status === 'confermata');
  const waitlistBookings = rosterBookings.filter(b => b.status === 'waitlist');
  const bookedClientIds = new Set(rosterBookings.map(b => b.clientId));
  const availableClients = clients.filter(c => !bookedClientIds.has(c.id));

  const handleAddClient = () => {
    if (!rosterClassId || !addClientId) return;
    bookClass(rosterClassId, addClientId, selectedDate);
    setAddClientId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Corsi</h1>
          <p className="text-neutral-500">Catalogo corsi e calendario prenotazioni</p>
        </div>
        {tab === 'catalogo' && (
          <button onClick={() => openModal()} className="bg-brand-950 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-800 transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" /> Nuovo Corso
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-neutral-200">
        <button onClick={() => setTab('catalogo')} className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${tab === 'catalogo' ? 'border-brand-600 text-brand-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
          <ListTree className="w-4 h-4" /> Catalogo
        </button>
        <button onClick={() => setTab('calendario')} className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${tab === 'calendario' ? 'border-brand-600 text-brand-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
          <CalendarDays className="w-4 h-4" /> Calendario
        </button>
      </div>

      {tab === 'catalogo' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium border-b border-neutral-200">Corso</th>
                  <th className="p-4 font-medium border-b border-neutral-200">Istruttore</th>
                  <th className="p-4 font-medium border-b border-neutral-200">Sala</th>
                  <th className="p-4 font-medium border-b border-neutral-200">Orari</th>
                  <th className="p-4 font-medium border-b border-neutral-200">Capienza</th>
                  <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {gymClasses.length > 0 ? gymClasses.map(c => {
                  const instructor = staff.find(s => s.id === c.staffId);
                  const room = rooms.find(r => r.id === c.roomId);
                  return (
                    <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="font-medium text-neutral-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-neutral-600">{instructor?.name || '—'}</td>
                      <td className="p-4 text-neutral-600">{room?.name || '—'}</td>
                      <td className="p-4 text-neutral-600 text-sm">
                        {c.schedule.length > 0 ? c.schedule.map((s, i) => (
                          <span key={i} className="inline-block bg-neutral-100 rounded-md px-2 py-0.5 mr-1 mb-1">{DAYS_SHORT[s.dayOfWeek]} {s.startTime}</span>
                        )) : '—'}
                      </td>
                      <td className="p-4 text-neutral-600">{c.capacity}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openModal(c)} className="p-2 text-neutral-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => { if (window.confirm('Eliminare questo corso e tutte le prenotazioni associate?')) deleteGymClass(c.id); }} className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Nessun corso configurato.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'calendario' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <h2 className="text-lg font-bold text-neutral-900">{DAYS_FULL[dayOfWeek]} {new Date(selectedDate + 'T00:00:00').toLocaleDateString('it-IT')}</h2>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>

          {occurrences.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 py-12 text-center text-neutral-500">Nessun corso programmato per questo giorno.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {occurrences.map(({ gymClass, startTime }) => {
                const bookings = bookingsFor(gymClass.id);
                const confirmed = bookings.filter(b => b.status === 'confermata').length;
                const waitlist = bookings.filter(b => b.status === 'waitlist').length;
                const instructor = staff.find(s => s.id === gymClass.staffId);
                const room = rooms.find(r => r.id === gymClass.roomId);
                const isFull = confirmed >= gymClass.capacity;
                return (
                  <button key={gymClass.id + startTime} onClick={() => setRosterClassId(gymClass.id)}
                    className="text-left bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 hover:shadow-md transition-shadow"
                    style={{ borderLeftWidth: '4px', borderLeftColor: gymClass.color }}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-neutral-900">{gymClass.name}</h3>
                      <span className="text-sm font-semibold text-neutral-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{startTime}</span>
                    </div>
                    <p className="text-sm text-neutral-500">{instructor?.name || 'Nessun istruttore'} · {room?.name || 'Nessuna sala'}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${isFull ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700'}`}>
                        <Users className="w-3.5 h-3.5" /> {confirmed}/{gymClass.capacity}
                      </span>
                      {waitlist > 0 && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">{waitlist} in attesa</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal corso */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-neutral-900">{editing ? 'Modifica Corso' : 'Nuovo Corso'}</h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Corso</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="es. Spinning" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Istruttore</label>
                  <select value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                    <option value="">Nessuno</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Sala</label>
                  <select value={formData.roomId} onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                    <option value="">Nessuna</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Capienza</label>
                  <input type="number" min="1" required value={formData.capacity}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setFormData({ ...formData, capacity: e.target.value }); }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Durata (min)</label>
                  <input type="number" min="1" required value={formData.durationMinutes}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setFormData({ ...formData, durationMinutes: e.target.value }); }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Colore</label>
                  <div className="flex items-center gap-1.5 pt-2">
                    {COLORS.map(col => (
                      <button type="button" key={col} onClick={() => setFormData({ ...formData, color: col })}
                        className={`w-6 h-6 rounded-full ${formData.color === col ? 'ring-2 ring-offset-1 ring-neutral-400' : ''}`}
                        style={{ backgroundColor: col }} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Descrizione</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Breve descrizione del corso..." />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-neutral-700">Orari Settimanali</label>
                  <button type="button" onClick={addSlot} className="text-sm text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Aggiungi Slot
                  </button>
                </div>
                {formData.schedule.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-neutral-300 rounded-xl text-neutral-400 text-sm">Nessun orario configurato</div>
                ) : (
                  <div className="space-y-2">
                    {formData.schedule.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        <select value={slot.dayOfWeek} onChange={(e) => updateSlot(idx, 'dayOfWeek', parseInt(e.target.value))}
                          className="flex-1 px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                          {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                        <input type="time" value={slot.startTime} onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                          className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                        <button type="button" onClick={() => removeSlot(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-brand-950 text-white font-medium hover:bg-brand-800 rounded-lg transition-colors">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal roster occorrenza */}
      {rosterClassId && rosterClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">{rosterClass.name}</h2>
                <p className="text-sm text-neutral-500 mt-0.5">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('it-IT')} · {confirmedBookings.length}/{rosterClass.capacity} posti</p>
              </div>
              <button onClick={() => { setRosterClassId(null); setAddClientId(''); }} className="text-neutral-400 hover:text-neutral-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="flex items-center gap-2">
                <select value={addClientId} onChange={(e) => setAddClientId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                  <option value="">Seleziona cliente da aggiungere...</option>
                  {availableClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={handleAddClient} disabled={!addClientId} className="px-3 py-2 bg-brand-950 text-white rounded-lg text-sm font-medium hover:bg-brand-800 transition-colors disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0">
                  <UserPlus className="w-4 h-4" /> Aggiungi
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-700 mb-2">Iscritti ({confirmedBookings.length})</h3>
                {confirmedBookings.length === 0 ? (
                  <p className="text-sm text-neutral-400 italic">Nessun iscritto</p>
                ) : (
                  <div className="space-y-2">
                    {confirmedBookings.map(b => {
                      const client = clients.find(c => c.id === b.clientId);
                      return (
                        <div key={b.id} className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                          <button onClick={() => markAttendance(b.id, !b.attended)} className={`flex-shrink-0 ${b.attended ? 'text-green-600' : 'text-neutral-300'}`} title="Presenza">
                            {b.attended ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <span className="flex-1 font-medium text-neutral-900 text-sm">{client?.name || 'Cliente eliminato'}</span>
                          <button onClick={() => cancelBooking(b.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {waitlistBookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-amber-700 mb-2">Lista d'attesa ({waitlistBookings.length})</h3>
                  <div className="space-y-2">
                    {waitlistBookings.map(b => {
                      const client = clients.find(c => c.id === b.clientId);
                      return (
                        <div key={b.id} className="flex items-center gap-2 p-2.5 bg-amber-50/50 rounded-xl border border-amber-200">
                          <span className="flex-1 font-medium text-neutral-900 text-sm">{client?.name || 'Cliente eliminato'}</span>
                          <button onClick={() => cancelBooking(b.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
