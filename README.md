# StimTracker

Kofeiini ja nikotiini jälgija: logi, mida jõid või tarbisid, ja vaata, kui palju sellest on hinnanguliselt veel kehas.

Next.js (App Router) · TypeScript · Supabase · Vitest

## Käivitamine

```bash
npm install
cp .env.example .env.local   # täida Supabase'i väärtused
npm run dev                  # http://localhost:3000
```

## Käsud

| Käsk | Mida teeb |
| --- | --- |
| `npm run dev` | arendusserver |
| `npm run build` | tootmisbuild |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScripti kontroll |
| `npm test` | Vitesti testid |

## Töövoog

- Iga muudatus algab issue'st, branch on `<tüüp>/<issue nr>-<lühinimi>` (nt `feat/4-today-page`).
- Commitid [Angulari formaadis](https://www.conventionalcommits.org/): `feat(ui): ...`, `fix: ...`, `test: ...`.
- Main'i otse ei pushi keegi: PR, teise liikme review, siis merge.
