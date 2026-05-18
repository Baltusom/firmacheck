import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'

interface UlozenáFirma {
  id: number
  ico: string
  nazev: string
  adresa: string
  ulozeno_at: number
}

export async function GET(request: NextRequest) {
  const exportCsv = request.nextUrl.searchParams.get('export') === 'csv'
  const db = getDb()

  const firmy = db
    .prepare('SELECT * FROM ulozene_firmy ORDER BY ulozeno_at DESC')
    .all() as UlozenáFirma[]

  if (exportCsv) {
    const header = 'IČO,Název,Adresa,Datum uložení\n'
    const rows = firmy
      .map((f) => {
        const datum = new Date(f.ulozeno_at).toLocaleDateString('cs-CZ')
        const nazev = `"${f.nazev.replace(/"/g, '""')}"`
        const adresa = `"${f.adresa.replace(/"/g, '""')}"`
        return `${f.ico},${nazev},${adresa},${datum}`
      })
      .join('\n')

    return new Response(header + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="firmacheck-export.csv"',
      },
    })
  }

  return Response.json(firmy)
}

export async function POST(request: NextRequest) {
  let body: { ico?: string; nazev?: string; adresa?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Neplatné tělo požadavku' }, { status: 400 })
  }

  const { ico, nazev, adresa } = body
  if (!ico || !nazev || !adresa) {
    return Response.json({ error: 'Chybí povinná pole: ico, nazev, adresa' }, { status: 400 })
  }

  const db = getDb()
  const existing = db
    .prepare('SELECT id FROM ulozene_firmy WHERE ico = ?')
    .get(ico)

  if (existing) {
    return Response.json({ error: 'Firma s tímto IČO je již uložena' }, { status: 409 })
  }

  const result = db
    .prepare('INSERT INTO ulozene_firmy (ico, nazev, adresa, ulozeno_at) VALUES (?, ?, ?, ?)')
    .run(ico, nazev, adresa, Date.now())

  return Response.json({ id: result.lastInsertRowid }, { status: 201 })
}
