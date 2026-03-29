import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sheetId = searchParams.get('id')
  const gid = searchParams.get('gid') || '0'
  const directUrl = searchParams.get('url')

  // Support URL directe (pour CSV Shopify ou Google Sheet pub)
  if (directUrl) {
    try {
      const res = await fetch(directUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 0 } })
      if (!res.ok) return NextResponse.json({ error: 'Impossible de lire le fichier.' }, { status: res.status })
      const text = await res.text()
      return NextResponse.json({ csv: text })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  if (!sheetId) {
    return NextResponse.json({ error: 'Sheet ID manquant' }, { status: 400 })
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Impossible de lire le fichier. Vérifie que le partage est activé (Toute personne avec le lien).' },
        { status: res.status }
      )
    }

    const text = await res.text()
    return NextResponse.json({ csv: text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
