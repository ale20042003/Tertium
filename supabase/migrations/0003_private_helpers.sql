-- Le funzioni SECURITY DEFINER non devono essere richiamabili via /rest/v1/rpc:
-- spostandole in uno schema non esposto restano usabili dalle policy ma spariscono dall'API.
-- (Segnalato da: supabase advisor, lint 0028/0029.)
create schema if not exists private;

alter function public.is_staff() set schema private;
alter function public.is_owner() set schema private;
alter function public.current_client_id() set schema private;
alter function public.handle_new_user() set schema private;

grant usage on schema private to authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_owner() to authenticated;
grant execute on function private.current_client_id() to authenticated;

-- Funzione di trigger: la chiama solo il trigger, che gira come owner della tabella.
revoke all on function private.handle_new_user() from public;
revoke all on function private.handle_new_user() from anon;
revoke all on function private.handle_new_user() from authenticated;
