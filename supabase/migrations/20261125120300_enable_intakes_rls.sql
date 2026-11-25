-- Each user sees and changes only their own intakes. The publishable key is
-- public, so these policies are what actually protects the data.

alter table public.intakes enable row level security;

-- Supabase grants everything on new tables to anon and authenticated by
-- default. Logged-out users get nothing; logged-in users get only what the
-- app needs. There is no editing in the app, so no update.
revoke all on public.intakes from anon, authenticated;
grant select, insert, delete on public.intakes to authenticated;

create policy "intakes: read own"
  on public.intakes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "intakes: add own"
  on public.intakes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "intakes: delete own"
  on public.intakes for delete
  to authenticated
  using ((select auth.uid()) = user_id);
