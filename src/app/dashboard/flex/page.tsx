'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const THEMES = [
  {
    id: 'dark',
    nom: 'Dark Premium',
    bg: 'linear-gradient(135deg,#06060F 0%,#0C0C1E 50%,#1a1a3e 100%)',
    accent: '#7F77DD',
    text: '#fff',
    sub: 'rgba(255,255,255,.5)',
    card: 'rgba(255,255,255,.06)',
    border: 'rgba(127,119,221,.3)',
  },
  {
    id: 'gold',
    nom: 'Gold Luxe',
    bg: 'linear-gradient(135deg,#0A0800 0%,#1A1200 50%,#2A1E00 100%)',
    accent: '#F5C842',
    text: '#fff',
    sub: 'rgba(245,200,66,.6)',
    card: 'rgba(245,200,66,.08)',
    border: 'rgba(245,200,66,.3)',
  },
  {
    id: 'green',
    nom: 'Green Money',
    bg: 'linear-gradient(135deg,#000D06 0%,#001A0C 50%,#002A14 100%)',
    accent: '#00E676',
    text: '#fff',
    sub: 'rgba(0,230,118,.6)',
    card: 'rgba(0,230,118,.08)',
    border: 'rgba(0,230,118,.25)',
  },
  {
    id: 'purple',
    nom: 'Purple King',
    bg: 'linear-gradient(135deg,#0D0020 0%,#1A0040 50%,#2D0060 100%)',
    accent: '#BF5FFF',
    text: '#fff',
    sub: 'rgba(191,95,255,.6)',
    card: 'rgba(191,95,255,.08)',
    border: 'rgba(191,95,255,.3)',
  },
  {
    id: 'fire',
    nom: 'Fire Boss',
    bg: 'linear-gradient(135deg,#0D0000 0%,#200000 50%,#350800 100%)',
    accent: '#FF4D00',
    text: '#fff',
    sub: 'rgba(255,77,0,.6)',
    card: 'rgba(255,77,0,.08)',
    border: 'rgba(255,77,0,.3)',
  },
]

const PERIODES = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: '7 jours' },
  { id: 'month', label: 'Ce mois' },
]

