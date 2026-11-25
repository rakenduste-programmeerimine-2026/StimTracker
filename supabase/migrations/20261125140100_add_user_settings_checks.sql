-- A daily limit is either not set (null) or a sensible daily amount.
-- The upper bounds catch typos, they are not medical advice.

alter table public.user_settings
  add constraint user_settings_caffeine_limit_mg_check
    check (caffeine_limit_mg between 1 and 2000),
  add constraint user_settings_nicotine_limit_mg_check
    check (nicotine_limit_mg between 1 and 200);
