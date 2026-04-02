import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRIX: Record<string, number> = { starter: 3000, business: 5000, elite: 15000 }

export async function POST(request: NextRequest) {
  try {
    const { user_id, plan, expires_days } = await request.json()
    if (!user_id || !plan) return NextResponse.json({ ok: false, error: 'user_id et plan requis' })

    const fin = new Date()
    fin.setDate(fin.getDate() + (expires_days || 30))
    const finStr = fin.toISOString()

    // Utiliser une fonction SQL avec security definer pour bypass absolu
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('admin_set_plan', {
      p_user_id: user_id,
      p_plan: plan,
      p_expires: finStr,
      p_montant: PRIX[plan] || 0,
    })

    console.log('admin_set_plan RPC result:', rpcResult, 'error:', rpcErr)

    if (rpcErr) {
      // Fallback : update direct avec service role
      console.log('RPC failed, trying direct update...')
      
      const { data: d1, error: e1 } = await supabase
        .from('profiles')
        .update({ plan, plan_expires: finStr })
        .eq('id', user_id)
        .select('id, plan, plan_expires')
      
      console.log('Direct update result:', d1, e1)

      if (e1) return NextResponse.json({ ok: false, error: e1.message })
      if (!d1 || d1.length === 0) return NextResponse.json({ ok: false, error: 'User introuvable: ' + user_id })

      // Abonnements
      const { error: e2 } = await supabase.from('abonnements').upsert({
        user_id, plan,
        statut: plan === 'aucun' ? 'expire' : 'actif',
        montant: PRIX[plan] || 0,
        debut: new Date().toISOString(),
        fin: finStr,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (e2) console.error('Abonnements error:', e2)

      return NextResponse.json({ ok: true, plan: d1[0].plan, fin: finStr, method: 'direct' })
    }

    // RPC a marché
    try {
      await supabase.from('notifications_user').insert({
        user_id,
        titre: `🎉 Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} activé !`,
        message: `Ton abonnement Dropzi ${plan} est maintenant actif.`,
        type: 'success',
      })
    } catch(_) {}

    return NextResponse.json({ ok: true, plan, fin: finStr, method: 'rpc' })
  } catch (e: any) {
    console.error('set-plan error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
