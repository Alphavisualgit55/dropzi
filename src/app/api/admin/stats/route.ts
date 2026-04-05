import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const [profiles, abonnements] = await Promise.all([
      supabase.from('profiles').select('id, email, nom_boutique, plan, plan_expires, created_at, telephone'),
      supabase.from('abonnements').select('user_id, plan, montant, statut, fin'),
    ])

    // Récupérer commandes avec filtre date
    let cmdQuery = supabase.from('commandes').select('id, user_id, statut, cout_livraison, created_at')
    if (from) cmdQuery = cmdQuery.gte('created_at', from)
    if (to) cmdQuery = cmdQuery.lte('created_at', to + 'T23:59:59')
    const commandes = await cmdQuery

    // Récupérer commande_items pour CA et bénéfice
    let itemsQuery = supabase.from('commande_items').select('commande_id, quantite, prix_unitaire, cout_unitaire')
    const items = await itemsQuery

    const now = new Date()
    const users = profiles.data || []
    const cmds = commandes.data || []
    const allItems = items.data || []
    const abos = abonnements.data || []

    // Stats par user
    const userStats = users.map((u: any) => {
      const userCmds = cmds.filter((c: any) => c.user_id === u.id)
      const livrees = userCmds.filter((c: any) => c.statut === 'livre')

      // Calculer CA et bénéfice depuis les items
      let ca = 0, benefice = 0
      livrees.forEach((cmd: any) => {
        const cmdItems = allItems.filter((it: any) => it.commande_id === cmd.id)
        const coutLiv = cmd.cout_livraison || 0
        cmdItems.forEach((it: any) => {
          const vente = (it.prix_unitaire || 0) * (it.quantite || 1)
          const cout = (it.cout_unitaire || 0) * (it.quantite || 1)
          ca += vente
          benefice += vente - cout
        })
        benefice -= coutLiv
      })

      const planActif = u.plan && u.plan !== 'aucun' && u.plan_expires && new Date(u.plan_expires) > now
      const abo = abos.find((a: any) => a.user_id === u.id)

      return {
        ...u,
        nb_commandes: userCmds.length,
        nb_livrees: livrees.length,
        nb_annulees: userCmds.filter((c: any) => ['annule','echec'].includes(c.statut)).length,
        ca_total: Math.round(ca),
        benefice_total: Math.round(benefice),
        taux_livraison: userCmds.length > 0 ? Math.round((livrees.length / userCmds.length) * 100) : 0,
        plan_actif: planActif,
        abo_montant: abo?.montant || 0,
      }
    })

    const PRIX: Record<string, number> = { starter: 3000, business: 5000, elite: 15000 }
    const actifs = users.filter((u: any) => u.plan && u.plan !== 'aucun' && u.plan_expires && new Date(u.plan_expires) > now)
    const livreesAll = cmds.filter((c: any) => c.statut === 'livre')
    const totalCA = userStats.reduce((s: number, u: any) => s + u.ca_total, 0)
    const totalBenefice = userStats.reduce((s: number, u: any) => s + u.benefice_total, 0)
    const mrr = actifs.reduce((s: number, u: any) => s + (PRIX[u.plan] || 0), 0)

    return NextResponse.json({
      ok: true,
      global: {
        totalUsers: users.length,
        actifs: actifs.length,
        mrr,
        totalCommandes: cmds.length,
        totalLivrees: livreesAll.length,
        totalCA,
        totalBenefice,
      },
      users: userStats.sort((a: any, b: any) => b.nb_commandes - a.nb_commandes)
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
