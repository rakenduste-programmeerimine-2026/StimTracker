# StimTracki andmebaas (Supabase)

Omanik: Olaf (andmebaas ja kvaliteet). Skeemi muudatused tulevad **ainult** uue migratsioonina kaustas `supabase/migrations/` ja käivad läbi PR-i. Supabase'i dashboardis tabeleid käsitsi ei looda ega muudeta.

## Ühendus

```env
NEXT_PUBLIC_SUPABASE_URL=https://<projekt>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

- Kasuta ainult publishable võtit. **Secret / service_role võtit ei pane keegi koodi ega `.env.local`-i.**
- Kliendid tehakse `@supabase/ssr` abil (`createBrowserClient` / `createServerClient`).

## Mudel

```
auth.users 1─* intakes
auth.users 1─1 user_settings   (rida võib puududa = limiite pole)
```

### `intakes`

Üks rida = üks tarbimine (tass kohvi, üks snus jne).

| Veerg | Tüüp | Märkus |
| --- | --- | --- |
| id | uuid | genereeritakse ise |
| user_id | uuid | täidetakse ise (`auth.uid()`); kliendi väärtust eiratakse |
| substance | text | `caffeine` \| `nicotine` |
| amount_mg | numeric | > 0; kofeiin ≤ 1000, nikotiin ≤ 100 (samad piirid mis vormis) |
| taken_at | timestamptz | millal tarbiti; vaikimisi `now()`; ei tohi olla üle minuti tulevikus |
| label | text | 1–60 märki, nt „Espresso“ |
| created_at | timestamptz | määrab andmebaas; kliendi väärtust eiratakse |

Rakenduse tüüp `Intake` (`src/lib/intake/types.ts`) on sama kuju camelCase'is: `amount_mg` → `amountMg`, `taken_at` → `takenAt`.

### `user_settings`

Kasutaja seaded, üks rida kasutaja kohta. Praegu ainult valikulised päevalimiidid. **Rida võib puududa** — siis limiite pole. Ridu ei looda registreerumisel; rakendus salvestab upsert'iga.

| Veerg | Tüüp | Märkus |
| --- | --- | --- |
| user_id | uuid | PK; täidetakse ise (`auth.uid()`); kliendi väärtust eiratakse, omanik ei muutu |
| caffeine_limit_mg | numeric \| null | päevalimiit; `null` = pole; muidu 1–2000 |
| nicotine_limit_mg | numeric \| null | päevalimiit; `null` = pole; muidu 1–200 |
| updated_at | timestamptz | määrab andmebaas |

## Õigused (RLS)

| Tabel | Kes | Mida saab |
| --- | --- | --- |
| kõik | sisselogimata (`anon`) | mitte midagi (viga `42501`) |
| intakes | sisseloginud kasutaja | loeb, lisab ja kustutab **ainult enda** ridu; muuta ei saa (`42501`) — vale rida kustutatakse ja lisatakse uuesti |
| user_settings | sisseloginud kasutaja | loeb, loob ja muudab **ainult enda** rida; kustutada ei saa (`42501`) — limiidi eemaldamiseks pane see `null`-iks |

RLS-i ei pea koodis üle kontrollima: võõrad read lihtsalt ei tule päringus kaasa ja võõra rea kustutamine ei mõjuta midagi.

## Vead

| Kood | Millal |
| --- | --- |
| `42501` | pole sisse logitud või tegevus pole lubatud |
| `23514` | piirang ei sobi (aine, kogus, nimetus või tulevikus olev aeg) |
| `23502` | kohustuslik väli puudub |

Toores andmebaasi viga logitakse serveris, kasutajale näidatakse eestikeelset teadet (vt `src/lib/intake/validation.ts`).

## Valmis päringud

```ts
// Tarbimise lisamine (user_id ja created_at täituvad ise)
const { data, error } = await supabase
  .from('intakes')
  .insert({ substance: 'caffeine', amount_mg: 95, taken_at: takenAt.toISOString(), label: 'Kohv' })
  .select()
  .single();

// Tänased tarbimised, uuemad ees
const { data } = await supabase
  .from('intakes')
  .select('id, substance, amount_mg, taken_at, label')
  .gte('taken_at', dayStart.toISOString())
  .lte('taken_at', now.toISOString())
  .order('taken_at', { ascending: false });

// Kustutamine
await supabase.from('intakes').delete().eq('id', intakeId);

// Nädala statistika: sama päring 7 päeva vahemikuga, summad arvutatakse rakenduses

// Päevalimiidid (null → rida puudub, limiite pole)
const { data: settings } = await supabase
  .from('user_settings')
  .select('caffeine_limit_mg, nicotine_limit_mg')
  .maybeSingle();

// Limiitide salvestamine (user_id täitub ise; saada ainult veerud, mida muudad)
await supabase
  .from('user_settings')
  .upsert({ caffeine_limit_mg: 400, nicotine_limit_mg: null }, { onConflict: 'user_id' })
  .select()
  .single();
```

**Ajavöönd:** „täna“ algab kasutaja kohalikul keskööl. Server (nt Vercel) töötab UTC-s, seega päeva algust ei arvutata serveris `new Date()` põhjal — see tuleb brauserist (vt `startOfLocalDay` failis `src/lib/intake/today.ts`).

## Kohalik arendus

Vajab Docker Desktopi.

```bash
npx supabase start       # käivitab kohaliku Supabase'i, rakendab migratsioonid ja seed'i
npx supabase test db     # pgTAP testid kaustas supabase/tests/database/
npx supabase db reset    # alustab puhtalt (migratsioonid + seed uuesti)
npx supabase stop
```

`npx supabase start` näitab kohalikku URL-i ja publishable võtit — need lähevad kohaliku arenduse ajal `.env.local`-i.

Seed'i testkasutaja (ainult kohalikus andmebaasis): `test@example.com` / `password123`, koos tänase ja eelmiste päevade tarbimistega ning kofeiini päevalimiidiga 400 mg (nikotiinil limiiti pole).

## Muudatuse soov

Kui vajad uut veergu, tabelit või päringut: tee issue sildiga `db`, kirjelda mida ja miks.
