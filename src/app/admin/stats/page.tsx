'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function AdminStatsPage() {
  const supabase = createClient()
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [commandesParJour, setCommandesParJour] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [statsRes, profilesRes] = await Promise.all([
        supabase.from('admin_stats').select('*').single(),
        supabase.from('profiles').select('id, nom_boutique, email, plan').neq('statut', 'supprime'),
      ])
      setData(statsRes.data || {})

      // Top users par commandes
      const profiles = profilesRes.data || []
      const topData: any[] = []
      for (const p of profiles.slice(0, 10)) {
        const { count: cmd } = await supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('user_id', p.id)
        const { count: cmd_livrees } = await supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('user_id', p.id).eq('statut', 'livre')
        topData.push({ ...p, commandes: cmd || 0, livrees: cmd_livrees || 0 })
      }
      setTopUsers(topData.sort((a, b) => b.commandes - a.commandes).slice(0, 8))

      // Commandes par jour (7 derniers jours)
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
        const to = new Date(d); to.setHours(23, 59, 59, 999)
        const { count } = await supabase.from('commandes').select('*', { count: 'exact', head: true }).gte('created_at', d.toISOString()).lte('created_at', to.toISOString())
        days.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), count: count || 0 })
      }
      setCommandesParJour(days)
      setLoading(false)
    }
    load()
  }, [])

  const maxCmd = Math.max(...commandesParJour.map(d => d.count), 1)

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>Statistiques</h1>
        <p className="text-gray-500 text-sm mt-1">Analyse globale de la plateforme</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { l: 'Total utilisateurs', v: fmt(data.total_users || 0), c: '#7F77DD', icon: '👥' },
          { l: 'Nouveaux ce mois', v: '+' + fmt(data.nouveaux_ce_mois || 0), c: '#1D9E75', icon: '🚀' },
          { l: 'Commandes ce mois', v: fmt(data.commandes_ce_mois || 0), c: '#BA7517', icon: '📦' },
        ].map(k => (
          <div key={k.l} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ color: k.c, fontSize: 32, fontWeight: 800, fontFamily: 'Georgia,serif', letterSpacing: -1 }}>{k.v}</div>
            <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Graphique commandes 7 jours */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 24 }}>
        <h2 className="text-white font-semibold mb-6">Commandes — 7 derniers jours</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160 }}>
          {commandesParJour.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ color: '#7F77DD', fontSize: 12, fontWeight: 700 }}>{d.count || ''}</div>
              <div style={{
                width: '100%', borderRadius: 8,
                background: d.count > 0 ? 'linear-gradient(180deg,#7F77DD,#534AB7)' : 'rgba(255,255,255,.05)',
                height: `${Math.max(8, (d.count / maxCmd) * 120)}px`,
                transition: 'height .5s ease'
              }} />
              <div style={{ color: '#444', fontSize: 10, textAlign: 'center' }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top utilisateurs */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 24 }}>
        <h2 className="text-white font-semibold mb-5">Top utilisateurs par commandes</h2>
        <div className="space-y-3">
          {topUsers.map((u, i) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? 'linear-gradient(135deg,#7F77DD,#534AB7)' : 'rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: i < 3 ? '#fff' : '#555', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_boutique || u.email || '—'}</div>
                <div style={{ color: '#555', fontSize: 11 }}>{u.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexShrink: 0, alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#7F77DD', fontSize: 16, fontWeight: 800 }}>{u.commandes}</div>
                  <div style={{ color: '#444', fontSize: 10 }}>commandes</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#1D9E75', fontSize: 16, fontWeight: 800 }}>{u.livrees}</div>
                  <div style={{ color: '#444', fontSize: 10 }}>livrées</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: u.plan === 'elite' ? 'rgba(29,158,117,.15)' : u.plan === 'business' ? 'rgba(127,119,221,.15)' : 'rgba(136,136,136,.1)', color: u.plan === 'elite' ? '#1D9E75' : u.plan === 'business' ? '#7F77DD' : '#888' }}>
                  {(u.plan || 'BASIC').toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
