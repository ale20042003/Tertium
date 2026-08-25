import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Dumbbell, Clock, Repeat, X, CreditCard, CheckCircle2, AlertCircle, Clock3, Search, ChevronDown, Check, Apple, Edit2 } from 'lucide-react';
import { useAppContext } from '../store';
import { Client, WorkoutDay, NutritionMeal } from '../types';

interface ClientDetailsProps {
  client: Client;
  onBack: () => void;
}

// ─── COMPONENTE: Menù a tendina con ricerca integrata ───
const SearchableExerciseSelect = ({ exercises, value, onChange }: { exercises: any[], value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedExercise = exercises.find((e) => e.id === value);
  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Finta "Select" visibile */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg cursor-pointer flex justify-between items-center hover:bg-neutral-50 transition-colors focus:ring-2 focus:ring-blue-500"
      >
        <span className={`text-sm ${selectedExercise ? "text-neutral-900 font-medium" : "text-neutral-500"}`}>
          {selectedExercise ? `${selectedExercise.name} (${selectedExercise.muscleGroup})` : 'Seleziona esercizio...'}
        </span>
        <ChevronDown className="w-4 h-4 text-neutral-400" />
      </div>

      {/* Menù a tendina a comparsa */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-neutral-100 bg-neutral-50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                autoFocus
                placeholder="Cerca esercizio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredExercises.length > 0 ? (
              filteredExercises.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => {
                    onChange(ex.id);
                    setIsOpen(false);
                    setSearchTerm(''); 
                  }}
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 flex justify-between items-center transition-colors ${
                    value === ex.id ? 'bg-blue-50 text-blue-700' : 'text-neutral-700'
                  }`}
                >
                  <div>
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-neutral-400 text-xs ml-2">({ex.muscleGroup})</span>
                  </div>
                  {value === ex.id && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-neutral-500 text-center italic">
                Nessun esercizio trovato.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
// ────────────────────────────────────────────────────────

const emptyNutritionForm = { title: '', dailyCalories: '', dailyProtein: '', dailyCarbs: '', dailyFat: '', notes: '', meals: [] as NutritionMeal[] };

export const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onBack }) => {
  const { exercises, subscriptions, addWorkoutDay, deleteWorkoutDay, addWorkoutExercise, deleteWorkoutExercise, archiveWorkoutPlan, updateNutritionPlan } = useAppContext();

  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [nutritionForm, setNutritionForm] = useState(emptyNutritionForm);

  const openNutritionModal = () => {
    const plan = client.nutritionPlan;
    if (plan) {
      setNutritionForm({
        title: plan.title,
        dailyCalories: plan.dailyCalories !== undefined ? String(plan.dailyCalories) : '',
        dailyProtein: plan.dailyProtein !== undefined ? String(plan.dailyProtein) : '',
        dailyCarbs: plan.dailyCarbs !== undefined ? String(plan.dailyCarbs) : '',
        dailyFat: plan.dailyFat !== undefined ? String(plan.dailyFat) : '',
        notes: plan.notes || '',
        meals: [...plan.meals],
      });
    } else {
      setNutritionForm(emptyNutritionForm);
    }
    setIsNutritionModalOpen(true);
  };

  const closeNutritionModal = () => { setIsNutritionModalOpen(false); setNutritionForm(emptyNutritionForm); };

  const addMeal = () => {
    setNutritionForm(prev => ({ ...prev, meals: [...prev.meals, { id: crypto.randomUUID(), name: '', time: '', items: '' }] }));
  };

  const removeMeal = (id: string) => {
    setNutritionForm(prev => ({ ...prev, meals: prev.meals.filter(m => m.id !== id) }));
  };

  const updateMeal = (id: string, field: keyof NutritionMeal, value: string) => {
    setNutritionForm(prev => ({ ...prev, meals: prev.meals.map(m => m.id === id ? { ...m, [field]: value } : m) }));
  };

  const handleSaveNutrition = (e: React.FormEvent) => {
    e.preventDefault();
    updateNutritionPlan(client.id, {
      id: client.nutritionPlan?.id || crypto.randomUUID(),
      title: nutritionForm.title,
      dailyCalories: nutritionForm.dailyCalories ? parseFloat(nutritionForm.dailyCalories) : undefined,
      dailyProtein: nutritionForm.dailyProtein ? parseFloat(nutritionForm.dailyProtein) : undefined,
      dailyCarbs: nutritionForm.dailyCarbs ? parseFloat(nutritionForm.dailyCarbs) : undefined,
      dailyFat: nutritionForm.dailyFat ? parseFloat(nutritionForm.dailyFat) : undefined,
      notes: nutritionForm.notes || undefined,
      meals: nutritionForm.meals,
      updatedAt: new Date().toISOString(),
    });
    closeNutritionModal();
  };

  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [newDayName, setNewDayName] = useState('');
  
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archivePlanName, setArchivePlanName] = useState('');
  const [expandedPastPlanId, setExpandedPastPlanId] = useState<string | null>(null);
  
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [exerciseFormData, setExerciseFormData] = useState({
    exerciseId: '',
    sets: 3,
    reps: 10,
    restSeconds: 60 as number | string,
    notes: ''
  });

  const handleAddDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDayName.trim()) {
      addWorkoutDay(client.id, newDayName.trim());
      setNewDayName('');
      setIsDayModalOpen(false);
    }
  };

  const handleArchivePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (archivePlanName.trim()) {
      archiveWorkoutPlan(client.id, archivePlanName.trim());
      setArchivePlanName('');
      setIsArchiveModalOpen(false);
    }
  };

  const openExerciseModal = (dayId: string) => {
    setSelectedDayId(dayId);
    setExerciseFormData({
      exerciseId: exercises.length > 0 ? exercises[0].id : '',
      sets: 3,
      reps: 10,
      restSeconds: 60,
      notes: ''
    });
    setIsExerciseModalOpen(true);
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDayId && exerciseFormData.exerciseId) {
      const selectedEx = exercises.find(ex => ex.id === exerciseFormData.exerciseId);
      const isCardio = selectedEx?.muscleGroup === 'Cardio';

      const { restSeconds, ...rest } = exerciseFormData;
      
      // Se è cardio resettiamo i valori tecnici a zero/trattino in modo invisibile
      const finalRest = isCardio ? 0 : (restSeconds === '' ? 0 : Number(restSeconds));
      const finalSets = isCardio ? 1 : rest.sets;
      const finalReps = isCardio ? '-' : String(rest.reps);

      addWorkoutExercise(client.id, selectedDayId, { 
        ...rest, 
        sets: finalSets,
        reps: finalReps,
        rest: `${finalRest}s` 
      });
      setIsExerciseModalOpen(false);
    }
  };

  // Variabile per capire se attualmente nel form abbiamo scelto un esercizio Cardio
  const selectedExInForm = exercises.find(e => e.id === exerciseFormData.exerciseId);
  const isCardioSelected = selectedExInForm?.muscleGroup === 'Cardio';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Scheda di {client.name}</h1>
          <p className="text-neutral-500">{client.email}</p>
        </div>
      </div>

      {/* ─── Riepilogo Pagamenti ─── */}
      {client.payment && (() => {
        const pay = client.payment!;
        const sub = subscriptions.find(s => s.id === client.subscriptionId);
        const pct = pay.totalCost > 0 ? Math.min(100, (pay.amountPaid / pay.totalCost) * 100) : 0;
        const moneyLeft = pay.totalCost - pay.amountPaid;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pending = pay.installments.filter(i => !i.paid);
        const paid = pay.installments.filter(i => i.paid);
        const nextInst = pending
          .filter(i => i.dueDate)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        const nextDue = nextInst ? new Date(nextInst.dueDate + 'T00:00:00') : null;
        const nextIsLate = nextDue && nextDue < today;

        const getStatus = (inst: { dueDate: string; paid: boolean }) => {
          if (inst.paid) return { label: 'Saldata', color: 'text-green-700 bg-green-100', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
          if (!inst.dueDate) return { label: 'In attesa', color: 'text-neutral-600 bg-neutral-100', icon: <Clock3 className="w-3.5 h-3.5" /> };
          const due = new Date(inst.dueDate + 'T00:00:00');
          if (due < today) return { label: 'Scaduta', color: 'text-red-700 bg-red-100', icon: <AlertCircle className="w-3.5 h-3.5" /> };
          const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
          if (diff <= 7) return { label: `Scade in ${diff}g`, color: 'text-amber-700 bg-amber-100', icon: <AlertCircle className="w-3.5 h-3.5" /> };
          return { label: 'In scadenza', color: 'text-blue-700 bg-blue-100', icon: <Clock3 className="w-3.5 h-3.5" /> };
        };

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Pagamenti</h2>
              {sub && <span className="ml-auto text-sm text-neutral-500 font-medium">{sub.name}</span>}
            </div>

            <div className="p-5 space-y-5">
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-neutral-50 rounded-xl p-3 text-center border border-neutral-200">
                  <div className="text-xl font-bold text-neutral-800">{pay.installments.length}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Rate totali</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
                  <div className="text-xl font-bold text-green-700">{paid.length}</div>
                  <div className="text-xs text-green-600 mt-0.5">Saldate</div>
                </div>
                <div className={`rounded-xl p-3 text-center border ${pending.length === 0 ? 'bg-green-50 border-green-200' : nextIsLate ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className={`text-xl font-bold ${pending.length === 0 ? 'text-green-700' : nextIsLate ? 'text-red-700' : 'text-amber-700'}`}>{pending.length}</div>
                  <div className={`text-xs mt-0.5 ${pending.length === 0 ? 'text-green-600' : nextIsLate ? 'text-red-600' : 'text-amber-600'}`}>Rimanenti</div>
                </div>
                <div className={`rounded-xl p-3 text-center border ${nextDue ? (nextIsLate ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200') : 'bg-neutral-50 border-neutral-200'}`}>
                  <div className={`text-sm font-bold leading-tight ${nextDue ? (nextIsLate ? 'text-red-700' : 'text-blue-700') : 'text-neutral-400'}`}>
                    {nextDue
                      ? nextDue.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })
                      : pending.length === 0 ? '✓' : '—'}
                  </div>
                  <div className={`text-xs mt-0.5 ${nextIsLate ? 'text-red-600' : 'text-neutral-500'}`}>
                    {nextIsLate ? '⚠ Scaduta' : 'Pross. scad.'}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-sm text-neutral-600">Importo pagato</span>
                  <span className="text-sm font-bold text-neutral-800">€{pay.amountPaid.toFixed(2)} / €{pay.totalCost.toFixed(2)}</span>
                </div>
                <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#f59e0b' }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-neutral-400">{pct.toFixed(0)}% saldato</span>
                  <span className={`text-xs font-semibold ${moneyLeft <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {moneyLeft <= 0 ? 'Completamente saldato' : `Rimanente: €${moneyLeft.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Installments table */}
              {pay.installments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">Dettaglio rate</h3>
                  <div className="rounded-xl border border-neutral-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                          <th className="px-4 py-2.5 text-left font-medium">#</th>
                          <th className="px-4 py-2.5 text-left font-medium">Scadenza</th>
                          <th className="px-4 py-2.5 text-right font-medium">Importo</th>
                          <th className="px-4 py-2.5 text-right font-medium">Stato</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {pay.installments.map((inst, idx) => {
                          const status = getStatus(inst);
                          const isNext = nextInst?.id === inst.id;
                          return (
                            <tr key={inst.id} className={`${isNext ? 'bg-amber-50/50' : 'hover:bg-neutral-50'}`}>
                              <td className="px-4 py-3 text-neutral-400 font-medium">
                                <div className="flex items-center gap-1.5">
                                  {idx + 1}
                                  {isNext && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-neutral-700 font-medium">
                                {inst.dueDate
                                  ? new Date(inst.dueDate + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
                                  : '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-neutral-800">€{inst.amount.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                  {status.icon} {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ─── Piano Alimentare ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center gap-2">
          <Apple className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Piano Alimentare</h2>
          <button
            onClick={openNutritionModal}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            {client.nutritionPlan ? <><Edit2 className="w-3.5 h-3.5" /> Modifica</> : <><Plus className="w-3.5 h-3.5" /> Crea Piano</>}
          </button>
        </div>
        <div className="p-4">
          {!client.nutritionPlan ? (
            <p className="text-sm text-neutral-400 italic text-center py-4">Nessun piano alimentare impostato.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-neutral-900">{client.nutritionPlan.title}</h3>
                <div className="flex gap-2 flex-wrap">
                  {client.nutritionPlan.dailyCalories !== undefined && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">{client.nutritionPlan.dailyCalories} kcal</span>
                  )}
                  {client.nutritionPlan.dailyProtein !== undefined && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">P {client.nutritionPlan.dailyProtein}g</span>
                  )}
                  {client.nutritionPlan.dailyCarbs !== undefined && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">C {client.nutritionPlan.dailyCarbs}g</span>
                  )}
                  {client.nutritionPlan.dailyFat !== undefined && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700">G {client.nutritionPlan.dailyFat}g</span>
                  )}
                </div>
              </div>
              {client.nutritionPlan.meals.length > 0 && (
                <div className="space-y-2">
                  {client.nutritionPlan.meals.map(meal => (
                    <div key={meal.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neutral-900 text-sm">{meal.name}</span>
                        {meal.time && <span className="text-xs text-neutral-400">{meal.time}</span>}
                      </div>
                      <p className="text-sm text-neutral-600 whitespace-pre-wrap">{meal.items}</p>
                    </div>
                  ))}
                </div>
              )}
              {client.nutritionPlan.notes && (
                <p className="text-sm text-neutral-500 italic border-t border-neutral-100 pt-3">{client.nutritionPlan.notes}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">Giorni di Allenamento (Attuale)</h2>
        <div className="flex gap-2">
          {client.workoutPlan.length > 0 && (
            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 text-sm"
            >
              Archivia
            </button>
          )}
          <button
            onClick={() => setIsDayModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Giorno
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {client.workoutPlan.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 border-dashed">
            <Dumbbell className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">Nessun giorno di allenamento.</p>
            <p className="text-neutral-400 text-sm mt-1">Aggiungi un giorno per iniziare a creare la scheda.</p>
          </div>
        ) : (
          client.workoutPlan.map((day) => (
            <div key={day.id} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="bg-neutral-50 p-4 border-b border-neutral-200 flex justify-between items-center">
                <h3 className="font-bold text-neutral-900 text-lg">{day.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openExerciseModal(day.id)}
                    className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Esercizio
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Eliminare ${day.name}?`)) {
                        deleteWorkoutDay(client.id, day.id);
                      }
                    }}
                    className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                {day.exercises.length === 0 ? (
                  <p className="text-neutral-500 text-sm text-center py-4">Nessun esercizio in questo giorno.</p>
                ) : (
                  <div className="space-y-3">
                    {day.exercises.map((workoutEx) => {
                      const exerciseInfo = exercises.find(e => e.id === workoutEx.exerciseId);
                      if (!exerciseInfo) return null;
                      
                      const isCardio = exerciseInfo.muscleGroup === 'Cardio';

                      return (
                        <div key={workoutEx.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-neutral-900">{exerciseInfo.name}</span>
                              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {exerciseInfo.muscleGroup}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-600">
                              {/* Mostriamo Serie/Reps solo se NON è cardio */}
                              {!isCardio && (
                                <>
                                  <span className="flex items-center gap-1"><Repeat className="w-4 h-4" /> {workoutEx.sets}x{workoutEx.reps}</span>
                                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {workoutEx.rest}</span>
                                </>
                              )}
                              {workoutEx.notes && <span className={`${isCardio ? 'text-neutral-600 font-medium' : 'text-neutral-400 italic'}`}>"{workoutEx.notes}"</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteWorkoutExercise(client.id, day.id, workoutEx.id)}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {client.pastPlans && client.pastPlans.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Storico Schede ({client.pastPlans.length}/3)</h2>
          {client.pastPlans.map(plan => (
            <div key={plan.id} className="bg-neutral-50 rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
              <button 
                onClick={() => setExpandedPastPlanId(expandedPastPlanId === plan.id ? null : plan.id)}
                className="w-full p-4 flex justify-between items-center hover:bg-neutral-100 transition-colors focus:outline-none"
              >
                <div className="text-left">
                  <h3 className="font-bold text-neutral-900">{plan.name}</h3>
                  <p className="text-sm text-neutral-500">Archiviata il {new Date(plan.date).toLocaleDateString()}</p>
                </div>
                <div className="text-neutral-400 text-sm font-medium">
                  {expandedPastPlanId === plan.id ? 'Chiudi' : 'Espandi'}
                </div>
              </button>
              
              {expandedPastPlanId === plan.id && (
                <div className="p-4 border-t border-neutral-200 space-y-4">
                  {plan.workoutPlan.map(day => (
                    <div key={day.id} className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                      <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                        <h4 className="font-bold text-neutral-900">{day.name}</h4>
                      </div>
                      <div className="p-3 space-y-2">
                        {day.exercises.length === 0 ? (
                          <p className="text-sm text-neutral-500">Nessun esercizio.</p>
                        ) : (
                          day.exercises.map(workoutEx => {
                            const exerciseInfo = exercises.find(e => e.id === workoutEx.exerciseId);
                            if (!exerciseInfo) return null;
                            const isCardioStorico = exerciseInfo.muscleGroup === 'Cardio';
                            
                            return (
                              <div key={workoutEx.id} className="p-3 bg-neutral-50 rounded-lg flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-neutral-900">{exerciseInfo.name}</div>
                                  <div className="text-xs text-neutral-500 mt-1">
                                    {!isCardioStorico ? (
                                      `${workoutEx.sets}x${workoutEx.reps} • Rec: ${workoutEx.rest}`
                                    ) : (
                                      workoutEx.notes ? `Note: ${workoutEx.notes}` : 'Cardio'
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                  {workoutEx.logs && workoutEx.logs.length > 0 ? (
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      {workoutEx.logs.length} progressi salvati
                                    </span>
                                  ) : (
                                    <span className="text-xs text-neutral-400">
                                      {isCardioStorico ? '' : 'Nessun progresso'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuovo Giorno */}
      {isDayModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-neutral-900">Nuovo Giorno</h2>
              <button onClick={() => { setIsDayModalOpen(false); setNewDayName(''); }} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDay} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Giorno</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newDayName}
                  onChange={(e) => setNewDayName(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="es. Giorno 1 - Petto/Tricipiti"
                />
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => { setIsDayModalOpen(false); setNewDayName(''); }} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors">Aggiungi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Archivia Scheda */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-neutral-900">Archivia Scheda</h2>
              <button onClick={() => { setIsArchiveModalOpen(false); setArchivePlanName(''); }} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleArchivePlan} className="p-5 space-y-4">
              <p className="text-sm text-neutral-500">La scheda attuale verrà salvata nello storico e i giorni verranno svuotati per crearne una nuova.</p>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome Scheda</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={archivePlanName}
                  onChange={(e) => setArchivePlanName(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="es. Scheda Aprile 2026"
                />
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => { setIsArchiveModalOpen(false); setArchivePlanName(''); }} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-neutral-800 text-white font-medium hover:bg-neutral-900 rounded-lg transition-colors">Archivia</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aggiungi Esercizio */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-neutral-900">Aggiungi Esercizio</h2>
              <button onClick={() => setIsExerciseModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddExercise} className="p-5 space-y-4">
              {exercises.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-neutral-500 mb-4">Non ci sono esercizi nel database.</p>
                  <button
                    type="button"
                    onClick={() => setIsExerciseModalOpen(false)}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Chiudi e vai ad aggiungere esercizi
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Seleziona Esercizio</label>
                    <SearchableExerciseSelect
                      exercises={exercises}
                      value={exerciseFormData.exerciseId}
                      onChange={(newId: string) => setExerciseFormData({ ...exerciseFormData, exerciseId: newId })}
                    />
                  </div>
                  
                  {/* NASCONDIAMO I CAMPI SE E' CARDIO */}
                  {!isCardioSelected && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Serie</label>
                          <input
                            type="number"
                            min="1"
                            required={!isCardioSelected}
                            value={exerciseFormData.sets}
                            onChange={(e) => setExerciseFormData({ ...exerciseFormData, sets: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Ripetizioni</label>
                          <input
                            type="number"
                            min="1"
                            required={!isCardioSelected}
                            value={exerciseFormData.reps}
                            onChange={(e) => setExerciseFormData({ ...exerciseFormData, reps: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="es. 10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Recupero (secondi)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            required={!isCardioSelected}
                            value={exerciseFormData.restSeconds}
                            onChange={(e) => setExerciseFormData({ ...exerciseFormData, restSeconds: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 pr-16 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="es. 90"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">sec</span>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {isCardioSelected ? 'Note sull\'esecuzione' : 'Note (Opzionale)'}
                    </label>
                    <input
                      type="text"
                      required={isCardioSelected} // Rendiamo obbligatorio per il cardio se vogliamo
                      value={exerciseFormData.notes}
                      onChange={(e) => setExerciseFormData({ ...exerciseFormData, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={isCardioSelected ? "es. 30 minuti, velocità 6, pendenza 2" : "es. Lento in eccentrica"}
                    />
                  </div>

                  <div className="pt-4 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsExerciseModalOpen(false)}
                      className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Aggiungi
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal Piano Alimentare */}
      {isNutritionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-neutral-900">{client.nutritionPlan ? 'Modifica Piano Alimentare' : 'Nuovo Piano Alimentare'}</h2>
              <button onClick={closeNutritionModal} className="text-neutral-400 hover:text-neutral-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveNutrition} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Titolo</label>
                <input type="text" required value={nutritionForm.title} onChange={(e) => setNutritionForm({ ...nutritionForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="es. Piano Definizione" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Kcal</label>
                  <input type="number" min="0" value={nutritionForm.dailyCalories}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setNutritionForm({ ...nutritionForm, dailyCalories: e.target.value }); }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Prot. (g)</label>
                  <input type="number" min="0" value={nutritionForm.dailyProtein}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setNutritionForm({ ...nutritionForm, dailyProtein: e.target.value }); }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Carb. (g)</label>
                  <input type="number" min="0" value={nutritionForm.dailyCarbs}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setNutritionForm({ ...nutritionForm, dailyCarbs: e.target.value }); }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Grassi (g)</label>
                  <input type="number" min="0" value={nutritionForm.dailyFat}
                    onChange={(e) => { if (e.target.value.includes('-')) return; setNutritionForm({ ...nutritionForm, dailyFat: e.target.value }); }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-neutral-700">Pasti</label>
                  <button type="button" onClick={addMeal} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Aggiungi Pasto
                  </button>
                </div>
                {nutritionForm.meals.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-neutral-300 rounded-xl text-neutral-400 text-sm">Nessun pasto configurato</div>
                ) : (
                  <div className="space-y-3">
                    {nutritionForm.meals.map((meal) => (
                      <div key={meal.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <input type="text" value={meal.name} onChange={(e) => updateMeal(meal.id, 'name', e.target.value)}
                            placeholder="es. Colazione" className="flex-1 px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                          <input type="time" value={meal.time || ''} onChange={(e) => updateMeal(meal.id, 'time', e.target.value)}
                            className="w-28 px-2 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                          <button type="button" onClick={() => removeMeal(meal.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                        <textarea value={meal.items} onChange={(e) => updateMeal(meal.id, 'items', e.target.value)} rows={2}
                          placeholder="es. Petto di pollo 150g, riso 80g, verdure"
                          className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Note</label>
                <textarea value={nutritionForm.notes} onChange={(e) => setNutritionForm({ ...nutritionForm, notes: e.target.value })} rows={2}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Note aggiuntive per il cliente..." />
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={closeNutritionModal} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};