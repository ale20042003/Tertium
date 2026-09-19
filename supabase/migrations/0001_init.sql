-- ============================================================
-- Vertium Fit Club — schema iniziale
-- Deriva da src/types.ts, con le strutture annidate normalizzate.
-- ============================================================

create extension if not exists pgcrypto;

-- ─── Ruoli ──────────────────────────────────────────────────
create type app_role as enum ('owner', 'trainer', 'staff', 'client');

create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  role        app_role not null default 'client',
  full_name   text not null default '',
  email       text,
  phone       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Ogni utente che si registra ottiene un profilo 'client'.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $fn$
begin
  insert into profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper usati dalle policy. SECURITY DEFINER per non ricorrere su profiles.
create or replace function is_staff()
returns boolean
language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from profiles
    where id = auth.uid() and active and role in ('owner', 'trainer', 'staff')
  );
$fn$;

create or replace function is_owner()
returns boolean
language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from profiles where id = auth.uid() and active and role = 'owner'
  );
$fn$;

-- ─── Anagrafiche ────────────────────────────────────────────
create table clients (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid unique references profiles on delete set null,
  name        text not null,
  email       text not null,
  phone       text,
  birth_date  date,
  created_at  timestamptz not null default now()
);
create unique index clients_email_key on clients (lower(email));

-- L'id cliente dell'utente collegato (null per lo staff).
create or replace function current_client_id()
returns uuid
language sql stable security definer set search_path = public
as $fn$
  select id from clients where profile_id = auth.uid();
$fn$;

create table staff (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid unique references profiles on delete set null,
  name        text not null,
  email       text not null,
  phone       text,
  role        text not null,
  active      boolean not null default true,
  hourly_rate numeric(10,2),
  hire_date   date,
  notes       text
);

create table rooms (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  type     text not null default 'altro' check (type in ('pesi', 'corso', 'altro')),
  capacity int check (capacity is null or capacity > 0)
);

create table exercises (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  muscle_group text not null,
  description  text,
  -- path dell'oggetto nel bucket 'exercise-videos', oppure URL esterno
  video_path   text
);

-- ─── Schede di allenamento ──────────────────────────────────
create table workout_plans (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients on delete cascade,
  name        text not null default 'Scheda',
  status      text not null default 'active' check (status in ('active', 'archived')),
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);
-- Una sola scheda attiva per cliente: le altre vanno archiviate.
create unique index workout_plans_one_active
  on workout_plans (client_id) where status = 'active';

create table workout_days (
  id       uuid primary key default gen_random_uuid(),
  plan_id  uuid not null references workout_plans on delete cascade,
  name     text not null,
  position int not null default 0
);

create table workout_exercises (
  id          uuid primary key default gen_random_uuid(),
  day_id      uuid not null references workout_days on delete cascade,
  exercise_id uuid references exercises on delete set null,
  sets        int not null default 3,
  reps        text not null default '',
  rest        text not null default '',
  notes       text,
  position    int not null default 0
);

create table exercise_logs (
  id                  uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises on delete cascade,
  week                int not null,
  weight              numeric(6,2) not null,
  logged_at           timestamptz not null default now(),
  unique (workout_exercise_id, week)
);

create table body_measurements (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients on delete cascade,
  measured_at timestamptz not null default now(),
  weight      numeric(5,2),
  height      numeric(5,2),
  waist       numeric(5,2),
  thigh       numeric(5,2),
  chest       numeric(5,2),
  bicep       numeric(5,2),
  calf        numeric(5,2)
);

-- ─── Piano alimentare ───────────────────────────────────────
create table nutrition_plans (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null unique references clients on delete cascade,
  title          text not null default 'Piano alimentare',
  daily_calories int,
  daily_protein  int,
  daily_carbs    int,
  daily_fat      int,
  notes          text,
  updated_at     timestamptz not null default now()
);

create table nutrition_meals (
  id       uuid primary key default gen_random_uuid(),
  plan_id  uuid not null references nutrition_plans on delete cascade,
  name     text not null,
  time     time,
  items    text not null default '',
  position int not null default 0
);

-- ─── Corsi e prenotazioni ───────────────────────────────────
create table gym_classes (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  staff_id         uuid references staff on delete set null,
  room_id          uuid references rooms on delete set null,
  capacity         int not null check (capacity > 0),
  duration_minutes int not null check (duration_minutes > 0),
  color            text not null default '#2235dd'
);

create table class_slots (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references gym_classes on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time  time not null,
  unique (class_id, day_of_week, start_time)
);

