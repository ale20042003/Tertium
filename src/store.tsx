import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client, Exercise, WorkoutDay, WorkoutExercise, ExerciseLog, BodyMeasurement, NutritionPlan } from './types';
import { useStaff } from './store/useStaff';
import { useRooms } from './store/useRooms';
import { useClasses } from './store/useClasses';
import { useGymSettings } from './store/useGymSettings';
import { useAnnouncements } from './store/useAnnouncements';
import { supabase } from './lib/supabase';
import { useAuth, isStaffRole } from './lib/auth';
import { descriviErrore } from './lib/errors';

interface AppState extends
  ReturnType<typeof useStaff>,
  ReturnType<typeof useRooms>,
  ReturnType<typeof useClasses>,
  ReturnType<typeof useGymSettings>,
  ReturnType<typeof useAnnouncements> {
  clients: Client[];
  exercises: Exercise[];
  addClient: (client: Omit<Client, 'id' | 'workoutPlan'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addExercise: (exercise: Omit<Exercise, 'id'>) => void;
  updateExercise: (exercise: Exercise) => void;
  deleteExercise: (id: string) => void;
  addWorkoutDay: (clientId: string, dayName: string) => void;
  deleteWorkoutDay: (clientId: string, dayId: string) => void;
  addWorkoutExercise: (clientId: string, dayId: string, exercise: Omit<WorkoutExercise, 'id'>) => void;
  deleteWorkoutExercise: (clientId: string, dayId: string, exerciseId: string) => void;
  addExerciseLog: (clientId: string, dayId: string, exerciseId: string, log: Omit<ExerciseLog, 'id'>) => void;
  deleteExerciseLog: (clientId: string, dayId: string, exerciseId: string, logId: string) => void;
  archiveWorkoutPlan: (clientId: string, planName: string) => void;
  addBodyMeasurement: (clientId: string, measurement: Omit<BodyMeasurement, 'id' | 'date'>) => void;
  deleteBodyMeasurement: (clientId: string, measurementId: string) => void;
  saveCustomPlan: (clientId: string, days: WorkoutDay[]) => void;
  updateNutritionPlan: (clientId: string, plan: NutritionPlan) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('gym_clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const saved = localStorage.getItem('gym_exercises');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Panca Piana', muscleGroup: 'Petto' },
      { id: '2', name: 'Squat', muscleGroup: 'Gambe' },
      { id: '3', name: 'Stacco da Terra', muscleGroup: 'Schiena' },
      { id: '4', name: 'Trazioni', muscleGroup: 'Schiena' },
      { id: '5', name: 'Lento Avanti', muscleGroup: 'Spalle' },
    ];
  });

  // Solo il personale vede l'elenco completo: per un cliente le policy restituirebbero
  // la sola riga sua, e sovrascriverebbe la copia locale del gestionale.
  const { profile } = useAuth();
  const sincronizza = Boolean(supabase) && isStaffRole(profile?.role);

  // Serve dentro ricaricaClienti senza rientrare nelle dipendenze del callback.
  const clientiRef = React.useRef(clients);
  clientiRef.current = clients;

  const ricaricaClienti = React.useCallback(async () => {
    if (!supabase || !sincronizza) return;
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone, birth_date')
      .order('name');
    if (error || !data) {
      if (error) console.error('Lettura clienti fallita:', error.message);
      return;
    }

    // Alla prima sincronizzazione i clienti inseriti prima di Supabase esistono solo in
    // locale: vanno caricati, altrimenti la lettura appena fatta li cancellerebbe.
    const emailRemote = new Set(data.map(r => r.email.toLowerCase()));
    const soloLocali = clientiRef.current.filter(
      c => c.email && !emailRemote.has(c.email.toLowerCase()),
    );
    if (soloLocali.length > 0) {
      const { error: erroreCaricamento } = await supabase.from('clients').insert(
        soloLocali.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || null,
          birth_date: c.birthDate || null,
        })),
      );
      if (erroreCaricamento) {
        // Meglio tenerseli in locale che perderli: non tocchiamo lo stato.
        console.error('Caricamento clienti locali fallito:', erroreCaricamento.message);
        return;
      }
    }

    setClients(precedenti => {
      const perId = new Map(precedenti.map(c => [c.id, c]));
      const remoti = data.map(riga => {
        // Scheda, misure e piano alimentare non sono ancora su Supabase:
        // restano sulla copia locale finché non si migra anche quella parte.
        const locale = perId.get(riga.id);
        return {
          id: riga.id,
          name: riga.name,
          email: riga.email,
          phone: riga.phone ?? undefined,
          birthDate: riga.birth_date ?? undefined,
          workoutPlan: locale?.workoutPlan ?? [],
          pastPlans: locale?.pastPlans ?? [],
          measurements: locale?.measurements ?? [],
          nutritionPlan: locale?.nutritionPlan,
        };
      });
      return [...remoti, ...soloLocali].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, [sincronizza]);

  useEffect(() => { void ricaricaClienti(); }, [ricaricaClienti]);

  const staffStore = useStaff(sincronizza);
  const roomsStore = useRooms();
  const classesStore = useClasses();
  const gymSettingsStore = useGymSettings();
  const announcementsStore = useAnnouncements();

  useEffect(() => {
    localStorage.setItem('gym_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('gym_exercises', JSON.stringify(exercises));
  }, [exercises]);

  const addClient = async (clientData: Omit<Client, 'id' | 'workoutPlan' | 'pastPlans' | 'measurements'>) => {
    const newClient: Client = {
      ...clientData,
      id: crypto.randomUUID(),
      workoutPlan: [],
      pastPlans: [],
      measurements: [],
    };
    if (supabase && sincronizza) {
      const { error } = await supabase.from('clients').insert({
        id: newClient.id,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone || null,
        birth_date: newClient.birthDate || null,
      });
      if (error) throw new Error(descriviErrore(error.message));
    }
    setClients([...clients, newClient]);
  };

  const updateClient = async (updatedClient: Client) => {
    if (supabase && sincronizza) {
      const { error } = await supabase.from('clients').update({
        name: updatedClient.name,
        email: updatedClient.email,
        phone: updatedClient.phone || null,
        birth_date: updatedClient.birthDate || null,
      }).eq('id', updatedClient.id);
      if (error) throw new Error(descriviErrore(error.message));
    }
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const deleteClient = async (id: string) => {
    if (supabase && sincronizza) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
        console.error('Eliminazione cliente fallita:', error.message);
        await ricaricaClienti();
        return;
      }
    }
    setClients(clients.filter(c => c.id !== id));
  };

  const addExercise = (exerciseData: Omit<Exercise, 'id'>) => {
    const newExercise: Exercise = {
      ...exerciseData,
      id: crypto.randomUUID(),
    };
    setExercises([...exercises, newExercise]);
  };

  const updateExercise = (updatedExercise: Exercise) => {
    setExercises(exercises.map(e => e.id === updatedExercise.id ? updatedExercise : e));
  };

  const deleteExercise = (id: string) => {
    const exercise = exercises.find(e => e.id === id);
    setExercises(exercises.filter(e => e.id !== id));
    
    if (exercise?.videoUrl?.startsWith('localforage:')) {
      import('localforage').then(localforage => {
        localforage.default.removeItem(exercise.videoUrl!).catch(err => {
          console.error('Error removing video:', err);
        });
      });
    }
  };

  const addWorkoutDay = (clientId: string, dayName: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          workoutPlan: [...c.workoutPlan, { id: crypto.randomUUID(), name: dayName, exercises: [] }]
        };
      }
      return c;
    }));
  };

  const deleteWorkoutDay = (clientId: string, dayId: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          workoutPlan: c.workoutPlan.filter(d => d.id !== dayId)
        };
      }
      return c;
    }));
  };

  const addWorkoutExercise = (clientId: string, dayId: string, exerciseData: Omit<WorkoutExercise, 'id'>) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          workoutPlan: c.workoutPlan.map(d => {
            if (d.id === dayId) {
              return {
                ...d,
                exercises: [...d.exercises, { ...exerciseData, id: crypto.randomUUID() }]
              };
            }
            return d;
          })
        };
      }
      return c;
    }));
  };

  const deleteWorkoutExercise = (clientId: string, dayId: string, exerciseId: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          workoutPlan: c.workoutPlan.map(d => {
            if (d.id === dayId) {
              return {
                ...d,
                exercises: d.exercises.filter(e => e.id !== exerciseId)
              };
            }
            return d;
          })
        };
      }
      return c;
    }));
  };

  const addExerciseLog = (clientId: string, dayId: string, exerciseId: string, log: Omit<ExerciseLog, 'id'>) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          workoutPlan: c.workoutPlan.map(d => {
            if (d.id === dayId) {
              return {
                ...d,
                exercises: d.exercises.map(e => {
                  if (e.id === exerciseId) {
                    const existingLogs = e.logs || [];
                    const existingLogIndex = existingLogs.findIndex(l => l.week === log.week);
                    
                    let newLogs;
                    if (existingLogIndex >= 0) {
                      newLogs = [...existingLogs];
                      newLogs[existingLogIndex] = { ...newLogs[existingLogIndex], weight: log.weight, date: log.date };
                    } else {
                      newLogs = [...existingLogs, { ...log, id: crypto.randomUUID() }];
                    }
                    
                    return {
                      ...e,
                      logs: newLogs
                    };
                  }
                  return e;
                })
              };
            }
            return d;
          })
        };
      }
      return c;
    }));
  };

  const deleteExerciseLog = (clientId: string, dayId: string, exerciseId: string, logId: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          workoutPlan: c.workoutPlan.map(d => {
            if (d.id === dayId) {
              return {
                ...d,
                exercises: d.exercises.map(e => {
                  if (e.id === exerciseId) {
                    return {
                      ...e,
                      logs: (e.logs || []).filter(l => l.id !== logId)
                    };
                  }
                  return e;
                })
              };
            }
            return d;
          })
        };
      }
      return c;
    }));
  };

  const archiveWorkoutPlan = (clientId: string, planName: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId && c.workoutPlan.length > 0) {
        const newPastPlan = {
          id: crypto.randomUUID(),
          name: planName,
          date: new Date().toISOString(),
          workoutPlan: [...c.workoutPlan]
        };
        const updatedPastPlans = [newPastPlan, ...(c.pastPlans || [])].slice(0, 3);
        return {
          ...c,
          workoutPlan: [],
          pastPlans: updatedPastPlans
        };
      }
      return c;
    }));
  };

  const addBodyMeasurement = (clientId: string, measurementData: Omit<BodyMeasurement, 'id' | 'date'>) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          measurements: [
            { ...measurementData, id: crypto.randomUUID(), date: new Date().toISOString() },
            ...(c.measurements || [])
          ]
        };
      }
      return c;
    }));
  };

  const deleteBodyMeasurement = (clientId: string, measurementId: string) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          measurements: (c.measurements || []).filter(m => m.id !== measurementId)
        };
      }
      return c;
    }));
  };

  const saveCustomPlan = (clientId: string, days: WorkoutDay[]) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        let updatedPastPlans = c.pastPlans || [];
        if (c.workoutPlan && c.workoutPlan.length > 0) {
          const archivedPlan = {
            id: crypto.randomUUID(),
            name: 'Scheda Precedente del ' + new Date().toLocaleDateString('it-IT'),
            date: new Date().toISOString(),
            workoutPlan: [...c.workoutPlan]
          };
          // FIX: limite a 3 schede archiviate, come in archiveWorkoutPlan
          updatedPastPlans = [archivedPlan, ...updatedPastPlans].slice(0, 3);
        }
        return {
          ...c,
          workoutPlan: days.map(day => ({
            ...day,
            exercises: day.exercises.map(ex => ({
              ...ex,
              logs: ex.logs ?? [],
             }))
          })),
          pastPlans: updatedPastPlans
        };
      }
      return c;
    }));
  };

  const updateNutritionPlan = (clientId: string, plan: NutritionPlan) => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return { ...c, nutritionPlan: plan };
      }
      return c;
    }));
  };

  return (
    <AppContext.Provider value={{
      clients, exercises,
      addClient, updateClient, deleteClient,
      addExercise, updateExercise, deleteExercise,
      addWorkoutDay, deleteWorkoutDay,
      addWorkoutExercise, deleteWorkoutExercise,
      addExerciseLog, deleteExerciseLog, archiveWorkoutPlan,
      addBodyMeasurement, deleteBodyMeasurement,
      saveCustomPlan, updateNutritionPlan,
      ...staffStore,
      ...roomsStore,
      ...classesStore,
      ...gymSettingsStore,
      ...announcementsStore,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};