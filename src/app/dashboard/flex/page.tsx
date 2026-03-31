'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const fmt = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0','') + ' M'
  if (n >= 1000) return (n / 1000).toFixed(0) + ' k'
  return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
}
const fmtFull = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const PERIODES = [
  { id: 'today', label: "Aujourd'hui", days: 0 },
  { id: '7j', label: '7 derniers jours', days: 7 },
  { id: '30j', label: '30 derniers jours', days: 30 },
]

export default function DashboardPage() {
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [periode, setPeriode] = useState('7j')
  const [showPeriodeMenu, setShowPeriodeMenu] = useState(false)
  const [stats, setStats] = useState({ benef: 0, ca: 0, nb: 0, livrees: 0, en_cours: 0, annulees: 0, en_attente: 0 })
  const [prevStats, setPrevStats] = useState({ benef: 0, ca: 0, nb: 0 })
  const [chartData, setChartData] = useState<{ label: string; ca: number; benef: number }[]>([])
  const [recentCmds, setRecentCmds] = useState<any[]>([])
  const [boutique, setBoutique] = useState('Ma Boutique')
  const [loading, setLoading] = useState(true)
  const [liveCount, setLiveCount] = useState(0)
  const [profil, setProfil] = useState<any>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const p = PERIODES.find(p => p.id === periode)!
    const since = new Date()
    if (periode === 'today') { since.setHours(0, 0, 0, 0) }
    else { since.setDate(now.getDate() - p.days); since.setHours(0, 0, 0, 0) }

    const prevSince = new Date(since)
    const prevUntil = new Date(since)
    if (periode === 'today') {
      prevSince.setDate(since.getDate() - 1)
      prevUntil.setDate(since.getDate())
    } else {
      prevSince.setDate(since.getDate() - p.days)
    }

    const [cmd, prev, pr, live] = await Promise.all([
      supabase.from('commandes_detail').select('*').gte('created_at', since.toISOString()).order('created_at', { ascending: false }),
      supabase.from('commandes_detail').select('total_vente,benefice,statut').gte('created_at', prevSince.toISOString()).lt('created_at', since.toISOString()),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('sessions_live').select('*', { count: 'exact', head: true }).gte('updated_at', new Date(Date.now() - 35000).toISOString()),
    ])

    const data = cmd.data || []
    const livrees = data.filter((c: any) => c.statut === 'livre')
    const ca = livrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const benef = livrees.reduce((s: number, c: any) => s + (c.benefice || 0), 0)

    const prevData = (prev.data || []).filter((c: any) => c.statut === 'livre')
    const prevCa = prevData.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const prevBenef = prevData.reduce((s: number, c: any) => s + (c.benefice || 0), 0)

    setStats({ benef, ca, nb: data.length, livrees: livrees.length, en_cours: data.filter((c: any) => c.statut === 'en_livraison').length, annulees: data.filter((c: any) => ['annule', 'echec'].includes(c.statut)).length, en_attente: data.filter((c: any) => c.statut === 'en_attente').length })
    setPrevStats({ benef: prevBenef, ca: prevCa, nb: (prev.data || []).length })
    setRecentCmds(data.slice(0, 6))
    setBoutique(pr.data?.nom_boutique || 'Ma Boutique')
    setProfil(pr.data)
    setLiveCount(live.count || 0)

    // Données graphique
    const nbPoints = periode === 'today' ? 24 : p.days
    const points: { label: string; ca: number; benef: number }[] = []
    for (let i = nbPoints - 1; i >= 0; i--) {
      const d = new Date(since)
      let label = ''
      let dStart: Date, dEnd: Date
      if (periode === 'today') {
        dStart = new Date(since); dStart.setHours(i, 0, 0, 0)
        dEnd = new Date(since); dEnd.setHours(i + 1, 0, 0, 0)
        label = `${i}h`
      } else {
        dStart = new Date(since); dStart.setDate(since.getDate() + (nbPoints - 1 - i))
        dEnd = new Date(dStart); dEnd.setDate(dStart.getDate() + 1)
        label = dStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      }
      const dayData = livrees.filter((c: any) => {
        const cd = new Date(c.created_at)
        return cd >= dStart && cd < dEnd
      })
      points.push({
        label,
        ca: dayData.reduce((s: number, c: any) => s + (c.total_vente || 0), 0),
        benef: dayData.reduce((s: number, c: any) => s + (c.benefice || 0), 0),
      })
    }
    setChartData(points)
    setLoading(false)
  }, [periode])

  useEffect(() => {
    load()
    const iv = setInterval(load, 15000)
    const ch = supabase.channel('dash-live').on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, load).subscribe()
    return () => { clearInterval(iv); supabase.removeChannel(ch) }
  }, [load])

  // Dessiner le graphique courbe style Shopify
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || chartData.length === 0) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const maxCa = Math.max(...chartData.map(d => d.ca), 1)
    const pad = { top: 20, bottom: 36, left: 48, right: 16 }
    const gW = W - pad.left - pad.right
    const gH = H - pad.top - pad.bottom

    // Lignes horizontales
    const steps = 4
    ctx.strokeStyle = 'rgba(0,0,0,.06)'
    ctx.lineWidth = 1
    for (let i = 0; i <= steps; i++) {
      const y = pad.top + (gH / steps) * i
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke()
      const val = maxCa * (1 - i / steps)
      ctx.fillStyle = 'rgba(0,0,0,.35)'
      ctx.font = '10px -apple-system,sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(fmt(val), pad.left - 6, y + 4)
    }

    const pts = chartData.map((d, i) => ({
      x: pad.left + (i / (chartData.length - 1)) * gW,
      y: pad.top + (1 - d.ca / maxCa) * gH,
      ca: d.ca,
    }))

    // Gradient fill sous la courbe CA
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom)
    grad.addColorStop(0, 'rgba(0,122,255,.18)')
    grad.addColorStop(1, 'rgba(0,122,255,.01)')
    ctx.beginPath()
    ctx.moveTo(pts[0].x, H - pad.bottom)
    pts.forEach((p, i) => {
      if (i === 0) ctx.lineTo(p.x, p.y)
      else {
        const prev = pts[i - 1]
        const cpx = (prev.x + p.x) / 2
        ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y)
      }
    })
    ctx.lineTo(pts[pts.length - 1].x, H - pad.bottom)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Courbe CA
    ctx.beginPath()
    ctx.strokeStyle = '#007AFF'
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else {
        const prev = pts[i - 1]
        const cpx = (prev.x + p.x) / 2
        ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y)
      }
    })
    ctx.stroke()

    // Labels axe X (espacés)
    const step = Math.max(1, Math.floor(chartData.length / 5))
    ctx.fillStyle = 'rgba(0,0,0,.35)'
    ctx.font = '10px -apple-system,sans-serif'
    ctx.textAlign = 'center'
    chartData.forEach((d, i) => {
      if (i % step === 0 || i === chartData.length - 1) {
        ctx.fillText(d.label, pts[i].x, H - 8)
      }
    })

    // Points sur les valeurs non nulles
    pts.forEach(p => {
      if (p.ca > 0) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = '#007AFF'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    })
  }, [chartData])

  const pct = (cur: number, prev: number) => prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0
  const pctCa = pct(stats.ca, prevStats.ca)
  const pctNb = pct(stats.nb, prevStats.nb)
  const taux = stats.nb > 0 ? Math.round((stats.livrees / stats.nb) * 100) : 0
  const periodeLabel = PERIODES.find(p => p.id === periode)?.label || ''

  const STATUT_CFG: Record<string, { color: string; bg: string }> = {
    en_attente:   { color: '#633806', bg: '#FAEEDA' },
    en_livraison: { color: '#0C447C', bg: '#E6F1FB' },
    livre:        { color: '#085041', bg: '#E1F5EE' },
    annule:       { color: '#501313', bg: '#FCEBEB' },
    echec:        { color: '#444', bg: '#F1EFE8' },
  }
  const STATUT_LABEL: Record<string, string> = { en_attente: 'En attente', en_livraison: 'En livraison', livre: 'Livré', annule: 'Annulé', echec: 'Échec' }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: '3px solid #007AFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .dash-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:#F0F0F0;}
        .stat-cell{background:#fff;padding:16px 18px;}
        .cmd-row{transition:background .12s;cursor:pointer;}
        .cmd-row:hover{background:#F9F9F9!important;}
        .periode-btn{transition:all .15s;cursor:pointer;font-family:inherit;}
        @media(max-width:600px){
          .dash-row{grid-template-columns:1fr 1fr!important;}
          .top-row{flex-direction:column!important;align-items:flex-start!important;gap:12px!important;}
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 48 }}>

        {/* HEADER */}
        <div className="top-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', letterSpacing: -.3, margin: 0 }}>{boutique}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Visiteurs live */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '6px 12px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D' }}>{liveCount} visiteur{liveCount > 1 ? 's' : ''}</span>
            </div>
            {/* Sélecteur période */}
            <div style={{ position: 'relative' }}>
              <button className="periode-btn" onClick={() => setShowPeriodeMenu(v => !v)}
                style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
                {periodeLabel} <span style={{ fontSize: 10, color: '#999' }}>▼</span>
              </button>
              {showPeriodeMenu && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #E0E0E0', borderRadius: 14, padding: 6, zIndex: 50, minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
                  {PERIODES.map(p => (
                    <button key={p.id} onClick={() => { setPeriode(p.id); setShowPeriodeMenu(false) }}
                      style={{ display: 'block', width: '100%', padding: '9px 14px', fontSize: 13, fontWeight: periode === p.id ? 700 : 500, color: periode === p.id ? '#007AFF' : '#333', background: 'none', border: 'none', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GRANDE STAT CA */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0F0F0', padding: '20px 20px 0', marginBottom: 2, boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 16 }}>
            {/* CA */}
            <div>
              <p style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 6 }}>Ventes totales</p>
              <p style={{ fontSize: 38, fontWeight: 700, color: '#1A1A1A', letterSpacing: -1.5, lineHeight: 1, marginBottom: 4 }}>{fmt(stats.ca)} <span style={{ fontSize: 16, color: '#999', fontWeight: 500 }}>F CFA</span></p>
              {pctCa !== 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: pctCa > 0 ? '#16A34A' : '#DC2626' }}>
                    {pctCa > 0 ? '↑' : '↓'} {Math.abs(pctCa)} %
                  </span>
                  <span style={{ fontSize: 12, color: '#999' }}>vs période précédente</span>
                </div>
              )}
            </div>
            {/* Bénéfice */}
            <div>
              <p style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 6 }}>Bénéfice net</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#16A34A', letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>{fmt(stats.benef)} <span style={{ fontSize: 14, fontWeight: 500 }}>F</span></p>
              <p style={{ fontSize: 12, color: '#999' }}>Marge {stats.ca > 0 ? Math.round((stats.benef / stats.ca) * 100) : 0}%</p>
            </div>
            {/* Commandes */}
            <div>
              <p style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 6 }}>Commandes</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#1A1A1A', letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>{stats.nb}</p>
              {pctNb !== 0 && (
                <span style={{ fontSize: 13, fontWeight: 700, color: pctNb > 0 ? '#16A34A' : '#DC2626' }}>
                  {pctNb > 0 ? '↑' : '↓'} {Math.abs(pctNb)} %
                </span>
              )}
            </div>
            {/* Taux livraison */}
            <div>
              <p style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 6 }}>Taux livraison</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: taux > 70 ? '#16A34A' : taux > 40 ? '#D97706' : '#DC2626', letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>{taux} %</p>
              <p style={{ fontSize: 12, color: '#999' }}>{stats.livrees} livrées</p>
            </div>
          </div>

          {/* GRAPHIQUE COURBE */}
          <div style={{ height: 180, position: 'relative', marginLeft: -4, marginRight: -4 }}>
            {chartData.every(d => d.ca === 0) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 32 }}>📊</span>
                <p style={{ fontSize: 13, color: '#C0C0C0' }}>Aucune vente sur cette période</p>
              </div>
            ) : (
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            )}
          </div>
        </div>

        {/* STATS GRILLE */}
        <div className="dash-row" style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,.05)', border: '1px solid #F0F0F0' }}>
          {[
            { lbl: 'En attente', val: stats.en_attente, color: '#D97706', icon: '⏳' },
            { lbl: 'En livraison', val: stats.en_cours, color: '#2563EB', icon: '🚚' },
            { lbl: 'Livrées', val: stats.livrees, color: '#16A34A', icon: '✅' },
            { lbl: 'Annulées', val: stats.annulees, color: '#DC2626', icon: '❌' },
            { lbl: 'Panier moy.', val: stats.livrees > 0 ? Math.round(stats.ca / stats.livrees) : 0, color: '#7C3AED', icon: '💰', isMoney: true },
            { lbl: 'Bénéf./cmd', val: stats.livrees > 0 ? Math.round(stats.benef / stats.livrees) : 0, color: '#059669', icon: '📈', isMoney: true },
          ].map((s, i) => (
            <div key={i} className="stat-cell">
              <p style={{ fontSize: 11, color: '#999', fontWeight: 500, marginBottom: 8 }}>{s.icon} {s.lbl}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: -1, lineHeight: 1 }}>
                {(s as any).isMoney ? fmt(s.val) + ' F' : s.val}
              </p>
            </div>
          ))}
        </div>

        {/* BOUTONS RAPIDES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <Link href="/dashboard/commandes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #F0F0F0', borderRadius: 14, padding: '14px 16px', textDecoration: 'none', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>Commandes</p>
              <p style={{ fontSize: 12, color: '#999' }}>à traiter</p>
            </div>
            <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '6px 12px' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#D97706' }}>{stats.en_attente}</span>
            </div>
          </Link>
          <Link href="/dashboard/import" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #F0F0F0', borderRadius: 14, padding: '14px 16px', textDecoration: 'none', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>Sync Sheet</p>
              <p style={{ fontSize: 12, color: '#999' }}>automatique</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>Active</span>
            </div>
          </Link>
        </div>

        {/* COMMANDES RÉCENTES */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0F0F0', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,.05)', marginBottom: 16 }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>Commandes récentes</p>
            <Link href="/dashboard/commandes" style={{ fontSize: 13, color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>Voir tout</Link>
          </div>
          {recentCmds.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📦</p>
              <p style={{ fontSize: 14, color: '#C0C0C0' }}>Aucune commande sur cette période</p>
            </div>
          ) : recentCmds.map((c: any, i: number) => {
            const cfg = STATUT_CFG[c.statut] || STATUT_CFG['en_attente']
            const nom = c.client_nom || c.client_tel || 'Client'
            return (
              <div key={c.id} className="cmd-row" style={{ padding: '12px 18px', borderBottom: i < recentCmds.length - 1 ? '1px solid #F5F5F5' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
                  {nom.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</p>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{STATUT_LABEL[c.statut] || c.statut}</span>
                    {c.zone_nom && <span style={{ fontSize: 10, color: '#C0C0C0' }}>📍 {c.zone_nom}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: c.statut === 'livre' ? '#16A34A' : '#1A1A1A' }}>{fmtFull(c.total_vente || 0)} F</p>
                  {c.statut === 'livre' && c.benefice > 0 && <p style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>+{fmtFull(c.benefice)} F</p>}
                </div>
              </div>
            )
          })}
        </div>

        {/* NAVIGATION RAPIDE */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0F0F0', padding: '16px 18px', boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Navigation</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[
              { href: '/dashboard/commandes', icon: '📦', label: 'Commandes' },
              { href: '/dashboard/produits', icon: '🛍️', label: 'Produits' },
              { href: '/dashboard/rapports', icon: '📊', label: 'Rapports' },
              { href: '/dashboard/factures', icon: '🧾', label: 'Factures' },
              { href: '/dashboard/stock', icon: '🏪', label: 'Stock' },
              { href: '/dashboard/livraisons', icon: '🚚', label: 'Livraisons' },
              { href: '/dashboard/import', icon: '🔄', label: 'Sync Sheet' },
              { href: '/dashboard/flex', icon: '📈', label: 'Mes Stats' },
            ].map(m => (
              <Link key={m.href} href={m.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px', borderRadius: 14, background: '#F9F9F9', textDecoration: 'none', transition: 'background .15s' }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#555', textAlign: 'center', lineHeight: 1.3 }}>{m.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
