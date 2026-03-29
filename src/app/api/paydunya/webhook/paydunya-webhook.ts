import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_LIMITS = {
  starter:  { commandes: 50,  produits: 5,  zones: 2, livreurs: 1, facture_modeles: 1 },
  business: { commandes: 500, produits: 25, zones: 5, livreurs: 6, facture_modeles: 3 },
  elite:    { commandes: 999999, produits: 999999, zones: 999999, livreurs: 999999, facture_modeles: 5 },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = body.data?.invoice?.token || body.token

    if (!token) return NextResponse.json({ ok: false })

    // Vérifier le paiement auprès de PayDunya
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

    if (data.status !== 'completed') {
      return NextResponse.json({ ok: false, status: data.status })
    }

    // Récupérer les données custom (user_id + plan)
    const customData = data.custom_data || {}
    const userId = customData.user_id
    const plan = customData.plan

    if (!userId || !plan) return NextResponse.json({ ok: false })

    // Calculer la date de fin (30 jours)
    const fin = new Date()
    fin.setDate(fin.getDate() + 30)

    // Mettre à jour l'abonnement
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

    // Mettre à jour le profil
    await supabase.from('profiles').update({
      plan,
      plan_expires: fin.toISOString(),
      montant_mensuel: data.invoice?.total_amount || 0,
    }).eq('id', userId)

    // Notifier l'utilisateur
    await supabase.from('notifications_user').insert({
      user_id: userId,
      titre: `🎉 Abonnement ${plan.charAt(0).toUpperCase() + plan.slice(1)} activé !`,
      message: `Ton abonnement Dropzi ${plan} est maintenant actif jusqu'au ${fin.toLocaleDateString('fr-FR')}. Profite de toutes les fonctionnalités !`,
      type: 'success',
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Webhook error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
