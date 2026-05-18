import { getDb } from './db'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

const PRAVNI_FORMA: Record<string, string> = {
  '101': 'Fyzická osoba (živnostník)',
  '105': 'Fyzická osoba podnikatel',
  '111': 'Veřejná obchodní společnost (v.o.s.)',
  '112': 'Spol. s r.o. (s.r.o.)',
  '113': 'Komanditní společnost (k.s.)',
  '121': 'Akciová společnost (a.s.)',
  '122': 'Komanditní akciová společnost',
  '205': 'Obecně prospěšná společnost',
  '211': 'Evropská společnost',
  '301': 'Státní podnik',
  '305': 'Příspěvková organizace',
  '331': 'Příspěvková org. zřízená ÚSC',
  '421': 'Nadace',
  '422': 'Nadační fond',
  '441': 'Spolek',
  '601': 'Vysoká škola',
}

export interface FirmaData {
  ico: string
  nazev: string
  adresa: string
  pravniForma: string
  datumVzniku: string
}

interface AresSidlo {
  nazevObce?: string
  nazevUlice?: string
  cisloDomovni?: number
  cisloOrientacni?: number
  cisloOrientacniPismeno?: string
  psc?: number
  textovaAdresa?: string
}

interface AresResponse {
  ico: string
  obchodniJmeno: string
  sidlo: AresSidlo
  pravniForma?: string
  datumVzniku?: string
}

function buildAdresa(sidlo: AresSidlo): string {
  if (sidlo.textovaAdresa) return sidlo.textovaAdresa

  const parts: string[] = []

  if (sidlo.nazevUlice) {
    let streetPart = sidlo.nazevUlice
    if (sidlo.cisloDomovni) {
      streetPart += ` ${sidlo.cisloDomovni}`
      if (sidlo.cisloOrientacni) {
        streetPart += `/${sidlo.cisloOrientacni}${sidlo.cisloOrientacniPismeno ?? ''}`
      }
    }
    parts.push(streetPart)
  }

  const pscFormatted = sidlo.psc
    ? String(sidlo.psc).padStart(5, '0').replace(/^(\d{3})(\d{2})$/, '$1 $2')
    : ''
  const cityPart = [pscFormatted, sidlo.nazevObce].filter(Boolean).join(' ')
  if (cityPart) parts.push(cityPart)

  return parts.join(', ')
}

function formatDatum(datum?: string): string {
  if (!datum) return 'Neznámo'
  try {
    return new Date(datum).toLocaleDateString('cs-CZ')
  } catch {
    return datum
  }
}

async function fetchFromAres(ico: string): Promise<FirmaData> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    )

    if (!res.ok) {
      if (res.status === 404) throw new Error('Firma s tímto IČO nebyla nalezena')
      throw new Error(`ARES API chyba: ${res.status}`)
    }

    const data: AresResponse = await res.json()

    return {
      ico: data.ico,
      nazev: data.obchodniJmeno,
      adresa: buildAdresa(data.sidlo),
      pravniForma: data.pravniForma
        ? (PRAVNI_FORMA[data.pravniForma] ?? `Kód ${data.pravniForma}`)
        : 'Neznámo',
      datumVzniku: formatDatum(data.datumVzniku),
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchFirma(ico: string): Promise<FirmaData> {
  const db = getDb()

  const cached = db
    .prepare('SELECT data, cached_at FROM cache_firem WHERE ico = ?')
    .get(ico) as { data: string; cached_at: number } | undefined

  if (cached && Date.now() - cached.cached_at < CACHE_TTL_MS) {
    return JSON.parse(cached.data) as FirmaData
  }

  const firma = await fetchFromAres(ico)

  db.prepare(
    'INSERT OR REPLACE INTO cache_firem (ico, data, cached_at) VALUES (?, ?, ?)'
  ).run(ico, JSON.stringify(firma), Date.now())

  return firma
}
