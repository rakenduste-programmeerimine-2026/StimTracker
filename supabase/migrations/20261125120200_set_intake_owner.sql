-- The database decides who owns a new intake: the logged-in user. Whatever
-- user_id or created_at the client sends is ignored, so one user cannot log
-- intakes for another.
--
-- A dose cannot be taken in the future. One minute of slack lets a phone
-- whose clock is slightly ahead still log "now". This is a trigger, not a
-- check constraint, because check constraints must not depend on now().

create function public.prepare_new_intake()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- auth.uid() is null only for trusted callers without a session
  -- (seed, migrations, tests run as postgres); they set user_id themselves.
  new.user_id := coalesce(auth.uid(), new.user_id);
  new.created_at := now();

  if new.taken_at > now() + interval '1 minute' then
    raise exception 'taken_at cannot be in the future'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger intakes_prepare_new
  before insert on public.intakes
  for each row execute function public.prepare_new_intake();
