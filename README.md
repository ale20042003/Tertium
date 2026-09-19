# Vertium Fit Club

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
| `VITE_MANAGER_USER` / `VITE_MANAGER_PASSWORD` | Credenziali gestore, soluzione temporanea fino all'auth Supabase |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Connessione al backend |

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

## Backend

Progetto Supabase `Tertium` (`dmguwgtkeydedrrvaxfh`, regione `eu-west-1`), con schema
già applicato — vedi `supabase/migrations/`:

- `0001_init.sql` — tabelle, ruoli (`owner`, `trainer`, `staff`, `client`) e row level security
- `0002_exercise_videos_bucket.sql` — bucket privato per i video degli esercizi
- `0003_private_helpers.sql` — sposta le funzioni `SECURITY DEFINER` fuori dallo schema esposto

Le regole di accesso in breve: lo staff lavora su tutto, il titolare è l'unico che tocca
anagrafica staff, ruoli e impostazioni, il cliente vede solo la propria scheda, le proprie
misure, il proprio piano alimentare e le proprie prenotazioni.

L'app **non legge ancora** da Supabase: i dati stanno in `localStorage` finché la migrazione
dello store non è completa. Quando lo sarà, i dati esistenti si portano su con:

```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-backup.mjs backup.json --dry-run
```

Togli `--dry-run` per scrivere davvero. La `service_role` key sta solo nel terminale: mai nel
frontend, mai nel repository.
