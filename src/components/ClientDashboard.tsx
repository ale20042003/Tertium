import React, { useState, useEffect } from 'react';
import { LogOut, Clock, ChevronDown, Plus, Dumbbell, Calendar, Edit2, Trash2, Save, Users, Apple, Megaphone, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store';
import { ExerciseAnimation } from './ExerciseAnimation';
import { RestTimer } from './RestTimer';
import { ClientProgress } from './ClientProgress';
import { WorkoutDay, WorkoutExercise } from '../types';
import vertiumLogo from '../assets/vertium-logo-full.jpg';

export const ClientDashboard: React.FC<{ clientId: string, onLogout: () => void }> = ({ clientId, onLogout }) => {
  const { clients, exercises, saveCustomPlan } = useAppContext();
  const client = clients.find(c => c.id === clientId);

  const [selectedPlanId, setSelectedPlanId] = useState<string>('current');
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workout' | 'progress' | 'builder' | 'classes' | 'nutrition' | 'board'>('workout');

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

  // Senza questa schermata, un cliente i cui dati non sono ancora arrivati
  // si ritroverebbe davanti una pagina completamente bianca.
  if (!client) {
    return (
      <div className="min-h-screen bg-brand-950 text-white flex flex-col items-center justify-center gap-6 p-8 text-center">
        <img src={vertiumLogo} alt="Vertium Fit Club" className="h-20 w-auto rounded-2xl shadow-2xl" />
        <p className="text-neutral-300">Stiamo caricando i tuoi dati…</p>
        <button
          onClick={onLogout}
          className="text-neutral-400 hover:text-white underline underline-offset-4"
        >
          Esci
        </button>
      </div>
    );
  }

  const currentPlanDays = selectedPlanId === 'current' 
    ? client.workoutPlan 
    : client.pastPlans?.find(p => p.id === selectedPlanId)?.workoutPlan || [];

  const activeDay = currentPlanDays.find(d => d.id === activeDayId);
  const isReadOnly = selectedPlanId !== 'current';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-24 font-sans">
      <header className="px-6 pt-12 pb-6 flex justify-between items-end sticky top-0 bg-white/90 backdrop-blur-xl z-20 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <img src={vertiumLogo} alt="Vertium Fit Club" className="h-12 w-auto rounded-xl shadow-md flex-shrink-0" />
          <div>
            <p className="text-brand-950 text-sm font-bold uppercase tracking-widest mb-1">Bentornato</p>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{client.name}</h1>
          </div>
        </div>
        <button onClick={onLogout} className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center hover:bg-neutral-200 transition-colors">
          <LogOut className="w-5 h-5 text-neutral-500" />
        </button>
      </header>

      <div className="px-6 pb-2 pt-2">
        <div className="bg-neutral-100 rounded-full p-1 border border-neutral-200 flex overflow-x-auto no-scrollbar snap-x">
          <button
            onClick={() => setActiveTab('workout')}
            className={`snap-start flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${activeTab === 'workout' ? 'bg-brand-950 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Scheda
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`snap-start flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${activeTab === 'builder' ? 'bg-brand-950 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Crea Scheda
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`snap-start flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${activeTab === 'progress' ? 'bg-brand-950 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Progressi
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`snap-start flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${activeTab === 'classes' ? 'bg-brand-950 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Corsi
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`snap-start flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${activeTab === 'nutrition' ? 'bg-brand-950 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Nutrizione
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`snap-start flex-1 py-2.5 px-4 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${activeTab === 'board' ? 'bg-brand-950 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Bacheca
          </button>
        </div>
      </div>

      {activeTab === 'progress' ? (
        <ClientProgress client={client} />
      ) : activeTab === 'classes' ? (
        <ClassesTab client={client} />
      ) : activeTab === 'nutrition' ? (
        <NutritionTab client={client} />
      ) : activeTab === 'board' ? (
        <AnnouncementsTab />
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
                className="w-full bg-white border border-neutral-200 shadow-sm text-neutral-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 font-bold"
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
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Dumbbell className="w-10 h-10 text-neutral-400" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-neutral-900">Nessuna scheda</h2>
              <p className="text-neutral-500 mb-6">
                {isReadOnly ? 'Questa scheda passata è vuota.' : 'Non hai ancora una scheda di allenamento attiva.'}
              </p>
              {!isReadOnly && (
                <button
                  onClick={() => setActiveTab('builder')}
                  className="bg-brand-950 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-800 transition-colors inline-flex items-center gap-2"
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
                        ? 'bg-brand-950 text-white shadow-sm'
                        : 'bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300'
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
// TAB CORSI (self-service)
// ============================================================================
const DAY_LABELS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

const ClassesTab: React.FC<{ client: any }> = ({ client }) => {
  const { gymClasses, classBookings, rooms, staff, bookClass, cancelBooking } = useAppContext();

  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const occurrences = nextDays.flatMap(date => {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    return gymClasses
      .flatMap(c => c.schedule.filter(s => s.dayOfWeek === dayOfWeek).map(s => ({ gymClass: c, startTime: s.startTime, date: dateStr, dateObj: date })))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return (
    <div className="px-6 py-6 space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-4 px-1">Prossimi 7 giorni</h2>
        {occurrences.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm text-center text-neutral-500">
            Nessun corso in programma questa settimana.
          </div>
        ) : (
          <div className="space-y-3">
            {occurrences.map(({ gymClass, startTime, date, dateObj }) => {
              const bookingsForOccurrence = classBookings.filter(b => b.classId === gymClass.id && b.date === date && b.status !== 'cancellata');
              const confirmedCount = bookingsForOccurrence.filter(b => b.status === 'confermata').length;
              const myBooking = bookingsForOccurrence.find(b => b.clientId === client.id);
              const instructor = staff.find((s: any) => s.id === gymClass.staffId);
              const room = rooms.find((r: any) => r.id === gymClass.roomId);

              return (
                <div key={gymClass.id + date} className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm" style={{ borderLeftWidth: '4px', borderLeftColor: gymClass.color }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-neutral-900">{gymClass.name}</h3>
                      <p className="text-xs text-neutral-500">{DAY_LABELS[dateObj.getDay()]} · {instructor?.name || 'Nessun istruttore'} · {room?.name || 'Nessuna sala'}</p>
                    </div>
                    <span className="text-sm font-semibold text-neutral-600 flex items-center gap-1 flex-shrink-0"><Clock className="w-3.5 h-3.5" />{startTime}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-medium text-neutral-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {confirmedCount}/{gymClass.capacity}</span>
                    {myBooking ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${myBooking.status === 'waitlist' ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
                          {myBooking.status === 'waitlist' ? 'In lista d\'attesa' : 'Prenotato'}
                        </span>
                        <button onClick={() => cancelBooking(myBooking.id)} className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5">Disdici</button>
                      </div>
                    ) : (
                      <button onClick={() => bookClass(gymClass.id, client.id, date)} className="text-xs font-bold bg-brand-950 text-white px-4 py-1.5 rounded-full hover:bg-brand-800 transition-colors">
                        Prenota
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TAB NUTRIZIONE (sola lettura)
// ============================================================================
const NutritionTab: React.FC<{ client: any }> = ({ client }) => {
  const plan = client.nutritionPlan;

  if (!plan) {
    return (
      <div className="p-6 text-center mt-10 animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Apple className="w-10 h-10 text-neutral-400" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-neutral-900">Nessun Piano Alimentare</h2>
        <p className="text-neutral-500">Il tuo piano alimentare non è ancora stato impostato dal gestore.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
            <Apple className="w-5 h-5 text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900">{plan.title}</h2>
        </div>
        {(plan.dailyCalories || plan.dailyProtein || plan.dailyCarbs || plan.dailyFat) && (
          <div className="grid grid-cols-4 gap-3">
            {plan.dailyCalories !== undefined && (
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-center">
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Kcal</p>
                <p className="text-neutral-900 font-bold">{plan.dailyCalories}</p>
              </div>
            )}
            {plan.dailyProtein !== undefined && (
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-center">
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Prot.</p>
                <p className="text-neutral-900 font-bold">{plan.dailyProtein}g</p>
              </div>
            )}
            {plan.dailyCarbs !== undefined && (
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-center">
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Carb.</p>
                <p className="text-neutral-900 font-bold">{plan.dailyCarbs}g</p>
              </div>
            )}
            {plan.dailyFat !== undefined && (
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-center">
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Grassi</p>
                <p className="text-neutral-900 font-bold">{plan.dailyFat}g</p>
              </div>
            )}
          </div>
        )}
      </div>

      {plan.meals.length > 0 && (
        <div className="space-y-3">
          {plan.meals.map((meal: any) => (
            <div key={meal.id} className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-neutral-900 text-sm">{meal.name}</span>
                {meal.time && <span className="text-xs text-neutral-500">{meal.time}</span>}
              </div>
              <p className="text-sm text-neutral-500 whitespace-pre-wrap">{meal.items}</p>
            </div>
          ))}
        </div>
      )}

      {plan.notes && (
        <div className="bg-brand-50/60 p-4 rounded-2xl border border-brand-100">
          <p className="text-neutral-600 text-sm italic">"{plan.notes}"</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TAB BACHECA (sola lettura)
// ============================================================================
const AnnouncementsTab: React.FC = () => {
  const { announcements } = useAppContext();

  const sorted = [...announcements].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  if (sorted.length === 0) {
    return (
      <div className="p-6 text-center mt-10 animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Megaphone className="w-10 h-10 text-neutral-400" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-neutral-900">Nessun Avviso</h2>
        <p className="text-neutral-500">Il gestore non ha ancora pubblicato annunci in bacheca.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-3 animate-in fade-in duration-300">
      {sorted.map(a => (
        <div key={a.id} className={`p-4 rounded-2xl border shadow-sm ${a.pinned ? 'bg-brand-50/60 border-brand-100' : 'bg-white border-neutral-200'}`}>
          <div className="flex items-start gap-2">
            {a.pinned && <Pin className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />}
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900">{a.title}</h3>
              <p className="text-sm text-neutral-600 mt-1 whitespace-pre-wrap">{a.message}</p>
              <p className="text-xs text-neutral-400 mt-2">{new Date(a.createdAt).toLocaleString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      ))}
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
      <div className="mb-6 bg-brand-50 border border-brand-100 p-4 rounded-2xl">
        <h2 className="text-brand-700 font-bold text-lg mb-1">Costruisci il tuo piano</h2>
        <p className="text-neutral-600 text-sm">Seleziona gli esercizi dal database, imposta le serie, le ripetizioni e salva per attivare la tua nuova scheda personalizzata.</p>
      </div>

      <div className="space-y-8">
        {days.map((day, dIdx) => (
          <div key={day.id} className="bg-white border border-neutral-200 shadow-sm rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-6">
              <input
                type="text"
                value={day.name}
                onChange={(e) => updateDayName(day.id, e.target.value)}
                className="bg-transparent text-xl font-bold text-neutral-900 border-b border-neutral-300 focus:border-brand-500 outline-none w-full pb-1"
                placeholder="Nome sessione (es. Spinta)"
              />
              <button onClick={() => removeDay(day.id)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors bg-neutral-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {day.exercises.map((ex, eIdx) => (
                <div key={ex.id} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 relative">
                  <span className="absolute top-4 left-4 w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">{eIdx + 1}</span>
                  <button onClick={() => removeExercise(day.id, ex.id)} className="absolute top-4 right-4 text-neutral-400 hover:text-red-500"><XIcon className="w-5 h-5" /></button>

                  <div className="pl-10 pr-8">
                    <div className="mb-3">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Seleziona Esercizio</label>
                      <select
                        value={ex.exerciseId}
                        onChange={(e) => updateExercise(day.id, ex.id, 'exerciseId', e.target.value)}
                        className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                      >
                        {exercises.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.muscleGroup})</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Serie</label>
                        <input type="number" min="1" value={ex.sets} onChange={(e) => updateExercise(day.id, ex.id, 'sets', parseInt(e.target.value))} className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 text-sm outline-none focus:border-brand-500 text-center" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Reps</label>
                        <input type="text" value={ex.reps} onChange={(e) => updateExercise(day.id, ex.id, 'reps', e.target.value)} placeholder="es. 10-12" className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 text-sm outline-none focus:border-brand-500 text-center" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Recup.</label>
                        <input type="text" value={ex.rest} onChange={(e) => updateExercise(day.id, ex.id, 'rest', e.target.value)} placeholder="es. 90s" className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 text-sm outline-none focus:border-brand-500 text-center" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => addExercise(day.id)} className="mt-4 w-full py-3 border border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-colors">
              <Plus className="w-4 h-4" /> Aggiungi Esercizio
            </button>
          </div>
        ))}

        <button onClick={addDay} className="w-full py-4 bg-white border border-dashed border-neutral-300 text-neutral-700 font-bold rounded-3xl flex items-center justify-center gap-2 transition-colors hover:bg-neutral-50">
          <Calendar className="w-5 h-5" /> Aggiungi un Giorno
        </button>
      </div>

      <div className="mt-8 pt-8 border-t border-neutral-200 pb-10">
        <button onClick={handleSave} className="w-full py-4 bg-brand-950 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-lg hover:bg-brand-800 transition-colors shadow-lg shadow-brand-500/20">
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
      <div className="bg-white rounded-3xl overflow-hidden border border-neutral-200 shadow-sm relative">
        <div className="h-56 bg-neutral-100 relative group">
          <ExerciseAnimation muscleGroup={exerciseInfo.muscleGroup} videoUrl={exerciseInfo.videoUrl} />
          {exerciseInfo.videoUrl ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 pointer-events-none" />
              <div className="absolute top-4 left-5 right-5 flex justify-between items-start pointer-events-none">
                <span className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/10">
                  {exerciseInfo.muscleGroup}
                </span>
              </div>
            </>
          ) : (
            <div className="absolute top-4 left-5 right-5 flex justify-between items-start pointer-events-none">
              <span className="bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-brand-100">
                {exerciseInfo.muscleGroup}
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">{exerciseInfo.name}</h3>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-neutral-50 px-4 py-3 rounded-2xl border border-neutral-200 flex-1">
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Serie x Reps</p>
              <p className="text-neutral-900 font-bold text-lg">{workoutEx.sets} <span className="text-neutral-400 mx-1">×</span> {workoutEx.reps}</p>
            </div>
            <RestTimer restString={workoutEx.rest} />
          </div>

          {workoutEx.notes && (
            <div className="mb-6 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
              <p className="text-neutral-500 text-sm italic">"{workoutEx.notes}"</p>
            </div>
          )}

          {/* Il blocco dei progressi viene mostrato SOLO se l'esercizio NON è Cardio */}
          {!isCardio && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors ${
                  expanded ? 'bg-neutral-100 text-neutral-900' : (isReadOnly ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' : 'bg-brand-950 text-white hover:bg-brand-800')
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
                    <div className="pt-6 space-y-4 border-t border-neutral-200 mt-6">

                      {sortedLogs.length > 0 && (
                        <div className="space-y-3 mb-6">
                          <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Storico</h4>
                          {sortedLogs.map((log: any) => (
                            <div key={log.id} className="flex justify-between items-center bg-neutral-50 p-4 rounded-2xl border border-neutral-200 group">
                              <div>
                                <div className="font-bold text-neutral-700">Settimana {log.week}</div>
                                <div className="text-[10px] text-neutral-400 mt-0.5">{new Date(log.date).toLocaleDateString('it-IT')}</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <span className="text-xl font-bold text-brand-600">{log.weight}</span>
                                  <span className="text-neutral-500 font-medium text-sm">kg</span>
                                </div>

                                {!isReadOnly && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditWeightValue(String(log.weight));
                                        setEditingLog(log);
                                      }}
                                      className="p-2 text-neutral-400 hover:text-brand-600 transition-colors"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingLog(log)}
                                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
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
                        <form onSubmit={handleSaveLog} className="bg-brand-50 p-5 rounded-2xl border border-brand-100">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-brand-700 uppercase tracking-wider">Registra Carico</h4>
                            <select
                              value={selectedWeek}
                              onChange={(e) => setSelectedWeek(Number(e.target.value))}
                              className="bg-white border border-neutral-200 text-neutral-900 text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-brand-500"
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
                                className="w-full bg-white border border-neutral-300 rounded-xl py-3 pl-4 pr-10 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-brand-500 transition-colors font-bold text-lg"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">kg</span>
                            </div>
                            <button
                              type="submit"
                              className="bg-brand-950 text-white w-14 rounded-xl flex items-center justify-center hover:bg-brand-800 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Eliminare record?</h3>
            <p className="text-neutral-500 text-sm mb-6">
              Stai per eliminare il carico di <span className="font-bold text-neutral-900">{deletingLog.weight} kg</span> registrato per la <span className="font-bold text-neutral-900">Settimana {deletingLog.week}</span>. L'azione è irreversibile.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingLog(null)}
                className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {editingLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-neutral-900">Modifica Settimana {editingLog.week}</h3>
              <button onClick={() => setEditingLog(null)} className="text-neutral-400 hover:text-neutral-900">
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
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl py-4 pl-4 pr-12 text-neutral-900 focus:outline-none focus:border-brand-500 transition-colors font-bold text-2xl text-center"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">kg</span>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-brand-950 hover:bg-brand-800 text-white font-bold rounded-xl transition-colors text-lg"
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