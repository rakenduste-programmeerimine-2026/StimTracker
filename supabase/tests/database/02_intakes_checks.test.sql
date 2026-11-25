-- Käivitamine: npx supabase test db   (vajab: Docker ja npx supabase start)
-- Piirangud peavad olema samad mis src/lib/intake/validation.ts-is.
begin;
select plan(15);

insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'mari@example.com');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';

-- ---------- Aine ----------
select throws_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('alcohol', 10, 'Õlu') $$,
  '23514', null, 'tundmatu aine lükatakse tagasi'
);

-- ---------- Kogus ----------
select throws_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('caffeine', 0, 'Kohv') $$,
  '23514', null, 'kogus 0 lükatakse tagasi'
);
select throws_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('caffeine', -5, 'Kohv') $$,
  '23514', null, 'negatiivne kogus lükatakse tagasi'
);
select lives_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('caffeine', 1000, 'Kohv') $$,
  'kofeiini 1000 mg on lubatud'
);
select throws_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('caffeine', 1000.5, 'Kohv') $$,
  '23514', null, 'kofeiini üle 1000 mg lükatakse tagasi'
);
select lives_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('nicotine', 100, 'Snus') $$,
  'nikotiini 100 mg on lubatud'
);
select throws_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('nicotine', 101, 'Snus') $$,
  '23514', null, 'nikotiini üle 100 mg lükatakse tagasi'
);
select lives_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('nicotine', 1.5, 'Vape') $$,
  'murdarvuline kogus on lubatud'
);

-- ---------- Nimetus ----------
select throws_ok(
  $$ insert into public.intakes (substance, amount_mg) values ('caffeine', 95) $$,
  '23502', null, 'nimetus on kohustuslik'
);
select throws_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('caffeine', 95, '   ') $$,
  '23514', null, 'ainult tühikutest nimetus lükatakse tagasi'
);
select lives_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('caffeine', 95, repeat('a', 60)) $$,
  '60-märgiline nimetus on lubatud'
);
select throws_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('caffeine', 95, repeat('a', 61)) $$,
  '23514', null, 'üle 60 märgi nimetus lükatakse tagasi'
);

-- ---------- Aeg ----------
select throws_ok(
  $$ insert into public.intakes (substance, amount_mg, taken_at, label)
     values ('caffeine', 95, now() + interval '1 hour', 'Kohv') $$,
  '23514', null, 'tulevikus olev aeg lükatakse tagasi'
);
select lives_ok(
  $$ insert into public.intakes (substance, amount_mg, taken_at, label)
     values ('caffeine', 95, now() + interval '30 seconds', 'Kohv') $$,
  'kuni minut ees olev kell on lubatud'
);

-- ---------- created_at ----------
insert into public.intakes (substance, amount_mg, label, created_at)
values ('caffeine', 95, 'Vana kuupäev', '2000-01-01');
select is((select created_at from public.intakes where label = 'Vana kuupäev'), now(),
          'kliendi saadetud created_at-i eiratakse');

select * from finish();
rollback;
