'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const STATUT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  en_attente:   { label: 'En attente',   color: '#633806', bg: '#FAEEDA' },
  en_livraison: { label: 'En livraison', color: '#0C447C', bg: '#E6F1FB' },
  livre:        { label: 'Livré',        color: '#085041', bg: '#E1F5EE' },
  annule:       { label: 'Annulé',       color: '#501313', bg: '#FCEBEB' },
  echec:        { label: 'Échec',        color: '#444441', bg: '#F1EFE8' },
}

const MENU = [
  { href: '/dashboard/commandes',     icon: '📦', label: 'Commandes',      color: '#7F77DD', bg: '#EEEDFE' },
  { href: '/dashboard/produits',      icon: '🛍️', label: 'Produits',       color: '#1D9E75', bg: '#E1F5EE' },
  { href: '/dashboard/stock',         icon: '🏪', label: 'Stock',          color: '#BA7517', bg: '#FAEEDA' },
  { href: '/dashboard/livraisons',    icon: '🚚', label: 'Livraisons',     color: '#378ADD', bg: '#E6F1FB' },
  { href: '/dashboard/rapports',      icon: '📊', label: 'Rapports',       color: '#25D366', bg: '#E1F5EE' },
  { href: '/dashboard/factures',      icon: '🧾', label: 'Factures',       color: '#534AB7', bg: '#EEEDFE' },
  { href: '/dashboard/import',        icon: '🔄', label: 'Sync Sheet',     color: '#378ADD', bg: '#E6F1FB' },
  { href: '/dashboard/import-produits',icon: '📥', label: 'Import Produits',color: '#BA7517', bg: '#FAEEDA' },
]

