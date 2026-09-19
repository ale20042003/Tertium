/**
 * Importa in Supabase un backup JSON esportato dall'app (Impostazioni → Esporta backup).
 *
 * Uso:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/import-backup.mjs gym-backup-2026-09-19.json [--dry-run]
 *
 * La service_role key scavalca la RLS: usala solo da qui, mai nel frontend.
 *
 * Nota sulle password: i clienti nel backup hanno password in chiaro, che non
 * vengono importate. Gli account vanno ricreati via Supabase Auth (invito via email);
 * lo script lascia `clients.profile_id` a null, da collegare al primo accesso.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const [, , backupPath, ...flags] = process.argv;
const dryRun = flags.includes('--dry-run');

if (!backupPath) {
  console.error('Manca il percorso del file di backup.');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Imposta SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const parsed = JSON.parse(readFileSync(backupPath, 'utf8'));
const data = parsed?.data ?? parsed;

const clients = data.gym_clients ?? [];
const exercises = data.gym_exercises ?? [];
const staff = data.gym_staff ?? [];
const rooms = data.gym_rooms ?? [];
const gymClasses = data.gym_classes ?? [];
const bookings = data.gym_class_bookings ?? [];
const announcements = data.gym_announcements ?? [];
const settings = data.gym_settings;

// Righe da inserire, nell'ordine in cui rispettano le foreign key.
const rows = {
  rooms: [],
  exercises: [],
  staff: [],
  clients: [],
  gym_classes: [],
  class_slots: [],
  class_bookings: [],
  announcements: [],
  workout_plans: [],
  workout_days: [],
  workout_exercises: [],
  exercise_logs: [],
  body_measurements: [],
  nutrition_plans: [],
  nutrition_meals: [],
};

const num = (v) => (v === undefined || v === '' ? null : Number(v));
const text = (v) => (v === undefined || v === '' ? null : String(v));

for (const r of rooms) {
  rows.rooms.push({ id: r.id, name: r.name, type: r.type ?? 'altro', capacity: num(r.capacity) });
}

const exerciseIds = new Set();
for (const e of exercises) {
  exerciseIds.add(e.id);
  rows.exercises.push({
    id: e.id,
    name: e.name,
    muscle_group: e.muscleGroup ?? '',
    description: text(e.description),
    // I video in IndexedDB stanno solo sul browser del gestore: vanno ricaricati a mano.
    video_path: e.videoUrl?.startsWith('localforage:') ? null : text(e.videoUrl),
  });
}

for (const s of staff) {
  rows.staff.push({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: text(s.phone),
    role: s.role ?? 'Staff',
    active: s.active ?? true,
    hourly_rate: num(s.hourlyRate),
    hire_date: text(s.hireDate),
    notes: text(s.notes),
  });
}

for (const c of gymClasses) {
  rows.gym_classes.push({
    id: c.id,
    name: c.name,
    description: text(c.description),
    staff_id: c.staffId ?? null,
    room_id: c.roomId ?? null,
    capacity: c.capacity,
    duration_minutes: c.durationMinutes,
    color: c.color ?? '#2235dd',
  });
  for (const slot of c.schedule ?? []) {
    rows.class_slots.push({
      id: randomUUID(),
      class_id: c.id,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
    });
  }
}

for (const a of announcements) {
  rows.announcements.push({
    id: a.id,
    title: a.title,
    message: a.message,
    pinned: a.pinned ?? false,
    created_at: a.createdAt,
  });
}

/**
 * Appiattisce una scheda (giorni → esercizi → log) generando id nuovi:
 * le schede archiviate riusano gli id di quella attiva, quindi non sono riutilizzabili.
 */
