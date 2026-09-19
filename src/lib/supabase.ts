import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Finché le variabili non sono configurate l'app continua a funzionare
 * sui dati locali: così lo sviluppo e la demo non si bloccano.
 */
export const isSupabaseEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Come `supabase`, ma solleva invece di restituire null: per i punti che lo richiedono. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase non configurato: imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
