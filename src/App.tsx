/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { AppProvider } from './store';
import { AuthProvider, useAuth, isStaffRole } from './lib/auth';
import { isSupabaseEnabled } from './lib/supabase';
import { Dashboard } from './components/Dashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { AuthScreen, NewPasswordScreen } from './components/AuthScreen';

const Schermata: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-brand-950 text-white flex items-center justify-center p-6 text-center">
    <div className="max-w-md space-y-4">{children}</div>
  </div>
);

const Errore: React.FC<{ testo: string; onLogout?: () => void }> = ({ testo, onLogout }) => (
  <Schermata>
    <AlertTriangle className="w-10 h-10 mx-auto text-amber-400" />
    <p className="text-neutral-300">{testo}</p>
    {onLogout && (
      <button
        onClick={onLogout}
        className="text-neutral-400 hover:text-white underline underline-offset-4"
      >
        Esci
      </button>
    )}
  </Schermata>
);

const Contenuto: React.FC = () => {
  const { loading, profileLoading, session, profile, clientId, recoveryMode, loadError, signOut } =
    useAuth();

  if (!isSupabaseEnabled) {
    return (
      <Errore testo="Connessione al database non configurata: mancano VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY." />
    );
  }

  // Il link di recupero password apre una sessione: prima di tutto si sceglie la nuova password.
  if (recoveryMode) return <NewPasswordScreen />;

  if (loading) {
    return (
      <Schermata>
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-brand-300" />
      </Schermata>
    );
  }

  if (!session) return <AuthScreen />;

  if (loadError) return <Errore testo={loadError} onLogout={signOut} />;

  if (profileLoading) {
    return (
      <Schermata>
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-brand-300" />
      </Schermata>
    );
  }

  if (isStaffRole(profile?.role)) {
    return (
      <AppProvider>
        <Dashboard onLogout={signOut} viewer={{ type: 'manager' }} />
      </AppProvider>
    );
  }

  if (profile?.role === 'client') {
    if (!clientId) {
      return (
        <Errore
          testo="Il tuo account non risulta collegato a una scheda cliente. Chiedi in segreteria di verificare l'anagrafica."
          onLogout={signOut}
        />
      );
    }
    return (
      <AppProvider>
        <ClientDashboard clientId={clientId} onLogout={signOut} />
      </AppProvider>
    );
  }

  return <Errore testo="Il tuo account non ha un ruolo assegnato." onLogout={signOut} />;
};

export default function App() {
  return (
    <AuthProvider>
      <Contenuto />
    </AuthProvider>
  );
}
