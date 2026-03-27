'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const STATUT_LABEL: Record<string, string> = {
  en_attente: '⏳ En attente', en_livraison: '🚚 En livraison',
  livre: '✅ Livré', annule: '❌ Annulé', echec: '⚠️ Échec'
}

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ ca: 0, benefice: 0, nb: 0, livrees: 0, en_cours: 0, annulees: 0 })
  const [commandes, setCommandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { data } = await supabase.from('commandes_detail').select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
    if (data) {
      setCommandes(data.slice(0, 5))
      setStats({
        ca: data.reduce((s: number, c: any) => s + (c.total_vente || 0), 0),
        benefice: data.filter((c: any) => c.statut === 'livre').reduce((s: number, c: any) => s + (c.benefice || 0), 0),
        nb: data.length,
        livrees: data.filter((c: any) => c.statut === 'livre').length,
        en_cours: data.filter((c: any) => c.statut === 'en_livraison').length,
        annulees: data.filter((c: any) => c.statut === 'annule').length,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const ch = supabase.channel('dash').on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, loadData).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <p className="text-sm text-gray-400 capitalize">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      <div style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', borderRadius: 24, padding: 22, color: '#fff', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(255,255,255,.08)', borderRadius: '50%' }} />
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Mon bénéfice aujourd'hui</p>
        <p style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>{fmt(stats.benefice)} <span style={{ fontSize: 20 }}>FCFA</span></p>
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.2)', fontSize: 12, color: 'rgba(255,255,255,.55)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>CA : {fmt(stats.ca)} F</span>
          <span>·</span>
          <span>{stats.nb} commandes</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { l: 'Commandes', v: stats.nb, c: 'text-gray-900' },
          { l: 'Livrées', v: stats.livrees, c: 'text-green-600' },
          { l: 'En livraison', v: stats.en_cours, c: 'text-blue-600' },
          { l: 'Annulées', v: stats.annulees, c: 'text-red-500' },
        ].map(s => (
          <div key={s.l} className="card">
            <p className="text-xs text-gray-400">{s.l}</p>
            <p className={`text-3xl font-bold mt-1 ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <Link href="/dashboard/commandes" className="block w-full text-center font-semibold py-4 rounded-2xl text-white transition-colors"
        style={{ background: '#0C0C1E' }}>
        + Nouvelle commande
      </Link>

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
                <div className="w-9 h-9 rounded-full bg-[#EEEDFE] flex items-center justify-center text-xs font-bold text-[#534AB7] flex-shrink-0">
                  {(c.client_nom || 'C').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.client_nom || c.client_tel || 'Client'}</p>
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
