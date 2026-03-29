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
  console.log('PayDunya confirm response:', JSON.stringify(data))

  if (data.status !== 'completed') return { ok: false, reason: 'not_completed', status: data.status }

  // Chercher le token dans abonnements pour retrouver user_id et plan
  const { data: abo } = await supabase
    .from('abonnements')
    .select('user_id, plan')
    .eq('paydunya_token', token)
    .single()

  // Essayer aussi depuis custom_data
  const customData = data.custom_data || {}
  const userId = abo?.user_id || customData.user_id
  const plan = abo?.plan || customData.plan

  if (!userId || !plan) return { ok: false, reason: 'no_user_or_plan' }

  const fin = new Date()
  fin.setDate(fin.getDate() + 30)

  await supabase.from('abonnements').upsert({
    user_id: userId,
    plan,
    statut: 'actif',
    paydunya_token: token,
    montant: data.invoice?.total_amount || 0,
    debut: new Date().toISOString(),
    fin: fin.toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  await supabase.from('profiles').update({
    plan,
    plan_expires: fin.toISOString(),
  }).eq('id', userId)

  await supabase.from('notifications_user').insert({
    user_id: userId,
    titre: `🎉 Abonnement ${plan.charAt(0).toUpperCase() + plan.slice(1)} activé !`,
    message: `Ton abonnement Dropzi ${plan} est actif jusqu'au ${fin.toLocaleDateString('fr-FR')}.`,
    type: 'success',
  })

  return { ok: true }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Webhook body:', JSON.stringify(body))

    // PayDunya envoie le token de plusieurs façons possibles
    const token =
      body.data?.invoice?.token ||
      body.invoice?.token ||
      body.token ||
      body.data?.token

    if (!token) return NextResponse.json({ ok: false, reason: 'no_token' })

    const result = await activatePlan(token)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('Webhook error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// PayDunya peut aussi envoyer GET pour vérifier que l'URL est accessible
export async function GET() {
  return NextResponse.json({ ok: true, service: 'Dropzi PayDunya Webhook' })
}
