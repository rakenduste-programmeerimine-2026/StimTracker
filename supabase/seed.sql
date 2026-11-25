-- Local development data only (npx supabase start / npx supabase db reset).
-- Never run against the hosted project.
--
-- Login: test@example.com / password123

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'authenticated', 'authenticated', 'test@example.com',
  extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"test@example.com"}',
  'email', now(), now(), now()
);

-- A typical student day today, plus a few earlier days for the weekly stats.
-- Times are relative to when the seed runs, so "today" always has data.
insert into public.intakes (user_id, substance, amount_mg, taken_at, label) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'caffeine', 95, now() - interval '9 hours',  'Kohv'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'caffeine', 63, now() - interval '6 hours',  'Espresso'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'caffeine', 80, now() - interval '2 hours',  'Energiajook'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'nicotine', 3,  now() - interval '5 hours',  'Snus'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'nicotine', 3,  now() - interval '1 hour',   'Snus'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'caffeine', 95, now() - interval '1 day',    'Kohv'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'caffeine', 95, now() - interval '26 hours', 'Kohv'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'nicotine', 1,  now() - interval '2 days',   'Sigaret'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'caffeine', 47, now() - interval '3 days',   'Must tee'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'nicotine', 1,  now() - interval '4 days',   'Vape');
