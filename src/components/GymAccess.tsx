import React, { useMemo, useState } from 'react';
import { Search, DoorOpen, Users, Trash2, Clock } from 'lucide-react';
import { useAppContext } from '../store';

export const GymAccess: React.FC = () => {
  const { clients, checkIns, checkInClient, deleteCheckIn } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const todayStr = new Date().toISOString().split('T')[0];

  const matchingClients = searchTerm.trim()
    ? clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 6)
    : [];

  const todaysCheckIns = useMemo(
    () => checkIns.filter(c => c.dateTime.startsWith(todayStr)),
    [checkIns, todayStr]
  );

  const uniquePresentToday = new Set(todaysCheckIns.map(c => c.clientId)).size;

  const filteredHistory = useMemo(
    () => checkIns.filter(c => c.dateTime.startsWith(dateFilter)).sort((a, b) => b.dateTime.localeCompare(a.dateTime)),
    [checkIns, dateFilter]
  );

  const handleCheckIn = (clientId: string) => {
    checkInClient(clientId, 'sala_pesi');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Sala Pesi / Accessi</h1>
        <p className="text-neutral-500">Check-in rapido e storico presenze</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0"><Users className="w-5 h-5" /></div>
          <div>
            <p className="text-neutral-500 text-xs font-medium">Presenze Oggi</p>
            <h3 className="text-2xl font-bold text-neutral-900">{uniquePresentToday}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0"><DoorOpen className="w-5 h-5" /></div>
          <div>
            <p className="text-neutral-500 text-xs font-medium">Ingressi Totali Oggi</p>
            <h3 className="text-2xl font-bold text-neutral-900">{todaysCheckIns.length}</h3>
          </div>
        </div>
      </div>

      {/* Check-in rapido */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <h2 className="text-lg font-bold text-neutral-900 mb-3">Check-in Rapido</h2>
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" placeholder="Cerca cliente per nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        {matchingClients.length > 0 && (
          <div className="mt-3 space-y-2 max-w-md">
            {matchingClients.map(c => (
              <button key={c.id} onClick={() => handleCheckIn(c.id)}
                className="w-full flex items-center justify-between gap-3 p-3 bg-neutral-50 hover:bg-blue-50 rounded-xl border border-neutral-200 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">{c.name.charAt(0).toUpperCase()}</div>
                  <span className="font-medium text-neutral-900">{c.name}</span>
                </div>
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1"><DoorOpen className="w-3.5 h-3.5" /> Check-in</span>
              </button>
            ))}
          </div>
        )}
        {searchTerm.trim() && matchingClients.length === 0 && (
          <p className="text-sm text-neutral-400 italic mt-3">Nessun cliente trovato.</p>
        )}
      </div>

      {/* Storico */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <h2 className="text-lg font-bold text-neutral-900">Storico Accessi</h2>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-neutral-200">Cliente</th>
                <th className="p-4 font-medium border-b border-neutral-200">Orario</th>
                <th className="p-4 font-medium border-b border-neutral-200">Tipo</th>
                <th className="p-4 font-medium border-b border-neutral-200 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredHistory.length > 0 ? filteredHistory.map(c => {
                const client = clients.find(cl => cl.id === c.clientId);
                return (
                  <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 font-medium text-neutral-900">{client?.name || 'Cliente eliminato'}</td>
                    <td className="p-4 text-neutral-600">
                      <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {new Date(c.dateTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {c.type === 'sala_pesi' ? 'Sala Pesi' : 'Corso'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => deleteCheckIn(c.id)} className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={4} className="p-8 text-center text-neutral-500">Nessun accesso registrato per questa data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
