import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLANS = {
  starter:  { prix: 3000,  nom: 'Dropzi Starter',  desc: '50 commandes, 5 produits, 1 modèle facture' },
  business: { prix: 5000,  nom: 'Dropzi Business', desc: '500 commandes, 25 produits, 3 modèles factures' },
  elite:    { prix: 15000, nom: 'Dropzi Elite',     desc: 'Tout illimité + support prioritaire' },
}

export async function POST(request: NextRequest) {
  try {
    const { plan, user_id, email, nom } = await request.json()

    if (!plan || !user_id || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    const planData = PLANS[plan as keyof typeof PLANS]
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dropzi.netlify.app'

    // Créer la facture PayDunya
    const payload = {
      invoice: {
        total_amount: planData.prix,
        description: planData.desc,
        customer: {
          name: nom || 'Client Dropzi',
          email: email || '',
        }
      },
      store: {
        name: 'Dropzi',
        tagline: "L'outil logistique e-commerce N°1 en Afrique",
        website_url: baseUrl,
        logo_url: `${baseUrl}/icons/icon-192.png`,
      },
      custom_data: {
        user_id,
        plan,
      },
      actions: {
        return_url: `${baseUrl}/dashboard/abonnement?status=success&plan=${plan}`,
        cancel_url: `${baseUrl}/dashboard/abonnement?status=cancel`,
        callback_url: `${baseUrl}/api/paydunya/webhook`,
      }
    }

    const mode = process.env.PAYDUNYA_MODE || 'live'
    const apiUrl = mode === 'test'
      ? 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create'
      : 'https://app.paydunya.com/api/v1/checkout-invoice/create'

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

    if (data.response_code !== '00') {
      return NextResponse.json({ error: 'Erreur PayDunya: ' + data.response_text }, { status: 500 })
    }

    // Sauvegarder le token en attente
    await supabase.from('abonnements').upsert({
      user_id,
      plan,
      statut: 'expire',
      paydunya_token: data.token,
      montant: planData.prix,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return NextResponse.json({
      checkout_url: data.response_text,
      token: data.token,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
