import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [profiles, commandes, abonnements] = await Promise.all([
      supabase.from('profiles').select('id, email, nom_boutique, plan, plan_expires, created_at, telephone'),
      supabase.from('commandes').select('user_id, statut, total_vente, benefice, created_at'),
      supabase.from('abonnements').select('user_id, plan, montant, statut, fin'),
    ])

    const now = new Date()
    const users = profiles.data || []
    const cmds = commandes.data || []
    const abos = abonnements.data || []

    // Stats par user
    const userStats = users.map((u: any) => {
      const userCmds = cmds.filter((c: any) => c.user_id === u.id)
      const livrees = userCmds.filter((c: any) => c.statut === 'livre')
      const ca = livrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
      const benefice = livrees.reduce((s: number, c: any) => s + (c.benefice || 0), 0)
      const abo = abos.find((a: any) => a.user_id === u.id)
      const planActif = u.plan && u.plan !== 'aucun' && u.plan_expires && new Date(u.plan_expires) > now

      return {
        ...u,
        nb_commandes: userCmds.length,
        nb_livrees: livrees.length,
        ca_total: ca,
        benefice_total: benefice,
        taux_livraison: userCmds.length > 0 ? Math.round((livrees.length / userCmds.length) * 100) : 0,
        plan_actif: planActif,
        abo_montant: abo?.montant || 0,
      }
    })

    // Stats globales
    const actifs = users.filter((u: any) => u.plan && u.plan !== 'aucun' && u.plan_expires && new Date(u.plan_expires) > now)
    const totalCA = cmds.filter((c: any) => c.statut === 'livre').reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const totalCommandes = cmds.length
    const mrr = actifs.reduce((s: number, u: any) => {
      const prix: Record<string, number> = { starter: 3000, business: 5000, elite: 15000 }
      return s + (prix[u.plan] || 0)
    }, 0)

    return NextResponse.json({
      ok: true,
      global: { totalUsers: users.length, actifs: actifs.length, mrr, totalCommandes, totalCA },
      users: userStats.sort((a: any, b: any) => b.nb_commandes - a.nb_commandes)
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
