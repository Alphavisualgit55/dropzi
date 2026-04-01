'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

function useCount(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

function useInView(ref: React.RefObject<HTMLElement>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: .2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return inView
}

function StatCard({ value, suffix, label, delay }: { value: number, suffix: string, label: string, delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<HTMLElement>)
  const count = useCount(value, 1800, inView)
  return (
    <div ref={ref} style={{ textAlign: 'center', animation: inView ? `fadeUp .6s ease ${delay}ms both` : 'none' }}>
      <p style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>
        {count.toLocaleString('fr-FR')}{suffix}
      </p>
    </div>
  )
}

const PROBLEMES = [
  { emoji: '😤', probleme: 'Tu perds des heures à noter tes commandes Shopify à la main', solution: 'Dropzi sync automatiquement toutes tes commandes en moins de 60 secondes' },
  { emoji: '💸', probleme: 'Tu ne sais jamais combien tu gagnes vraiment après les frais de livraison', solution: 'Dropzi calcule ton bénéfice net en temps réel — livraison déduite automatiquement' },
  { emoji: '📦', probleme: 'Tes livreurs ne savent pas quoi livrer ni où aller chaque matin', solution: 'Chaque livreur reçoit sa liste de livraison organisée par zone géographique' },
  { emoji: '😰', probleme: 'Tu rappelles 50 clients par jour pour confirmer les commandes', solution: 'Dropzi suit chaque commande du paiement à la livraison — tu n\'appelles plus' },
  { emoji: '📊', probleme: 'Tu découvres en fin de mois que tu as vendu à perte', solution: 'Tableau de bord live avec marge par produit, taux de livraison et alertes de stock' },
  { emoji: '🧾', probleme: 'Tes clients demandent des factures et tu n\'as rien à envoyer', solution: '5 modèles de factures professionnelles générées en un clic et prêtes à envoyer' },
]

const FEATURES = [
  { icon: '⚡', titre: 'Sync Shopify automatique', desc: 'Tes commandes Shopify arrivent dans Dropzi toutes les 60 secondes. Zéro copier-coller.', badge: 'NOUVEAU' },
  { icon: '📊', titre: 'Dashboard en temps réel', desc: 'CA, bénéfices, taux de livraison, top produits. Tout sur un seul écran comme Shopify.' },
  { icon: '🚚', titre: 'Gestion des livreurs', desc: 'Zones, tarifs, tournées. Tes livreurs savent exactement quoi faire chaque jour.' },
  { icon: '🧾', titre: 'Factures premium', desc: '5 modèles professionnels. Génère et envoie une facture en moins de 10 secondes.' },
  { icon: '📈', titre: 'Rapports avancés', desc: 'Analyse tes performances par période, par produit, par zone. Prends de meilleures décisions.' },
  { icon: '🏪', titre: 'Gestion du stock', desc: 'Alertes de stock faible, historique des mouvements. Plus jamais de rupture surprise.' },
  { icon: '💳', titre: 'Paiement Wave & OM', desc: 'Abonnement via Wave, Orange Money ou carte bancaire. Simple et sécurisé.' },
  { icon: '🤝', titre: 'Programme d\'affiliation', desc: 'Invite des commerçants, gagne 50% de commission automatiquement sur leur abonnement.', badge: 'NOUVEAU' },
]

const PLANS = [
  { nom: 'Starter', prix: 3000, color: '#6B7280', features: ['50 commandes/mois', '5 produits', '1 zone de livraison', '1 livreur', 'Sync Shopify', 'Factures basiques'] },
  { nom: 'Business', prix: 5000, color: '#7F77DD', features: ['500 commandes/mois', '25 produits', '5 zones', '6 livreurs', 'Sync Shopify', 'Toutes les factures', 'Rapports avancés'], popular: true },
  { nom: 'Elite', prix: 15000, color: '#1D9E75', features: ['Commandes illimitées', 'Produits illimités', 'Zones illimitées', 'Livreurs illimités', 'Support prioritaire', 'Tout inclus'] },
]

const TEMOIGNAGES = [
  { nom: 'Aminata S.', ville: 'Dakar', text: 'Avant je passais 3h par jour à copier mes commandes Shopify. Maintenant Dropzi le fait tout seul. J\'ai gagné du temps et de l\'argent.', gain: '+2h/jour', avatar: 'AS' },
  { nom: 'Ibrahima D.', ville: 'Thiès', text: 'Je savais jamais si je faisais des bénéfices. Maintenant je vois tout en temps réel. J\'ai arrêté 3 produits non rentables grâce à Dropzi.', gain: '+35% marge', avatar: 'ID' },
  { nom: 'Fatou K.', ville: 'Ziguinchor', text: 'Mes livreurs adorent. Chacun a sa zone, ses commandes. Les erreurs de livraison ont chuté de 80% depuis qu\'on utilise Dropzi.', gain: '-80% erreurs', avatar: 'FK' },
]

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef as React.RefObject<HTMLElement>)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

  return (
    <div style={{ minHeight: '100vh', background: '#06060F', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(127,119,221,.3)}50%{box-shadow:0 0 40px rgba(127,119,221,.6)}}
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        .btn{transition:all .2s;cursor:pointer;font-family:inherit;}
        .btn:hover{transform:translateY(-2px);}
        .card-hover{transition:all .25s;}
        .card-hover:hover{transform:translateY(-6px);}
        .nav-link{transition:color .15s;text-decoration:none;color:rgba(255,255,255,.5);font-size:14px;font-weight:500;}
        .nav-link:hover{color:#fff;}
        @media(max-width:768px){
          .hero-title{font-size:38px!important;letter-spacing:-1.5px!important;}
          .hero-sub{font-size:16px!important;}
          .plans-grid{grid-template-columns:1fr!important;}
          .features-grid{grid-template-columns:1fr 1fr!important;}
          .temoignages-grid{grid-template-columns:1fr!important;}
          .hide-mobile{display:none!important;}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrollY > 50 ? 'rgba(6,6,15,.96)' : 'transparent', backdropFilter: scrollY > 50 ? 'blur(24px)' : 'none', borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,.06)' : 'none', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'glow 3s ease-in-out infinite' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: -.5 }}>Dropzi</span>
          </div>
          <div className="hide-mobile" style={{ display: 'flex', gap: 24 }}>
            {[['#features','Fonctionnalités'],['#problemes','Pourquoi Dropzi'],['#tarifs','Tarifs'],['#affiliation','Affiliation']].map(([href, label]) => (
              <a key={href} href={href} className="nav-link">{label}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/login" className="nav-link hide-mobile" style={{ color: 'rgba(255,255,255,.6)' }}>Connexion</Link>
          <Link href="/login" className="btn"
            style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 12, padding: '9px 20px', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(127,119,221,.35)', textDecoration: 'none' }}>
            Commencer →
          </Link>
        </div>
      </nav>

      {/* TICKER */}
      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', height: 32, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 0, animation: 'ticker 20s linear infinite', whiteSpace: 'nowrap' }}>
          {[...Array(4)].map((_, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.85)', padding: '0 32px' }}>
              ⚡ Sync Shopify automatique &nbsp;·&nbsp; 📦 Gestion livreurs &nbsp;·&nbsp; 💰 Bénéfices en temps réel &nbsp;·&nbsp; 🧾 Factures premium &nbsp;·&nbsp; 🤝 Affiliation 50% commission &nbsp;·&nbsp; 📊 Dashboard analytics &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section ref={heroRef} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '140px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Fonds déco */}
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, background: 'radial-gradient(ellipse,rgba(127,119,221,.12),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '5%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(29,158,117,.08),transparent 70%)', pointerEvents: 'none', animation: 'float 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '20%', right: '5%', width: 250, height: 250, background: 'radial-gradient(circle,rgba(245,158,11,.07),transparent 70%)', pointerEvents: 'none', animation: 'float 8s ease-in-out infinite reverse' }} />

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(127,119,221,.12)', border: '1px solid rgba(127,119,221,.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 32, animation: 'fadeUp .5s ease' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7F77DD', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 13, color: '#AFA9EC', fontWeight: 600 }}>Le logiciel e-commerce N°1 des commerçants africains</span>
        </div>

        <h1 className="hero-title" style={{ fontSize: 72, fontWeight: 900, letterSpacing: -3.5, lineHeight: 1.02, marginBottom: 28, animation: 'fadeUp .6s ease .1s both', maxWidth: 900 }}>
          Arrête de gérer ton business<br />
          <span style={{ background: 'linear-gradient(135deg,#7F77DD 0%,#9FE1CB 50%,#F59E0B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            à la main comme en 2010
          </span>
        </h1>

        <p className="hero-sub" style={{ fontSize: 20, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: 44, maxWidth: 620, animation: 'fadeUp .6s ease .2s both' }}>
          Dropzi connecte ta boutique Shopify, suit tes commandes, calcule tes bénéfices et gère tes livreurs — <strong style={{ color: 'rgba(255,255,255,.8)' }}>automatiquement</strong>.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64, animation: 'fadeUp .6s ease .3s both' }}>
          <Link href="/login" className="btn"
            style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 16, padding: '16px 36px', fontSize: 17, fontWeight: 800, boxShadow: '0 4px 28px rgba(127,119,221,.45)', textDecoration: 'none', display: 'inline-block' }}>
            🚀 Essayer Dropzi gratuitement
          </Link>
          <Link href="/affiliation" className="btn"
            style={{ background: 'rgba(29,158,117,.12)', border: '1px solid rgba(29,158,117,.35)', color: '#9FE1CB', borderRadius: 16, padding: '16px 28px', fontSize: 16, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            🤝 Gagner de l'argent avec Dropzi
          </Link>
        </div>

        {/* Faux dashboard preview */}
        <div style={{ width: '100%', maxWidth: 780, margin: '0 auto', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, overflow: 'hidden', animation: 'fadeUp .8s ease .4s both', boxShadow: '0 40px 120px rgba(0,0,0,.6)' }}>
          {/* Barre titre */}
          <div style={{ background: 'rgba(255,255,255,.05)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E24B4A' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1D9E75' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginLeft: 8 }}>dropzi.io — Tableau de bord</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: '#9FE1CB' }}>4 visiteurs live</span>
            </div>
          </div>
          {/* Stats mini */}
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[['15,4 M F CFA','CA total','↑ 234%','#9FE1CB'],['2 847','Commandes','↑ 89%','#AFA9EC'],['89%','Taux livraison','↑ 12%','#FCD34D'],['4,1 M F CFA','Bénéfice net','↑ 178%','#93C5FD']].map(([val, label, pct, color]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '12px' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: -.5 }}>{val}</p>
                <p style={{ fontSize: 10, color: '#1D9E75', marginTop: 4 }}>{pct}</p>
              </div>
            ))}
          </div>
          {/* Graphique fictif */}
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 14, height: 80, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '12px', overflow: 'hidden' }}>
              {[30,45,35,60,50,75,55,80,65,90,70,95,75,100,85].map((h, i) => (
                <div key={i} style={{ flex: 1, background: `rgba(127,119,221,${0.3 + (h/100)*0.5})`, borderRadius: 4, height: `${h}%`, transition: 'height .3s' }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section ref={statsRef} style={{ padding: '60px 24px', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div className="stats-grid" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
          {[
            { value: 1200, suffix: '+', label: 'Commerçants actifs', sub: 'Au Sénégal et en Afrique', color: '#AFA9EC' },
            { value: 48000, suffix: '+', label: 'Commandes traitées', sub: 'Chaque mois sur Dropzi', color: '#9FE1CB' },
            { value: 98, suffix: '%', label: 'Satisfaction client', sub: 'Recommandent Dropzi', color: '#FCD34D' },
            { value: 60, suffix: 's', label: 'Sync Shopify', sub: 'Commandes importées en', color: '#93C5FD' },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', animation: statsInView ? `fadeUp .5s ease ${i * 100}ms both` : 'none' }}>
              <p style={{ fontSize: 44, fontWeight: 900, color: s.color, letterSpacing: -2, lineHeight: 1, marginBottom: 6 }}>
                {statsInView ? s.value.toLocaleString('fr-FR') : '0'}{s.suffix}
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLÈMES → SOLUTIONS */}
      <section id="problemes" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.12em' }}>Les vrais problèmes</span>
            <h2 style={{ fontSize: 44, fontWeight: 900, letterSpacing: -2, marginTop: 12, marginBottom: 16 }}>Tu te reconnais dans ça ?</h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,.45)', maxWidth: 520, margin: '0 auto' }}>Les commerçants africains qui vendent sur Shopify font face aux mêmes problèmes chaque jour.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PROBLEMES.map((p, i) => (
              <div key={i} className="card-hover" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{p.emoji}</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#E24B4A', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>❌ Le problème</div>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)', lineHeight: 1.5 }}>{p.probleme}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: 'rgba(29,158,117,.06)', border: '1px solid rgba(29,158,117,.15)', borderRadius: 14, padding: '16px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(29,158,117,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✅</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9FE1CB', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>La solution Dropzi</div>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}>{p.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '100px 24px', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.12em' }}>Tout ce dont tu as besoin</span>
            <h2 style={{ fontSize: 44, fontWeight: 900, letterSpacing: -2, marginTop: 12, marginBottom: 16 }}>Une plateforme.<br />Toutes les fonctionnalités.</h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,.45)' }}>Dropzi remplace 5 outils différents en un seul.</p>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {FEATURES.map((f, i) => (
              <div key={f.titre} className="card-hover" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, padding: '22px 18px', position: 'relative', overflow: 'hidden' }}>
                {f.badge && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '.06em' }}>{f.badge}</div>
                )}
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.titre}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.12em' }}>Ce qu'ils disent</span>
            <h2 style={{ fontSize: 44, fontWeight: 900, letterSpacing: -2, marginTop: 12 }}>Des commerçants comme toi</h2>
          </div>
          <div className="temoignages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {TEMOIGNAGES.map((t, i) => (
              <div key={i} className="card-hover" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '24px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.nom}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>📍 {t.ville}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', background: 'rgba(29,158,117,.15)', border: '1px solid rgba(29,158,117,.25)', borderRadius: 20, padding: '4px 12px' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#9FE1CB' }}>{t.gain}</span>
                  </div>
                </div>
                <div style={{ fontSize: 24, color: '#7F77DD', marginBottom: 10, opacity: .5 }}>"</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, fontStyle: 'italic' }}>{t.text}</p>
                <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
                  {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#F59E0B', fontSize: 14 }}>★</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" style={{ padding: '100px 24px', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.12em' }}>Tarifs simples</span>
            <h2 style={{ fontSize: 44, fontWeight: 900, letterSpacing: -2, marginTop: 12, marginBottom: 16 }}>Un plan pour chaque taille de boutique</h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,.45)' }}>Pas d'engagement. Paye par mois avec Wave ou Orange Money.</p>
          </div>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {PLANS.map((p) => (
              <div key={p.nom} className="card-hover" style={{ background: p.popular ? 'linear-gradient(135deg,rgba(127,119,221,.15),rgba(83,74,183,.08))' : 'rgba(255,255,255,.04)', border: `1px solid ${p.popular ? 'rgba(127,119,221,.5)' : 'rgba(255,255,255,.08)'}`, borderRadius: 22, padding: '28px 22px', position: 'relative', overflow: 'hidden' }}>
                {p.popular && (
                  <>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#7F77DD,#9FE1CB)' }} />
                    <div style={{ position: 'absolute', top: 16, right: 16, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', borderRadius: 20, padding: '3px 12px', fontSize: 10, fontWeight: 800 }}>⭐ Populaire</div>
                  </>
                )}
                <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginBottom: 8 }}>Plan {p.nom}</p>
                <p style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: -1.5, marginBottom: 4 }}>{fmt(p.prix)} <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,.4)' }}>FCFA</span></p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', marginBottom: 24 }}>par mois</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, color: p.popular ? '#9FE1CB' : '#7F77DD', flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" className="btn"
                  style={{ display: 'block', textAlign: 'center', background: p.popular ? 'linear-gradient(135deg,#7F77DD,#534AB7)' : 'rgba(255,255,255,.08)', color: '#fff', border: p.popular ? 'none' : '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: p.popular ? '0 4px 20px rgba(127,119,221,.35)' : 'none' }}>
                  Commencer avec {p.nom}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AFFILIATION CTA */}
      <section id="affiliation" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(127,119,221,.1),rgba(29,158,117,.08))', border: '1px solid rgba(127,119,221,.25)', borderRadius: 28, padding: '56px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 250, height: 250, background: 'radial-gradient(circle,rgba(127,119,221,.15),transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(29,158,117,.12),transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ fontSize: 52, marginBottom: 20, animation: 'float 3s ease-in-out infinite' }}>💰</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9FE1CB', textTransform: 'uppercase', letterSpacing: '.12em', display: 'block', marginBottom: 16 }}>Programme d'affiliation</span>
            <h2 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -2, marginBottom: 16 }}>Gagne jusqu'à<br /><span style={{ color: '#9FE1CB' }}>150 000 FCFA/mois</span></h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: 16, maxWidth: 480, margin: '0 auto 16px' }}>
              Recommande Dropzi à des commerçants et reçois <strong style={{ color: '#fff' }}>50% de commission</strong> sur chaque abonnement payé. Automatiquement sur Wave ou Orange Money.
            </p>

            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', margin: '28px 0 36px', flexWrap: 'wrap' }}>
              {[['🥉 Starter','1 500 F/invité'],['🥈 Business','2 500 F/invité'],['🥇 Elite','7 500 F/invité']].map(([plan, gain]) => (
                <div key={plan} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{plan}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: '#9FE1CB' }}>{gain}</p>
                </div>
              ))}
            </div>

            <Link href="/affiliation" className="btn"
              style={{ display: 'inline-block', background: 'linear-gradient(135deg,#1D9E75,#16A34A)', color: '#fff', border: 'none', borderRadius: 16, padding: '16px 40px', fontSize: 17, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 24px rgba(29,158,117,.35)' }}>
              🤝 Rejoindre le programme gratuitement →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '100px 24px', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 52, fontWeight: 900, letterSpacing: -2.5, marginBottom: 20, lineHeight: 1.05 }}>
            Prêt à gérer ton business<br />
            <span style={{ background: 'linear-gradient(135deg,#7F77DD,#9FE1CB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>comme un pro ?</span>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.45)', marginBottom: 40 }}>
            Rejoins plus de 1 200 commerçants qui gèrent leur boutique Shopify avec Dropzi.
          </p>
          <Link href="/login" className="btn"
            style={{ display: 'inline-block', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 18, padding: '18px 52px', fontSize: 19, fontWeight: 900, boxShadow: '0 8px 36px rgba(127,119,221,.45)', textDecoration: 'none', letterSpacing: -.3 }}>
            🚀 Commencer maintenant — Gratuit
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.25)', marginTop: 16 }}>Paiement Wave · Orange Money · Carte bancaire</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '32px 24px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Dropzi</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>© 2025 — Tous droits réservés</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['dropzi.io','Accueil'],['dropzi.io/login','Connexion'],['dropzi.io/affiliation','Affiliation']].map(([href, label]) => (
            <a key={label} href={`https://${href}`} style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