create table class_bookings (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references gym_classes on delete cascade,
  client_id  uuid not null references clients on delete cascade,
  date       date not null,
  status     text not null default 'confermata'
             check (status in ('confermata', 'waitlist', 'cancellata')),
  attended   boolean,
  created_at timestamptz not null default now()
);
-- Una sola prenotazione viva per cliente/corso/giorno.
create unique index class_bookings_unique_active
  on class_bookings (class_id, client_id, date) where status <> 'cancellata';

-- ─── Bacheca e impostazioni ─────────────────────────────────
create table announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  message    text not null,
  pinned     boolean not null default false,
  author_id  uuid references profiles on delete set null,
  created_at timestamptz not null default now()
);

create table gym_settings (
  id            boolean primary key default true check (id),
  name          text not null default 'La Mia Palestra',
  address       text,
  phone         text,
  opening_hours jsonb not null default '[]'::jsonb
);
insert into gym_settings (id) values (true);

-- ============================================================
-- Row Level Security
-- ============================================================
do $do$
declare t text;
begin
  foreach t in array array[
    'profiles','clients','staff','rooms','exercises','workout_plans','workout_days',
    'workout_exercises','exercise_logs','body_measurements','nutrition_plans',
    'nutrition_meals','gym_classes','class_slots','class_bookings','announcements','gym_settings'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $do$;

-- Lo staff (titolare, PT, segreteria) lavora su tutto.
do $do$
declare t text;
begin
  foreach t in array array[
    'clients','rooms','exercises','workout_plans','workout_days','workout_exercises',
    'exercise_logs','body_measurements','nutrition_plans','nutrition_meals',
    'gym_classes','class_slots','class_bookings','announcements'
  ] loop
    execute format(
      'create policy staff_all on %I for all to authenticated using (is_staff()) with check (is_staff())', t);
  end loop;
end $do$;

-- Anagrafica staff e impostazioni: lettura a tutto lo staff, scrittura al titolare.
create policy staff_read on staff for select to authenticated using (is_staff());
create policy staff_write on staff for all to authenticated
  using (is_owner()) with check (is_owner());

create policy settings_read on gym_settings for select to authenticated using (true);
create policy settings_write on gym_settings for update to authenticated
  using (is_owner()) with check (is_owner());

-- Profili: ognuno vede il proprio, lo staff li vede tutti;
-- i ruoli li cambia solo il titolare.
create policy profiles_read_self on profiles for select to authenticated
  using (id = auth.uid() or is_staff());
create policy profiles_owner_all on profiles for all to authenticated
  using (is_owner()) with check (is_owner());

-- ─── Accesso cliente: solo i propri dati ────────────────────
create policy clients_read_self on clients for select to authenticated
  using (profile_id = auth.uid());

create policy plans_read_own on workout_plans for select to authenticated
  using (client_id = current_client_id());

create policy days_read_own on workout_days for select to authenticated
  using (exists (select 1 from workout_plans p
                 where p.id = plan_id and p.client_id = current_client_id()));

create policy wex_read_own on workout_exercises for select to authenticated
  using (exists (select 1 from workout_days d
                 join workout_plans p on p.id = d.plan_id
                 where d.id = day_id and p.client_id = current_client_id()));

-- I log di allenamento li scrive il cliente stesso.
create policy logs_own on exercise_logs for all to authenticated
  using (exists (select 1 from workout_exercises we
                 join workout_days d on d.id = we.day_id
                 join workout_plans p on p.id = d.plan_id
                 where we.id = workout_exercise_id and p.client_id = current_client_id()))
  with check (exists (select 1 from workout_exercises we
                 join workout_days d on d.id = we.day_id
                 join workout_plans p on p.id = d.plan_id
                 where we.id = workout_exercise_id and p.client_id = current_client_id()));

create policy measurements_own on body_measurements for all to authenticated
  using (client_id = current_client_id())
  with check (client_id = current_client_id());

create policy nutrition_read_own on nutrition_plans for select to authenticated
  using (client_id = current_client_id());
create policy nutrition_meals_read_own on nutrition_meals for select to authenticated
  using (exists (select 1 from nutrition_plans np
                 where np.id = plan_id and np.client_id = current_client_id()));

-- Catalogo esercizi, sale, corsi e bacheca: in sola lettura per i clienti.
create policy exercises_read on exercises for select to authenticated using (true);
create policy rooms_read on rooms for select to authenticated using (true);
create policy classes_read on gym_classes for select to authenticated using (true);
create policy slots_read on class_slots for select to authenticated using (true);
create policy announcements_read on announcements for select to authenticated using (true);

-- Prenotazioni: il cliente vede e gestisce solo le proprie.
create policy bookings_read_own on class_bookings for select to authenticated
  using (client_id = current_client_id());
create policy bookings_insert_own on class_bookings for insert to authenticated
  with check (client_id = current_client_id());
create policy bookings_update_own on class_bookings for update to authenticated
  using (client_id = current_client_id())
  with check (client_id = current_client_id());
