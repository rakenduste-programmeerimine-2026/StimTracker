-- Each user reads and saves only their own settings. Saving is an upsert
-- (insert ... on conflict do update), which needs select, insert and update.
-- There is no delete: clearing a limit means setting it to null.

alter table public.user_settings enable row level security;

revoke all on public.user_settings from anon, authenticated;
grant select, insert, update on public.user_settings to authenticated;

create policy "user_settings: read own"
  on public.user_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_settings: add own"
  on public.user_settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_settings: update own"
  on public.user_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
