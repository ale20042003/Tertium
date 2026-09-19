import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import vertiumLogo from '../assets/vertium-logo-full.jpg';

type Mode = 'login' | 'register' | 'forgot';

const inputClass =
  'w-full bg-brand-900/50 border border-brand-700/60 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all';

const Sfondo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-brand-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img
        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920"
        className="w-full h-full object-cover opacity-30"
        alt=""
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/85 to-brand-900/50" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-800/30 via-transparent to-transparent" />
    </div>
    <div className="relative z-10 w-full max-w-md">
      <div className="text-center mb-10">
        <img
          src={vertiumLogo}
          alt="Vertium Fit Club"
          className="h-28 w-auto mx-auto rounded-2xl shadow-2xl mb-6"
        />
      </div>
      {children}
    </div>
  </div>
);

const Bottone: React.FC<{ busy: boolean; children: React.ReactNode }> = ({ busy, children }) => (
  <button
    type="submit"
    disabled={busy}
    className="w-full bg-brand-950 text-white font-bold text-lg py-4 rounded-2xl border border-brand-400/40 shadow-lg shadow-brand-500/20 hover:bg-brand-800 hover:border-brand-400/70 transition-colors flex items-center justify-center gap-2 mt-8 disabled:opacity-60"
  >
    {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
    {children}
    {!busy && <ArrowRight className="w-5 h-5" />}
  </button>
);

/** Schermata di accesso, registrazione e recupero password. */
export const AuthScreen: React.FC = () => {
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const cambiaModo = (m: Mode) => {
    setMode(m);
    setError('');
    setInfo('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
      // In caso di successo ci pensa il provider a cambiare schermata.
    } else if (mode === 'register') {
      const { error, needsConfirmation } = await signUp(email, password, name);
      if (error) setError(error);
      else if (needsConfirmation) {
        setInfo(
          'Ti abbiamo inviato una email di conferma: apri il link per attivare l\'account, poi torna qui e accedi.',
        );
      }
    } else {
      const { error } = await sendPasswordReset(email);
      if (error) setError(error);
      else {
        setInfo(
          'Se l\'indirizzo è registrato, ti arriverà una email con il link per impostare una nuova password.',
        );
      }
    }

    setBusy(false);
  };

  return (
    <Sfondo>
      <p className="text-neutral-400 text-center -mt-4 mb-8">
        {mode === 'login' && 'Accedi al tuo account'}
        {mode === 'register' && 'Crea il tuo account'}
        {mode === 'forgot' && 'Recupera la password'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="bg-brand-900/50 border border-brand-400/30 text-brand-300 p-4 rounded-xl text-sm mb-6 text-center">
            Usa la mail che hai comunicato in palestra: la registrazione è consentita solo a
            clienti e personale già in anagrafica.
          </div>
        )}

        {mode === 'register' && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome e cognome"
              className={inputClass}
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClass}
          />
        </div>

        {mode !== 'forgot' && (
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Password (min. 6 caratteri)' : 'Password'}
              className={inputClass}
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {info && (
          <p className="text-emerald-300 text-sm text-center flex items-start gap-2 justify-center">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{info}</span>
          </p>
        )}

        <Bottone busy={busy}>
          {mode === 'login' && 'Accedi'}
          {mode === 'register' && 'Registrati'}
          {mode === 'forgot' && 'Invia link di recupero'}
        </Bottone>
      </form>

      <div className="mt-8 text-center space-y-3">
        {mode === 'login' && (
          <>
            <button
              onClick={() => cambiaModo('forgot')}
              className="block w-full text-neutral-400 hover:text-white transition-colors"
            >
              Password dimenticata?
            </button>
            <button
              onClick={() => cambiaModo('register')}
              className="block w-full text-neutral-400 hover:text-white transition-colors"
            >
              Non hai un account? Registrati
            </button>
          </>
        )}
        {mode !== 'login' && (
          <button
            onClick={() => cambiaModo('login')}
            className="block w-full text-neutral-400 hover:text-white transition-colors"
          >
            Torna all'accesso
          </button>
        )}
      </div>
    </Sfondo>
  );
};

/** Mostrata quando si arriva dal link di recupero password. */
export const NewPasswordScreen: React.FC = () => {
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await updatePassword(password);
    if (error) setError(error);
    setBusy(false);
  };

  return (
    <Sfondo>
      <p className="text-neutral-400 text-center -mt-4 mb-8">Scegli una nuova password</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nuova password (min. 6 caratteri)"
            className={inputClass}
          />
        </div>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <Bottone busy={busy}>Salva password</Bottone>
      </form>
      <div className="mt-8 text-center">
        <button
          onClick={signOut}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          Annulla
        </button>
      </div>
    </Sfondo>
  );
};
