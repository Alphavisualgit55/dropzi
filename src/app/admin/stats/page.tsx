'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function AdminStatsPage() {
  const supabase = createClient()
  const [live, setLive] = useState(0)
  const [today, setToday] = useState(0)
  const [week, setWeek] = useState(0)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState<any[]>([])
  const [referrers, setReferrers] = useState<any[]>([])
  const [byHour, setByHour] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const load = useCallback(async () => {
    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)
    const liveStart = new Date(now.getTime() - 35000)

    const [liveRes, todayRes, weekRes, totalRes, pagesRes, refRes, hourRes] = await Promise.all([
      fetch('/api/track/live').then(r => r.json()),
      supabase.from('visites').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('visites').select('*', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString()),
      supabase.from('visites').select('*', { count: 'exact', head: true }),
      supabase.from('visites').select('page').gte('created_at', weekStart.toISOString()),
      supabase.from('visites').select('referrer').gte('created_at', weekStart.toISOString()).not('referrer', 'is', null),
      supabase.from('visites').select('created_at').gte('created_at', todayStart.toISOString()),
    ])

    setLive(liveRes.live || 0)
    setToday(todayRes.count || 0)
    setWeek(weekRes.count || 0)
    setTotal(totalRes.count || 0)
    setLastUpdate(new Date())

    // Pages les plus visitées
    const pageCounts: Record<string, number> = {}
    ;(pagesRes.data || []).forEach((v: any) => {
      pageCounts[v.page] = (pageCounts[v.page] || 0) + 1
    })
    setPages(Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([page, count]) => ({ page, count })))

    // Référents
    const refCounts: Record<string, number> = {}
    ;(refRes.data || []).forEach((v: any) => {
      if (!v.referrer) return
      try {
        const domain = new URL(v.referrer).hostname
        refCounts[domain] = (refCounts[domain] || 0) + 1
      } catch { refCounts[v.referrer] = (refCounts[v.referrer] || 0) + 1 }
    })
    setReferrers(Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([ref, count]) => ({ ref, count })))

    // Visites par heure aujourd'hui
    const hourCounts: Record<number, number> = {}
    ;(hourRes.data || []).forEach((v: any) => {
      const h = new Date(v.created_at).getHours()
      hourCounts[h] = (hourCounts[h] || 0) + 1
    })
    const hours = Array.from({ length: 24 }, (_, h) => ({ h, count: hourCounts[h] || 0 }))
    setByHour(hours)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [load])

  const maxHour = Math.max(...byHour.map(h => h.count), 1)
  const maxPage = Math.max(...pages.map(p => p.count), 1)

  const S = {
    card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 18 } as React.CSSProperties,
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 900 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -.5 }}>Analytics & Visiteurs</h1>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, marginTop: 4 }}>Mis à jour : {lastUpdate.toLocaleTimeString('fr-FR')}</p>
        </div>
        <button onClick={load} style={{ background: 'rgba(127,119,221,.15)', border: '1px solid rgba(127,119,221,.3)', color: '#7F77DD', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          🔄 Actualiser
        </button>
      </div>

      {/* VISITEURS EN LIVE */}
      <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', borderRadius: 20, padding: 24, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(127,119,221,.1)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>En ce moment</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>Actifs maintenant · se rafraîchit en temps réel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: '#fff', letterSpacing: -3, lineHeight: 1 }}>{live}</span>
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,.4)' }}>visiteur{live > 1 ? 's' : ''} actif{live > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { lbl: "Aujourd'hui", val: today, icon: '📅', color: '#7F77DD' },
          { lbl: '7 derniers jours', val: week, icon: '📆', color: '#1D9E75' },
          { lbl: 'Total historique', val: total, icon: '🌍', color: '#BA7517' },
        ].map(k => (
          <div key={k.lbl} style={S.card}>
            <div style={{ fontSize: 20, marginBottom: 10 }}>{k.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: k.color, letterSpacing: -1, lineHeight: 1 }}>{fmt(k.val)}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 6 }}>{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* GRAPHIQUE HEURES */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Visites par heure — aujourd'hui</p>
        {byHour.every(h => h.count === 0) ? (
          <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucune visite aujourd'hui</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
            {byHour.map(h => (
              <div key={h.h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: h.count > 0 ? '#7F77DD' : 'rgba(255,255,255,.06)', borderRadius: 4, height: `${Math.max((h.count / maxHour) * 100, h.count > 0 ? 8 : 0)}%`, minHeight: h.count > 0 ? 4 : 0, transition: 'height .3s' }} title={`${h.h}h : ${h.count} visites`} />
                {h.h % 4 === 0 && <span style={{ fontSize: 8, color: 'rgba(255,255,255,.2)' }}>{h.h}h</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* PAGES */}
        <div style={S.card}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Pages les plus visitées</p>
          {pages.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13 }}>Aucune donnée</p>
          ) : pages.map((p, i) => (
            <div key={p.page} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{p.page || '/'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', flexShrink: 0 }}>{p.count}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div style={{ width: `${(p.count / maxPage) * 100}%`, height: '100%', background: i === 0 ? '#7F77DD' : 'rgba(127,119,221,.4)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* RÉFÉRENTS */}
        <div style={S.card}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Sources de trafic</p>
          {referrers.length === 0 ? (
            <div>
              <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, marginBottom: 10 }}>Aucun référent (trafic direct)</p>
              <div style={{ background: 'rgba(29,158,117,.1)', border: '1px solid rgba(29,158,117,.2)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 11, color: '#1D9E75', fontWeight: 600 }}>Trafic direct</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#9FE1CB', marginTop: 4 }}>{fmt(week)}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>visites cette semaine</p>
              </div>
            </div>
          ) : (
            referrers.map((r, i) => (
              <div key={r.ref} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#aaa', flexShrink: 0, fontWeight: 700 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.ref}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1D9E75', flexShrink: 0 }}>{r.count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
