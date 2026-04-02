import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRIX: Record<string, number> = { starter: 3000, business: 5000, elite: 15000 }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, user_id } = body
    if (!action || !user_id) return NextResponse.json({ ok: false, error: 'action et user_id requis' })

    if (action === 'set_plan') {
      const { plan, expires_days } = body
      const fin = new Date(); fin.setDate(fin.getDate() + (expires_days || 30))
      const finStr = fin.toISOString()
      const { data: p, error: e1 } = await supabase.from('profiles')
        .update({ plan, plan_expires: finStr }).eq('id', user_id).select('id,plan,plan_expires')
      if (e1) return NextResponse.json({ ok: false, error: 'profiles: ' + e1.message })
      if (!p?.length) return NextResponse.json({ ok: false, error: 'User introuvable: ' + user_id })
      await supabase.from('abonnements').upsert({
        user_id, plan, statut: plan === 'aucun' ? 'expire' : 'actif',
        montant: PRIX[plan] || 0, debut: new Date().toISOString(), fin: finStr, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (plan !== 'aucun') {
        await supabase.from('notifications_user').insert({
          user_id, titre: `🎉 Plan ${plan} activé !`,
          message: `Ton abonnement ${plan} est actif jusqu'au ${fin.toLocaleDateString('fr-FR')}.`, type: 'success',
        })
      }
      console.log('set_plan OK:', user_id, p[0].plan)
      return NextResponse.json({ ok: true, plan: p[0].plan, fin: finStr })
    }

    if (action === 'reset_data') {
      const { data: cmds } = await supabase.from('commandes').select('id').eq('user_id', user_id)
      if (cmds?.length) await supabase.from('commande_items').delete().in('commande_id', cmds.map((c:any)=>c.id))
      await Promise.all([
        supabase.from('commandes').delete().eq('user_id', user_id),
        supabase.from('produits').delete().eq('user_id', user_id),
        supabase.from('clients').delete().eq('user_id', user_id),
        supabase.from('zones').delete().eq('user_id', user_id),
        supabase.from('livreurs').delete().eq('user_id', user_id),
        supabase.from('sync_config').delete().eq('user_id', user_id),
        supabase.from('sync_imported').delete().eq('user_id', user_id),
        supabase.from('notifications_user').delete().eq('user_id', user_id),
      ])
      return NextResponse.json({ ok: true })
    }

    if (action === 'delete_user') {
      const { data: cmds } = await supabase.from('commandes').select('id').eq('user_id', user_id)
      if (cmds?.length) await supabase.from('commande_items').delete().in('commande_id', cmds.map((c:any)=>c.id))
      await Promise.all([
        supabase.from('commandes').delete().eq('user_id', user_id),
        supabase.from('produits').delete().eq('user_id', user_id),
        supabase.from('clients').delete().eq('user_id', user_id),
        supabase.from('zones').delete().eq('user_id', user_id),
        supabase.from('livreurs').delete().eq('user_id', user_id),
        supabase.from('sync_config').delete().eq('user_id', user_id),
        supabase.from('sync_imported').delete().eq('user_id', user_id),
        supabase.from('abonnements').delete().eq('user_id', user_id),
        supabase.from('retraits').delete().eq('user_id', user_id),
        supabase.from('affilies').delete().eq('user_id', user_id),
        supabase.from('notifications_user').delete().eq('user_id', user_id),
        supabase.from('profiles').delete().eq('id', user_id),
      ])
      await supabase.auth.admin.deleteUser(user_id)
      return NextResponse.json({ ok: true })
    }

    if (action === 'notify') {
      const { titre, message, type } = body
      await supabase.from('notifications_user').insert({ user_id, titre, message, type: type || 'info' })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Action inconnue' })
  } catch (e: any) {
    console.error('Admin action error:', e.message)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
