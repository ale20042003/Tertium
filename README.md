# Tertium Fit Club

Web app per la gestione di una palestra: clienti, staff, corsi, schede di allenamento e comunicazioni.
Due tipi di accesso: **gestore** (titolare, personal trainer, segreteria) e **cliente**.

## Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Recharts (grafici progressi)
- vite-plugin-pwa (installabile su telefono, funziona offline)
- Hosting: Netlify — Backend: Supabase (in corso di integrazione)

## Avvio in locale

**Prerequisiti:** Node.js 22+

```
npm install
npm run dev
```

## Script disponibili

- `npm run dev` — server di sviluppo su http://localhost:3000
- `npm run build` — build di produzione in `dist/` (genera anche manifest e service worker)
- `npm run preview` — anteprima locale della build di produzione
- `npm run lint` — type-check con TypeScript
- `npm run clean` — rimuove la cartella `dist/`

## Variabili d'ambiente

Copia `.env.example` in `.env` e compila i valori. Le stesse variabili vanno impostate
su Netlify (Site configuration → Environment variables).

| Variabile | A cosa serve |
| --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Connessione al backend: senza, l'app non parte |

> Le variabili `VITE_*` vengono incluse nel bundle JavaScript: sono pubbliche.
> Non metterci mai la `service_role` key di Supabase.

## Deploy su Netlify

La configurazione sta in [`netlify.toml`](netlify.toml): build `npm run build`, publish `dist`,
redirect SPA su `index.html`, header di sicurezza e cache.
Collegando il repo GitHub, ogni push su `main` fa un deploy.

## PWA

L'app è installabile da browser (Aggiungi a schermata Home) e apre a schermo intero.
Icone in `public/icons/`, manifest generato da `vite.config.ts`.
Il service worker si aggiorna da solo al deploy successivo (`registerType: 'autoUpdate'`).

## Accesso

Non esiste un login "gestore" separato: tutti usano la stessa schermata, e il ruolo decide
dove si finisce dopo l'accesso.

- **Registrazione consentita solo a chi è già in anagrafica.** Il controllo è server-side,
  nell'hook `before-user-created` (`hook_restrict_signup_to_known_emails`): se la mail non è
  fra i clienti o il personale attivo, l'utente non viene creato. Il trigger
  `private.handle_new_user` ripete il controllo, così il gate regge anche se l'hook viene
  disattivato per sbaglio.
- **Ruolo assegnato in automatico** alla creazione dell'account: chi è in `staff` con una
  mansione che contiene "trainer" o "istruttore" diventa `trainer`, il resto del personale
  `staff`, chi è in `clients` diventa `client`. Il ruolo `owner` si assegna a mano.
  Se una mail compare in entrambe le anagrafiche, vince il personale.
- **Instradamento**: `owner`, `trainer` e `staff` entrano nel lato gestore, `client` nel
  proprio. Il profilo viene collegato alla riga di anagrafica (`profile_id`), che è ciò che
  permette al cliente di vedere i propri dati e nient'altro.
- **Sessione persistente**: si resta collegati anche chiudendo il browser, il token si
  rinnova da solo.
- **Conferma email e recupero password** passano da Supabase Auth. I link puntano al
  *Site URL* configurato nel progetto, che va tenuto allineato al dominio pubblicato.

Il servizio email integrato di Supabase ha un limite basso (poche mail all'ora) ed è pensato
per lo sviluppo: prima di aprire le registrazioni ai clienti veri va configurato un SMTP
proprio in *Authentication → Emails*.

## Backend

Progetto Supabase `Tertium` (`dmguwgtkeydedrrvaxfh`, regione `eu-west-1`), con schema
già applicato — vedi `supabase/migrations/`:

- `0001_init.sql` — tabelle, ruoli (`owner`, `trainer`, `staff`, `client`) e row level security
- `0002_exercise_videos_bucket.sql` — bucket privato per i video degli esercizi
- `0003_private_helpers.sql` — sposta le funzioni `SECURITY DEFINER` fuori dallo schema esposto
- `0004_signup_gate_and_role_assignment.sql` — gate sulle registrazioni e assegnazione del ruolo

Le regole di accesso in breve: lo staff lavora su tutto, il titolare è l'unico che tocca
anagrafica staff, ruoli e impostazioni, il cliente vede solo la propria scheda, le proprie
misure, il proprio piano alimentare e le proprie prenotazioni.

Su Supabase stanno **account, clienti e personale**. Schede, misure, piani alimentari, corsi,
prenotazioni, esercizi e impostazioni sono ancora in `localStorage`: la migrazione dello store
è a metà, e per ora quei dati restano legati al singolo browser. Quando lo sarà, i dati esistenti si portano su con:

```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-backup.mjs backup.json --dry-run
```

Togli `--dry-run` per scrivere davvero. La `service_role` key sta solo nel terminale: mai nel
frontend, mai nel repository.
