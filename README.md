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

### Prompt 1 – Vygenerování celé aplikace (Claude Code)

> Vytvoř kompletní FirmaCheck aplikaci v Next.js 14 (app router, TypeScript, Tailwind CSS).
>
> ## Co aplikace dělá:
> 1. Uživatel zadá IČO české firmy (8 číslic)
> 2. Backend zavolá ARES API: https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ICO}
> 3. Výsledek se cachuje do SQLite (better-sqlite3)
> 4. Zobrazí se karta s info o firmě (název, IČO, adresa, právní forma, datum vzniku)
> 5. Pod kartou je mapa sídla firmy (Leaflet.js + OpenStreetMap + Nominatim geokódování adresy na lat/lng)
> 6. Firmu lze uložit do SQLite tabulky ulozenych firem
> 7. Dole na stránce je tabulka uložených firem s tlačítkem CSV export
>
> ## Soubory které vytvoř:
>
> ### lib/db.ts
> - inicializace SQLite databáze v /tmp/firmacheck.db
> - tabulka cache_firem: ico TEXT PRIMARY KEY, data TEXT, cached_at INTEGER
> - tabulka ulozene_firmy: id INTEGER PRIMARY KEY, ico TEXT, nazev TEXT, adresa TEXT, ulozeno_at INTEGER
>
> ### lib/ares.ts
> - funkce fetchFirma(ico: string) která nejdřív zkusí cache, pak ARES API
> - parsuje odpověď z ARES do objektu: { ico, nazev, adresa, pravniForma, datumVzniku }
> - adresa = složena z obec, ulice, cisloDomovni, psc
>
> ### app/api/firma/route.ts
> - GET /api/firma?ico=XXXXXXXX
> - validace IČO (8 číslic)
> - vrátí JSON s daty firmy nebo error
>
> ### app/api/ulozene/route.ts
> - GET /api/ulozene - seznam uložených firem
> - POST /api/ulozene - uloží firmu (body: { ico, nazev, adresa })
> - GET /api/ulozene?export=csv - vrátí CSV soubor
>
> ### app/api/geocode/route.ts
> - GET /api/geocode?adresa=...
> - zavolá Nominatim: https://nominatim.openstreetmap.org/search?q={adresa}&format=json&limit=1&countrycodes=cz
> - vrátí { lat, lng } nebo null
>
> ### app/page.tsx
> - hlavní stránka s tmavým moderním designem (dark background #0f172a, accent #3b82f6)
> - input pole pro IČO s tlačítkem Vyhledat
> - loading stav
> - karta s výsledkem firmy
> - mapa (dynamicky importovaná, ssr: false) pod kartou
> - tlačítko Uložit firmu
> - sekce Uložené firmy s tabulkou a tlačítkem Exportovat CSV
>
> ### components/FirmaMap.tsx
> - React komponenta s Leaflet mapou
> - přijímá props: lat, lng, nazev
> - zobrazí marker s popupem s názvem firmy
> - výška mapy 300px
>
> ## Důležité technické detaily:
> - Leaflet musí být importován dynamicky (window is not defined na serveru)
> - přidej do package.json: leaflet, @types/leaflet
> - v globals.css přidej import leaflet/dist/leaflet.css
> - SQLite db inicializuj lazy (až při prvním použití, ne při importu modulu)
> - všechny fetch volání mají timeout 10s a error handling
> - README.md aktualizuj s popisem projektu a architekturou
>
> Začni vytvořením souborů v tomto pořadí: lib/db.ts, lib/ares.ts, api routes, page.tsx, FirmaMap.tsx. Po vytvoření všech souborů spusť npm install leaflet @types/leaflet.

### Prompt 2 – Oprava Leaflet race condition (Claude Code)

> V components/FirmaMap.tsx je stále chyba Map container is already initialized. Problém je race condition - async import('leaflet').then() se dokončí až po cleanup. Přidej cancelled flag do useEffect aby async callback neinicializoval mapu po cleanup.

### Prompt 3 – Generování loga (Ideogram.ai)

> Modern minimalist tech logo, dark navy background #0f172a, glowing blue magnifying glass, inside the lens show a clean white document/registry icon with lines representing a list or database records, geometric flat design, subtle grid lines, professional SaaS app icon style, white and electric blue #3b82f6 colors only, no text, clean vector look

### Prompt 4 – Přidání loga do aplikace (Claude Code)

> Přidej logo do aplikace. Soubor je v public/logo.webp. Zobraz ho v hlavičce stránky vlevo nahoře vedle textu FirmaCheck, velikost 48x48px.

## 7. Postup vývoje a iterace

### Co fungovalo hned

Úvodní prompt byl záměrně velmi detailní – specifikoval nejen co aplikace dělá, ale i strukturu souborů, schéma databázových tabulek, formát API odpovědí a pořadí vytváření souborů. Díky tomu Claude Code vygeneroval veškerý funkční kód v jediném kroku: všechny API route handlery, SQLite vrstvu, parsování ARES API i kompletní UI s dark tématem. `npm run build` prošel bez chyb hned napoprvé (po jedné drobné úpravě – odstranění Google Fonts, které nebyly dostupné v buildu).

### Co bylo potřeba iterovat

**Leaflet – Map container is already initialized** byl nejsložitější problém. Chyba se objevila kvůli kombinaci dvou faktorů:

1. React Strict Mode v development módu záměrně spouští každý `useEffect` dvakrát za sebou, aby odhalil vedlejší efekty
2. `import('leaflet')` je async operace – Promise se resolví až po tom, co React stihne spustit cleanup předchozího efektu

První oprava přidala guard `if (mapRef.current) { map.remove() }` před inicializaci. To nestačilo, protože cleanup proběhl synchronně, ale Promise s Leaflet se resolví asynchronně – v okamžiku, kdy callback konečně zavolal `L.map()`, byl container z pohledu Leaflet ještě stále „obsazený". Druhá, správná oprava přidala `cancelled` flag: cleanup ho nastaví na `true` synchronně, a async callback ho zkontroluje jako první věc – pokud je `true`, inicializaci přeskočí.

**Logo se nenačítalo** – `next/image` vracelo v Network tabu status 0 a 0 B. Příčina nebyla dohledána, ale přechod na obyčejný `<img>` tag problém okamžitě vyřešil.

### Shrnutí iterací

| Iterace | Problém | Řešení |
|---------|---------|--------|
| 1 | Google Fonts nedostupné při buildu | Odstraněn import `next/font/google` z `layout.tsx` |
| 2 | Leaflet: guard nestačil kvůli async | Přidán `cancelled` flag do `useEffect` |
| 3 | Logo se nenačítalo přes `next/image` | Nahrazeno standardním `<img>` tagem |

## 8. Spuštění lokálně

```bash
npm install
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

## 9. AI vizuální prvek

![FirmaCheck logo](./public/logo.webp)

Logo vygenerováno pomocí **Ideogram.ai**.
