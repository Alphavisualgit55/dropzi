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
  if (data.status !== 'completed') return { ok: false, reason: 'not_completed', status: data.status }

  // Récupérer l'abonnement via token
  const { data: abo } = await supabase
    .from('abonnements')
    .select('user_id, plan')
    .eq('paydunya_token', token)
    .single()

  const customData = data.custom_data || {}
  const userId = abo?.user_id || customData.user_id
  const plan = abo?.plan || customData.plan
  const montant = data.invoice?.total_amount || 0

  if (!userId || !plan) return { ok: false, reason: 'no_user_or_plan' }

  const fin = new Date()
  fin.setDate(fin.getDate() + 30)

  // Activer l'abonnement
  await supabase.from('abonnements').upsert({
    user_id: userId,
    plan,
    statut: 'actif',
    paydunya_token: token,
    montant,
    debut: new Date().toISOString(),
    fin: fin.toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  await supabase.from('profiles').update({
    plan,
    plan_expires: fin.toISOString(),
  }).eq('id', userId)

  // Notification utilisateur
  await supabase.from('notifications_user').insert({
    user_id: userId,
    titre: `🎉 Abonnement ${plan.charAt(0).toUpperCase() + plan.slice(1)} activé !`,
    message: `Ton abonnement Dropzi ${plan} est actif jusqu'au ${fin.toLocaleDateString('fr-FR')}.`,
    type: 'success',
  })

  // ── COMMISSION AFFILIATION ──
  try {
    // Vérifier si ce filleul a un parrain
    const { data: profil } = await supabase
      .from('profiles')
      .select('parrain_code, affilie_id')
      .eq('id', userId)
      .single()

    if (profil?.affilie_id) {
      const commission = Math.round(montant * 0.5) // 50%

      // Créditer le solde de l'affilié
      await supabase.rpc('crediter_affilie', {
        p_affilie_id: profil.affilie_id,
        p_montant: commission,
      })

      // Enregistrer la commission
      await supabase.from('commissions').insert({
        affilie_id: profil.affilie_id,
        filleul_user_id: userId,
        montant: commission,
        montant_abonnement: montant,
        plan,
        statut: 'valide',
      })

      // Notifier l'affilié
      const { data: affilieProfile } = await supabase
        .from('affilies')
        .select('user_id')
        .eq('id', profil.affilie_id)
        .single()

      if (affilieProfile) {
        await supabase.from('notifications_user').insert({
          user_id: affilieProfile.user_id,
          titre: `💰 Commission reçue — ${commission} FCFA !`,
          message: `Un de tes filleuls vient de souscrire au plan ${plan}. Tu gagnes ${commission} FCFA de commission (50%).`,
          type: 'success',
        })
      }
    }
  } catch (e) {
    console.error('Erreur commission affiliation:', e)
  }

  return { ok: true }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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

export async function GET() {
  return NextResponse.json({ ok: true, service: 'Dropzi PayDunya Webhook' })
}
