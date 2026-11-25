-- Käivitamine: npx supabase test db   (vajab: Docker ja npx supabase start)
begin;
select plan(11);

-- ---------- Testandmed: kaks kasutajat (Mari ja Jüri) ----------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'mari@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'juri@example.com');

-- ---------- Sisselogimata kasutaja ei saa midagi ----------
set local role anon;
select throws_ok('select * from public.intakes', '42501', null, 'anon ei saa intakes tabelit lugeda');
select throws_ok(
  $$ insert into public.intakes (substance, amount_mg, label) values ('caffeine', 95, 'Kohv') $$,
  '42501', null, 'anon ei saa tarbimist lisada'
);
reset role;

-- ---------- Mari ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';

insert into public.intakes (substance, amount_mg, label) values ('caffeine', 95, 'Kohv');
insert into public.intakes (substance, amount_mg, label) values ('nicotine', 3, 'Snus');

select is((select count(*)::int from public.intakes), 2, 'Mari saab tarbimisi lisada ja näeb neid');
select is((select user_id from public.intakes where label = 'Kohv'), '11111111-1111-1111-1111-111111111111'::uuid,
          'user_id täidetakse automaatselt');

-- Mari üritab logida Jüri nimel: andmebaas paneb omanikuks ikkagi Mari
insert into public.intakes (user_id, substance, amount_mg, label)
values ('22222222-2222-2222-2222-222222222222', 'caffeine', 47, 'Tee');
select is((select user_id from public.intakes where label = 'Tee'), '11111111-1111-1111-1111-111111111111'::uuid,
          'kliendi saadetud user_id-d eiratakse');

-- ---------- Jüri ----------
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';

select is((select count(*)::int from public.intakes), 0, 'Jüri ei näe Mari tarbimisi');
select lives_ok('delete from public.intakes', 'Jüri kustutamine ei anna viga');
select throws_ok('update public.intakes set amount_mg = 1', '42501', null, 'muuta ei saa keegi');

insert into public.intakes (substance, amount_mg, label) values ('nicotine', 1, 'Sigaret');
select is((select count(*)::int from public.intakes), 1, 'Jüri näeb ainult enda tarbimist');

-- ---------- Tagasi Mari juurde ----------
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';

select is((select count(*)::int from public.intakes), 3, 'Jüri kustutamine ei puudutanud Mari ridu');

delete from public.intakes where label = 'Tee';
select is((select count(*)::int from public.intakes), 2, 'Mari saab enda tarbimist kustutada');

select * from finish();
rollback;
