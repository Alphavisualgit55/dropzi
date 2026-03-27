'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function AdminStatsPage() {
  const supabase = createClient()
  const [data, setData] = useState<any>({})
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [jours, setJours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: stats } = await supabase.from('admin_stats').select('*').single()
      setData(stats || {})

      const { data: profiles } = await supabase.from('profiles').select('id, nom_boutique, email, plan').limit(15)
      const top: any[] = []
      for (const p of (profiles || [])) {
        const { count: cmd } = await supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('user_id', p.id)
        top.push({ ...p, commandes: cmd || 0 })
      }
      setTopUsers(top.sort((a, b) => b.commandes - a.commandes).slice(0, 7))

      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
        const to = new Date(d); to.setHours(23,59,59,999)
        const { count } = await supabase.from('commandes').select('*', { count: 'exact', head: true })
          .gte('created_at', d.toISOString()).lte('created_at', to.toISOString())
        days.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), count: count || 0 })
      }
      setJours(days)
      setLoading(false)
    }
    load()
  }, [])

  const maxCmd = Math.max(...jours.map(d => d.count), 1)
  const planColor = (p: string) => p === 'elite' ? '#1D9E75' : p === 'business' ? '#7F77DD' : '#666'

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -.5 }}>Statistiques</h1>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, marginTop: 4 }}>Analyse globale de la plateforme</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '👥', v: fmt(data.total_users || 0), l: 'Utilisateurs totaux', c: '#7F77DD' },
          { icon: '🚀', v: '+' + fmt(data.nouveaux_ce_mois || 0), l: 'Nouveaux ce mois', c: '#1D9E75' },
          { icon: '📦', v: fmt(data.commandes_ce_mois || 0), l: 'Commandes ce mois', c: '#BA7517' },
        ].map(k => (
          <div key={k.l} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>{k.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: k.c, letterSpacing: -1.5, lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 6 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Graphique */}
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 22, marginBottom: 16 }}>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Commandes — 7 derniers jours</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
          {jours.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {d.count > 0 && <div style={{ color: '#7F77DD', fontSize: 11, fontWeight: 700 }}>{d.count}</div>}
              <div style={{
                width: '100%', borderRadius: 8,
                background: d.count > 0 ? 'linear-gradient(180deg,#7F77DD,#534AB7)' : 'rgba(255,255,255,.05)',
                height: `${Math.max(8, (d.count / maxCmd) * 110)}px`,
                transition: 'height .5s ease',
                boxShadow: d.count > 0 ? '0 0 12px rgba(127,119,221,.2)' : 'none'
              }} />
              <div style={{ color: 'rgba(255,255,255,.25)', fontSize: 10, textAlign: 'center', lineHeight: 1.3 }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top users */}
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 22 }}>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Top utilisateurs par activité</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topUsers.map((u, i) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: i < 3 ? 'linear-gradient(135deg,#7F77DD,#534AB7)' : 'rgba(255,255,255,.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: i < 3 ? '#fff' : 'rgba(255,255,255,.3)'
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_boutique || u.email || '—'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#7F77DD', fontSize: 18, fontWeight: 800 }}>{u.commandes}</div>
                  <div style={{ color: 'rgba(255,255,255,.25)', fontSize: 10 }}>commandes</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: planColor(u.plan || 'basic') + '22', color: planColor(u.plan || 'basic') }}>
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
