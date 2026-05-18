# FirmaCheck

Webová aplikace pro ověřování českých firem podle IČO. Zobrazí základní informace z registru ARES, polohu sídla na mapě, umožní firmy ukládat do seznamu a exportovat do CSV.

## Funkce

- Vyhledání firmy podle IČO (8 číslic) v registru ARES
- Zobrazení karty firmy: název, IČO, adresa, právní forma, datum vzniku
- Interaktivní mapa sídla (Leaflet + OpenStreetMap) s geokódováním přes Nominatim
- Uložení firmy do lokální SQLite databáze
- Tabulka uložených firem s exportem do CSV

## Architektura

```
app/
  page.tsx               – hlavní stránka (Client Component)
  api/
    firma/route.ts       – GET /api/firma?ico= → data z ARES nebo cache
    ulozene/route.ts     – GET/POST /api/ulozene, GET ?export=csv
    geocode/route.ts     – GET /api/geocode?adresa= → lat/lng z Nominatim

lib/
  db.ts                  – lazy inicializace SQLite (/tmp/firmacheck.db)
  ares.ts                – fetchFirma(): cache → ARES API → parsování

components/
  FirmaMap.tsx           – Leaflet mapa (dynamicky importovaná, ssr: false)
```

### SQLite tabulky

| Tabulka | Sloupce |
|---------|---------|
| `cache_firem` | `ico`, `data` (JSON), `cached_at` (ms timestamp) |
| `ulozene_firmy` | `id`, `ico`, `nazev`, `adresa`, `ulozeno_at` (ms timestamp) |

Cache firem má TTL 24 hodin. Databáze se vytváří při prvním požadavku v `/tmp/firmacheck.db`.

## Spuštění

```bash
npm install
npm run dev
```

Aplikace běží na http://localhost:3000.

## Technologie

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **better-sqlite3** – SQLite cache a uložené firmy
- **Leaflet.js** – interaktivní mapa
- **ARES API** – `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/`
- **Nominatim** – geokódování adres (OpenStreetMap)
