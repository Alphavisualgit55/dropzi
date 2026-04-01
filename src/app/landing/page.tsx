'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

/* ── Hooks ── */
function useInView(ref: React.RefObject<HTMLElement>, threshold = 0.15) {
  const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])
  return v
}

/* ── Animated word rotator ── */
function WordRotator({ words }: { words: string[] }) {
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setI(p => (p + 1) % words.length); setVisible(true) }, 300)
    }, 2400)
    return () => clearInterval(iv)
  }, [])
  return (
    <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#7F77DD,#9FE1CB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', transition: 'opacity .3s,transform .3s', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-8px)' }}>
      {words[i]}
    </span>
  )
}

/* ── Counter ── */
function Counter({ to, suffix, duration = 1600 }: { to: number, suffix: string, duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref as React.RefObject<HTMLElement>)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start: number | null = null
    const step = (t: number) => {
      if (!start) start = t
      const p = Math.min((t - start) / duration, 1)
      setN(Math.floor(p * to))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView])
  return <span ref={ref}>{n.toLocaleString('fr-FR')}{suffix}</span>
}

/* ── Feature card ── */
function FCard({ icon, titre, desc, badge, delay, inView }: any) {
  return (
    <div style={{ background: '#fff', border: '1px solid #F0F0F0', borderRadius: 20, padding: '22px 20px', transition: 'all .25s', boxShadow: '0 2px 12px rgba(0,0,0,.04)', animation: inView ? `fadeUp .5s ease ${delay}ms both` : 'none', position: 'relative', overflow: 'hidden' }}>
      {badge && <div style={{ position: 'absolute', top: 14, right: 14, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '.06em' }}>{badge}</div>}
      <div style={{ fontSize: 30, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#0C0C1E', marginBottom: 7 }}>{titre}</p>
      <p style={{ fontSize: 13, color: '#888', lineHeight: 1.65 }}>{desc}</p>
    </div>
  )
}

/* ── Problem card ── */
function ProbCard({ emoji, pb, sol, inView, delay }: any) {
  return (
    <div style={{ animation: inView ? `fadeUp .5s ease ${delay}ms both` : 'none' }}>
      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: '14px 16px', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
        <p style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.55 }}><strong>Problème :</strong> {pb}</p>
      </div>
      <div style={{ background: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>✅</span>
        <p style={{ fontSize: 13, color: '#14532D', lineHeight: 1.55 }}><strong>Dropzi :</strong> {sol}</p>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: '⚡', titre: 'Sync Shopify automatique', desc: 'Tes commandes Shopify arrivent dans Dropzi toutes les 60 secondes. Sans rien faire.', badge: 'NOUVEAU' },
  { icon: '📊', titre: 'Dashboard en temps réel', desc: 'CA, bénéfices, taux de livraison, top produits. Tout visible en un coup d\'œil.' },
  { icon: '🚚', titre: 'Gestion des livreurs', desc: 'Zones, tarifs, tournées organisées. Tes livreurs savent exactement quoi livrer.' },
  { icon: '🧾', titre: 'Factures professionnelles', desc: '5 modèles premium. Génère et envoie une facture en moins de 10 secondes.' },
  { icon: '📈', titre: 'Générateur de rapports', desc: 'Rapports de ventes, bénéfices, livraisons par période. Téléchargeables.', badge: 'NOUVEAU' },
  { icon: '🔔', titre: 'Notifications intelligentes', desc: 'Alertes stock faible, nouvelles commandes importées, limites de plan. Tout en temps réel.' },
  { icon: '🏪', titre: 'Gestion du stock', desc: 'Suivi des quantités, alertes de rupture, historique des mouvements.' },
  { icon: '📥', titre: 'Import produits Shopify', desc: 'Importe ton catalogue Shopify CSV en quelques clics. Produits liés automatiquement.' },
]

const PROBLEMS = [
  { emoji: '😤', pb: 'Tu notes tes commandes Shopify à la main chaque matin.', sol: 'Dropzi les importe automatiquement toutes les 60 secondes depuis Shopify.' },
  { emoji: '💸', pb: 'Tu ne sais jamais combien tu gagnes vraiment après les frais de livraison.', sol: 'Dropzi calcule ton bénéfice net en temps réel, livraison déduite automatiquement.' },
  { emoji: '📦', pb: 'Tes livreurs ne savent pas quoi livrer ni où aller.', sol: 'Chaque livreur a sa liste organisée par zone géographique, accessible sur mobile.' },
  { emoji: '📊', pb: 'Tu découvres en fin de mois que tu as vendu à perte.', sol: 'Le générateur de rapports te donne tes chiffres exacts par période, par produit.' },
  { emoji: '🔔', pb: 'Tu rates des commandes importantes ou tu dépasses ton stock sans le savoir.', sol: 'Dropzi t\'envoie des notifications instantanées pour chaque événement important.' },
  { emoji: '🧾', pb: 'Tes clients demandent des factures et tu n\'as rien à envoyer.', sol: '5 modèles de factures professionnelles générées en 10 secondes.' },
]

const PLANS = [
  { nom: 'Starter', prix: 3000, color: '#6B7280', bg: '#F9FAFB', features: ['50 commandes/mois', '5 produits', '1 zone · 1 livreur', 'Sync Shopify', 'Factures basiques', 'Notifications'] },
  { nom: 'Business', prix: 5000, color: '#7F77DD', bg: '#EEEDFE', features: ['500 commandes/mois', '25 produits', '5 zones · 6 livreurs', 'Sync Shopify', 'Tous les modèles factures', 'Rapports avancés', 'Notifications'], popular: true },
  { nom: 'Elite', prix: 15000, color: '#1D9E75', bg: '#ECFDF5', features: ['Commandes illimitées', 'Produits illimités', 'Zones & livreurs illimités', 'Support prioritaire', 'Tout inclus'] },
]

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const featRef = useRef<HTMLDivElement>(null)
  const pbRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const plansRef = useRef<HTMLDivElement>(null)
  const featInView = useInView(featRef as React.RefObject<HTMLElement>)
  const pbInView = useInView(pbRef as React.RefObject<HTMLElement>)
  const statsInView = useInView(statsRef as React.RefObject<HTMLElement>)
  const plansInView = useInView(plansRef as React.RefObject<HTMLElement>)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

  return (
    <div style={{ minHeight: '100vh', background: '#06060F', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes glow{0%,100%{box-shadow:0 0 0 rgba(127,119,221,0)}50%{box-shadow:0 0 32px rgba(127,119,221,.35)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        a{text-decoration:none;}
        .btn{transition:all .2s;cursor:pointer;font-family:inherit;display:inline-block;}
        .btn:hover{transform:translateY(-2px);}
        .btn-ghost:hover{background:rgba(255,255,255,.08)!important;}
        .fcard:hover{transform:translateY(-5px);box-shadow:0 8px 32px rgba(0,0,0,.1)!important;}
        @media(max-width:640px){
          .hero-h{font-size:36px!important;letter-spacing:-1.5px!important;}
          .grid-2{grid-template-columns:1fr!important;}
          .grid-3{grid-template-columns:1fr!important;}
          .grid-4{grid-template-columns:repeat(2,1fr)!important;}
          .hide-m{display:none!important;}
          .nav-links{display:none!important;}
          .stats-row{grid-template-columns:repeat(2,1fr)!important;}
          section{padding:64px 20px!important;}
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrollY > 40 ? 'rgba(6,6,15,.97)' : 'transparent', backdropFilter: scrollY > 40 ? 'blur(24px)' : 'none', borderBottom: scrollY > 40 ? '1px solid rgba(255,255,255,.06)' : 'none', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', transition: 'all .3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'glow 4s ease-in-out infinite' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: -.5 }}>Dropzi</span>
          </Link>
          <div className="nav-links" style={{ display: 'flex', gap: 24 }}>
            {[['#features','Fonctionnalités'],['#problemes','Pourquoi'],['#tarifs','Tarifs']].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', fontWeight: 500, transition: 'color .15s' }}
                onMouseOver={e => (e.currentTarget.style.color = '#fff')} onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,.5)')}>
                {label}
              </a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/login" className="btn btn-ghost hide-m" style={{ color: 'rgba(255,255,255,.55)', fontSize: 14, padding: '8px 16px', borderRadius: 10, background: 'transparent', border: 'none' }}>
            Connexion
          </Link>
          <Link href="/login" className="btn"
            style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', borderRadius: 13, padding: '10px 22px', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(127,119,221,.35)' }}>
            Commencer →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Orbs déco */}
        <div style={{ position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(ellipse,rgba(127,119,221,.11),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '35%', left: '4%', width: 240, height: 240, background: 'radial-gradient(circle,rgba(29,158,117,.08),transparent 70%)', pointerEvents: 'none', animation: 'float 7s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '25%', right: '4%', width: 200, height: 200, background: 'radial-gradient(circle,rgba(245,158,11,.07),transparent 70%)', pointerEvents: 'none', animation: 'float 9s ease-in-out infinite reverse' }} />

        <div style={{ animation: 'fadeUp .6s ease', maxWidth: 820 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(127,119,221,.12)', border: '1px solid rgba(127,119,221,.25)', borderRadius: 20, padding: '6px 16px', marginBottom: 32 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#7F77DD', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, color: '#AFA9EC', fontWeight: 600 }}>Conçu pour les commerçants qui vendent sur Shopify en Afrique</span>
          </div>

          <h1 className="hero-h" style={{ fontSize: 68, fontWeight: 900, letterSpacing: -3, lineHeight: 1.03, marginBottom: 28 }}>
            Gère tes commandes<br />
            <WordRotator words={['automatiquement.', 'intelligemment.', 'sans effort.', 'en temps réel.']} />
          </h1>

          <p style={{ fontSize: 19, color: 'rgba(255,255,255,.5)', lineHeight: 1.75, marginBottom: 16, maxWidth: 580, margin: '0 auto 16px' }}>
            Dropzi connecte ta boutique Shopify, importe tes commandes, calcule tes vrais bénéfices et organise tes livraisons — <strong style={{ color: 'rgba(255,255,255,.85)' }}>tout automatiquement</strong>.
          </p>
          <p style={{ fontSize: 14, color: '#E24B4A', fontWeight: 600, marginBottom: 40 }}>
            À partir de 3 000 FCFA/mois · Wave · Orange Money · Carte
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <Link href="/login" className="btn"
              style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', borderRadius: 16, padding: '15px 36px', fontSize: 17, fontWeight: 800, boxShadow: '0 4px 28px rgba(127,119,221,.45)' }}>
              🚀 Commencer maintenant
            </Link>
            <a href="/tutoriels" className="btn"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)', borderRadius: 16, padding: '15px 24px', fontSize: 15, fontWeight: 600 }}>
              🎥 Voir comment ça marche
            </a>
          </div>

          {/* Faux dashboard */}
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.5)', animation: 'fadeUp .9s ease .3s both', maxWidth: 720, margin: '0 auto' }}>
            <div style={{ background: 'rgba(255,255,255,.04)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              {['#E24B4A','#F59E0B','#1D9E75'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', marginLeft: 8 }}>dropzi.io · Tableau de bord</span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, color: '#9FE1CB' }}>3 nouvelles commandes importées</span>
              </div>
            </div>
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[['8,4 M F','CA total','↑ 127%','#9FE1CB'],['1 247','Commandes','↑ 43%','#AFA9EC'],['91%','Livraison','↑ 8%','#FCD34D'],['2,1 M F','Bénéfice','↑ 89%','#93C5FD']].map(([v, l, p, c]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '12px 10px' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginBottom: 5 }}>{l}</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: c, letterSpacing: -.5 }}>{v}</p>
                  <p style={{ fontSize: 10, color: '#1D9E75', marginTop: 3 }}>{p}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 14, height: 72, display: 'flex', alignItems: 'flex-end', gap: 3, padding: '10px' }}>
                {[35,50,38,68,55,80,60,90,72,100,82,95,78,88,94].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: `rgba(127,119,221,${0.25 + (h / 100) * 0.55})`, borderRadius: 3, height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ padding: '64px 24px', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div className="stats-row" style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {[
            { val: 1200, suf: '+', label: 'Commerçants actifs', color: '#AFA9EC' },
            { val: 48000, suf: '+', label: 'Commandes traitées/mois', color: '#9FE1CB' },
            { val: 60, suf: 's', label: 'Sync Shopify', color: '#FCD34D' },
            { val: 98, suf: '%', label: 'Taux de satisfaction', color: '#93C5FD' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', animation: statsInView ? `fadeUp .5s ease ${i * 80}ms both` : 'none' }}>
              <p style={{ fontSize: 44, fontWeight: 900, color: s.color, letterSpacing: -2, lineHeight: 1, marginBottom: 8 }}>
                {statsInView ? <Counter to={s.val} suffix={s.suf} /> : '0' + s.suf}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" ref={featRef} style={{ padding: '90px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.12em' }}>Tout en un</span>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: -2, color: '#0C0C1E', marginTop: 10, marginBottom: 14 }}>
              Une plateforme.<br />Toutes les fonctionnalités.
            </h2>
            <p style={{ fontSize: 16, color: '#888' }}>Dropzi remplace 5 outils différents — sans surcharge, sans prise de tête.</p>
          </div>
          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="fcard" style={{ transition: 'all .25s' }}>
                <FCard {...f} delay={i * 60} inView={featInView} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOTIFICATION HIGHLIGHT ── */}
      <section style={{ padding: '0 24px 90px', background: '#fff' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', borderRadius: 24, padding: '36px 40px', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#AFA9EC', textTransform: 'uppercase', letterSpacing: '.1em', display: 'block', marginBottom: 12 }}>🔔 Notifications intelligentes</span>
              <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 14, lineHeight: 1.2 }}>Tu es alerté à chaque moment clé</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['⚡', 'Nouvelles commandes importées depuis Shopify'],
                  ['📦', 'Stock faible sur un produit'],
                  ['💰', 'Paiement d\'abonnement confirmé'],
                  ['🚚', 'Commande livrée avec succès'],
                  ['🤝', 'Commission d\'affiliation reçue'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,.6)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Fausse notif */}
            <div style={{ flexShrink: 0, width: 280 }}>
              {[
                { icon: '⚡', titre: '3 commandes importées', sub: 'Depuis ta boutique Shopify · il y a 1 min', color: '#AFA9EC' },
                { icon: '📦', titre: 'Stock faible : Chauffe-eau', sub: 'Il reste 2 unités en stock', color: '#FCD34D' },
                { icon: '💰', titre: 'Commission reçue : 2 500 F', sub: 'Plan Business · Fatou K. vient de s\'abonner', color: '#9FE1CB' },
              ].map((n, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '12px 14px', marginBottom: 10, animation: `slideIn .4s ease ${i * 150}ms both`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: n.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{n.icon}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{n.titre}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{n.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLÈMES ── */}
      <section id="problemes" ref={pbRef} style={{ padding: '90px 24px', background: '#F7F7FA' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E24B4A', textTransform: 'uppercase', letterSpacing: '.12em' }}>Les vrais problèmes</span>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: -2, color: '#0C0C1E', marginTop: 10, marginBottom: 14 }}>Tu te reconnais dans ça ?</h2>
            <p style={{ fontSize: 16, color: '#888' }}>Chaque commerçant africain qui vend sur Shopify vit ces situations quotidiennement.</p>
          </div>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {PROBLEMS.map((p, i) => (
              <ProbCard key={i} {...p} inView={pbInView} delay={i * 70} />
            ))}
          </div>
        </div>
      </section>

      {/* ── RAPPORT HIGHLIGHT ── */}
      <section style={{ padding: '90px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Faux rapport */}
          <div style={{ flex: 1, minWidth: 280, background: '#F7F7FA', borderRadius: 20, padding: '24px', border: '1px solid #F0F0F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>📈 Rapport — Mars 2025</p>
              <span style={{ fontSize: 11, background: '#EEEDFE', color: '#7F77DD', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>PDF prêt</span>
            </div>
            {[['Ventes totales','4 280 000 F','↑ 23%','#16A34A'],['Bénéfice net','1 140 000 F','↑ 18%','#16A34A'],['Commandes','342','↑ 31%','#2563EB'],['Taux livraison','87%','↑ 4%','#2563EB'],['Annulées','44','-12%','#DC2626']].map(([l, v, p, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F0F0' }}>
                <span style={{ fontSize: 13, color: '#555' }}>{l}</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>{v}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{p}</span>
                </div>
              </div>
            ))}
            <button style={{ width: '100%', marginTop: 16, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              📥 Télécharger le rapport PDF
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.12em', display: 'block', marginBottom: 14 }}>📈 Générateur de rapports</span>
            <h3 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.5, color: '#0C0C1E', marginBottom: 16, lineHeight: 1.15 }}>Sache exactement<br />où tu en es</h3>
            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 20 }}>
              Génère des rapports complets par période — ventes, bénéfices, livraisons, produits les plus rentables. Télécharge en PDF et partage avec ton équipe ou ton comptable.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Rapport hebdomadaire, mensuel ou personnalisé','Bénéfice net par produit et par zone','Taux de livraison et d\'annulation détaillé','Export PDF en un clic'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#7F77DD', fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: '#555' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TARIFS ── */}
      <section id="tarifs" ref={plansRef} style={{ padding: '90px 24px', background: '#F7F7FA' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.12em' }}>Tarifs clairs</span>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: -2, color: '#0C0C1E', marginTop: 10, marginBottom: 14 }}>Un plan pour chaque boutique</h2>
            <p style={{ fontSize: 16, color: '#888' }}>Paiement mensuel · Wave · Orange Money · Carte bancaire</p>
          </div>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {PLANS.map((p, i) => (
              <div key={p.nom} style={{ background: p.popular ? 'linear-gradient(160deg,#0C0C1E,#1a1a3e)' : '#fff', border: `1px solid ${p.popular ? 'rgba(127,119,221,.4)' : '#F0F0F0'}`, borderRadius: 22, padding: '28px 22px', position: 'relative', overflow: 'hidden', animation: plansInView ? `fadeUp .5s ease ${i * 100}ms both` : 'none' }}>
                {p.popular && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#7F77DD,#9FE1CB)' }} />}
                {p.popular && <div style={{ position: 'absolute', top: 16, right: 16, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', borderRadius: 20, padding: '3px 12px', fontSize: 10, fontWeight: 800, color: '#fff' }}>⭐ Populaire</div>}
                <p style={{ fontSize: 15, fontWeight: 700, color: p.popular ? 'rgba(255,255,255,.6)' : '#888', marginBottom: 8 }}>Plan {p.nom}</p>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: p.popular ? '#fff' : '#0C0C1E', letterSpacing: -1.5 }}>{fmt(p.prix)}</span>
                  <span style={{ fontSize: 15, color: p.popular ? 'rgba(255,255,255,.4)' : '#ABABAB', marginLeft: 4 }}>FCFA/mois</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14, color: p.popular ? '#9FE1CB' : '#7F77DD', flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 13, color: p.popular ? 'rgba(255,255,255,.6)' : '#555' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" className="btn"
                  style={{ display: 'block', textAlign: 'center', background: p.popular ? 'linear-gradient(135deg,#7F77DD,#534AB7)' : '#F5F5F5', color: p.popular ? '#fff' : '#0C0C1E', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 700, boxShadow: p.popular ? '0 4px 20px rgba(127,119,221,.35)' : 'none' }}>
                  Commencer avec {p.nom}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '90px 24px', background: '#06060F', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 52, marginBottom: 20, animation: 'float 3s ease-in-out infinite' }}>🚀</div>
          <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2.5, marginBottom: 16, lineHeight: 1.05 }}>
            Prêt à gérer ton<br />
            <span style={{ background: 'linear-gradient(135deg,#7F77DD,#9FE1CB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              business comme un pro ?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.4)', marginBottom: 40 }}>Plus de 1 200 commerçants gèrent déjà leur boutique Shopify avec Dropzi.</p>
          <Link href="/login" className="btn"
            style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', borderRadius: 18, padding: '18px 52px', fontSize: 19, fontWeight: 900, boxShadow: '0 8px 36px rgba(127,119,221,.45)' }}>
            Commencer maintenant →
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.2)', marginTop: 16 }}>À partir de 3 000 FCFA/mois · Wave · Orange Money · Carte</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '28px 24px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Dropzi</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>© 2026 — Tous droits réservés</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['#features','Fonctionnalités'],['#tarifs','Tarifs'],['dropzi.io/affiliation','Affiliation'],['dropzi.io/login','Connexion']].map(([href, label]) => (
            <a key={label} href={href.startsWith('http') ? href : href} style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>{label}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
