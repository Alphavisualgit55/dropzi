import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function activerPlan(userId: string, plan: string, token: string, montant: number) {
  const fin = new Date()
  fin.setDate(fin.getDate() + 30)
  const finStr = fin.toISOString()
  const now = new Date().toISOString()

  const { error: e1 } = await supabase
    .from('profiles')
    .update({ plan, plan_expires: finStr })
    .eq('id', userId)

  if (e1) {
    console.error('ERREUR update profiles:', e1.message)
    return { ok: false, error: e1.message }
  }

  await supabase.from('abonnements').upsert({
    user_id: userId, plan, statut: 'actif',
    paydunya_token: token, montant,
    debut: now, fin: finStr, updated_at: now,
  }, { onConflict: 'user_id' })

  // Vérification immédiate
  const { data: check } = await supabase
    .from('profiles').select('plan, plan_expires').eq('id', userId).single()
  console.log(`✅ Vérification post-activation - plan en DB: ${check?.plan} | attendu: ${plan}`)

  try {
    await supabase.from('notifications_user').insert({
      user_id: userId,
      titre: `🎉 Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} activé !`,
      message: `Ton abonnement est actif jusqu'au ${fin.toLocaleDateString('fr-FR')}.`,
      type: 'success',
    })
  } catch(_) {}

  // Commission affiliation
  try {
    const { data: profil } = await supabase
      .from('profiles').select('affilie_id').eq('id', userId).single()
    if (profil?.affilie_id && montant > 0) {
      const commission = Math.round(montant * 0.5)
      await supabase.rpc('crediter_affilie', { p_affilie_id: profil.affilie_id, p_montant: commission })
      await supabase.from('commissions').insert({
        affilie_id: profil.affilie_id, filleul_user_id: userId,
        montant: commission, montant_abonnement: montant, plan, statut: 'valide',
      })
      const { data: aff } = await supabase.from('affilies').select('user_id').eq('id', profil.affilie_id).single()
      if (aff) {
        await supabase.from('notifications_user').insert({
          user_id: aff.user_id,
          titre: `💰 Commission +${commission} FCFA !`,
          message: `Un contact a souscrit au plan ${plan}.`,
          type: 'success',
        })
      }
    }
  } catch(e) { console.error('Erreur commission:', e) }

  return { ok: true, plan, fin: finStr }
}

async function confirmerPaiement(token: string) {
  const mode = process.env.PAYDUNYA_MODE || 'live'
  const url = mode === 'test'
    ? `https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/${token}`
    : `https://app.paydunya.com/api/v1/checkout-invoice/confirm/${token}`

  const res = await fetch(url, {
    headers: {
      'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY!,
      'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY!,
      'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN!,
    }
  })

  const data = await res.json()
  const status = (data.status || '').toLowerCase()
  const isPaid = ['completed', 'success', 'paid'].includes(status)

  console.log(`PayDunya confirm [${token.slice(0,8)}...]: status=${data.status} isPaid=${isPaid}`)

  if (!isPaid) return { ok: false, reason: 'not_paid', status: data.status }

  const montant = data.invoice?.total_amount || 0
  const customData = data.custom_data || {}
  let userId = customData.user_id
  let plan = customData.plan

  // Fallback: chercher dans abonnements par token
  if (!userId || !plan) {
    const { data: abo } = await supabase
      .from('abonnements').select('user_id, plan').eq('paydunya_token', token).maybeSingle()
    if (abo) { userId = userId || abo.user_id; plan = plan || abo.plan }
  }

  if (!userId || !plan) {
    console.error(`❌ user_id ou plan introuvable pour token ${token}`)
    return { ok: false, reason: 'no_user_or_plan', customData }
  }

  return activerPlan(userId, plan, token, montant)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('🔔 Webhook PayDunya reçu:', JSON.stringify(body).slice(0, 300))

    const token =
      body?.data?.invoice?.token ||
      body?.invoice?.token ||
      body?.token ||
      body?.data?.token

    if (!token) {
      console.error('❌ Token manquant dans webhook')
      return NextResponse.json({ ok: false, reason: 'no_token' })
    }

    const result = await confirmerPaiement(token)
    console.log('Résultat webhook:', result)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('❌ Webhook erreur:', e.message)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'Dropzi Webhook v3' })
}