export default function FlexPage() {
  const supabase = createClient()
  const cardRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState(THEMES[0])
  const [periode, setPeriode] = useState('today')
  const [stats, setStats] = useState({ benef: 0, ca: 0, nb: 0, livrees: 0, topProduit: '' })
  const [boutique, setBoutique] = useState('Ma Boutique')
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [showEmoji, setShowEmoji] = useState(true)
  const [showLogo, setShowLogo] = useState(true)

  useEffect(() => {
    load()
  }, [periode])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    let depuis = new Date()
    if (periode === 'today') { depuis.setHours(0,0,0,0) }
    else if (periode === 'week') { depuis.setDate(now.getDate() - 7) }
    else { depuis.setDate(1); depuis.setHours(0,0,0,0) }

    const [cmd, pr] = await Promise.all([
      supabase.from('commandes_detail').select('*').gte('created_at', depuis.toISOString()),
      supabase.from('profiles').select('nom_boutique').eq('id', user.id).single(),
    ])

    const data = cmd.data || []
    const livrees = data.filter((c: any) => c.statut === 'livre')
    const ca = livrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const benef = livrees.reduce((s: number, c: any) => s + (c.benefice || 0), 0)

    // Top produit
    const prodCounts: Record<string, number> = {}
    data.forEach((c: any) => {
      if (c.produit_nom) prodCounts[c.produit_nom] = (prodCounts[c.produit_nom] || 0) + 1
    })
    const top = Object.entries(prodCounts).sort((a, b) => b[1] - a[1])[0]

    setStats({ benef, ca, nb: data.length, livrees: livrees.length, topProduit: top?.[0] || '' })
    setBoutique(pr.data?.nom_boutique || 'Ma Boutique')
    setLoading(false)
  }

  async function takeScreenshot() {
    setCopying(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current!, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      })
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dropzi-flex-${periode}.png`
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (e) {
      alert('Erreur lors de la capture. Essaie de faire une capture manuelle.')
    }
    setCopying(false)
  }

  const t = theme
  const periodeLabel = PERIODES.find(p => p.id === periode)?.label || ''
  const taux = stats.nb > 0 ? Math.round((stats.livrees / stats.nb) * 100) : 0
  const margeLabel = stats.ca > 0 ? Math.round((stats.benef / stats.ca) * 100) : 0

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 40 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.5 }}>Mes Stats 📈</h1>
        <p style={{ fontSize: 13, color: '#ABABAB', marginTop: 4 }}>Génère une carte de tes ventes à partager sur WhatsApp & Instagram</p>
      </div>

      {/* Sélecteur période */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {PERIODES.map(p => (
          <button key={p.id} onClick={() => setPeriode(p.id)}
            style={{ flex: 1, padding: '9px', borderRadius: 12, border: `2px solid ${periode === p.id ? '#7F77DD' : '#EBEBEB'}`, background: periode === p.id ? '#EEEDFE' : '#fff', color: periode === p.id ? '#534AB7' : '#888', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Sélecteur thème */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {THEMES.map(th => (
          <button key={th.id} onClick={() => setTheme(th)}
            style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: th.bg, border: `3px solid ${theme.id === th.id ? th.accent : 'transparent'}`, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            {theme.id === th.id && (
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[['showEmoji', showEmoji, setShowEmoji, '🔥 Emojis'], ['showLogo', showLogo, setShowLogo, '🏷️ Logo Dropzi']].map(([key, val, setter, label]: any) => (
          <button key={key} onClick={() => setter(!val)}
            style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1.5px solid ${val ? '#7F77DD' : '#EBEBEB'}`, background: val ? '#EEEDFE' : '#fff', color: val ? '#534AB7' : '#ABABAB', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {/* CARTE FLEX */}
      <div ref={cardRef} style={{ background: t.bg, borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
        {/* Orbes déco */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: `radial-gradient(circle,${t.accent}25,transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, background: `radial-gradient(circle,${t.accent}15,transparent 70%)`, pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, color: t.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>
              {showEmoji ? '🏪 ' : ''}{boutique}
            </p>
            <p style={{ fontSize: 13, color: t.sub, fontWeight: 500 }}>
              Rapport — {periodeLabel}
            </p>
          </div>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: '5px 12px' }}>
            <span style={{ fontSize: 11, color: t.accent, fontWeight: 700 }}>
              {showEmoji ? '⚡ ' : ''}DROPZI
            </span>
          </div>
        </div>

        {/* Bénéfice principal */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: '20px', marginBottom: 16 }}>
          <p style={{ fontSize: 10, color: t.sub, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>
            {showEmoji ? '💰 ' : ''}Bénéfice net
          </p>
          <p style={{ fontSize: 48, fontWeight: 800, color: t.text, letterSpacing: -2.5, lineHeight: 1, marginBottom: 6 }}>
            {fmt(stats.benef)}
            <span style={{ fontSize: 18, color: t.sub, marginLeft: 6 }}>FCFA</span>
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{fmt(stats.ca)} F</p>
              <p style={{ fontSize: 9, color: t.sub, textTransform: 'uppercase', letterSpacing: '.06em' }}>CA Total</p>
            </div>
            <div style={{ width: 1, background: t.border }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>{margeLabel}%</p>
              <p style={{ fontSize: 9, color: t.sub, textTransform: 'uppercase', letterSpacing: '.06em' }}>Marge</p>
            </div>
            <div style={{ width: 1, background: t.border }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{stats.nb}</p>
              <p style={{ fontSize: 9, color: t.sub, textTransform: 'uppercase', letterSpacing: '.06em' }}>Commandes</p>
            </div>
          </div>
        </div>

        {/* Stats secondaires */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: '14px' }}>
            <p style={{ fontSize: 9, color: t.sub, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
              {showEmoji ? '✅ ' : ''}Livrées
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: t.accent, letterSpacing: -1 }}>{stats.livrees}</p>
            <p style={{ fontSize: 10, color: t.sub, marginTop: 4 }}>Taux {taux}%</p>
          </div>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: '14px' }}>
            <p style={{ fontSize: 9, color: t.sub, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
              {showEmoji ? '🛍️ ' : ''}Panier moy.
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: -1 }}>
              {stats.livrees > 0 ? fmt(Math.round(stats.ca / stats.livrees)) : '0'}
            </p>
            <p style={{ fontSize: 9, color: t.sub, marginTop: 4 }}>FCFA/commande</p>
          </div>
        </div>

        {/* Top produit */}
        {stats.topProduit && (
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{showEmoji ? '🏆' : '★'}</span>
            <div>
              <p style={{ fontSize: 9, color: t.sub, textTransform: 'uppercase', letterSpacing: '.08em' }}>Top produit</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: t.text, marginTop: 2 }}>{stats.topProduit}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        {showLogo && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontSize: 11, color: t.sub, fontWeight: 600 }}>Propulsé par Dropzi</span>
          </div>
        )}
      </div>

      {/* Bouton télécharger */}
      <button onClick={takeScreenshot} disabled={copying || loading}
        style={{ width: '100%', background: copying ? '#ccc' : 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(127,119,221,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {copying ? (
          <>
            <span style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
            Génération...
          </>
        ) : (
          <>📸 Télécharger l'image</>
        )}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#ABABAB', marginTop: 10 }}>
        Partage sur WhatsApp, Instagram, TikTok 🔥
      </p>
    </div>
  )
}