function addPlan(clientId, name, days, status, createdAt) {
  const planId = randomUUID();
  rows.workout_plans.push({
    id: planId,
    client_id: clientId,
    name,
    status,
    created_at: createdAt ?? new Date().toISOString(),
    archived_at: status === 'archived' ? (createdAt ?? new Date().toISOString()) : null,
  });

  (days ?? []).forEach((day, dayIndex) => {
    const dayId = randomUUID();
    rows.workout_days.push({ id: dayId, plan_id: planId, name: day.name, position: dayIndex });

    (day.exercises ?? []).forEach((ex, exIndex) => {
      const wexId = randomUUID();
      rows.workout_exercises.push({
        id: wexId,
        day_id: dayId,
        exercise_id: exerciseIds.has(ex.exerciseId) ? ex.exerciseId : null,
        sets: ex.sets ?? 3,
        reps: ex.reps ?? '',
        rest: ex.rest ?? '',
        notes: text(ex.notes),
        position: exIndex,
      });

      // La tabella ha un vincolo unico su (esercizio, settimana).
      const seenWeeks = new Set();
      for (const log of ex.logs ?? []) {
        if (seenWeeks.has(log.week)) continue;
        seenWeeks.add(log.week);
        rows.exercise_logs.push({
          id: randomUUID(),
          workout_exercise_id: wexId,
          week: log.week,
          weight: log.weight,
          logged_at: log.date,
        });
      }
    });
  });
}

const seenEmails = new Set();
for (const c of clients) {
  const email = (c.email ?? '').toLowerCase();
  if (!email || seenEmails.has(email)) {
    console.warn(`Cliente saltato (email mancante o duplicata): ${c.name ?? c.id}`);
    continue;
  }
  seenEmails.add(email);

  rows.clients.push({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: text(c.phone),
    birth_date: text(c.birthDate),
  });

  if (c.workoutPlan?.length) {
    addPlan(c.id, 'Scheda attuale', c.workoutPlan, 'active', null);
  }
  for (const past of c.pastPlans ?? []) {
    addPlan(c.id, past.name, past.workoutPlan, 'archived', past.date);
  }

  for (const m of c.measurements ?? []) {
    rows.body_measurements.push({
      id: m.id,
      client_id: c.id,
      measured_at: m.date,
      weight: num(m.weight),
      height: num(m.height),
      waist: num(m.waist),
      thigh: num(m.thigh),
      chest: num(m.chest),
      bicep: num(m.bicep),
      calf: num(m.calf),
    });
  }

  const plan = c.nutritionPlan;
  if (plan) {
    const planId = plan.id ?? randomUUID();
    rows.nutrition_plans.push({
      id: planId,
      client_id: c.id,
      title: plan.title ?? 'Piano alimentare',
      daily_calories: num(plan.dailyCalories),
      daily_protein: num(plan.dailyProtein),
      daily_carbs: num(plan.dailyCarbs),
      daily_fat: num(plan.dailyFat),
      notes: text(plan.notes),
      updated_at: plan.updatedAt ?? new Date().toISOString(),
    });
    (plan.meals ?? []).forEach((meal, i) => {
      rows.nutrition_meals.push({
        id: meal.id ?? randomUUID(),
        plan_id: planId,
        name: meal.name,
        time: text(meal.time),
        items: meal.items ?? '',
        position: i,
      });
    });
  }
}

const clientIds = new Set(rows.clients.map((c) => c.id));
const classIds = new Set(rows.gym_classes.map((c) => c.id));
for (const b of bookings) {
  if (!clientIds.has(b.clientId) || !classIds.has(b.classId)) continue;
  rows.class_bookings.push({
    id: b.id,
    class_id: b.classId,
    client_id: b.clientId,
    date: b.date,
    status: b.status,
    attended: b.attended ?? null,
    created_at: b.createdAt,
  });
}

console.log('Righe da importare:');
for (const [table, list] of Object.entries(rows)) {
  if (list.length) console.log(`  ${table.padEnd(20)} ${list.length}`);
}

if (dryRun) {
  console.log('\n--dry-run: nessuna scrittura effettuata.');
  process.exit(0);
}

for (const [table, list] of Object.entries(rows)) {
  if (!list.length) continue;
  // upsert per rendere lo script ripetibile senza duplicare.
  const { error } = await db.from(table).upsert(list, { onConflict: 'id' });
  if (error) {
    console.error(`Errore su ${table}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ ${table} (${list.length})`);
}

if (settings) {
  const { error } = await db
    .from('gym_settings')
    .update({
      name: settings.name,
      address: text(settings.address),
      phone: text(settings.phone),
      opening_hours: settings.openingHours ?? [],
    })
    .eq('id', true);
  if (error) {
    console.error(`Errore su gym_settings: ${error.message}`);
    process.exit(1);
  }
  console.log('✓ gym_settings');
}

console.log('\nImport completato.');
