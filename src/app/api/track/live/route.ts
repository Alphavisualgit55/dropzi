import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Heartbeat — maintient la session active
export async function POST(request: NextRequest) {
  try {
    const { id, page } = await request.json()
    if (!id) return NextResponse.json({ ok: false })

    await supabase.from('sessions_live').upsert({
      id,
      page: page || '/',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    // Nettoyer les sessions expirées
    await supabase.from('sessions_live')
      .delete()
      .lt('updated_at', new Date(Date.now() - 35000).toISOString())

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

// Compter les visiteurs actifs
export async function GET() {
  try {
    // Nettoyer d'abord
    await supabase.from('sessions_live')
      .delete()
      .lt('updated_at', new Date(Date.now() - 35000).toISOString())

    const { count } = await supabase
      .from('sessions_live')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({ live: count || 0 })
  } catch {
    return NextResponse.json({ live: 0 })
  }
}
