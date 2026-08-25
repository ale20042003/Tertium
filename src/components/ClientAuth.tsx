import React, { useState } from 'react';
import { Dumbbell, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAppContext } from '../store';

export const ClientAuth: React.FC<{ onLogin: (clientId: string) => void, onManagerLogin: () => void, onStaffLogin: (staffId: string) => void }> = ({ onLogin, onManagerLogin, onStaffLogin }) => {
  const { clients, registerClient, staff } = useAppContext();
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

      const staffMember = staff.find(s => s.accountEnabled && s.email.toLowerCase() === email.toLowerCase());
      if (staffMember) {
        if (staffMember.password !== password) {
          setError('Credenziali non valide.');
          return;
        }
        onStaffLogin(staffMember.id);
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
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920" className="w-full h-full object-cover opacity-20" alt="Gym" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="bg-lime-400 p-4 rounded-full inline-block mb-6">
            <Dumbbell className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Gym App</h1>
          <p className="text-neutral-400">
            {isRegistering ? 'Crea il tuo account per vedere la scheda' : 'Accedi per vedere i tuoi allenamenti'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="bg-neutral-900/50 border border-lime-400/30 text-lime-400 p-4 rounded-xl text-sm mb-6 text-center">
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
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all"
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
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-lime-400 text-black font-bold text-lg py-4 rounded-2xl hover:bg-lime-500 transition-colors flex items-center justify-center gap-2 mt-8"
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
