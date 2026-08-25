import React, { useRef, useState } from 'react';
import { Plus, Trash2, Edit2, X, Building2, Save, DoorOpen, Download, Upload, DatabaseBackup } from 'lucide-react';
import { useAppContext } from '../store';
import { Room } from '../types';
import { exportBackup, importBackup } from '../utils/backup';

const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const ROOM_TYPES: { value: Room['type']; label: string }[] = [
  { value: 'pesi', label: 'Sala Pesi' },
  { value: 'corso', label: 'Sala Corsi' },
  { value: 'altro', label: 'Altro' },
];

const emptyRoomForm = { name: '', type: 'corso' as Room['type'], capacity: '' };

export const Settings: React.FC = () => {
  const { rooms, addRoom, updateRoom, deleteRoom, gymSettings, updateGymSettings } = useAppContext();

  const [profile, setProfile] = useState(gymSettings);
  const [savedFlash, setSavedFlash] = useState(false);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);

  const importInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm('Importare questo backup sovrascriverà tutti i dati attuali del gestionale. Continuare?')) return;
    try {
      await importBackup(file);
      setImportMessage({ type: 'success', text: 'Backup importato. Ricaricamento in corso...' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setImportMessage({ type: 'error', text: err instanceof Error ? err.message : 'Errore durante l\'importazione.' });
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateGymSettings(profile);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const updateHour = (day: number, field: 'open' | 'close', value: string) => {
    setProfile(prev => {
      const exists = prev.openingHours.some(h => h.day === day);
      const openingHours = exists
        ? prev.openingHours.map(h => h.day === day ? { ...h, [field]: value } : h)
        : [...prev.openingHours, { day, open: field === 'open' ? value : '09:00', close: field === 'close' ? value : '18:00' }];
      return { ...prev, openingHours };
    });
  };

  const toggleDayOpen = (day: number) => {
    setProfile(prev => {
      const exists = prev.openingHours.some(h => h.day === day);
      if (exists) return { ...prev, openingHours: prev.openingHours.filter(h => h.day !== day) };
      return { ...prev, openingHours: [...prev.openingHours, { day, open: '09:00', close: '18:00' }] };
    });
  };

  const openRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setRoomForm({ name: room.name, type: room.type, capacity: room.capacity !== undefined ? String(room.capacity) : '' });
    } else {
      setEditingRoom(null);
      setRoomForm(emptyRoomForm);
    }
    setIsRoomModalOpen(true);
  };

  const closeRoomModal = () => {
    setIsRoomModalOpen(false);
    setEditingRoom(null);
    setRoomForm(emptyRoomForm);
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: roomForm.name, type: roomForm.type, capacity: roomForm.capacity ? parseInt(roomForm.capacity) : undefined };
    if (editingRoom) updateRoom({ ...editingRoom, ...payload });
    else addRoom(payload);
    closeRoomModal();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Impostazioni</h1>
        <p className="text-neutral-500">Profilo palestra, orari di apertura e sale</p>
      </div>

      {/* Profilo palestra */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-neutral-900">Profilo Palestra</h2>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Palestra</label>
              <input type="text" required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Indirizzo</label>
              <input type="text" value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Via Roma 1, Milano" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Telefono</label>
              <input type="tel" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="02 1234567" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Orari di Apertura</label>
            <div className="space-y-2">
              {DAYS.map((dayName, day) => {
                const hour = profile.openingHours.find(h => h.day === day);
                const isOpen = !!hour;
                return (
                  <div key={day} className="flex items-center gap-3 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                    <label className="flex items-center gap-2 w-32 flex-shrink-0 cursor-pointer">
                      <input type="checkbox" checked={isOpen} onChange={() => toggleDayOpen(day)}
                        className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-medium text-neutral-700">{dayName}</span>
                    </label>
                    {isOpen ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={hour!.open} onChange={(e) => updateHour(day, 'open', e.target.value)}
                          className="px-2 py-1 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <span className="text-neutral-400 text-sm">—</span>
                        <input type="time" value={hour!.close} onChange={(e) => updateHour(day, 'close', e.target.value)}
                          className="px-2 py-1 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    ) : (
                      <span className="text-sm text-neutral-400 italic">Chiuso</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
              <Save className="w-4 h-4" /> Salva Profilo
            </button>
            {savedFlash && <span className="text-sm text-green-600 font-medium">Salvato ✓</span>}
          </div>
        </form>
      </div>

      {/* Sale */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-neutral-900">Sale</h2>
          </div>
          <button onClick={() => openRoomModal()} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Aggiungi Sala
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-neutral-200">Nome</th>
                <th className="p-4 font-medium border-b border-neutral-200">Tipo</th>
                <th className="p-4 font-medium border-b border-neutral-200">Capienza</th>
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rooms.length > 0 ? rooms.map(r => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4 font-medium text-neutral-900">{r.name}</td>
                  <td className="p-4 text-neutral-600">{ROOM_TYPES.find(t => t.value === r.type)?.label}</td>
                  <td className="p-4 text-neutral-600">{r.capacity ?? '—'}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openRoomModal(r)} className="p-2 text-neutral-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (window.confirm('Eliminare questa sala?')) deleteRoom(r.id); }} className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="p-8 text-center text-neutral-500">Nessuna sala configurata.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup dati */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <DatabaseBackup className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-neutral-900">Dati</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Tutti i dati sono salvati solo su questo browser. Esporta un backup periodicamente per non rischiare di perderli.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportBackup()} className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Esporta Backup
          </button>
          <button onClick={() => importInputRef.current?.click()} className="px-4 py-2 border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" /> Importa Backup
          </button>
          <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        </div>
        {importMessage && (
          <p className={`text-sm font-medium mt-3 ${importMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{importMessage.text}</p>
        )}
      </div>

      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-neutral-900">{editingRoom ? 'Modifica Sala' : 'Nuova Sala'}</h2>
              <button onClick={closeRoomModal} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRoomSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Sala</label>
                <input type="text" required autoFocus value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. Sala Corsi 1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
                  <select value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value as Room['type'] })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Capienza</label>
                  <input type="number" min="0" value={roomForm.capacity} onChange={(e) => { if (e.target.value.includes('-')) return; setRoomForm({ ...roomForm, capacity: e.target.value }); }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. 20" />
                </div>
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={closeRoomModal} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
