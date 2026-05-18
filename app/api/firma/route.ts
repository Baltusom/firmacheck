import { NextRequest } from 'next/server'
import { fetchFirma } from '@/lib/ares'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const ico = request.nextUrl.searchParams.get('ico')

  if (!ico || !/^\d{8}$/.test(ico)) {
    return Response.json(
      { error: 'IČO musí být přesně 8 číslic' },
      { status: 400 }
    )
  }

  try {
    const firma = await fetchFirma(ico)
    return Response.json(firma)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Neznámá chyba'
    return Response.json({ error: message }, { status: 500 })
  }
}
