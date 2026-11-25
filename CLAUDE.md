# StimTrack — juhised Claude'ile ja tiimile

Next.js (App Router) + TypeScript + Supabase. Tiim (projekt 2, rollid roteeritud): Joosep (frontend ja disain), Uku (backend ja turvalisus), Olaf (andmebaas ja kvaliteet).

Rakendus aitab tudengitel jälgida kofeiini ja nikotiini tarbimist: kiire logimine, hinnang, kui palju on veel kehas, ning päeva- ja nädalastatistika koos valikulise päevalimiidiga.

## Git — kohustuslik

- **Ära kunagi commiti ega pushi otse `main`-i.** Iga muudatus = oma branch + pull request + teise liikme review.
- Iga töö algab GitHubi issue'st. Branch: `<type>/<issue-nr>-<lühike-kirjeldus>`, nt `feat/12-daily-limit`.
- Commitid ja PR-i pealkirjad Angulari formaadis: `<type>(<scope>): <kokkuvõte>`
  - type: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `revert` (`chore` EI ole lubatud)
  - scope: `db` `auth` `intake` `stats` `ui` `config`
  - kokkuvõte inglise keeles, väike algustäht, käskiv kõneviis, punktita: `feat(intake): add one-tap presets`
- Üks commit = üks loogiline muudatus, mis töötab üksi (nt tabel, siis piirangud, siis RLS, siis testid). Ära kogu kogu PR-i ühte commiti.
- PR-i kehasse `Closes #<issue-nr>`.
- PR-i merge'ib review tegija, mitte autor. Kasuta tavalist merge commit'i, mitte squash'i.

## Andmebaas — reeglid

- Skeemi, RLS-i ja päringute kirjeldus: **`docs/DATABASE.md`**. Kasuta ainult seal olevaid tabeleid, veerge ja vaateid.
- **Ära muuda faile kaustas `supabase/`** ega loo uusi migratsioone, kui sa pole Olaf. Vajad muudatust → issue sildiga `db`.
- Tabeleid ei looda Supabase'i dashboardis käsitsi — kõik muudatused tulevad migratsioonina.
- Ära muuda `src/types/database.types.ts` käsitsi — see on genereeritud.
- Ainult `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Secret / service role võtit ei kasutata kuskil rakenduse koodis ega `.env.local`-is.
- RLS on tõe allikas: ära dubleeri õiguste kontrolli koodis teistsuguse loogikaga. Kasutaja id-d ei saadeta kliendist; `user_id` täidab andmebaas ise.
- Tarbimise aeg on `timestamptz` (ISO 8601, nt `2026-11-25T14:05:00.000Z`). Päeva piirid arvutatakse kasutaja ajavööndis.

## Hinnangud

- Poolestusajad on failis `src/lib/intake/substances.ts` (kofeiin 5 h, nikotiin 2 h). Kehas oleva koguse arvutus on `src/lib/intake/decay.ts`.
- Kõik numbrid on hinnangud, mitte meditsiiniline nõuanne — kasutajaliideses peab see nii ka paistma.

## Kvaliteet

- `npm run lint`, `npm run typecheck` ja `npm test` peavad enne PR-i läbi minema.
- Uus loogika (nt arvutused, valideerimine, päeva piirid) tuleb koos unit-testiga.
- Andmebaasi testid: `npx supabase test db` (vajab Dockerit ja `npx supabase start`).
- GitHub Actions kontrollib igas PR-is rakendust (lint, typecheck, testid, build) ja andmebaasi teste, kui PR muudab kausta `supabase/`. PR-i ei merge'ita, kui mõni kontroll on punane.
- Saladusi (paroolid, secret võtmed, `.env.local`) ei commitita. Kasutajatesti kontaktisiku andmeid ei panda repo'sse.
