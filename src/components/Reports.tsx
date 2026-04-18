import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon, Activity, Dumbbell, CreditCard, Calendar, TrendingUp, AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { useAppContext } from '../store';

export const Reports: React.FC = () => {
  const { clients, exercises, subscriptions } = useAppContext();
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');

  // ─── KPI principali ───────────────────────────────────────────
  const kpi = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let activeCount = 0;
    let totalIncassato = 0;
    let totalDaPagare = 0;
    let rateScadute = 0;
    let rateInScadenza7gg = 0;
    const typeCount: Record<string, number> = {};

    clients.forEach(c => {
      if (!c.subscriptionId || !c.subscriptionStart) return;
      const sub = subscriptions.find(s => s.id === c.subscriptionId);
      if (!sub) return;

      const start = new Date(c.subscriptionStart);
      const end = new Date(start);
      end.setMonth(end.getMonth() + sub.durationMonths);
      if (start <= today && end >= today) {
        activeCount++;
        typeCount[sub.name] = (typeCount[sub.name] || 0) + 1;
      }

      // Pagamenti reali
      if (c.payment) {
        totalIncassato += c.payment.amountPaid;
        totalDaPagare += Math.max(0, c.payment.totalCost - c.payment.amountPaid);

        c.payment.installments.forEach(inst => {
          if (inst.paid || !inst.dueDate) return;
          const due = new Date(inst.dueDate + 'T00:00:00');
          if (due < today) { rateScadute++; }
          else {
            const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
            if (diff <= 7) rateInScadenza7gg++;
          }
        });
      }
    });

    return { activeCount, typeCount, totalIncassato, totalDaPagare, rateScadute, rateInScadenza7gg };
  }, [clients, subscriptions]);

  // ─── Dati grafici (incasso reale = amountPaid, per mese di inizio abbonamento) ───
  const chartData = useMemo(() => {
    const dataObj: Record<string, { period: string; abbonamenti: number; incassoReale: number; incassoNominale: number; sortKey: string }> = {};
    const today = new Date();

    clients.forEach(c => {
      if (!c.subscriptionId || !c.subscriptionStart) return;
      if (subscriptionFilter !== 'all' && c.subscriptionId !== subscriptionFilter) return;

      const start = new Date(c.subscriptionStart);
      if (periodFilter !== 'all') {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() - parseInt(periodFilter));
        if (start < minDate || start > today) return;
      }

      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const sub = subscriptions.find(s => s.id === c.subscriptionId);
      const nominale = sub?.cost ?? 0;
      const reale = c.payment?.amountPaid ?? 0;

      if (!dataObj[monthKey]) {
        const monthNames = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
        dataObj[monthKey] = { period: `${monthNames[start.getMonth()]} ${year}`, abbonamenti: 0, incassoReale: 0, incassoNominale: 0, sortKey: monthKey };
      }
      dataObj[monthKey].abbonamenti += 1;
      dataObj[monthKey].incassoReale += reale;
      dataObj[monthKey].incassoNominale += nominale;
    });

    return Object.values(dataObj)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest);
  }, [clients, subscriptions, periodFilter, subscriptionFilter]);

  // ─── Tabella clienti con rate rimanenti ───────────────────────
  const installmentRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return clients
      .filter(c => c.payment && c.payment.installments.some(i => !i.paid))
      .map(c => {
        const sub = subscriptions.find(s => s.id === c.subscriptionId);
        const pending = c.payment!.installments.filter(i => !i.paid);
        const next = pending
          .filter(i => i.dueDate)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        const nextDue = next ? new Date(next.dueDate + 'T00:00:00') : null;
        const isLate = nextDue && nextDue < today;
        return { client: c, sub, pending, next, nextDue, isLate };
      })
      .sort((a, b) => {
        if (a.isLate && !b.isLate) return -1;
        if (!a.isLate && b.isLate) return 1;
        if (a.next && b.next) return a.next.dueDate.localeCompare(b.next.dueDate);
        return 0;
      });
  }, [clients, subscriptions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Report & Statistiche</h1>
          <p className="text-neutral-500">Monitora l'andamento della palestra</p>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Abbonamenti attivi */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-neutral-500 text-xs font-medium">Abb. Attivi</p>
            <h3 className="text-2xl font-bold text-neutral-900">{kpi.activeCount}</h3>
          </div>
        </div>

        {/* Incassato reale */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-neutral-500 text-xs font-medium">Incassato</p>
            <h3 className="text-2xl font-bold text-emerald-700">€{kpi.totalIncassato.toFixed(0)}</h3>
          </div>
        </div>

        {/* Da incassare */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.rateScadute > 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            <Clock3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-neutral-500 text-xs font-medium">Da incassare</p>
            <h3 className={`text-2xl font-bold ${kpi.totalDaPagare > 0 ? 'text-amber-600' : 'text-green-600'}`}>€{kpi.totalDaPagare.toFixed(0)}</h3>
          </div>
        </div>

        {/* Rate scadute / in scadenza */}
        <div className={`p-5 rounded-2xl shadow-sm border flex items-center gap-4 ${kpi.rateScadute > 0 ? 'bg-red-50 border-red-200' : kpi.rateInScadenza7gg > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-neutral-200'}`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.rateScadute > 0 ? 'bg-red-100 text-red-600' : kpi.rateInScadenza7gg > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-xs font-medium ${kpi.rateScadute > 0 ? 'text-red-600' : 'text-neutral-500'}`}>
              {kpi.rateScadute > 0 ? 'Rate Scadute' : 'Scad. 7gg'}
            </p>
            <h3 className={`text-2xl font-bold ${kpi.rateScadute > 0 ? 'text-red-700' : kpi.rateInScadenza7gg > 0 ? 'text-amber-700' : 'text-green-700'}`}>
              {kpi.rateScadute > 0 ? kpi.rateScadute : kpi.rateInScadenza7gg > 0 ? kpi.rateInScadenza7gg : '✓'}
            </h3>
          </div>
        </div>
      </div>

      {/* ─── Seconda riga KPI: tipo abbonamento + esercizi ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center gap-2 mb-3">
            <PieIcon className="w-4 h-4 text-neutral-400" />
            <p className="text-neutral-700 text-sm font-semibold">Attivi per Tipo Abbonamento</p>
          </div>
          {Object.keys(kpi.typeCount).length === 0 ? (
            <p className="text-sm text-neutral-400 italic">Nessun abbonamento attivo</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(kpi.typeCount).map(([name, count]) => (
                <div key={name} className="flex justify-between items-center text-sm">
                  <span className="text-neutral-700 font-medium">{name}</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-neutral-500 text-sm font-medium">Esercizi nel Database</p>
            <h3 className="text-3xl font-bold text-neutral-900">{exercises.length}</h3>
          </div>
        </div>
      </div>

      {/* ─── Grafici ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-4 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900">Andamento Abbonamenti & Incassi</h2>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}
                className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="30">Ultimi 30 giorni</option>
                <option value="90">Ultimi 3 mesi</option>
                <option value="180">Ultimi 6 mesi</option>
                <option value="365">Ultimo anno</option>
                <option value="all">Tutti i tempi</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-neutral-400" />
              <select value={subscriptionFilter} onChange={(e) => setSubscriptionFilter(e.target.value)}
                className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="all">Tutti i tipi</option>
                {subscriptions.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">Nessun dato disponibile per i filtri selezionati.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Abbonamenti venduti */}
            <div className="h-72 w-full flex flex-col">
              <h3 className="text-sm font-semibold text-neutral-600 mb-4 text-center">Abbonamenti Venduti</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f3f4f6' }} />
                    <Bar dataKey="abbonamenti" name="Abbonamenti" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Incassi reali vs nominali */}
            <div className="h-72 w-full flex flex-col">
              <h3 className="text-sm font-semibold text-neutral-600 mb-4 text-center">Incassato Reale vs Nominale (€)</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReale" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNominale" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `€${v}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: any) => [`€${Number(value).toFixed(2)}`, name === 'incassoReale' ? 'Incassato' : 'Nominale']}                    />
                    <Area type="monotone" dataKey="incassoNominale" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" fillOpacity={1} fill="url(#colorNominale)" />
                    <Area type="monotone" dataKey="incassoReale" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReale)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <div className="w-5 h-0.5 bg-emerald-500" /><span>Incassato</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <div className="w-5 h-0.5 bg-blue-400 border-dashed border-t border-blue-400" style={{borderTopStyle:'dashed'}} /><span>Nominale</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Tabella rate rimanenti ─── */}
      {installmentRows.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-neutral-900">Rate Pendenti</h2>
            <span className="ml-auto text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {installmentRows.reduce((acc, r) => acc + r.pending.length, 0)} rate rimanenti
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Abbonamento</th>
                  <th className="px-4 py-3 font-medium text-center">Rate rimaste</th>
                  <th className="px-4 py-3 font-medium">Prossima scadenza</th>
                  <th className="px-4 py-3 font-medium text-right">Da incassare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {installmentRows.map(({ client, sub, pending, next, nextDue, isLate }) => {
                  const daPagare = pending.reduce((s, i) => s + i.amount, 0);
                  return (
                    <tr key={client.id} className={`hover:bg-neutral-50 ${isLate ? 'bg-red-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          {client.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{sub?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${isLate ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {pending.length}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {nextDue ? (
                          <span className={`inline-flex items-center gap-1 text-sm font-medium ${isLate ? 'text-red-600' : 'text-neutral-700'}`}>
                            {isLate && <AlertTriangle className="w-3.5 h-3.5" />}
                            {nextDue.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-800">
                        €{daPagare.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50 border-t-2 border-neutral-200">
                  <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-neutral-700">Totale da incassare</td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-red-600">
                    €{installmentRows.reduce((acc, r) => acc + r.pending.reduce((s, i) => s + i.amount, 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
