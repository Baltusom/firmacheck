'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

const FirmaMap = dynamic(() => import('@/components/FirmaMap'), { ssr: false })

interface FirmaData {
  ico: string
  nazev: string
  adresa: string
  pravniForma: string
  datumVzniku: string
}

interface UlozenáFirma {
  id: number
  ico: string
  nazev: string
  adresa: string
  ulozeno_at: number
}

interface MapCoords {
  lat: number
  lng: number
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 font-medium" style={{ color: '#64748b' }}>
        {label}
      </dt>
      <dd style={{ color: '#cbd5e1' }}>{value}</dd>
    </div>
  )
}

export default function Home() {
  const [ico, setIco] = useState('')
  const [loading, setLoading] = useState(false)
  const [firma, setFirma] = useState<FirmaData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mapCoords, setMapCoords] = useState<MapCoords | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [ulozene, setUlozene] = useState<UlozenáFirma[]>([])
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadUlozene = useCallback(async () => {
    try {
      const res = await fetch('/api/ulozene')
      if (res.ok) setUlozene(await res.json())
    } catch {
      // silently ignore network errors for saved list
    }
  }, [])

  useEffect(() => {
    loadUlozene()
  }, [loadUlozene])

  const geocodeAdresa = useCallback(async (adresa: string) => {
    setGeocoding(true)
    setMapCoords(null)
    try {
      const res = await fetch(`/api/geocode?adresa=${encodeURIComponent(adresa)}`)
      if (res.ok) {
        const coords = await res.json()
        if (coords) setMapCoords(coords)
      }
    } finally {
      setGeocoding(false)
    }
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = ico.trim()
    if (!/^\d{8}$/.test(trimmed)) {
      setError('IČO musí být přesně 8 číslic')
      return
    }

    setLoading(true)
    setError(null)
    setFirma(null)
    setMapCoords(null)
    setSaveStatus(null)

    try {
      const res = await fetch(`/api/firma?ico=${trimmed}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Neznámá chyba')
        return
      }
      setFirma(data)
      geocodeAdresa(data.adresa)
    } catch {
      setError('Nelze se připojit k serveru')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!firma) return
    setSaving(true)
    setSaveStatus(null)

    try {
      const res = await fetch('/api/ulozene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ico: firma.ico, nazev: firma.nazev, adresa: firma.adresa }),
      })
      if (res.status === 409) {
        setSaveStatus('Firma je již uložena')
      } else if (res.ok) {
        setSaveStatus('Firma byla uložena')
        loadUlozene()
      } else {
        const d = await res.json()
        setSaveStatus(d.error ?? 'Chyba při ukládání')
      }
    } catch {
      setSaveStatus('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#3b82f6' }}>
            FirmaCheck
          </h1>
          <p style={{ color: '#94a3b8' }}>Ověření české firmy podle IČO z registru ARES</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={ico}
              onChange={(e) => setIco(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="Zadejte IČO (8 číslic)"
              maxLength={8}
              className="flex-1 rounded-lg px-4 py-3 text-white text-lg outline-none"
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
              }}
            />
            <button
              type="submit"
              disabled={loading || ico.length !== 8}
              className="rounded-lg px-6 py-3 font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#3b82f6' }}
            >
              {loading ? 'Hledám…' : 'Vyhledat'}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm" style={{ color: '#f87171' }}>
              {error}
            </p>
          )}
        </form>

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center mb-8">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {/* Company card */}
        {firma && (
          <div
            className="rounded-xl p-6 mb-6 shadow-lg"
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#f1f5f9' }}>
              {firma.nazev}
            </h2>
            <dl className="space-y-2 text-sm">
              <Row label="IČO" value={firma.ico} />
              <Row label="Adresa" value={firma.adresa} />
              <Row label="Právní forma" value={firma.pravniForma} />
              <Row label="Datum vzniku" value={firma.datumVzniku} />
            </dl>

            <div className="mt-5 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#22c55e' }}
              >
                {saving ? 'Ukládám…' : 'Uložit firmu'}
              </button>
              {saveStatus && (
                <span className="text-sm" style={{ color: '#94a3b8' }}>
                  {saveStatus}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        {firma && (
          <div
            className="rounded-xl overflow-hidden mb-10"
            style={{ border: '1px solid #334155' }}
          >
            {geocoding && (
              <div
                className="flex items-center justify-center"
                style={{ height: '300px', backgroundColor: '#1e293b', color: '#64748b' }}
              >
                Geokóduji adresu…
              </div>
            )}
            {!geocoding && mapCoords && (
              <FirmaMap lat={mapCoords.lat} lng={mapCoords.lng} nazev={firma.nazev} />
            )}
            {!geocoding && !mapCoords && (
              <div
                className="flex items-center justify-center"
                style={{ height: '300px', backgroundColor: '#1e293b', color: '#64748b' }}
              >
                Polohu firmy se nepodařilo určit
              </div>
            )}
          </div>
        )}

        {/* Saved companies */}
        {ulozene.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#cbd5e1' }}>
                Uložené firmy
              </h3>
              <a
                href="/api/ulozene?export=csv"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: '#475569' }}
              >
                Exportovat CSV
              </a>
            </div>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid #334155' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', color: '#64748b' }}>
                    <th className="px-4 py-3 text-left font-medium">Název</th>
                    <th className="px-4 py-3 text-left font-medium">IČO</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Adresa</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Uloženo</th>
                  </tr>
                </thead>
                <tbody>
                  {ulozene.map((f, i) => (
                    <tr
                      key={f.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? '#1e293b' : '#182032',
                        borderTop: '1px solid #334155',
                      }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: '#f1f5f9' }}>
                        {f.nazev}
                      </td>
                      <td className="px-4 py-3 font-mono" style={{ color: '#94a3b8' }}>
                        {f.ico}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell" style={{ color: '#94a3b8' }}>
                        {f.adresa}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell" style={{ color: '#64748b' }}>
                        {new Date(f.ulozeno_at).toLocaleDateString('cs-CZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
