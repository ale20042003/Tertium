import { useCallback, useEffect, useRef } from 'react';
import { StaffMember } from '../types';
import { useLocalStorageState } from './useLocalStorageState';
import { supabase } from '../lib/supabase';
import { descriviErrore } from '../lib/errors';

type Riga = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  hourly_rate: number | null;
  hire_date: string | null;
  notes: string | null;
};

const daRiga = (r: Riga): StaffMember => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone ?? undefined,
  role: r.role,
  active: r.active,
  hourlyRate: r.hourly_rate ?? undefined,
  hireDate: r.hire_date ?? undefined,
  notes: r.notes ?? undefined,
});

const aRiga = (s: StaffMember) => ({
  id: s.id,
  name: s.name,
  email: s.email,
  phone: s.phone || null,
  role: s.role,
  active: s.active,
  hourly_rate: s.hourlyRate ?? null,
  hire_date: s.hireDate || null,
  notes: s.notes || null,
});

/**
 * @param sincronizza true quando l'utente collegato è personale: solo allora
 * le policy permettono di leggere e scrivere l'anagrafica staff.
 */
export function useStaff(sincronizza: boolean) {
  const [staff, setStaff] = useLocalStorageState<StaffMember[]>('gym_staff', []);
  const attivo = Boolean(supabase) && sincronizza;

  // Serve dentro ricarica senza rientrare nelle sue dipendenze.
  const staffRef = useRef(staff);
  staffRef.current = staff;

  const ricarica = useCallback(async () => {
    if (!supabase || !attivo) return;
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, email, phone, role, active, hourly_rate, hire_date, notes')
      .order('name');
    if (error) {
      console.error('Lettura personale fallita:', error.message);
      return;
    }
    if (!data) return;

    // Come per i clienti: chi esiste solo in locale viene caricato, non cancellato.
    const emailRemote = new Set(data.map(r => r.email.toLowerCase()));
    const soloLocali = staffRef.current.filter(
      s => s.email && !emailRemote.has(s.email.toLowerCase()),
    );
    if (soloLocali.length > 0) {
      const { error: erroreCaricamento } = await supabase.from('staff').insert(soloLocali.map(aRiga));
      if (erroreCaricamento) {
        console.error('Caricamento personale locale fallito:', erroreCaricamento.message);
        return;
      }
    }

    setStaff([...data.map(daRiga), ...soloLocali].sort((a, b) => a.name.localeCompare(b.name)));
  }, [attivo, setStaff]);

  useEffect(() => { void ricarica(); }, [ricarica]);

  const addStaff = async (data: Omit<StaffMember, 'id'>) => {
    const nuovo: StaffMember = { ...data, id: crypto.randomUUID() };
    if (supabase && attivo) {
      const { error } = await supabase.from('staff').insert(aRiga(nuovo));
      if (error) throw new Error(descriviErrore(error.message));
    }
    setStaff(prev => [...prev, nuovo]);
  };

  const updateStaff = async (updated: StaffMember) => {
    if (supabase && attivo) {
      const { id, ...campi } = aRiga(updated);
      const { error } = await supabase.from('staff').update(campi).eq('id', id);
      if (error) throw new Error(descriviErrore(error.message));
    }
    setStaff(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteStaff = async (id: string) => {
    if (supabase && attivo) {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) {
        console.error('Eliminazione personale fallita:', error.message);
        await ricarica();
        return;
      }
    }
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  return { staff, addStaff, updateStaff, deleteStaff };
}
