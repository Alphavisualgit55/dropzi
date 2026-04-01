import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { retrait_id, montant, numero, email } = await request.json()

    if (!retrait_id || !montant || !numero) {
      return NextResponse.json({ ok: false, error: 'Paramètres manquants' }, { status: 400 })
    }

    const mode = process.env.PAYDUNYA_MODE || 'live'
    const baseUrl = mode === 'test'
      ? 'https://app.paydunya.com/sandbox-api/v1'
      : 'https://app.paydunya.com/api/v1'

    // Créer une facture de paiement sortant (Direct Pay)
    // PayDunya permet d'envoyer de l'argent vers un numéro Wave/OM
    const payload = {
      invoice: {
        total_amount: montant,
        description: `Retrait commission Dropzi - Affilié ${email}`,
      },
      store: {
        name: 'Dropzi Affiliés',
      },
      actions: {
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/affiliation/webhook`,
      },
      custom_data: {
        retrait_id,
        type: 'retrait_affilie',
      }
    }

    const res = await fetch(`${baseUrl}/checkout-invoice/create`, {
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

    if (data.response_code === '00') {
      return NextResponse.json({
        ok: true,
        token: data.token,
        checkout_url: data.response_text,
        message: `Retrait de ${montant} FCFA vers ${numero} initié`,
      })
    } else {
      // Si PayDunya échoue, on marque quand même comme approuvé
      // et l'admin peut payer manuellement
      return NextResponse.json({
        ok: false,
        error: data.response_text || 'Erreur PayDunya',
        manual: true,
      })
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
