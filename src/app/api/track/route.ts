import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, referrer } = body
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''

    // Détecter le pays depuis l'IP (basique)
    const pays = request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') || 'SN'

    await supabase.from('visites').insert({
      page: page || '/',
      referrer: referrer || null,
      user_agent: userAgent.slice(0, 200),
      pays,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  // Visiteurs actifs (dernières 5 minutes)
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('visites')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since)
  return NextResponse.json({ live: count || 0 })
}
