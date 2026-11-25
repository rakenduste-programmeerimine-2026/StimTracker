-- Personal settings, one row per user. For now only the optional daily
-- limits (core feature 3). A user without a row has no limits; the app saves
-- with an upsert, so nothing has to be created at sign-up.

create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  caffeine_limit_mg numeric,
  nicotine_limit_mg numeric,
  updated_at timestamptz not null default now()
);

comment on table public.user_settings is 'Per-user settings; a missing row means default settings.';
comment on column public.user_settings.caffeine_limit_mg is 'Optional daily caffeine limit in mg; null = no limit.';
comment on column public.user_settings.nicotine_limit_mg is 'Optional daily nicotine limit in mg; null = no limit.';
