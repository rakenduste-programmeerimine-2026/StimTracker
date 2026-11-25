-- Käivitamine: npx supabase test db   (vajab: Docker ja npx supabase start)
-- Rakendus salvestab seaded upsert'iga; PostgREST teeb sellest
-- "insert ... on conflict (user_id) do update", seega testime sama lauset.
begin;
select plan(19);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'mari@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'juri@example.com');

-- ---------- Sisselogimata kasutaja ei saa midagi ----------
set local role anon;
select throws_ok('select * from public.user_settings', '42501', null, 'anon ei saa seadeid lugeda');
select throws_ok(
  $$ insert into public.user_settings (caffeine_limit_mg) values (400) $$,
  '42501', null, 'anon ei saa seadeid salvestada'
);
reset role;

-- ---------- Mari ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';

select lives_ok(
  $$ insert into public.user_settings (caffeine_limit_mg) values (400)
     on conflict (user_id) do update set caffeine_limit_mg = excluded.caffeine_limit_mg $$,
  'esimene salvestus loob rea'
);
select is((select user_id from public.user_settings), '11111111-1111-1111-1111-111111111111'::uuid,
          'user_id tuleb sessioonist');

insert into public.user_settings (caffeine_limit_mg) values (300)
on conflict (user_id) do update set caffeine_limit_mg = excluded.caffeine_limit_mg;
select is((select count(*)::int from public.user_settings), 1, 'teine salvestus ei loo uut rida');
select is((select caffeine_limit_mg from public.user_settings), 300::numeric, 'teine salvestus muudab limiiti');
select is((select nicotine_limit_mg from public.user_settings), null, 'määramata limiit on null');

select throws_ok('update public.user_settings set caffeine_limit_mg = 0', '23514', null,
                 'kofeiini limiit 0 lükatakse tagasi');
select throws_ok('update public.user_settings set caffeine_limit_mg = 2001', '23514', null,
                 'kofeiini limiit üle 2000 lükatakse tagasi');
select throws_ok('update public.user_settings set nicotine_limit_mg = 201', '23514', null,
                 'nikotiini limiit üle 200 lükatakse tagasi');

select lives_ok('update public.user_settings set nicotine_limit_mg = 200, caffeine_limit_mg = null',
                'limiidi saab seada ja eemaldada');
select is((select caffeine_limit_mg from public.user_settings), null, 'eemaldatud limiit on null');

update public.user_settings set user_id = '22222222-2222-2222-2222-222222222222';
select is((select user_id from public.user_settings), '11111111-1111-1111-1111-111111111111'::uuid,
          'rea omanikku ei saa muuta');

update public.user_settings set updated_at = '2000-01-01';
select is((select updated_at from public.user_settings), now(), 'updated_at määrab andmebaas');

select throws_ok('delete from public.user_settings', '42501', null, 'seadeid ei kustutata, limiit pannakse nulliks');

-- ---------- Jüri ----------
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is((select count(*)::int from public.user_settings), 0, 'Jüri ei näe Mari seadeid');

update public.user_settings set nicotine_limit_mg = 1;

-- Jüri üritab salvestada Mari nimel: rida tuleb ikkagi Jürile
insert into public.user_settings (user_id, caffeine_limit_mg)
values ('11111111-1111-1111-1111-111111111111', 999)
on conflict (user_id) do update set caffeine_limit_mg = excluded.caffeine_limit_mg;
select is((select user_id from public.user_settings), '22222222-2222-2222-2222-222222222222'::uuid,
          'kliendi saadetud user_id-d eiratakse');

-- ---------- Tagasi Mari juurde ----------
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';

select is((select nicotine_limit_mg from public.user_settings), 200::numeric,
          'Jüri muudatus ei puudutanud Mari seadeid');
select is((select caffeine_limit_mg from public.user_settings), null,
          'Jüri upsert ei kirjutanud Mari limiiti üle');

select * from finish();
rollback;
