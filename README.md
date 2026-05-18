# FirmaCheck

## 1. Popis projektu

FirmaCheck je webová aplikace pro ověřování českých firem podle IČO. Uživatel zadá osmimístné IČO a aplikace zobrazí základní informace z registru ARES, interaktivní mapu sídla firmy, umožní firmu uložit do seznamu a celý seznam exportovat do CSV.

**Live demo:** [https://firmacheck-cyan.vercel.app](https://firmacheck-cyan.vercel.app)

## 2. Funkce

- Vyhledávání firmy podle IČO přes ARES API
- SQLite cache výsledků (TTL 24 hodin)
- Mapa sídla firmy (Leaflet + OpenStreetMap + Nominatim geokódování)
- Uložení firem do lokální databáze
- Export uložených firem do CSV

## 3. Technologie

- **Next.js 16**, TypeScript, Tailwind CSS v4
- **better-sqlite3** – SQLite cache a uložené firmy
- **Leaflet.js** – interaktivní mapa
- **ARES API** – `ares.gov.cz` – zdroj dat o firmách
- **Nominatim** – geokódování adresy na souřadnice (OpenStreetMap)

## 4. Architektura

| Soubor | Účel |
|--------|------|
| `/app/api/firma` | ARES API + cache logika |
| `/app/api/ulozene` | Správa uložených firem + CSV export |
| `/app/api/geocode` | Geokódování adresy → lat/lng |
| `/lib/db.ts` | Lazy inicializace SQLite (`/tmp/firmacheck.db`) |
| `/lib/ares.ts` | `fetchFirma()` – cache → ARES → parsování |
| `/components/FirmaMap.tsx` | Leaflet mapa (dynamický import, `ssr: false`) |

## 5. AI nástroje použité při vývoji

- **Claude Code** (claude.ai) – generování veškerého kódu, debugging, návrh architektury
- **Ideogram.ai** – generování loga aplikace

## 6. Použité prompty (klíčové)

1. **Úvodní prompt** – komplexní zadání celé aplikace: Next.js 16, App Router, TypeScript, Tailwind CSS, SQLite cache, ARES API, Leaflet mapa, uložené firmy, CSV export – vygenerovalo kompletní kódovou základnu v jednom kroku.

2. **Oprava Leaflet race condition** – *„Map container is already initialized – přidej cancelled flag do useEffect aby async import('leaflet').then() neinicializoval mapu po cleanup"* – odhalilo a opravilo race condition mezi async importem Leaflet a React cleanup funkcí.

3. **Generování loga (Ideogram.ai)** – *„Modern minimalist logo for a Czech company verification app called FirmaCheck. Dark blue background, stylized building/company icon combined with a checkmark, blue and white color scheme, clean sans-serif typography"*

## 7. Postup vývoje a iterace

1. **Inicializace** – `create-next-app` s TypeScript, Tailwind CSS a better-sqlite3
2. **Generování kódu** – jeden prompt vygeneroval všechny soubory: `lib/db.ts`, `lib/ares.ts`, tři API route handlery, `page.tsx` a `FirmaMap.tsx`
3. **Debugging** – oprava chyby Leaflet `Map container is already initialized` způsobené race condition v `useEffect` (async import + React Strict Mode double-invoke)
4. **Logo** – vygenerováno v Ideogram.ai, přidáno do hlavičky stránky
5. **Deploy** – nasazení na Vercel přes GitHub integraci

## 8. Spuštění lokálně

```bash
npm install
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

## 9. AI vizuální prvek

![FirmaCheck logo](./public/logo.webp)

Logo vygenerováno pomocí **Ideogram.ai**.
