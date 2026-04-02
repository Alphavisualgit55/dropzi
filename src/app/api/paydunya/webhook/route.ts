import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function activatePlan(token: string) {
  const mode = process.env.PAYDUNYA_MODE || 'live'
  const confirmUrl = mode === 'test'
    ? `https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/${token}`
    : `https://app.paydunya.com/api/v1/checkout-invoice/confirm/${token}`

  const res = await fetch(confirmUrl, {
    headers: {
      'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY!,
      'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY!,
      'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN!,
    }
  })

  const data = await res.json()
  console.log('PayDunya confirm response:', JSON.stringify(data).slice(0, 500))

  // PayDunya peut renvoyer completed, success, COMPLETED...
  const status = (data.status || '').toLowerCase()
  const isCompleted = status === 'completed' || status === 'success' || data.response_code === '00'
  if (!isCompleted) return { ok: false, reason: 'not_completed', status: data.status }

  const customData = data.custom_data || data.invoice?.custom_data || {}
  const montant = data.invoice?.total_amount || customData.montant || 0

  // Chercher d'abord dans abonnements par token
  let userId = customData.user_id
  let plan = customData.plan

  const { data: abo } = await supabase
    .from('abonnements')
    .select('user_id, plan')
    .eq('paydunya_token', token)
    .maybeSingle()

  if (abo) {
    userId = userId || abo.user_id
    plan = plan || abo.plan
  }

  if (!userId || !plan) {
    console.error('Webhook: userId ou plan manquant', { userId, plan, customData })
    return { ok: false, reason: 'no_user_or_plan', customData }
  }

  const fin = new Date()
  fin.setDate(fin.getDate() + 30)
  const finStr = fin.toISOString()
  const now = new Date().toISOString()

  // 1. Mettre à jour profiles IMMÉDIATEMENT
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ plan, plan_expires: finStr })
    .eq('id', userId)

  if (profileErr) console.error('Erreur update profiles:', profileErr)

  // 2. Upsert abonnements
  const { error: aboErr } = await supabase
    .from('abonnements')
    .upsert({
      user_id: userId,
      plan,
      statut: 'actif',
      paydunya_token: token,
      montant,
      debut: now,
      fin: finStr,
      updated_at: now,
    }, { onConflict: 'user_id' })

  if (aboErr) console.error('Erreur upsert abonnements:', aboErr)

  // 3. Notification
  try { await supabase.from('notifications_user').insert({ user_id: userId, titre: `🎉 Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} activé !`, message: `Ton abonnement Dropzi ${plan} est actif jusqu'au ${fin.toLocaleDateString('fr-FR')}.`, type: 'success' }) } catch(_) {}

  // 4. Commission affiliation
  try {
    const { data: profil } = await supabase
      .from('profiles')
      .select('affilie_id')
      .eq('id', userId)
      .single()

    if (profil?.affilie_id && montant > 0) {
      const commission = Math.round(montant * 0.5)
      try { await supabase.rpc('crediter_affilie', { p_affilie_id: profil.affilie_id, p_montant: commission }) } catch(_) {}
      try { await supabase.from('commissions').insert({ affilie_id: profil.affilie_id, filleul_user_id: userId, montant: commission, montant_abonnement: montant, plan, statut: 'valide' }) } catch(_) {}
      const { data: aff } = await supabase.from('affilies').select('user_id').eq('id', profil.affilie_id).single()
      if (aff) {
        try { await supabase.from('notifications_user').insert({ user_id: aff.user_id, titre: `💰 Commission ${commission} FCFA reçue !`, message: `Un de tes contacts vient de souscrire au plan ${plan}.`, type: 'success' }) } catch(_) {}
      }
    }
  } catch (e) {
    console.error('Erreur commission:', e)
  }

  console.log(`✅ Plan ${plan} activé pour user ${userId} jusqu'au ${finStr}`)
  return { ok: true, userId, plan, fin: finStr }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Webhook body keys:', Object.keys(body))

    const token =
      body.data?.invoice?.token ||
      body.invoice?.token ||
      body.token ||
      body.data?.token ||
      body.custom_data?.token

    if (!token) {
      console.error('Webhook: token manquant dans', JSON.stringify(body).slice(0, 300))
      return NextResponse.json({ ok: false, reason: 'no_token' })
    }

    const result = await activatePlan(token)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('Webhook error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'Dropzi PayDunya Webhook' })
}