export default function DashboardPage() {
  const supabase = createClient()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const [stats, setStats] = useState({ benef: 0, ca: 0, nb: 0, livrees: 0, en_cours: 0, annulees: 0, panier: 0 })
  const [hierBenef, setHierBenef] = useState(0)
  const [commandes, setCommandes] = useState<any[]>([])
  const [profil, setProfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [semaine, setSemaine] = useState<{ jour: string; benef: number; ca: number }[]>([])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6)

    const [cmd, hier, pr, semCmd] = await Promise.all([
      supabase.from('commandes_detail').select('*').gte('created_at', today.toISOString()).order('created_at', { ascending: false }),
      supabase.from('commandes_detail').select('benefice,statut').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('commandes_detail').select('created_at,benefice,total_vente,statut').gte('created_at', weekStart.toISOString()),
    ])

    const data = cmd.data || []
    const livrees = data.filter((c: any) => c.statut === 'livre')
    const ca = livrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const benef = livrees.reduce((s: number, c: any) => s + (c.benefice || 0), 0)
    const hierB = (hier.data || []).filter((c: any) => c.statut === 'livre').reduce((s: number, c: any) => s + (c.benefice || 0), 0)

    setStats({ benef, ca, nb: data.length, livrees: livrees.length, en_cours: data.filter((c: any) => c.statut === 'en_livraison').length, annulees: data.filter((c: any) => ['annule','echec'].includes(c.statut)).length, panier: livrees.length > 0 ? Math.round(ca / livrees.length) : 0 })
    setHierBenef(hierB)
    setCommandes(data.slice(0, 8))
    setProfil(pr.data)

    // Données graphique 7 jours
    const jours: { jour: string; benef: number; ca: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const next = new Date(d); next.setDate(d.getDate() + 1)
      const dayData = (semCmd.data || []).filter((c: any) => {
        const cd = new Date(c.created_at)
        return cd >= d && cd < next && c.statut === 'livre'
      })
      jours.push({
        jour: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
        benef: dayData.reduce((s: number, c: any) => s + (c.benefice || 0), 0),
        ca: dayData.reduce((s: number, c: any) => s + (c.total_vente || 0), 0),
      })
    }
    setSemaine(jours)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('dash').on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Dessiner le graphique
  useEffect(() => {
    if (!chartRef.current || semaine.length === 0) return
    const canvas = chartRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = canvas.offsetWidth * window.devicePixelRatio
    const H = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight

    ctx.clearRect(0, 0, w, h)
    const max = Math.max(...semaine.map(s => s.benef), 1)
    const pad = { top: 20, bottom: 32, left: 8, right: 8 }
    const barW = (w - pad.left - pad.right) / semaine.length

    semaine.forEach((s, i) => {
      const x = pad.left + i * barW
      const barH = ((s.benef / max) * (h - pad.top - pad.bottom))
      const y = h - pad.bottom - barH
      const isToday = i === semaine.length - 1

      // Barre
      const grad = ctx.createLinearGradient(0, y, 0, h - pad.bottom)
      grad.addColorStop(0, isToday ? '#7F77DD' : '#CECBF6')
      grad.addColorStop(1, isToday ? '#534AB7' : '#EEEDFE')
      ctx.fillStyle = grad
      const bw = barW * .55
      const bx = x + (barW - bw) / 2
      const radius = 6
      ctx.beginPath()
      ctx.moveTo(bx + radius, y)
      ctx.lineTo(bx + bw - radius, y)
      ctx.quadraticCurveTo(bx + bw, y, bx + bw, y + radius)
      ctx.lineTo(bx + bw, h - pad.bottom)
      ctx.lineTo(bx, h - pad.bottom)
      ctx.lineTo(bx, y + radius)
      ctx.quadraticCurveTo(bx, y, bx + radius, y)
      ctx.fill()

      // Valeur
      if (s.benef > 0) {
        ctx.fillStyle = isToday ? '#534AB7' : '#AFA9EC'
        ctx.font = `${isToday ? 'bold ' : ''}10px -apple-system,sans-serif`
        ctx.textAlign = 'center'
        const label = s.benef >= 1000 ? Math.round(s.benef / 1000) + 'k' : String(Math.round(s.benef))
        ctx.fillText(label, x + barW / 2, y - 5)
      }

      // Jour
      ctx.fillStyle = isToday ? '#534AB7' : '#ABABAB'
      ctx.font = `${isToday ? 'bold ' : ''}11px -apple-system,sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(s.jour, x + barW / 2, h - 10)
    })
  }, [semaine])

  const pct = hierBenef > 0 ? Math.round(((stats.benef - hierBenef) / hierBenef) * 100) : 0
  const heure = new Date().getHours()
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: '3px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .dash-grid{display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start;}
        .menu-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
        .cmd-row{transition:background .15s;cursor:default;}
        .cmd-row:hover{background:#F5F4FE!important;}
        .menu-link{transition:transform .15s,box-shadow .15s;text-decoration:none;}
        .menu-link:hover{transform:translateY(-2px);}
        @media(max-width:900px){
          .dash-grid{grid-template-columns:1fr!important;}
          .menu-grid{grid-template-columns:repeat(4,1fr)!important;}
        }
        @media(max-width:500px){
          .menu-grid{grid-template-columns:repeat(4,1fr)!important;}
          .stats-row{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 32 }}>

        {/* ── HERO SOMBRE ── */}
        <div style={{ margin: '-24px -24px 20px', background: '#06060F', position: 'relative', overflow: 'hidden', paddingBottom: 32 }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, background: 'radial-gradient(circle,rgba(127,119,221,.2),transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(29,158,117,.1),transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, padding: '24px 24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginBottom: 4, textTransform: 'capitalize' }}>
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <h1 style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: -.5, margin: 0 }}>
                  {salut} 👋 <span style={{ color: '#AFA9EC' }}>{profil?.nom_boutique || 'Ma Boutique'}</span>
                </h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(29,158,117,.15)', border: '1px solid rgba(29,158,117,.3)', borderRadius: 20, padding: '6px 14px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, color: '#9FE1CB', fontWeight: 600 }}>Temps réel</span>
              </div>
            </div>

            {/* Stats hero */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
              {/* Bénéfice principal */}
              <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '18px 20px', gridColumn: 'span 2' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Bénéfice aujourd'hui</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, color: '#fff', letterSpacing: -2.5, lineHeight: 1 }}>{fmt(stats.benef)}</span>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,.4)', fontWeight: 600, marginBottom: 4 }}>FCFA</span>
                  {pct !== 0 && <span style={{ marginLeft: 'auto', marginBottom: 2, background: pct > 0 ? 'rgba(29,158,117,.25)' : 'rgba(226,75,74,.25)', color: pct > 0 ? '#9FE1CB' : '#F09595', fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>{pct > 0 ? '+' : ''}{pct}% vs hier</span>}
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '10px 0' }} />
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[['CA', fmt(stats.ca) + ' F'], ['Commandes', String(stats.nb)], ['Panier moy.', fmt(stats.panier) + ' F']].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{v}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats statuts */}
              {[
                { l: 'Livrées', v: stats.livrees, c: '#1D9E75', bg: 'rgba(29,158,117,.12)' },
                { l: 'En cours', v: stats.en_cours, c: '#378ADD', bg: 'rgba(55,138,221,.12)' },
                { l: 'Annulées', v: stats.annulees, c: '#E24B4A', bg: 'rgba(226,75,74,.12)' },
              ].map(s => (
                <div key={s.l} style={{ background: s.bg, border: `1px solid ${s.c}22`, borderRadius: 20, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 10, color: s.c, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, marginBottom: 8, opacity: .8 }}>{s.l}</p>
                  <p style={{ fontSize: 42, fontWeight: 800, color: s.c, letterSpacing: -2, lineHeight: 1 }}>{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Courbe */}
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 40, marginTop: 0 }}>
            <path d="M0,0 C480,40 960,0 1440,30 L1440,40 L0,40 Z" fill="#F2F2F7" />
          </svg>
        </div>

        {/* ── LAYOUT 2 COLONNES PC / 1 COLONNE MOBILE ── */}
        <div className="dash-grid">

          {/* COLONNE GAUCHE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* GRAPHIQUE VENTES */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px 20px 16px', boxShadow: '0 2px 16px rgba(0,0,0,.06)', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.3 }}>Bénéfices — 7 derniers jours</p>
                  <p style={{ fontSize: 12, color: '#C0C0C0', marginTop: 2 }}>
                    Total semaine : <strong style={{ color: '#7F77DD' }}>{fmt(semaine.reduce((s, d) => s + d.benef, 0))} F</strong>
                  </p>
                </div>
                <div style={{ background: '#EEEDFE', borderRadius: 10, padding: '4px 12px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#534AB7' }}>7 jours</span>
                </div>
              </div>
              <div style={{ height: 160, position: 'relative' }}>
                {semaine.every(s => s.benef === 0) ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 32 }}>📊</span>
                    <p style={{ fontSize: 13, color: '#C0C0C0' }}>Aucune vente cette semaine</p>
                  </div>
                ) : (
                  <canvas ref={chartRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                )}
              </div>
            </div>

            {/* BOUTON NOUVELLE COMMANDE */}
            <Link href="/dashboard/commandes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', borderRadius: 18, padding: '18px 22px', textDecoration: 'none', boxShadow: '0 8px 24px rgba(127,119,221,.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚡</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>Nouvelle commande</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Créer ou voir toutes les commandes</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: 'rgba(255,255,255,.2)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 800 }}>{stats.nb} auj.</span>
                <span style={{ fontSize: 22, opacity: .7 }}>→</span>
              </div>
            </Link>

            {/* COMMANDES RÉCENTES */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,.06)', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.3 }}>Commandes du jour</p>
                <Link href="/dashboard/commandes" style={{ fontSize: 12, color: '#7F77DD', fontWeight: 700, textDecoration: 'none' }}>Voir tout →</Link>
              </div>
              {commandes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
                  <p style={{ fontSize: 14, color: '#C0C0C0' }}>Aucune commande aujourd'hui</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {commandes.map((c: any) => {
                    const cfg = STATUT_CFG[c.statut] || STATUT_CFG['en_attente']
                    return (
                      <div key={c.id} className="cmd-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F8F8FC', borderRadius: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
                          {(c.client_nom || c.client_tel || 'C').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.client_nom || c.client_tel || 'Client'}
                          </p>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                            {c.zone_nom && <span style={{ fontSize: 10, color: '#C0C0C0' }}>📍 {c.zone_nom}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: c.statut === 'livre' ? '#1D9E75' : '#0C0C1E' }}>{fmt(c.total_vente || 0)} F</p>
                          {c.statut === 'livre' && c.benefice > 0 && <p style={{ fontSize: 10, color: '#1D9E75', fontWeight: 700 }}>+{fmt(c.benefice)} F</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* MENU NAVIGATION */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,.06)', border: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>Navigation</p>
              <div className="menu-grid">
                {MENU.map(m => (
                  <Link key={m.href} href={m.href} className="menu-link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px', borderRadius: 14, background: m.bg + '66', border: `1px solid ${m.color}22` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.icon}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: m.color, textAlign: 'center', lineHeight: 1.2 }}>{m.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* SYNC SHEET STATUS */}
            <Link href="/dashboard/import" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', borderRadius: 18, padding: '16px 18px', textDecoration: 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(29,158,117,.2)', border: '1px solid rgba(29,158,117,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🔄</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Sync Google Sheet</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 11, color: '#9FE1CB' }}>Active · toutes les 60 secondes</span>
                </div>
              </div>
              <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 18 }}>→</span>
            </Link>

            {/* ACCÈS RAPIDES */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,.06)', border: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>Accès rapides</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: '/dashboard/rapports', icon: '📊', label: 'Voir mes rapports', sub: 'Bilan hebdo & mensuel', color: '#25D366' },
                  { href: '/dashboard/factures', icon: '🧾', label: 'Créer une facture', sub: '5 modèles premium', color: '#7F77DD' },
                  { href: '/dashboard/import-produits', icon: '📥', label: 'Importer des produits', sub: 'Depuis Shopify CSV', color: '#BA7517' },
                ].map(a => (
                  <Link key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F8F8FC', borderRadius: 14, textDecoration: 'none', border: '1px solid #f0f0f0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: a.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E', marginBottom: 2 }}>{a.label}</p>
                      <p style={{ fontSize: 11, color: '#C0C0C0' }}>{a.sub}</p>
                    </div>
                    <span style={{ color: '#DCDCDC', fontSize: 16 }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
