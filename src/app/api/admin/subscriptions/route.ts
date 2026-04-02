import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('abonnements')
      .select('*, profiles(email, nom_boutique, plan, plan_expires, created_at)')
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json({ ok: false, error: error.message })
    return NextResponse.json({ ok: true, abonnements: data || [] })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
