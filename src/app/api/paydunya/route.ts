import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLANS = {
  starter:  { prix: 3000,  nom: 'Dropzi Starter',  desc: '50 commandes, 5 produits' },
  business: { prix: 5000,  nom: 'Dropzi Business', desc: '500 commandes, 25 produits' },
  elite:    { prix: 15000, nom: 'Dropzi Elite',     desc: 'Tout illimité + support prioritaire' },
}

export async function POST(request: NextRequest) {
  try {
    const { plan, user_id, email, nom } = await request.json()

    if (!plan || !user_id || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    const planData = PLANS[plan as keyof typeof PLANS]

    // URL de base — toujours depuis les headers de la requête pour être sûr
    const host = request.headers.get('host') || 'dropzi.netlify.app'
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    const baseUrl = `${proto}://${host}`

    console.log('PayDunya checkout - baseUrl:', baseUrl, '| user_id:', user_id, '| plan:', plan)

    const mode = process.env.PAYDUNYA_MODE || 'live'
    const apiUrl = mode === 'test'
      ? 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create'
      : 'https://app.paydunya.com/api/v1/checkout-invoice/create'

    const payload = {
      invoice: {
        total_amount: planData.prix,
        description: planData.desc,
        customer: { name: nom || 'Client Dropzi', email: email || '' }
      },
      store: {
        name: 'Dropzi',
        tagline: "L'outil logistique e-commerce N°1 en Afrique",
        website_url: baseUrl,
      },
      custom_data: { user_id, plan },
      actions: {
        return_url: `${baseUrl}/dashboard/abonnement?status=success&plan=${plan}`,
        cancel_url: `${baseUrl}/dashboard/abonnement?status=cancel`,
        callback_url: `${baseUrl}/api/paydunya/webhook`,
      }
    }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY!,
        'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY!,
        'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN!,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    console.log('PayDunya create response:', data.response_code, data.response_text?.slice(0, 100))

    if (data.response_code !== '00') {
      return NextResponse.json({ error: 'Erreur PayDunya: ' + data.response_text }, { status: 500 })
    }

    // Sauvegarder token + user_id en attente dans abonnements
    const { error: aboErr } = await supabase.from('abonnements').upsert({
      user_id,
      plan,
      statut: 'en_attente',
      paydunya_token: data.token,
      montant: planData.prix,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (aboErr) console.error('Erreur sauvegarde abonnement:', aboErr)

    // Aussi sauvegarder dans une table de suivi des paiements en attente
    await supabase.from('paiements_pending').upsert({
      user_id,
      plan,
      token: data.token,
      montant: planData.prix,
      created_at: new Date().toISOString(),
    }, { onConflict: 'token' }).then(() => {}).catch(() => {})

    console.log('✅ Facture créée - token:', data.token, '| callback_url:', payload.actions.callback_url)

    return NextResponse.json({
      checkout_url: data.response_text,
      token: data.token,
    })
  } catch (e: any) {
    console.error('PayDunya create error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
