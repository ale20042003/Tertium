import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAppContext } from '../store';
import vertiumLogo from '../assets/vertium-logo-full.jpg';

export const ClientAuth: React.FC<{ onLogin: (clientId: string) => void, onManagerLogin: () => void }> = ({ onLogin, onManagerLogin }) => {
  const { clients, registerClient } = useAppContext();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      const result = registerClient(email, password);
      if (result.success && result.clientId) {
        onLogin(result.clientId);
      } else {
        setError(result.error || 'Errore durante la registrazione');
      }
    } else {
      // Login logic
      if (email === 'admin' && password === 'admin') {
        onManagerLogin();
        return;
      }

      const client = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
      if (!client) {
        setError('Credenziali non valide.');
        return;
      }
      if (!client.isRegistered) {
        setError('Account non registrato. Passa alla registrazione.');
        return;
      }
      if (client.password !== password) {
        setError('Credenziali non valide.');
        return;
      }
      onLogin(client.id);
    }
  };

  return (
    <div className="min-h-screen bg-brand-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920" className="w-full h-full object-cover opacity-30" alt="Gym" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/85 to-brand-900/50" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800/30 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <img src={vertiumLogo} alt="Vertium Fit Club" className="h-28 w-auto mx-auto rounded-2xl shadow-2xl mb-6" />
          <p className="text-neutral-400">
            {isRegistering ? 'Crea il tuo account per vedere la scheda' : 'Accedi per vedere i tuoi allenamenti'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="bg-brand-900/50 border border-brand-400/30 text-brand-300 p-4 rounded-xl text-sm mb-6 text-center">
              Inserisci la mail che hai comunicato in palestra per registrarti.
            </div>
          )}

          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email o Username"
                className="w-full bg-brand-900/50 border border-brand-700/60 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-brand-900/50 border border-brand-700/60 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-brand-950 text-white font-bold text-lg py-4 rounded-2xl border border-brand-400/40 shadow-lg shadow-brand-500/20 hover:bg-brand-800 hover:border-brand-400/70 transition-colors flex items-center justify-center gap-2 mt-8"
          >
            {isRegistering ? 'Registrati' : 'Accedi'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </button>
        </div>
      </div>
    </div>
  );
};
