-- Bucket privato per i video degli esercizi.
-- ─── Storage: video degli esercizi ──────────────────────────
insert into storage.buckets (id, name, public)
values ('exercise-videos', 'exercise-videos', false)
on conflict (id) do nothing;

create policy videos_read on storage.objects for select to authenticated
  using (bucket_id = 'exercise-videos');
create policy videos_write on storage.objects for all to authenticated
  using (bucket_id = 'exercise-videos' and is_staff())
  with check (bucket_id = 'exercise-videos' and is_staff());
