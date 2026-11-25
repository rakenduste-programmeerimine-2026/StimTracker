-- Same limits as the add-intake form (src/lib/intake/validation.ts), so a
-- request that skips the form cannot store something the form would reject.
-- The upper limits catch typos (950 instead of 95), they are not health limits.

alter table public.intakes
  add constraint intakes_substance_check
    check (substance in ('caffeine', 'nicotine')),
  add constraint intakes_amount_mg_check
    check (
      amount_mg > 0
      and amount_mg <= case substance when 'caffeine' then 1000 when 'nicotine' then 100 end
    ),
  add constraint intakes_label_check
    check (char_length(btrim(label)) >= 1 and char_length(label) <= 60);
