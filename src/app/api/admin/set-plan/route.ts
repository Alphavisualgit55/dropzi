import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// SERVICE ROLE = bypass total RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRIX: Record<string, number> = { starter: 3000, business: 5000, elite: 15000 }

export async function POST(request: NextRequest) {
  try {
    const { user_id, plan, expires_days } = await request.json()

    if (!user_id || !plan) {
      return NextResponse.json({ ok: false, error: 'user_id et plan requis' }, { status: 400 })
    }

    const fin = new Date()
    fin.setDate(fin.getDate() + (expires_days || 30))
    const finStr = fin.toISOString()
    const now = new Date().toISOString()

    // 1. Update profiles avec service_role (bypass RLS)
    const { error: e1 } = await supabase
      .from('profiles')
      .update({ plan, plan_expires: finStr })
      .eq('id', user_id)

    if (e1) {
      console.error('Erreur profiles:', e1)
      return NextResponse.json({ ok: false, error: 'profiles: ' + e1.message })
    }

    // 2. Upsert abonnements
    const { error: e2 } = await supabase
      .from('abonnements')
      .upsert({
        user_id,
        plan,
        statut: plan === 'aucun' ? 'expire' : 'actif',
        montant: PRIX[plan] || 0,
        debut: now,
        fin: finStr,
        updated_at: now,
      }, { onConflict: 'user_id' })

    if (e2) console.error('Erreur abonnements:', e2)

    // 3. Notification utilisateur
    if (plan !== 'aucun') {
      await supabase.from('notifications_user').insert({
        user_id,
        titre: `🎉 Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} activé !`,
        message: `Ton abonnement Dropzi ${plan} est actif jusqu'au ${fin.toLocaleDateString('fr-FR')}.`,
        type: 'success',
      })
    }

    // 4. Vérification finale
    const { data: check } = await supabase
      .from('profiles')
      .select('plan, plan_expires')
      .eq('id', user_id)
      .single()

    console.log(`✅ Admin: plan ${plan} activé pour ${user_id} | Vérifié: ${check?.plan}`)

    return NextResponse.json({
      ok: true,
      plan: check?.plan,
      expires: check?.plan_expires,
      fin: finStr
    })
  } catch (e: any) {
    console.error('set-plan error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
