/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider } from './store';
import { Dashboard } from './components/Dashboard';
import { ClientAuth } from './components/ClientAuth';
import { ClientDashboard } from './components/ClientDashboard';

type AuthState = { type: 'manager' } | { type: 'client', clientId: string } | null;

export default function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('gym_auth');
    return saved ? JSON.parse(saved) : null;
  });

  const handleManagerLogin = () => {
    const state = { type: 'manager' as const };
    setAuth(state);
    localStorage.setItem('gym_auth', JSON.stringify(state));
  };

  const handleClientLogin = (clientId: string) => {
    const state = { type: 'client' as const, clientId };
    setAuth(state);
    localStorage.setItem('gym_auth', JSON.stringify(state));
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem('gym_auth');
  };

  return (
    <AppProvider>
      {auth?.type === 'manager' && <Dashboard onLogout={handleLogout} />}
      {auth?.type === 'client' && <ClientDashboard clientId={auth.clientId} onLogout={handleLogout} />}
      {auth === null && (
        <ClientAuth
          onLogin={handleClientLogin}
          onManagerLogin={handleManagerLogin}
        />
      )}
    </AppProvider>
  );
}
