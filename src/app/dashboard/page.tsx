'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Stats {
  ca: number; benefice: number; nb: number
  livrees: number; en_cours: number; annulees: number
}

interface Commande {
  id: string; client_nom: string; zone_nom: string
  total_vente: number; statut: string; created_at: string
}

const STATUT_LABEL: Record<string, string> = {
  en_attente: 'En attente', en_livraison: 'En livraison',
  livre: 'Livré', annule: 'Annulé', echec: 'Échec'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ ca: 0, benefice: 0, nb: 0, livrees: 0, en_cours: 0, annulees: 0 })
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function loadData() {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('commandes_detail')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    if (data) {
      const all = data as Commande[]
      setCommandes(all.slice(0, 5))
      const ca = all.reduce((s, c: any) => s + (c.total_vente || 0), 0)
      const benefice = all.reduce((s, c: any) => s + (c.benefice || 0), 0)
      setStats({
        ca, benefice, nb: all.length,
        livrees: all.filter((c: any) => c.statut === 'livre').length,
        en_cours: all.filter((c: any) => c.statut === 'en_livraison').length,
        annulees: all.filter((c: any) => c.statut === 'annule').length,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const channel = supabase.channel('commandes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Date */}
      <p className="text-sm text-gray-400">
        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {/* Profit card */}
      <div className="bg-[#7F77DD] rounded-3xl p-5 text-white">
        <p className="text-sm text-purple-200 mb-1">Mon bénéfice aujourd'hui</p>
        <p className="text-4xl font-medium">{fmt(stats.benefice)} <span className="text-2xl">FCFA</span></p>
        <div className="mt-3 pt-3 border-t border-white/20 flex gap-4 text-xs text-purple-200">
          <span>CA : {fmt(stats.ca)} F</span>
          <span>·</span>
          <span>{stats.nb} commandes</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Commandes', val: stats.nb, color: 'text-gray-900' },
          { label: 'Livrées', val: stats.livrees, color: 'text-green-600' },
          { label: 'En livraison', val: stats.en_cours, color: 'text-blue-600' },
          { label: 'Annulées', val: stats.annulees, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-3xl font-medium mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Nouvelle commande CTA */}
      <Link href="/dashboard/commandes?new=1"
        className="block w-full bg-[#0C0C1E] text-white text-center font-medium py-4 rounded-2xl hover:bg-[#1a1a3e] transition-colors">
        + Nouvelle commande
      </Link>

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium text-sm">Commandes récentes</p>
          <Link href="/dashboard/commandes" className="text-[#7F77DD] text-xs font-medium">Voir tout →</Link>
        </div>
        {commandes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Aucune commande aujourd'hui</p>
        ) : (
          <div className="space-y-3">
            {commandes.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EEEDFE] flex items-center justify-center text-xs font-medium text-[#534AB7] flex-shrink-0">
                  {(c.client_nom || 'C').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.client_nom || 'Client'}</p>
                  <p className="text-xs text-gray-400 truncate">{c.zone_nom || '—'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">{fmt(c.total_vente || 0)} F</p>
                  <span className={`badge-${c.statut}`}>{STATUT_LABEL[c.statut]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
