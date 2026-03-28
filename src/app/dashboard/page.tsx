'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const MENU = [
  { href: '/dashboard/commandes', icon: '📦', label: 'Commandes' },
  { href: '/dashboard/produits',  icon: '🛍️', label: 'Produits'  },
  { href: '/dashboard/stock',     icon: '🏪', label: 'Stock'     },
  { href: '/dashboard/livraisons',icon: '🚚', label: 'Livraisons'},
  { href: '/dashboard/rapports',  icon: '📊', label: 'Rapports'  },
  { href: '/dashboard/factures',  icon: '🧾', label: 'Factures'  },
  { href: '/dashboard/import',    icon: '🔄', label: 'Sync Sheet'},
  { href: '/dashboard/parametres',icon: '⚙️', label: 'Paramètres'},
]

const STATUT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  en_attente:   { label: 'En attente',   color: '#633806', bg: '#FAEEDA' },
  en_livraison: { label: 'En livraison', color: '#0C447C', bg: '#E6F1FB' },
  livre:        { label: 'Livré',        color: '#085041', bg: '#E1F5EE' },
  annule:       { label: 'Annulé',       color: '#501313', bg: '#FCEBEB' },
  echec:        { label: 'Échec',        color: '#444441', bg: '#F1EFE8' },
}

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ benef: 0, ca: 0, nb: 0, livrees: 0, en_cours: 0, annulees: 0, panier: 0 })
  const [hierBenef, setHierBenef] = useState(0)
  const [commandes, setCommandes] = useState<any[]>([])
  const [profil, setProfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    const [cmd, hier, pr] = await Promise.all([
      supabase.from('commandes_detail').select('*').gte('created_at', today.toISOString()).order('created_at', { ascending: false }),
      supabase.from('commandes_detail').select('benefice,statut').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    const data = cmd.data || []
    const livrees = data.filter((c: any) => c.statut === 'livre')
    const ca = livrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const benef = livrees.reduce((s: number, c: any) => s + (c.benefice || 0), 0)
    const hierB = (hier.data || []).filter((c: any) => c.statut === 'livre').reduce((s: number, c: any) => s + (c.benefice || 0), 0)
    setStats({ benef, ca, nb: data.length, livrees: livrees.length, en_cours: data.filter((c: any) => c.statut === 'en_livraison').length, annulees: data.filter((c: any) => ['annule','echec'].includes(c.statut)).length, panier: livrees.length > 0 ? Math.round(ca / livrees.length) : 0 })
    setHierBenef(hierB)
    setCommandes(data.slice(0, 5))
    setProfil(pr.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('dash').on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const pct = hierBenef > 0 ? Math.round(((stats.benef - hierBenef) / hierBenef) * 100) : 0
  const heure = new Date().getHours()
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes count{from{opacity:0}to{opacity:1}}
        .fade1{animation:fadeUp .4s ease both;}
        .fade2{animation:fadeUp .5s .1s ease both;}
        .fade3{animation:fadeUp .5s .2s ease both;}
        .fade4{animation:fadeUp .5s .3s ease both;}
        .menu-item{transition:transform .15s,box-shadow .15s;}
        .menu-item:hover,.menu-item:active{transform:scale(.95);}
        .cmd-row{transition:background .15s;}
        .cmd-row:hover{background:#F5F4FE!important;}
        .quick-link{transition:transform .15s,box-shadow .15s;}
        .quick-link:hover{transform:translateY(-2px);}
        @media(max-width:400px){
          .menu-grid{grid-template-columns:repeat(4,1fr)!important;}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>

        {/* ── HERO CARD avec fond sombre et courbe SVG ── */}
        <div className="fade1" style={{ margin: '-24px -24px 0', background: '#06060F', position: 'relative', overflow: 'hidden', paddingBottom: 40 }}>
          {/* Orbes déco */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle,rgba(127,119,221,.25),transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 20, left: -40, width: 160, height: 160, background: 'radial-gradient(circle,rgba(29,158,117,.15),transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, padding: '24px 24px 0' }}>
            {/* Salutation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginBottom: 3, textTransform: 'capitalize' }}>{date}</p>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -.6 }}>
                  {salut} 👋<br />
                  <span style={{ color: '#AFA9EC' }}>{profil?.nom_boutique || 'Ma Boutique'}</span>
                </h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>LIVE</span>
              </div>
            </div>

            {/* Bénéfice principal */}
            <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, padding: '20px 20px 18px' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Bénéfice aujourd'hui</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 44, fontWeight: 800, color: '#fff', letterSpacing: -2.5, lineHeight: 1 }}>{fmt(stats.benef)}</span>
                <span style={{ fontSize: 18, color: 'rgba(255,255,255,.4)', fontWeight: 600, marginBottom: 6 }}>FCFA</span>
                {pct !== 0 && (
                  <span style={{ marginLeft: 'auto', marginBottom: 4, background: pct > 0 ? 'rgba(29,158,117,.25)' : 'rgba(226,75,74,.25)', color: pct > 0 ? '#9FE1CB' : '#F09595', fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>
                    {pct > 0 ? '+' : ''}{pct}%
                  </span>
                )}
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '14px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
                {[
                  { lbl: 'CA total', val: fmt(stats.ca) + ' F' },
                  { lbl: 'Commandes', val: String(stats.nb) },
                  { lbl: 'Panier moy.', val: fmt(stats.panier) + ' F' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,.07)' : 'none', padding: '0 4px' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: -.3 }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Courbe SVG */}
          <svg viewBox="0 0 390 48" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 48, marginTop: 0 }}>
            <path d="M0,0 C130,48 260,0 390,32 L390,48 L0,48 Z" fill="#F2F2F7" />
          </svg>
        </div>

        {/* ── STATS 4 CASES ── */}
        <div className="fade2 stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, margin: '-8px 0 16px' }}>
          {[
            { lbl: 'Livrées', val: stats.livrees, color: '#085041', bg: '#E1F5EE', dot: '#1D9E75' },
            { lbl: 'En cours', val: stats.en_cours, color: '#0C447C', bg: '#E6F1FB', dot: '#378ADD' },
            { lbl: 'Annulées', val: stats.annulees, color: '#501313', bg: '#FCEBEB', dot: '#E24B4A' },
            { lbl: 'Produits', val: stats.nb, color: '#3C3489', bg: '#EEEDFE', dot: '#7F77DD' },
          ].map(s => (
            <div key={s.lbl} style={{ background: s.bg, borderRadius: 16, padding: '12px 8px', textAlign: 'center', border: `1px solid ${s.dot}22` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, margin: '0 auto 6px' }} />
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: -1, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: s.color, fontWeight: 700, marginTop: 4, opacity: .7 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── MENU ICÔNES avec titres ── */}
        <div className="fade2" style={{ background: '#fff', borderRadius: 24, padding: '18px 16px', marginBottom: 16, boxShadow: '0 2px 20px rgba(0,0,0,.06)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>Navigation rapide</p>
          <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {MENU.map(m => (
              <Link key={m.href} href={m.href} className="menu-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '10px 4px', borderRadius: 16, background: '#F8F8FC' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {m.icon}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#534AB7', textAlign: 'center', lineHeight: 1.2 }}>{m.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── BOUTON NOUVELLE COMMANDE ── */}
        <Link href="/dashboard/commandes" className="fade3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', borderRadius: 20, padding: '16px', marginBottom: 16, textDecoration: 'none', boxShadow: '0 8px 24px rgba(127,119,221,.4)', fontWeight: 800, fontSize: 16 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          Nouvelle commande
          <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.2)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{stats.nb} auj.</span>
        </Link>

        {/* ── COMMANDES RÉCENTES ── */}
        <div className="fade3" style={{ background: '#fff', borderRadius: 24, padding: '18px 16px', marginBottom: 16, boxShadow: '0 2px 20px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.3 }}>Dernières commandes</p>
            <Link href="/dashboard/commandes" style={{ fontSize: 12, color: '#7F77DD', fontWeight: 700, textDecoration: 'none' }}>Voir tout →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <div style={{ width: 24, height: 24, border: '2.5px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : commandes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
              <p style={{ fontSize: 14, color: '#C0C0C0', fontWeight: 500 }}>Aucune commande aujourd'hui</p>
              <Link href="/dashboard/commandes" style={{ display: 'inline-block', marginTop: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '10px 24px', borderRadius: 14, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Créer la première</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {commandes.map((c: any) => {
                const cfg = STATUT_CFG[c.statut] || STATUT_CFG['en_attente']
                const init = (c.client_nom || c.client_tel || 'C').slice(0, 2).toUpperCase()
                return (
                  <div key={c.id} className="cmd-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F8F8FC', borderRadius: 16 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>{init}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.client_nom || c.client_tel || 'Client'}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {c.zone_nom && <span style={{ fontSize: 10, color: '#C0C0C0' }}>📍 {c.zone_nom}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: c.statut === 'livre' ? '#1D9E75' : '#0C0C1E', letterSpacing: -.3 }}>{fmt(c.total_vente || 0)} F</p>
                      {c.statut === 'livre' && c.benefice > 0 && <p style={{ fontSize: 10, color: '#1D9E75', fontWeight: 700 }}>+{fmt(c.benefice)} F</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── COURBE + RACCOURCIS ── */}
        <div className="fade4" style={{ background: '#0C0C1E', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.15)' }}>
          {/* Mini courbe déco */}
          <svg viewBox="0 0 480 32" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 32, background: '#F2F2F7' }}>
            <path d="M0,0 C160,32 320,0 480,20 L480,32 L0,32 Z" fill="#0C0C1E" />
          </svg>

          <div style={{ padding: '4px 16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>Accès rapides</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {[
                { href: '/dashboard/rapports', icon: '📊', label: 'Rapports', sub: 'Bilans & analytics', color: '#25D366', bg: 'rgba(37,211,102,.1)' },
                { href: '/dashboard/factures', icon: '🧾', label: 'Factures', sub: '5 modèles premium', color: '#7F77DD', bg: 'rgba(127,119,221,.1)' },
                { href: '/dashboard/import',   icon: '🔄', label: 'Sync Sheet', sub: 'Google Sheet auto', color: '#378ADD', bg: 'rgba(55,138,221,.1)' },
                { href: '/dashboard/stock',    icon: '🏪', label: 'Stock', sub: 'Gérer vos produits', color: '#BA7517', bg: 'rgba(186,117,23,.1)' },
              ].map(a => (
                <Link key={a.href} href={a.href} className="quick-link" style={{ display: 'flex', alignItems: 'center', gap: 10, background: a.bg, border: `1px solid ${a.color}22`, borderRadius: 16, padding: '12px 14px', textDecoration: 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: a.bg, border: `1px solid ${a.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: -.2 }}>{a.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>{a.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
