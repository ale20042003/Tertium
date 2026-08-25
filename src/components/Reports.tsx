import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieIcon, Activity, Dumbbell, CreditCard, Calendar, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock3, Wallet, Cake, FileWarning, UserCog, Wrench, Target, CalendarDays, Flame, Store } from 'lucide-react';
import { useAppContext } from '../store';

export const Reports: React.FC = () => {
  const { clients, exercises, subscriptions, expenses, staff, gymClasses, classBookings, checkIns, equipment, leads, sales, products } = useAppContext();
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

  // ─── Finanza: spese, utile netto, entrate vs uscite per mese ──
  const financeData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalSpese = expenses.reduce((s, e) => s + e.amount, 0);
    const totalRicaviProdotti = sales.reduce((s, sale) => s + sale.total, 0);
    const utileNetto = kpi.totalIncassato + totalRicaviProdotti - totalSpese;

    const byCategory: Record<string, number> = {};
    expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

    const monthObj: Record<string, { period: string; entrate: number; uscite: number; sortKey: string }> = {};
    const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
    const ensureMonth = (dateStr: string) => {
      const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthObj[key]) monthObj[key] = { period: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, entrate: 0, uscite: 0, sortKey: key };
      return monthObj[key];
    };
    clients.forEach(c => {
      if (c.subscriptionStart && c.payment) ensureMonth(c.subscriptionStart).entrate += c.payment.amountPaid;
    });
    expenses.forEach(e => { ensureMonth(e.date).uscite += e.amount; });

    sales.forEach(s => { ensureMonth(s.date).entrate += s.total; });

    const monthlyChart = Object.values(monthObj).sort((a, b) => a.sortKey.localeCompare(b.sortKey)).map(({ sortKey, ...rest }) => rest);

    return { totalSpese, totalRicaviProdotti, utileNetto, byCategory, monthlyChart };
  }, [expenses, clients, sales, kpi.totalIncassato]);

  // ─── Clienti: nuovi, attivi/scaduti, rinnovo, compleanni, certificati ──
  const clientMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const nuoviQuestoMese = clients.filter(c => c.subscriptionStart && new Date(c.subscriptionStart) >= startOfMonth).length;

    let attivi = 0, scaduti = 0;
    clients.forEach(c => {
      if (!c.subscriptionEnd) return;
      const end = new Date(c.subscriptionEnd);
      if (end >= today) attivi++; else scaduti++;
    });
    const tassoRinnovo = (attivi + scaduti) > 0 ? Math.round((attivi / (attivi + scaduti)) * 100) : 0;

    const compleanniMese = clients.filter(c => {
      if (!c.birthDate) return false;
      const bd = new Date(c.birthDate + 'T00:00:00');
      return bd.getMonth() === today.getMonth();
    });

    const certificatiInScadenza = clients.filter(c => {
      if (!c.medicalCertificateExpiry) return false;
      const exp = new Date(c.medicalCertificateExpiry + 'T00:00:00');
      return exp <= in30;
    }).sort((a, b) => (a.medicalCertificateExpiry || '').localeCompare(b.medicalCertificateExpiry || ''));

    return { nuoviQuestoMese, attivi, scaduti, tassoRinnovo, compleanniMese, certificatiInScadenza };
  }, [clients]);

  // ─── Abbonamenti in scadenza ────────────────────────────────
  const subscriptionExpiry = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);

    const inScadenza7 = clients.filter(c => c.subscriptionEnd && new Date(c.subscriptionEnd) >= today && new Date(c.subscriptionEnd) <= in7);
    const inScadenza30 = clients.filter(c => c.subscriptionEnd && new Date(c.subscriptionEnd) >= today && new Date(c.subscriptionEnd) <= in30);
    const scadutiNonRinnovati = clients.filter(c => c.subscriptionEnd && new Date(c.subscriptionEnd) < today);

    return { inScadenza7, inScadenza30, scadutiNonRinnovati };
  }, [clients]);

  // ─── Corsi & Presenze ───────────────────────────────────────
  const classMetrics = useMemo(() => {
    const activeBookings = classBookings.filter(b => b.status !== 'cancellata');

    const popolarita = gymClasses.map(c => ({
      name: c.name,
      prenotazioni: activeBookings.filter(b => b.classId === c.id).length,
      capacity: c.capacity,
    })).sort((a, b) => b.prenotazioni - a.prenotazioni).slice(0, 6);

    // Tasso di riempimento medio: per ogni combinazione classId+date, confermati/capienza
    const occurrenceMap: Record<string, { classId: string; confermati: number }> = {};
    activeBookings.filter(b => b.status === 'confermata').forEach(b => {
      const key = `${b.classId}_${b.date}`;
      if (!occurrenceMap[key]) occurrenceMap[key] = { classId: b.classId, confermati: 0 };
      occurrenceMap[key].confermati++;
    });
    const fillRates = Object.values(occurrenceMap).map(occ => {
      const cls = gymClasses.find(c => c.id === occ.classId);
      return cls && cls.capacity > 0 ? occ.confermati / cls.capacity : 0;
    });
    const tassoRiempimentoMedio = fillRates.length > 0 ? Math.round((fillRates.reduce((s, r) => s + r, 0) / fillRates.length) * 100) : 0;

    // Check-in per settimana (ultime 8 settimane) + ora di picco
    const weekObj: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    checkIns.forEach(ci => {
      const d = new Date(ci.dateTime);
      const hour = d.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const key = weekStart.toISOString().split('T')[0];
      weekObj[key] = (weekObj[key] || 0) + 1;
    });
    const checkInsPerSettimana = Object.entries(weekObj)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([week, count]) => ({ period: new Date(week + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }), presenze: count }));

    let oraPunta: number | null = null;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([h, count]) => { if (count > maxCount) { maxCount = count; oraPunta = parseInt(h); } });

    return { popolarita, tassoRiempimentoMedio, checkInsPerSettimana, oraPunta };
  }, [gymClasses, classBookings, checkIns]);

  // ─── Personale ────────────────────────────────────────────
  const staffMetrics = useMemo(() => {
    const attivi = staff.filter(s => s.active).length;
    const oreCorsiPerIstruttore = staff.map(s => {
      const classiAssegnate = gymClasses.filter(c => c.staffId === s.id);
      const oreSettimanali = classiAssegnate.reduce((sum, c) => sum + (c.schedule.length * c.durationMinutes) / 60, 0);
      return { name: s.name, ore: Math.round(oreSettimanali * 10) / 10 };
    }).filter(s => s.ore > 0).sort((a, b) => b.ore - a.ore);
    return { attivi, oreCorsiPerIstruttore };
  }, [staff, gymClasses]);

  // ─── Attrezzature ───────────────────────────────────────────
  const equipmentMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    const inManutenzioneOGuasto = equipment.filter(e => e.status === 'manutenzione' || e.status === 'guasto').length;
    const manutenzioniInScadenza = equipment.filter(e => e.nextMaintenanceDate && new Date(e.nextMaintenanceDate + 'T00:00:00') <= in30 && e.status !== 'dismesso').length;
    return { inManutenzioneOGuasto, manutenzioniInScadenza, totale: equipment.length };
  }, [equipment]);

  // ─── Lead ─────────────────────────────────────────────────
  const leadMetrics = useMemo(() => {
    const byStatus: Record<string, number> = {};
    leads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
    const convertiti = leads.filter(l => l.status === 'convertito').length;
    const tassoConversione = leads.length > 0 ? Math.round((convertiti / leads.length) * 100) : 0;
    return { byStatus, tassoConversione, totale: leads.length };
  }, [leads]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Report & Statistiche</h1>
          <p className="text-neutral-500">Monitora l'andamento della palestra</p>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      {/* Modificato in grid-cols-1 sm:grid-cols-3 per adattarsi ai 3 riquadri rimanenti */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* ─── Finanza ─── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 pt-2">Finanza</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
            <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0"><TrendingDown className="w-5 h-5" /></div>
            <div>
              <p className="text-neutral-500 text-xs font-medium">Spese Totali</p>
              <h3 className="text-2xl font-bold text-red-700">€{financeData.totalSpese.toFixed(0)}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
            <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0"><Store className="w-5 h-5" /></div>
            <div>
              <p className="text-neutral-500 text-xs font-medium">Ricavi Prodotti</p>
              <h3 className="text-2xl font-bold text-purple-700">€{financeData.totalRicaviProdotti.toFixed(0)}</h3>
              <p className="text-[11px] text-neutral-400">{products.length} a catalogo</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${financeData.utileNetto >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}><Wallet className="w-5 h-5" /></div>
            <div>
              <p className="text-neutral-500 text-xs font-medium">Utile Netto</p>
              <h3 className={`text-2xl font-bold ${financeData.utileNetto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>€{financeData.utileNetto.toFixed(0)}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-xs font-medium mb-2">Spese per Categoria</p>
            {Object.keys(financeData.byCategory).length === 0 ? (
              <p className="text-sm text-neutral-400 italic">Nessuna spesa</p>
            ) : (
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {Object.entries(financeData.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className="text-neutral-600">{cat}</span>
                    <span className="font-semibold text-neutral-900">€{amt.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {financeData.monthlyChart.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-600 mb-4">Entrate vs Uscite per Mese</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeData.monthlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `€${v}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => `€${Number(value).toFixed(2)}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="entrate" name="Entrate" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="uscite" name="Uscite" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ─── Clienti & Abbonamenti ─── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 pt-2">Clienti & Abbonamenti</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-xs font-medium mb-1">Nuovi (mese)</p>
            <h3 className="text-xl font-bold text-neutral-900">{clientMetrics.nuoviQuestoMese}</h3>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-xs font-medium mb-1">Attivi / Scaduti</p>
            <h3 className="text-xl font-bold text-neutral-900">{clientMetrics.attivi} / {clientMetrics.scaduti}</h3>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-xs font-medium mb-1">Tasso di Rinnovo</p>
            <h3 className="text-xl font-bold text-neutral-900">{clientMetrics.tassoRinnovo}%</h3>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-xs font-medium mb-1">In scadenza 7 / 30gg</p>
            <h3 className="text-xl font-bold text-neutral-900">{subscriptionExpiry.inScadenza7.length} / {subscriptionExpiry.inScadenza30.length}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Cake className="w-4 h-4 text-pink-500" />
              <p className="text-neutral-700 text-sm font-semibold">Compleanni del Mese</p>
            </div>
            {clientMetrics.compleanniMese.length === 0 ? (
              <p className="text-sm text-neutral-400 italic">Nessun compleanno questo mese</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {clientMetrics.compleanniMese.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-neutral-700">{c.name}</span>
                    <span className="text-neutral-500">{new Date(c.birthDate! + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileWarning className="w-4 h-4 text-amber-500" />
              <p className="text-neutral-700 text-sm font-semibold">Certificati Medici in Scadenza (30gg)</p>
            </div>
            {clientMetrics.certificatiInScadenza.length === 0 ? (
              <p className="text-sm text-neutral-400 italic">Nessun certificato in scadenza</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {clientMetrics.certificatiInScadenza.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-neutral-700">{c.name}</span>
                    <span className="text-amber-600 font-medium">{new Date(c.medicalCertificateExpiry! + 'T00:00:00').toLocaleDateString('it-IT')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Corsi & Presenze ─── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 pt-2">Corsi & Presenze</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-xs font-medium mb-1">Riempimento Medio Corsi</p>
            <h3 className="text-xl font-bold text-neutral-900">{classMetrics.tassoRiempimentoMedio}%</h3>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-xs font-medium mb-1">Ora di Picco Accessi</p>
            <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-1.5">
              {classMetrics.oraPunta !== null ? <><Flame className="w-4 h-4 text-orange-500" />{String(classMetrics.oraPunta).padStart(2, '0')}:00</> : '—'}
            </h3>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-xs font-medium mb-1">Check-in Totali</p>
            <h3 className="text-xl font-bold text-neutral-900">{checkIns.length}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-600 mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-neutral-400" /> Corsi Più Popolari</h3>
            {classMetrics.popolarita.length === 0 ? (
              <p className="text-sm text-neutral-400 italic py-8 text-center">Nessun corso configurato</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classMetrics.popolarita} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={90} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="prenotazioni" name="Prenotazioni" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-600 mb-4">Check-in per Settimana</h3>
            {classMetrics.checkInsPerSettimana.length === 0 ? (
              <p className="text-sm text-neutral-400 italic py-8 text-center">Nessun accesso registrato</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={classMetrics.checkInsPerSettimana} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPresenze" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="presenze" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPresenze)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Personale, Attrezzature & Lead ─── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 pt-2">Personale, Attrezzature & Lead</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <UserCog className="w-4 h-4 text-purple-500" />
              <p className="text-neutral-700 text-sm font-semibold">Personale ({staffMetrics.attivi} attivi)</p>
            </div>
            {staffMetrics.oreCorsiPerIstruttore.length === 0 ? (
              <p className="text-sm text-neutral-400 italic">Nessuna ora corso assegnata</p>
            ) : (
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {staffMetrics.oreCorsiPerIstruttore.map(s => (
                  <div key={s.name} className="flex justify-between text-sm">
                    <span className="text-neutral-700">{s.name}</span>
                    <span className="font-semibold text-neutral-900">{s.ore}h/sett</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-amber-500" />
              <p className="text-neutral-700 text-sm font-semibold">Attrezzature ({equipmentMetrics.totale})</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-neutral-600">In manutenzione/guasto</span><span className="font-semibold text-red-600">{equipmentMetrics.inManutenzioneOGuasto}</span></div>
              <div className="flex justify-between"><span className="text-neutral-600">Manutenzioni in scadenza (30gg)</span><span className="font-semibold text-amber-600">{equipmentMetrics.manutenzioniInScadenza}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-500" />
              <p className="text-neutral-700 text-sm font-semibold">Lead ({leadMetrics.totale}) · Conversione {leadMetrics.tassoConversione}%</p>
            </div>
            {Object.keys(leadMetrics.byStatus).length === 0 ? (
              <p className="text-sm text-neutral-400 italic">Nessun lead registrato</p>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(leadMetrics.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-neutral-700 capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-semibold text-neutral-900">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};