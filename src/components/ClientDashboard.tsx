import React, { useState, useEffect } from 'react';
import { LogOut, Clock, ChevronDown, Plus, Dumbbell, CreditCard, Calendar, CheckCircle2, AlertCircle, Clock3, Euro, Edit2, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store';
import { ExerciseAnimation } from './ExerciseAnimation';
import { RestTimer } from './RestTimer';
import { ClientProgress } from './ClientProgress';
import { WorkoutDay, WorkoutExercise } from '../types';

export const ClientDashboard: React.FC<{ clientId: string, onLogout: () => void }> = ({ clientId, onLogout }) => {
  const { clients, exercises, subscriptions, saveCustomPlan } = useAppContext();
  const client = clients.find(c => c.id === clientId);
  
  const [selectedPlanId, setSelectedPlanId] = useState<string>('current');
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workout' | 'progress' | 'subscription' | 'builder'>('workout');

  React.useEffect(() => {
    if (!client) return;

    // Recuperiamo i giorni della scheda attualmente selezionata
    const currentPlanDays = selectedPlanId === 'current' 
      ? client.workoutPlan 
      : client.pastPlans?.find(p => p.id === selectedPlanId)?.workoutPlan || [];

    // Verifichiamo se il giorno attualmente attivo esiste ancora in questa scheda
    const isDayStillValid = currentPlanDays.some(d => d.id === activeDayId);

    // Cambiamo giorno SOLO se quello in memoria non è valido (es. cambio scheda o primo accesso)
    if (!isDayStillValid && currentPlanDays.length > 0) {
      setActiveDayId(currentPlanDays[0].id);
    }
  }, [selectedPlanId, client?.workoutPlan, client?.pastPlans]);

  if (!client) return null;

  const currentPlanDays = selectedPlanId === 'current' 
    ? client.workoutPlan 
    : client.pastPlans?.find(p => p.id === selectedPlanId)?.workoutPlan || [];

  const activeDay = currentPlanDays.find(d => d.id === activeDayId);
  const isReadOnly = selectedPlanId !== 'current';

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24 font-sans">
      <header className="px-6 pt-12 pb-6 flex justify-between items-end sticky top-0 bg-neutral-950/80 backdrop-blur-xl z-20 border-b border-neutral-900">
        <div>
          <p className="text-lime-400 text-sm font-bold uppercase tracking-widest mb-1">Bentornato</p>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
        </div>
        <button onClick={onLogout} className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors">
          <LogOut className="w-5 h-5 text-neutral-400" />
        </button>
      </header>

      <div className="px-6 pb-2 pt-2">
        <div className="bg-neutral-900 rounded-full p-1 border border-neutral-800 flex overflow-x-auto no-scrollbar snap-x">
          <button 
            onClick={() => setActiveTab('workout')}
            className={`snap-start flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${activeTab === 'workout' ? 'bg-lime-400 text-black' : 'text-neutral-400 hover:text-white'}`}
          >
            Scheda
          </button>
          <button 
            onClick={() => setActiveTab('builder')}
            className={`snap-start flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${activeTab === 'builder' ? 'bg-lime-400 text-black' : 'text-neutral-400 hover:text-white'}`}
          >
            Crea Scheda
          </button>
          <button 
            onClick={() => setActiveTab('progress')}
            className={`snap-start flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${activeTab === 'progress' ? 'bg-lime-400 text-black' : 'text-neutral-400 hover:text-white'}`}
          >
            Progressi
          </button>
          <button 
            onClick={() => setActiveTab('subscription')}
            className={`snap-start flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${activeTab === 'subscription' ? 'bg-lime-400 text-black' : 'text-neutral-400 hover:text-white'}`}
          >
            Abbonamento
          </button>
        </div>
      </div>

      {activeTab === 'progress' ? (
        <ClientProgress client={client} />
      ) : activeTab === 'subscription' ? (
        <SubscriptionTab client={client} subscriptions={subscriptions} />
      ) : activeTab === 'builder' ? (
        <PlanBuilderTab 
          exercises={exercises} 
          onSave={(newDays: any) => {
            saveCustomPlan(client.id, newDays);
            setActiveTab('workout');
            setSelectedPlanId('current');
            setActiveDayId(newDays[0]?.id);
          }} 
        />
      ) : (
        <>
          {client.pastPlans && client.pastPlans.length > 0 && (
            <div className="px-6 py-2">
              <select 
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-lime-400 font-bold"
              >
                <option value="current">Scheda Attuale {client.workoutPlan.length === 0 ? '(Vuota)' : ''}</option>
                {client.pastPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name} ({new Date(plan.date).toLocaleDateString('it-IT')})</option>
                ))}
              </select>
            </div>
          )}

          {currentPlanDays.length === 0 ? (
            <div className="p-6 text-center mt-10">
              <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Dumbbell className="w-10 h-10 text-neutral-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Nessuna scheda</h2>
              <p className="text-neutral-500 mb-6">
                {isReadOnly ? 'Questa scheda passata è vuota.' : 'Non hai ancora una scheda di allenamento attiva.'}
              </p>
              {!isReadOnly && (
                <button 
                  onClick={() => setActiveTab('builder')}
                  className="bg-lime-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-lime-500 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Creane una tu
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="px-6 py-6 flex gap-3 overflow-x-auto no-scrollbar">
                {currentPlanDays.map(day => (
                  <button
                    key={day.id}
                    onClick={() => setActiveDayId(day.id)}
                    className={`px-6 py-3 rounded-full whitespace-nowrap font-bold text-sm transition-all ${
                      activeDayId === day.id 
                        ? 'bg-lime-400 text-black' 
                        : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {day.name}
                  </button>
                ))}
              </div>

              {activeDay && (
                <div className="px-6 space-y-6">
                  {activeDay.exercises.length === 0 ? (
                    <p className="text-neutral-500 text-center py-10">Nessun esercizio per questo giorno.</p>
                  ) : (
                    activeDay.exercises.map((workoutEx) => {
                      const exerciseInfo = exercises.find(e => e.id === workoutEx.exerciseId);
                      if (!exerciseInfo) return null;
                      return (
                        <ExerciseCard 
                          key={workoutEx.id} 
                          workoutEx={workoutEx} 
                          exerciseInfo={exerciseInfo}
                          clientId={client.id}
                          dayId={activeDay.id}
                          isReadOnly={isReadOnly}
                        />
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE BUILDER SCHEDA
// ============================================================================
const PlanBuilderTab = ({ exercises, onSave }: any) => {
  const [days, setDays] = useState<WorkoutDay[]>([{ id: crypto.randomUUID(), name: 'Giorno 1', exercises: [] }]);

  const addDay = () => setDays([...days, { id: crypto.randomUUID(), name: `Giorno ${days.length + 1}`, exercises: [] }]);
  const removeDay = (id: string) => setDays(days.filter(d => d.id !== id));
  const updateDayName = (id: string, name: string) => setDays(days.map(d => d.id === id ? { ...d, name } : d));

  const addExercise = (dayId: string) => {
    if (exercises.length === 0) return alert("Nessun esercizio nel database!");
    setDays(days.map(d => {
      if (d.id === dayId) {
        return {
          ...d,
          exercises: [...d.exercises, { id: crypto.randomUUID(), exerciseId: exercises[0].id, sets: 3, reps: '10', rest: '90s', logs: [] }]
        };
      }
      return d;
    }));
  };

  const updateExercise = (dayId: string, exId: string, field: string, value: any) => {
    setDays(days.map(d => {
      if (d.id === dayId) {
        return { ...d, exercises: d.exercises.map(e => e.id === exId ? { ...e, [field]: value } : e) };
      }
      return d;
    }));
  };

  const removeExercise = (dayId: string, exId: string) => {
    setDays(days.map(d => d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.id !== exId) } : d));
  };

  const handleSave = () => {
    if (days.length === 0) return alert("Devi aggiungere almeno un giorno!");
    if (days.some(d => d.exercises.length === 0)) return alert("Hai lasciato dei giorni vuoti. Riempi tutti i giorni o eliminali.");
    if (window.confirm("Attenzione: salvare questa scheda sovrascriverà la tua scheda attuale (che verrà archiviata). Vuoi procedere?")) {
      onSave(days);
    }
  };

  return (
    <div className="px-6 py-6 animate-in fade-in duration-300">
      <div className="mb-6 bg-lime-400/10 border border-lime-400/20 p-4 rounded-2xl">
        <h2 className="text-lime-400 font-bold text-lg mb-1">Costruisci il tuo piano</h2>
        <p className="text-neutral-400 text-sm">Seleziona gli esercizi dal database, imposta le serie, le ripetizioni e salva per attivare la tua nuova scheda personalizzata.</p>
      </div>

      <div className="space-y-8">
        {days.map((day, dIdx) => (
          <div key={day.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-6">
              <input 
                type="text" 
                value={day.name} 
                onChange={(e) => updateDayName(day.id, e.target.value)}
                className="bg-transparent text-xl font-bold text-white border-b border-neutral-700 focus:border-lime-400 outline-none w-full pb-1"
                placeholder="Nome sessione (es. Spinta)"
              />
              <button onClick={() => removeDay(day.id)} className="p-2 text-neutral-500 hover:text-red-400 transition-colors bg-neutral-950 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {day.exercises.map((ex, eIdx) => (
                <div key={ex.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 relative">
                  <span className="absolute top-4 left-4 w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">{eIdx + 1}</span>
                  <button onClick={() => removeExercise(day.id, ex.id)} className="absolute top-4 right-4 text-neutral-500 hover:text-red-400"><XIcon className="w-5 h-5" /></button>
                  
                  <div className="pl-10 pr-8">
                    <div className="mb-3">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Seleziona Esercizio</label>
                      <select 
                        value={ex.exerciseId}
                        onChange={(e) => updateExercise(day.id, ex.id, 'exerciseId', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-lime-400"
                      >
                        {exercises.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.muscleGroup})</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Serie</label>
                        <input type="number" min="1" value={ex.sets} onChange={(e) => updateExercise(day.id, ex.id, 'sets', parseInt(e.target.value))} className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-lime-400 text-center" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Reps</label>
                        <input type="text" value={ex.reps} onChange={(e) => updateExercise(day.id, ex.id, 'reps', e.target.value)} placeholder="es. 10-12" className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-lime-400 text-center" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Recup.</label>
                        <input type="text" value={ex.rest} onChange={(e) => updateExercise(day.id, ex.id, 'rest', e.target.value)} placeholder="es. 90s" className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-lime-400 text-center" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => addExercise(day.id)} className="mt-4 w-full py-3 border border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-colors">
              <Plus className="w-4 h-4" /> Aggiungi Esercizio
            </button>
          </div>
        ))}

        <button onClick={addDay} className="w-full py-4 bg-neutral-900 border border-neutral-800 text-white font-bold rounded-3xl flex items-center justify-center gap-2 transition-colors hover:bg-neutral-800">
          <Calendar className="w-5 h-5" /> Aggiungi un Giorno
        </button>
      </div>

      <div className="mt-8 pt-8 border-t border-neutral-900 pb-10">
        <button onClick={handleSave} className="w-full py-4 bg-lime-400 text-black font-bold rounded-2xl flex items-center justify-center gap-2 text-lg hover:bg-lime-500 transition-colors shadow-lg shadow-lime-400/20">
          <Save className="w-6 h-6" /> Attiva la Scheda
        </button>
      </div>
    </div>
  );
};

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

// ============================================================================
// SUBSCRIPTION TAB
// ============================================================================
const SubscriptionTab = ({ client, subscriptions }: any) => {
  const sub = subscriptions.find((s: any) => s.id === client.subscriptionId);
  const pay = client.payment;

  if (!sub && !client.subscriptionStart && !pay) {
    return (
      <div className="p-6 text-center mt-10 animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-10 h-10 text-neutral-600" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-white">Nessun Abbonamento</h2>
        <p className="text-neutral-500">Non hai ancora un abbonamento attivo registrato nel sistema.</p>
      </div>
    );
  }

  const totalCost = pay ? pay.totalCost : (sub ? sub.cost : 0);
  const amountPaid = pay ? pay.amountPaid : 0;
  const moneyLeft = Math.max(0, totalCost - amountPaid);
  const pct = totalCost > 0 ? Math.min(100, (amountPaid / totalCost) * 100) : 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getStatus = (inst: any) => {
    if (inst.paid) return { label: 'Saldata', color: 'text-green-400 bg-green-400/10 border border-green-400/20' };
    if (!inst.dueDate) return { label: 'In attesa', color: 'text-neutral-400 bg-neutral-800 border border-neutral-700' };
    
    const due = new Date(inst.dueDate + 'T00:00:00');
    if (due < today) return { label: 'Scaduta', color: 'text-red-400 bg-red-400/10 border border-red-400/20' };
    
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    
    if (diff === 0) return { label: 'Scade oggi', color: 'text-amber-400 bg-amber-400/10 border border-amber-400/20' };
    if (diff <= 7) return { label: `Scade tra ${diff} giorni`, color: 'text-amber-400 bg-amber-400/10 border border-amber-400/20' };
    return { label: `Scade tra ${diff} giorni`, color: 'text-blue-400 bg-blue-400/10 border border-blue-400/20' };
  };

  return (
    <div className="px-6 py-6 space-y-6 animate-in fade-in duration-300">
      <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-lime-400/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Il tuo piano</h2>
            <p className="text-neutral-400 text-sm">{sub ? sub.name : 'Personalizzato'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Inizio</p>
            <p className="text-white font-bold text-sm">
              {client.subscriptionStart ? new Date(client.subscriptionStart).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
            </p>
          </div>
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Scadenza</p>
            <p className="text-white font-bold text-sm">
              {client.subscriptionEnd ? new Date(client.subscriptionEnd).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-lime-400/10 flex items-center justify-center">
            <Euro className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Riepilogo Pagamenti</h2>
            <p className="text-neutral-400 text-sm">Dettaglio costi e rate</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex flex-col justify-center items-center text-center">
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-1">Totale</span>
            <span className="text-white font-bold text-base sm:text-lg">€{totalCost.toFixed(2)}</span>
          </div>
          <div className="bg-neutral-950 p-3 rounded-2xl border border-lime-400/30 flex flex-col justify-center items-center text-center shadow-[0_0_15px_rgba(163,230,53,0.1)]">
            <span className="text-lime-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pagato</span>
            <span className="text-lime-400 font-bold text-base sm:text-lg">€{amountPaid.toFixed(2)}</span>
          </div>
          <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex flex-col justify-center items-center text-center">
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-1">Da Pagare</span>
            <span className={`font-bold text-base sm:text-lg ${moneyLeft > 0 ? 'text-red-400' : 'text-neutral-400'}`}>
              €{moneyLeft.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mb-8">
          <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${pct}%`, background: pct >= 100 ? '#a3e635' : pct >= 50 ? '#60a5fa' : '#fbbf24' }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Rate Programmate</h3>
          {(!pay || pay.installments.length === 0) ? (
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-center">
              <p className="text-neutral-500 text-sm">Nessuna rata generata dal gestore.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pay.installments.map((inst: any, idx: number) => {
                const status = getStatus(inst);
                return (
                  <div key={inst.id} className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-600 font-bold text-sm w-4">#{idx + 1}</span>
                      <div>
                        <p className="text-white font-bold text-sm sm:text-base">€{inst.amount.toFixed(2)}</p>
                        <p className="text-xs text-neutral-500">
                          {inst.dueDate ? new Date(inst.dueDate + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXERCISE CARD
// ============================================================================
const ExerciseCard = ({ workoutEx, exerciseInfo, clientId, dayId, isReadOnly }: any) => {
  const { addExerciseLog, deleteExerciseLog } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [editingLog, setEditingLog] = useState<any>(null);
  const [editWeightValue, setEditWeightValue] = useState('');
  const [deletingLog, setDeletingLog] = useState<any>(null);

  const logs = workoutEx.logs || [];
  const sortedLogs = [...logs].sort((a: any, b: any) => a.week - b.week);
  const maxWeek = logs.reduce((max: number, log: any) => Math.max(max, log.week), 0);

  // FIX BUG 3: selectedWeek si aggiorna dinamicamente quando maxWeek cambia
  const [selectedWeek, setSelectedWeek] = useState(maxWeek + 1);
  useEffect(() => {
    setSelectedWeek(maxWeek + 1);
  }, [maxWeek]);

  const availableWeeks = Array.from(
    { length: Math.max(12, maxWeek + 5) }, 
    (_, i) => i + 1
  );

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;
    addExerciseLog(clientId, dayId, workoutEx.id, {
      week: selectedWeek,
      weight: parseFloat(newWeight),
      date: new Date().toISOString()
    });
    setNewWeight('');
  };

  const submitEditLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog && editWeightValue.trim() !== '') {
      const parsed = parseFloat(editWeightValue.replace(',', '.'));
      if (!isNaN(parsed) && parsed >= 0) {
        addExerciseLog(clientId, dayId, workoutEx.id, {
          week: editingLog.week,
          weight: parsed,
          date: new Date().toISOString()
        });
      }
    }
    setEditingLog(null);
  };

  const confirmDelete = () => {
    if (deletingLog) {
      deleteExerciseLog(clientId, dayId, workoutEx.id, deletingLog.id);
    }
    setDeletingLog(null);
  };

  // NUOVA LOGICA: Controlliamo se l'esercizio è di tipo "Cardio"
  const isCardio = exerciseInfo?.muscleGroup === 'Cardio';

  return (
    <>
      <div className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl relative">
        {exerciseInfo.videoUrl ? (
          <div className="h-56 bg-neutral-800 relative group">
            <ExerciseAnimation muscleGroup={exerciseInfo.muscleGroup} videoUrl={exerciseInfo.videoUrl} />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80 pointer-events-none" />
            <div className="absolute top-4 left-5 right-5 flex justify-between items-start pointer-events-none">
              <span className="bg-neutral-950/80 backdrop-blur-md text-lime-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-neutral-800">
                {exerciseInfo.muscleGroup}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-5 pt-5 pb-0 flex justify-end">
            <span className="bg-neutral-950 text-lime-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-neutral-800">
              {exerciseInfo.muscleGroup}
            </span>
          </div>
        )}
        
        <div className="p-5">
          <h3 className="text-2xl font-bold text-white mb-2">{exerciseInfo.name}</h3>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-800 flex-1">
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Serie x Reps</p>
              <p className="text-white font-bold text-lg">{workoutEx.sets} <span className="text-neutral-500 mx-1">×</span> {workoutEx.reps}</p>
            </div>
            <RestTimer restString={workoutEx.rest} />
          </div>

          {workoutEx.notes && (
            <div className="mb-6 bg-neutral-950/50 p-4 rounded-2xl border border-neutral-800/50">
              <p className="text-neutral-400 text-sm italic">"{workoutEx.notes}"</p>
            </div>
          )}
          
          {/* Il blocco dei progressi viene mostrato SOLO se l'esercizio NON è Cardio */}
          {!isCardio && (
            <>
              <button 
                onClick={() => setExpanded(!expanded)} 
                className={`w-full py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors ${
                  expanded ? 'bg-neutral-800 text-white' : (isReadOnly ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-lime-400 text-black hover:bg-lime-500')
                }`}
              >
                {expanded ? 'Chiudi' : (isReadOnly ? 'Visualizza Progressi Passati' : 'Traccia Progressi')} 
                <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 space-y-4 border-t border-neutral-800 mt-6">
                      
                      {sortedLogs.length > 0 && (
                        <div className="space-y-3 mb-6">
                          <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Storico</h4>
                          {sortedLogs.map((log: any) => (
                            <div key={log.id} className="flex justify-between items-center bg-neutral-950 p-4 rounded-2xl border border-neutral-800 group">
                              <div>
                                <div className="font-bold text-neutral-300">Settimana {log.week}</div>
                                <div className="text-[10px] text-neutral-500 mt-0.5">{new Date(log.date).toLocaleDateString('it-IT')}</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <span className="text-xl font-bold text-lime-400">{log.weight}</span>
                                  <span className="text-neutral-500 font-medium text-sm">kg</span>
                                </div>
                                
                                {!isReadOnly && (
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => {
                                        setEditWeightValue(String(log.weight));
                                        setEditingLog(log);
                                      }}
                                      className="p-2 text-neutral-500 hover:text-blue-400 transition-colors"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => setDeletingLog(log)}
                                      className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isReadOnly && (
                        <form onSubmit={handleSaveLog} className="bg-neutral-950 p-5 rounded-2xl border border-lime-400/30">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-lime-400 uppercase tracking-wider">Registra Carico</h4>
                            <select 
                              value={selectedWeek}
                              onChange={(e) => setSelectedWeek(Number(e.target.value))}
                              className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-lime-400"
                            >
                              {availableWeeks.map(w => (
                                <option key={w} value={w}>Settimana {w}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-3">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                required
                                value={newWeight}
                                onChange={(e) => {
                                  if (e.target.value.includes('-')) return;
                                  setNewWeight(e.target.value);
                                }}
                                placeholder="Carico"
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 pl-4 pr-10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-lime-400 transition-colors font-bold text-lg"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">kg</span>
                            </div>
                            <button 
                              type="submit"
                              className="bg-lime-400 text-black w-14 rounded-xl flex items-center justify-center hover:bg-lime-500 transition-colors"
                            >
                              <Plus className="w-6 h-6" />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

        </div>
      </div>

      {deletingLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Eliminare record?</h3>
            <p className="text-neutral-400 text-sm mb-6">
              Stai per eliminare il carico di <span className="font-bold text-white">{deletingLog.weight} kg</span> registrato per la <span className="font-bold text-white">Settimana {deletingLog.week}</span>. L'azione è irreversibile.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingLog(null)}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {editingLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Modifica Settimana {editingLog.week}</h3>
              <button onClick={() => setEditingLog(null)} className="text-neutral-500 hover:text-white">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitEditLog}>
              <div className="relative mb-6">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={editWeightValue}
                  onChange={(e) => {
                    if (e.target.value.includes('-')) return;
                    setEditWeightValue(e.target.value);
                  }}
                  className="w-full bg-neutral-950 border border-lime-400/50 rounded-xl py-4 pl-4 pr-12 text-white focus:outline-none focus:border-lime-400 transition-colors font-bold text-2xl text-center"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">kg</span>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-lime-400 hover:bg-lime-500 text-black font-bold rounded-xl transition-colors text-lg"
              >
                Salva Modifica
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};