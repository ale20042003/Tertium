-- Una mail identifica una sola persona nello staff: serve al gate e al collegamento del profilo.
create unique index if not exists staff_email_key on staff (lower(email));

-- ─── Gate di registrazione ──────────────────────────────────
-- Hook "before user created": si registra solo chi è già in anagrafica,
-- come cliente o come membro del personale.
-- Va abilitato in Authentication → Hooks, altrimenti resta attiva solo la
-- rete di sicurezza del trigger qui sotto (che però dà un errore generico).
create or replace function public.hook_restrict_signup_to_known_emails(event jsonb)
returns jsonb
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_email text := lower(event->'user'->>'email');
begin
  if v_email is null or v_email = '' then
    return jsonb_build_object('error', jsonb_build_object(
      'message', 'Email mancante.', 'http_code', 400));
  end if;

  if exists (select 1 from staff where lower(email) = v_email and active)
     or exists (select 1 from clients where lower(email) = v_email) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object('error', jsonb_build_object(
    'message', 'Questa email non risulta nel gestionale della palestra. Chiedi in segreteria di essere aggiunto, poi riprova.',
    'http_code', 403));
end;
$fn$;

grant execute on function public.hook_restrict_signup_to_known_emails(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_to_known_emails(jsonb) from authenticated, anon, public;

-- ─── Creazione profilo, ruolo e collegamento anagrafica ─────
-- Fa anche da rete di sicurezza: se l'hook non fosse attivo, l'inserimento fallisce comunque.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_email  text := lower(new.email);
  v_staff  staff%rowtype;
  v_client clients%rowtype;
  v_role   app_role;
begin
  select * into v_staff from staff where lower(email) = v_email and active limit 1;

  if v_staff.id is not null then
    -- Chi allena entra come 'trainer', il resto del personale come 'staff'.
    -- Il ruolo 'owner' resta un'assegnazione manuale.
    v_role := case
      when v_staff.role ilike '%trainer%' or v_staff.role ilike '%istrutt%' then 'trainer'::app_role
      else 'staff'::app_role
    end;
  else
    select * into v_client from clients where lower(email) = v_email limit 1;
    if v_client.id is null then
      raise exception 'Email non presente nel gestionale: registrazione non consentita';
    end if;
    v_role := 'client'::app_role;
  end if;

  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), v_staff.name, v_client.name, ''),
    new.email,
    v_role
  )
  on conflict (id) do nothing;

  if v_staff.id is not null then
    update staff set profile_id = new.id where id = v_staff.id;
  else
    update clients set profile_id = new.id where id = v_client.id;
  end if;

  return new;
end;
$fn$;

-- Il titolare esisteva solo come utente auth: lo porto anche in anagrafica personale.
insert into staff (name, email, role, active)
values ('Titolare', 'automastudio.info@gmail.com', 'Amministrazione', true)
on conflict (lower(email)) do nothing;

update staff s
set profile_id = u.id
from auth.users u
where lower(s.email) = lower(u.email) and s.profile_id is null;
