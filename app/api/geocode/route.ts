import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const adresa = request.nextUrl.searchParams.get('adresa')

  if (!adresa) {
    return Response.json({ error: 'Chybí parametr adresa' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', adresa)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'cz')

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FirmaCheck/1.0 (motovsky@gmail.com)',
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      return Response.json(null)
    }

    const results = await res.json()
    if (!Array.isArray(results) || results.length === 0) {
      return Response.json(null)
    }

    const { lat, lon } = results[0]
    return Response.json({ lat: parseFloat(lat), lng: parseFloat(lon) })
  } catch {
    return Response.json(null)
  } finally {
    clearTimeout(timeout)
  }
}
