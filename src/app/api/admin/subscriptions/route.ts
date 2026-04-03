import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Récupérer directement depuis profiles — source de vérité
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, nom_boutique, telephone, plan, plan_expires, created_at, abonnements(montant, debut, fin, paydunya_token, statut)')
      .not('plan', 'eq', 'aucun')
      .not('plan', 'is', null)
      .not('plan_expires', 'is', null)
      .order('plan_expires', { ascending: false })

    if (error) return NextResponse.json({ ok: false, error: error.message })

    // Formater pour compatibilité avec la page
    const formatted = (data || []).map((p: any) => ({
      id: p.abonnements?.id || p.id,
      user_id: p.id,
      plan: p.plan,
      statut: p.plan_expires && new Date(p.plan_expires) > new Date() ? 'actif' : 'expire',
      fin: p.plan_expires,
      debut: p.abonnements?.debut || p.created_at,
      montant: p.abonnements?.montant || 0,
      paydunya_token: p.abonnements?.paydunya_token,
      profiles: {
        email: p.email,
        nom_boutique: p.nom_boutique,
        telephone: p.telephone,
        plan: p.plan,
        plan_expires: p.plan_expires,
      }
    }))

    return NextResponse.json({ ok: true, abonnements: formatted })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
