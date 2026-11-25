-- Logged caffeine and nicotine intakes, one row per dose.
-- Mirrors the Intake type in src/lib/intake/types.ts (snake_case columns).

create table public.intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  substance text not null,
  amount_mg numeric not null,
  taken_at timestamptz not null default now(),
  label text not null,
  created_at timestamptz not null default now()
);

comment on table public.intakes is 'One logged dose of caffeine or nicotine.';
comment on column public.intakes.amount_mg is 'Amount in milligrams; for nicotine the estimated amount absorbed.';
comment on column public.intakes.taken_at is 'When the dose was taken (not when it was logged).';
comment on column public.intakes.label is 'What it was, e.g. "Espresso" or "Snus".';

-- Today, history and weekly stats all read one user's intakes by time.
create index intakes_user_id_taken_at_idx on public.intakes (user_id, taken_at desc);
