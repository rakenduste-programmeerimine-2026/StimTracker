-- Same rule as for intakes: the database decides whose settings these are.
-- A new row always belongs to the logged-in user, a row never changes owner,
-- and updated_at is always set by the database.

create function public.prepare_user_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- auth.uid() is null only for trusted callers without a session
    -- (seed, tests run as postgres); they set user_id themselves.
    new.user_id := coalesce(auth.uid(), new.user_id);
  else
    new.user_id := old.user_id;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger user_settings_prepare
  before insert or update on public.user_settings
  for each row execute function public.prepare_user_settings();
