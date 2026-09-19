import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseEnabled } from './supabase';

export type Role = 'owner' | 'trainer' | 'staff' | 'client';

export interface Profile {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
}

interface AuthState {
  /** true finché non sappiamo se c'è una sessione */
  loading: boolean;
  /** true mentre stiamo leggendo ruolo e anagrafica dell'utente collegato */
  profileLoading: boolean;
  session: Session | null;
  profile: Profile | null;
  /** id della riga in `clients`, valorizzato solo per i clienti */
  clientId: string | null;
  /** l'utente è arrivato da un link di recupero password */
  recoveryMode: boolean;
  loadError: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/** I messaggi di Supabase sono in inglese: quelli che l'utente può incontrare li traduciamo. */
function traduciErrore(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email o password non corretti.';
  if (m.includes('email not confirmed')) {
    return 'Devi prima confermare la registrazione dal link che ti è arrivato via email.';
  }
  if (m.includes('user already registered')) {
    return 'Questa email è già registrata. Accedi, oppure usa "Password dimenticata".';
  }
  if (m.includes('password should be at least')) {
    return 'La password deve essere di almeno 6 caratteri.';
  }
  if (m.includes('email rate limit') || m.includes('rate limit')) {
    return 'Troppi tentativi ravvicinati. Riprova tra qualche minuto.';
  }
  if (m.includes('database error saving new user')) {
    // Rete di sicurezza del trigger, quando l'hook di registrazione non è attivo.
    return 'Questa email non risulta nel gestionale della palestra. Chiedi in segreteria di essere aggiunto, poi riprova.';
  }
  return message;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sessione iniziale e aggiornamenti successivi (login, logout, refresh del token).
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        setClientId(null);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Chi è l'utente collegato: ruolo e, per i clienti, la riga di anagrafica.
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (!supabase || !userId) return;

    let annullato = false;
    (async () => {
      setLoadError(null);
      const { data, error } = await supabase!
        .from('profiles')
        .select('id, role, full_name, email')
        .eq('id', userId)
        .maybeSingle();

      if (annullato) return;

      if (error) {
        setLoadError('Non riesco a leggere il tuo profilo: ' + error.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setLoadError('Il tuo account non ha un profilo associato. Contatta la segreteria.');
        setLoading(false);
        return;
      }

      const p: Profile = {
        id: data.id,
        role: data.role as Role,
        fullName: data.full_name ?? '',
        email: data.email,
      };
      setProfile(p);

      if (p.role === 'client') {
        const { data: row } = await supabase!
          .from('clients')
          .select('id')
          .eq('profile_id', userId)
          .maybeSingle();
        if (!annullato) setClientId(row?.id ?? null);
      } else {
        setClientId(null);
      }

      if (!annullato) setLoading(false);
    })();

    return () => {
      annullato = true;
    };
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase non configurato.' };
    // Niente loading globale qui: smonterebbe il form di accesso e con lui il messaggio
    // di errore. Il passaggio di schermata lo decide la comparsa della sessione.
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: traduciErrore(error.message) };
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!supabase) return { error: 'Supabase non configurato.' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: traduciErrore(error.message) };
    // Con la conferma via email attiva, l'utente esiste ma la sessione arriva dopo il click.
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setRecoveryMode(false);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Supabase non configurato.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) return { error: traduciErrore(error.message) };
    return {};
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) return { error: 'Supabase non configurato.' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: traduciErrore(error.message) };
    setRecoveryMode(false);
    return {};
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading: isSupabaseEnabled ? loading : false,
        profileLoading: Boolean(session) && !profile && !loadError,
        session,
        profile,
        clientId,
        recoveryMode,
        loadError,
        signIn,
        signUp,
        signOut,
        sendPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve stare dentro AuthProvider');
  return ctx;
};

/** Chi vede il lato gestore. */
export const isStaffRole = (role?: Role | null) =>
  role === 'owner' || role === 'trainer' || role === 'staff';
