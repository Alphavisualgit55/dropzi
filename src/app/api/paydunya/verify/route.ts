import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json()
    if (!user_id) return NextResponse.json({ ok: false, error: 'user_id requis' })

    const { data: abo } = await supabase
      .from('abonnements').select('*').eq('user_id', user_id).maybeSingle()

    if (!abo || !abo.paydunya_token) {
      return NextResponse.json({ ok: false, reason: 'no_pending_payment' })
    }

    // Déjà actif
    if (abo.statut === 'actif' && abo.fin && new Date(abo.fin) > new Date()) {
      return NextResponse.json({ ok: true, already_active: true, plan: abo.plan })
    }

    // Vérifier auprès de PayDunya
    const mode = process.env.PAYDUNYA_MODE || 'live'
    const confirmUrl = mode === 'test'
      ? `https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/${abo.paydunya_token}`
      : `https://app.paydunya.com/api/v1/checkout-invoice/confirm/${abo.paydunya_token}`

    const res = await fetch(confirmUrl, {
      headers: {
        'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY!,
        'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY!,
        'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN!,
      }
    })

    const data = await res.json()
    const isPaid = ['completed', 'success', 'paid'].includes((data.status || '').toLowerCase())

    if (!isPaid) {
      return NextResponse.json({ ok: false, reason: 'not_paid_yet', status: data.status })
    }

    // Activer
    const fin = new Date(); fin.setDate(fin.getDate() + 30)
    const finStr = fin.toISOString()
    await supabase.from('profiles').update({ plan: abo.plan, plan_expires: finStr }).eq('id', user_id)
    await supabase.from('abonnements').update({ statut: 'actif', fin: finStr, updated_at: new Date().toISOString() }).eq('user_id', user_id)
    try {
      await supabase.from('notifications_user').insert({
        user_id, titre: `🎉 Plan ${abo.plan} activé !`,
        message: `Ton abonnement est actif jusqu'au ${fin.toLocaleDateString('fr-FR')}.`, type: 'success',
      })
    } catch(_) {}

    console.log(`✅ Plan ${abo.plan} activé manuellement pour ${user_id}`)
    return NextResponse.json({ ok: true, activated: true, plan: abo.plan, fin: finStr })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
