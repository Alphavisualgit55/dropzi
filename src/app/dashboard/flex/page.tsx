'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
const fmtK = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + ' M'
  if (n >= 1000) return (n / 1000).toFixed(0) + ' k'
  return fmt(n)
}

const PERIODES = [
  { id: 'today', label: "Aujourd'hui" },
  { id: '7j', label: '7 jours' },
  { id: '30j', label: '30 jours' },
  { id: 'month', label: 'Ce mois' },
]

export default function StatsPage() {
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [periode, setPeriode] = useState('30j')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ benef: 0, ca: 0, nb: 0, livrees: 0, en_cours: 0, annulees: 0, en_attente: 0, panier: 0, marge: 0, retour: 0, benefCmd: 0 })
  const [prevStats, setPrevStats] = useState({ benef: 0, ca: 0, nb: 0 })
  const [topProduits, setTopProduits] = useState<{ nom: string; nb: number; ca: number; benef: number }[]>([])
  const [chartData, setChartData] = useState<{ label: string; ca: number; benef: number }[]>([])
  const [boutique, setBoutique] = useState('')
  const [showChart, setShowChart] = useState<'ca'|'benef'>('benef')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    let since = new Date()
    if (periode === 'today') { since.setHours(0,0,0,0) }
    else if (periode === 'month') { since.setDate(1); since.setHours(0,0,0,0) }
    else if (periode === '7j') { since.setDate(now.getDate() - 7); since.setHours(0,0,0,0) }
    else if (periode === '30j') { since.setDate(now.getDate() - 30); since.setHours(0,0,0,0) }

    const prevSince = new Date(since)
    const diff = now.getTime() - since.getTime()
    prevSince.setTime(since.getTime() - diff)

    const [cmd, prevCmd, items, pr] = await Promise.all([
      supabase.from('commandes_detail').select('*').gte('created_at', since.toISOString()).order('created_at', { ascending: true }),
      supabase.from('commandes_detail').select('total_vente,benefice,statut').gte('created_at', prevSince.toISOString()).lt('created_at', since.toISOString()),
      supabase.from('commande_items').select('quantite, prix_unitaire, cout_unitaire, produits(nom)').gte('created_at', since.toISOString()),
      supabase.from('profiles').select('nom_boutique').eq('id', user.id).single(),
    ])

    const data = cmd.data || []
    const livrees = data.filter((c: any) => c.statut === 'livre')
    const ca = livrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const benef = livrees.reduce((s: number, c: any) => s + (c.benefice || 0), 0)
    const annulees = data.filter((c: any) => ['annule','echec'].includes(c.statut)).length
    const enCours = data.filter((c: any) => c.statut === 'en_livraison').length
    const enAttente = data.filter((c: any) => c.statut === 'en_attente').length

    const prevLivrees = (prevCmd.data || []).filter((c: any) => c.statut === 'livre')
    setPrevStats({
      ca: prevLivrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0),
      benef: prevLivrees.reduce((s: number, c: any) => s + (c.benefice || 0), 0),
      nb: (prevCmd.data || []).length,
    })

    setStats({
      benef, ca, nb: data.length, livrees: livrees.length, en_cours: enCours, annulees, en_attente: enAttente,
      panier: livrees.length > 0 ? Math.round(ca / livrees.length) : 0,
      marge: ca > 0 ? Math.round((benef / ca) * 100) : 0,
      retour: data.length > 0 ? Math.round((annulees / data.length) * 100) : 0,
      benefCmd: livrees.length > 0 ? Math.round(benef / livrees.length) : 0,
    })

    // Top produits
    const prodMap: Record<string, { nb: number; ca: number; benef: number }> = {}
    ;(items.data || []).forEach((ci: any) => {
      const nom = ci.produits?.nom || 'Inconnu'
      if (!prodMap[nom]) prodMap[nom] = { nb: 0, ca: 0, benef: 0 }
      const q = ci.quantite || 1
      prodMap[nom].nb += q
      prodMap[nom].ca += (ci.prix_unitaire || 0) * q
      prodMap[nom].benef += ((ci.prix_unitaire || 0) - (ci.cout_unitaire || 0)) * q
    })
    setTopProduits(Object.entries(prodMap).sort((a, b) => b[1].nb - a[1].nb).slice(0, 8).map(([nom, v]) => ({ nom, ...v })))

    // Graphique
    const nbPoints = periode === 'today' ? 24 : 30
    const pts: { label: string; ca: number; benef: number }[] = []
    for (let i = nbPoints - 1; i >= 0; i--) {
      let label = '', dStart: Date, dEnd: Date
      if (periode === 'today') {
        dStart = new Date(); dStart.setHours(i, 0, 0, 0)
        dEnd = new Date(); dEnd.setHours(i + 1, 0, 0, 0)
        label = `${i}h`
      } else {
        dStart = new Date(now); dStart.setDate(now.getDate() - i); dStart.setHours(0, 0, 0, 0)
        dEnd = new Date(dStart); dEnd.setDate(dStart.getDate() + 1)
        label = dStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      }
      const dayData = livrees.filter((c: any) => {
        const cd = new Date(c.created_at); return cd >= dStart && cd < dEnd
      })
      pts.push({
        label,
        ca: dayData.reduce((s: number, c: any) => s + (c.total_vente || 0), 0),
        benef: dayData.reduce((s: number, c: any) => s + (c.benefice || 0), 0),
      })
    }
    setChartData(pts)
    setBoutique(pr.data?.nom_boutique || 'Ma Boutique')
    setLoading(false)
  }, [periode])

  useEffect(() => { load() }, [load])

  // Dessiner graphique
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || chartData.length === 0) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth; const H = canvas.offsetHeight
    canvas.width = W * dpr; canvas.height = H * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const vals = chartData.map(d => showChart === 'ca' ? d.ca : d.benef)
    const maxV = Math.max(...vals, 1)
    const pad = { top: 16, bottom: 32, left: 52, right: 12 }
    const gW = W - pad.left - pad.right
    const gH = H - pad.top - pad.bottom
    const color = showChart === 'ca' ? '#007AFF' : '#16A34A'

    // Grilles horizontales
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (gH / 4) * i
      ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke()
      ctx.fillStyle = '#AAA'; ctx.font = '10px -apple-system,sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(fmtK(maxV * (1 - i / 4)), pad.left - 6, y + 4)
    }

    const pts = vals.map((v, i) => ({ x: pad.left + (i / (vals.length - 1)) * gW, y: pad.top + (1 - v / maxV) * gH }))

    // Gradient
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom)
    grad.addColorStop(0, color + '28'); grad.addColorStop(1, color + '04')
    ctx.beginPath()
    ctx.moveTo(pts[0].x, H - pad.bottom)
    pts.forEach((p, i) => {
      if (i === 0) ctx.lineTo(p.x, p.y)
      else { const prev = pts[i-1]; const cx = (prev.x + p.x) / 2; ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y) }
    })
    ctx.lineTo(pts[pts.length-1].x, H - pad.bottom)
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill()

    // Courbe
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else { const prev = pts[i-1]; const cx = (prev.x + p.x) / 2; ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y) }
    })
    ctx.stroke()

    // Labels X
    const step = Math.max(1, Math.floor(chartData.length / 6))
    ctx.fillStyle = '#AAA'; ctx.font = '10px -apple-system,sans-serif'; ctx.textAlign = 'center'
    chartData.forEach((d, i) => {
      if (i % step === 0 || i === chartData.length - 1) ctx.fillText(d.label, pts[i].x, H - 8)
    })

    // Points sur données non nulles
    pts.forEach(p => {
      if (vals[pts.indexOf(p)] > 0) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'; ctx.fill()
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke()
      }
    })
  }, [chartData, showChart])

  const pct = (cur: number, prev: number) => prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null
  const pctCa = pct(stats.ca, prevStats.ca)
  const pctBenef = pct(stats.benef, prevStats.benef)
  const pctNb = pct(stats.nb, prevStats.nb)
  const taux = stats.nb > 0 ? Math.round((stats.livrees / stats.nb) * 100) : 0

  const Badge = ({ val }: { val: number | null }) => {
    if (val === null) return null
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: val >= 0 ? '#16A34A' : '#DC2626', background: val >= 0 ? '#F0FFF4' : '#FEF2F2', padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>
        {val >= 0 ? '↑' : '↓'} {Math.abs(val)}%
      </span>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', paddingBottom: 48 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.sbt{transition:all .15s;cursor:pointer;font-family:inherit;}`}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.5, margin: 0 }}>Mes Stats 📈</h1>
          <p style={{ fontSize: 13, color: '#ABABAB', marginTop: 4 }}>{boutique}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PERIODES.map(p => (
            <button key={p.id} className="sbt" onClick={() => setPeriode(p.id)}
              style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${periode === p.id ? '#7F77DD' : '#EBEBEB'}`, background: periode === p.id ? '#EEEDFE' : '#fff', color: periode === p.id ? '#534AB7' : '#888', fontWeight: 700, fontSize: 12 }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPIs PRINCIPAUX */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {/* Bénéfice */}
            <div style={{ background: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: 18, padding: '18px 18px' }}>
              <p style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>💰 Bénéfice net</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: '#15803D', letterSpacing: -1.5, lineHeight: 1, marginBottom: 4 }}>{fmtK(stats.benef)}<span style={{ fontSize: 16, fontWeight: 600, marginLeft: 4 }}>F</span></p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#166534' }}>Marge {stats.marge}%</span>
                <Badge val={pctBenef} />
              </div>
            </div>
            {/* CA */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 18, padding: '18px 18px' }}>
              <p style={{ fontSize: 11, color: '#2563EB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>📦 CA total</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: '#1D4ED8', letterSpacing: -1.5, lineHeight: 1, marginBottom: 4 }}>{fmtK(stats.ca)}<span style={{ fontSize: 16, fontWeight: 600, marginLeft: 4 }}>F</span></p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#1E40AF' }}>{stats.livrees} livr.</span>
                <Badge val={pctCa} />
              </div>
            </div>
          </div>

          {/* GRAPHIQUE */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0F0F0', padding: '18px', boxShadow: '0 1px 8px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0C0C1E' }}>Évolution des ventes</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['benef','Bénéfice','#16A34A'], ['ca','CA','#007AFF']].map(([id, label, color]) => (
                  <button key={id} className="sbt" onClick={() => setShowChart(id as any)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${showChart === id ? color : '#EBEBEB'}`, background: showChart === id ? color + '15' : '#fff', color: showChart === id ? color : '#888', fontWeight: 700, fontSize: 12 }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 200, position: 'relative' }}>
              {chartData.every(d => (showChart === 'ca' ? d.ca : d.benef) === 0) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 32 }}>📊</span>
                  <p style={{ fontSize: 13, color: '#C0C0C0' }}>Aucune vente sur cette période</p>
                </div>
              ) : <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />}
            </div>
          </div>

          {/* STATS GRILLE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { lbl: '📊 Commandes', val: stats.nb, sub: null, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', pctVal: pctNb },
              { lbl: '✅ Livrées', val: stats.livrees, sub: `${taux}% taux`, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', pctVal: null },
              { lbl: '⏳ En attente', val: stats.en_attente, sub: null, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', pctVal: null },
              { lbl: '🚚 En livraison', val: stats.en_cours, sub: null, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', pctVal: null },
              { lbl: '❌ Annulées', val: stats.annulees, sub: `${stats.retour}% retour`, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', pctVal: null },
              { lbl: '🛒 Panier moy.', val: stats.panier, sub: 'FCFA', color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', pctVal: null, isMoney: true },
            ].map(k => (
              <div key={k.lbl} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 16, padding: '14px 14px' }}>
                <p style={{ fontSize: 10, color: k.color, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{k.lbl}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: -.8, lineHeight: 1, marginBottom: 3 }}>
                  {(k as any).isMoney ? fmtK(k.val) : k.val}
                </p>
                {k.sub && <p style={{ fontSize: 10, color: k.color, opacity: .6 }}>{k.sub}</p>}
                {k.pctVal !== null && <Badge val={k.pctVal} />}
              </div>
            ))}
          </div>

          {/* BARRE RÉPARTITION */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0F0F0', padding: '18px', boxShadow: '0 1px 8px rgba(0,0,0,.04)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0C0C1E', marginBottom: 16 }}>Répartition des commandes</p>

            {/* Barre visuelle */}
            <div style={{ height: 10, borderRadius: 8, overflow: 'hidden', display: 'flex', marginBottom: 16 }}>
              {stats.nb > 0 && [
                { val: stats.livrees, color: '#16A34A' },
                { val: stats.en_cours, color: '#2563EB' },
                { val: stats.en_attente, color: '#D97706' },
                { val: stats.annulees, color: '#DC2626' },
              ].map((s, i) => s.val > 0 ? (
                <div key={i} style={{ width: `${(s.val / stats.nb) * 100}%`, background: s.color, transition: 'width .6s ease' }} />
              ) : null)}
            </div>

            {[
              { lbl: 'Livrées', val: stats.livrees, color: '#16A34A' },
              { lbl: 'En livraison', val: stats.en_cours, color: '#2563EB' },
              { lbl: 'En attente', val: stats.en_attente, color: '#D97706' },
              { lbl: 'Annulées', val: stats.annulees, color: '#DC2626' },
            ].map(r => (
              <div key={r.lbl} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#555', flex: 1 }}>{r.lbl}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E' }}>{r.val}</span>
                <span style={{ fontSize: 12, color: '#ABABAB', width: 40, textAlign: 'right' }}>{stats.nb > 0 ? Math.round((r.val / stats.nb) * 100) : 0}%</span>
              </div>
            ))}
          </div>

          {/* TOP PRODUITS */}
          {topProduits.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0F0F0', padding: '18px', boxShadow: '0 1px 8px rgba(0,0,0,.04)' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0C0C1E', marginBottom: 16 }}>🏆 Top produits</p>
              {topProduits.map((p, i) => (
                <div key={p.nom} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣'][i]}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</span>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#7F77DD' }}>{p.nb} ventes</span>
                      <span style={{ fontSize: 11, color: '#ABABAB', display: 'block' }}>{fmtK(p.ca)} F CA · {fmtK(p.benef)} F bén.</span>
                    </div>
                  </div>
                  <div style={{ background: '#F5F5F5', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${(p.nb / topProduits[0].nb) * 100}%`, height: '100%', background: ['#7F77DD','#1D9E75','#BA7517','#E24B4A','#378ADD','#7C3AED','#D97706','#059669'][i], borderRadius: 6, transition: 'width .6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INDICATEURS AVANCÉS */}
          <div style={{ background: '#0C0C1E', borderRadius: 18, padding: '20px', color: '#fff' }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Indicateurs avancés</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              {[
                { lbl: 'Bénéfice / commande', val: fmtK(stats.benefCmd) + ' F', icon: '💎' },
                { lbl: 'Taux de livraison', val: taux + '%', icon: '✅' },
                { lbl: 'Taux d\'annulation', val: stats.retour + '%', icon: '❌' },
                { lbl: 'Panier moyen', val: fmtK(stats.panier) + ' F', icon: '🛒' },
              ].map(k => (
                <div key={k.lbl} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '14px' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{k.icon} {k.lbl}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -.8 }}>{k.val}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
