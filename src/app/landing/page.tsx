'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

const FEATURES = [
  { icon: '🔄', titre: 'Sync Google Sheet automatique', desc: 'Tes commandes Easy Sell/Shopify arrivent dans Dropzi en moins de 60 secondes. Zéro saisie manuelle.', color: '#7F77DD' },
  { icon: '💰', titre: 'Bénéfice en temps réel', desc: 'Vois ton bénéfice exact après déduction des coûts produits et frais de livraison. À chaque commande livrée.', color: '#1D9E75' },
  { icon: '📦', titre: 'Suivi stock automatique', desc: 'Ton stock se déduit tout seul à chaque livraison. Alerte quand un produit est presque épuisé.', color: '#BA7517' },
  { icon: '🧾', titre: '5 modèles de factures premium', desc: 'Sombre, Corporate, Minimal, Africain, Luxe. PDF en 1 clic ou partage direct sur WhatsApp.', color: '#534AB7' },
  { icon: '🔔', titre: 'Notifications instantanées', desc: 'Popup dès qu\'une nouvelle commande arrive. Cloche en temps réel dans l\'app.', color: '#E24B4A' },
  { icon: '📥', titre: 'Import produits Shopify', desc: 'Uploade ton CSV Shopify — tous tes produits avec images arrivent dans Dropzi en 1 clic.', color: '#378ADD' },
]

const PLANS = [
  {
    id: 'starter', nom: 'Starter', prix: 3000, couleur: '#888', bg: 'rgba(136,136,136,.08)', border: 'rgba(136,136,136,.15)',
    features: ['50 commandes / mois', '5 produits maximum', '1 zone de livraison', '1 livreur', '1 modèle de facture basique', 'Sync Google Sheet (1h)'],
  },
  {
    id: 'business', nom: 'Business', prix: 5000, couleur: '#7F77DD', bg: 'rgba(127,119,221,.08)', border: 'rgba(127,119,221,.4)', star: true,
    features: ['500 commandes / mois', '25 produits maximum', '5 zones de livraison', '6 livreurs', '3 modèles de factures', 'Sync Google Sheet (1 min)', 'Import produits Shopify CSV', 'Photo produit', 'Notifications temps réel', 'Suivi stock automatique'],
  },
  {
    id: 'elite', nom: 'Elite', prix: 15000, couleur: '#1D9E75', bg: 'rgba(29,158,117,.08)', border: 'rgba(29,158,117,.3)',
    features: ['Commandes illimitées', 'Produits illimités', 'Zones & livreurs illimités', '5 modèles de factures premium', 'Sync Google Sheet (1 min)', 'Import produits Shopify', 'Analytics avancés', 'Export données', 'Support prioritaire', 'Nouvelles fonctions en avant-première'],
  },
]

const TEMOIGNAGES = [
  { nom: 'Fatou D.', boutique: 'FashionDakar', texte: 'Avant je passais 2h à recopier les commandes WhatsApp. Maintenant tout arrive seul en 60 secondes. Incroyable.', note: 5 },
  { nom: 'Moussa S.', boutique: 'ElectroPro SN', texte: 'Je vois mon bénéfice exact en temps réel. Je sais exactement où j\'en suis à chaque instant. Indispensable.', note: 5 },
  { nom: 'Aïcha B.', boutique: 'CosmétiqueAfrik', texte: 'Les factures professionnelles ont changé l\'image de ma boutique. Mes clients me font plus confiance.', note: 5 },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeFeat, setActiveFeat] = useState(0)
  const [c1, setC1] = useState(0)
  const [c2, setC2] = useState(0)
  const [c3, setC3] = useState(0)
  const statsRef = useRef<HTMLDivElement>(null)
  const animated = useRef(false)
  const [visible, setVisible] = useState<Record<string,boolean>>({})

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveFeat(f => (f + 1) % FEATURES.length), 3200)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setVisible(v => ({ ...v, [e.target.id]: true }))
        }
      })
    }, { threshold: .15 })
    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !animated.current) {
        animated.current = true
        let i = 0
        const t = setInterval(() => {
          i++
          setC1(Math.min(Math.round(i * 38 / 60), 38))
          setC2(Math.min(Math.round(i * 60 / 60), 60))
          setC3(Math.min(Math.round(i * 97 / 60), 97))
          if (i >= 60) clearInterval(t)
        }, 25)
      }
    }, { threshold: .3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  const isVis = (id: string) => !!visible[id]

  return (
    <div style={{ background: '#06060F', color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes glow{0%,100%{box-shadow:0 0 32px rgba(127,119,221,.3)}50%{box-shadow:0 0 72px rgba(127,119,221,.65)}}
        @keyframes shine{from{left:-100%}to{left:200%}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideR{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideL{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
        .hero-in{animation:fadeUp .8s .1s ease both;}
        .float{animation:float 5s ease-in-out infinite;}
        .glow-btn{animation:glow 3s ease-in-out infinite;position:relative;overflow:hidden;}
        .glow-btn::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);animation:shine 2.5s ease infinite;}
        .nav-link{color:rgba(255,255,255,.5);font-size:14px;text-decoration:none;transition:color .2s;}
        .nav-link:hover{color:#fff;}
        .feat-dot{transition:all .2s;cursor:pointer;border:none;background:none;padding:0;}
        .plan-card{transition:transform .25s,box-shadow .25s;}
        .plan-card:hover{transform:translateY(-6px);}
        .testi-card{transition:transform .2s;}
        .testi-card:hover{transform:translateY(-3px);}
        @media(max-width:768px){
          .hero-grid,.feat-grid,.plans-grid,.testi-grid,.steps-grid{grid-template-columns:1fr!important;}
          .hero-title{font-size:clamp(38px,10vw,56px)!important;letter-spacing:-2px!important;}
          .hide-mob{display:none!important;}
          .nav-links{display:none!important;}
          .form-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 5vw', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(6,6,15,.96)' : 'transparent', backdropFilter: scrolled ? 'blur(24px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,.07)' : 'none', transition: 'all .35s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(127,119,221,.5)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.8"/></svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -.5 }}>Dropzi</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a href="#features" className="nav-link">Fonctionnalités</a>
          <a href="#pricing" className="nav-link">Tarifs</a>
          <Link href="/tutoriels" className="nav-link">Tutoriels</Link>
        </div>
        <Link href="/login" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '9px 22px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(127,119,221,.4)' }}>
          S'inscrire →
        </Link>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 5vw 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle,rgba(127,119,221,.18),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '-8%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(29,158,117,.12),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: 1120, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 60, alignItems: 'center' }}>
          <div className="hero-in">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(29,158,117,.12)', border: '1px solid rgba(29,158,117,.3)', borderRadius: 100, padding: '5px 16px', marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', display: 'inline-block', animation: 'pulse 1.8s infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>🌍 L'outil logistique e-commerce N°1 en Afrique</span>
            </div>

            <h1 className="hero-title" style={{ fontSize: 'clamp(42px,5vw,76px)', fontWeight: 800, lineHeight: 1.04, letterSpacing: -3.5, marginBottom: 22 }}>
              Toute ta logistique<br />
              e-commerce<br />
              <span style={{ background: 'linear-gradient(90deg,#7F77DD,#AFA9EC,#7F77DD)', backgroundSize: '200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>enfin maîtrisée.</span>
            </h1>

            <p style={{ fontSize: 18, color: 'rgba(255,255,255,.5)', lineHeight: 1.8, maxWidth: 480, marginBottom: 10 }}>
              Commandes, stock, livraisons, bénéfices, factures — tout centralisé. Tes commandes Shopify arrivent automatiquement en 60 secondes.
            </p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.28)', marginBottom: 36, fontStyle: 'italic' }}>Zéro Excel. Zéro recopie. Zéro stress.</p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link href="/login" className="glow-btn" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '17px 40px', borderRadius: 18, fontSize: 17, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(127,119,221,.4)' }}>
                Créer mon compte <span style={{ fontSize: 22 }}>→</span>
              </Link>
              <Link href="/tutoriels" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.65)', padding: '17px 28px', borderRadius: 18, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                ▶ Voir la démo
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>Paiement :</span>
              {['Wave', 'Orange Money', 'Carte bancaire'].map(m => (
                <span key={m} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{m}</span>
              ))}
            </div>
          </div>

          {/* Preview dashboard */}
          <div className="float hide-mob">
            <div style={{ background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 26, padding: 22, boxShadow: '0 40px 100px rgba(0,0,0,.7)' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {['#E24B4A','#BA7517','#1D9E75'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', marginLeft: 8 }}>dropzi.netlify.app/dashboard</span>
              </div>
              <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', borderRadius: 18, padding: '18px 20px', marginBottom: 12 }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Bénéfice aujourd'hui</p>
                <p style={{ fontSize: 38, fontWeight: 800, letterSpacing: -2.5, color: '#fff', lineHeight: 1 }}>127 500 <span style={{ fontSize: 17, opacity: .45 }}>FCFA</span></p>
                <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,.3)', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.07)' }}>
                  <span>CA : 420 000 F</span><span>·</span><span>38 commandes</span>
                  <span style={{ marginLeft: 'auto', background: 'rgba(29,158,117,.2)', color: '#9FE1CB', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>+18% ↑</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                {[['24','Livrées','#1D9E75'],['8','En cours','#378ADD'],['2','Annulées','#E24B4A']].map(([v,l,c]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: c, letterSpacing: -.5 }}>{v}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(29,158,117,.1)', border: '1px solid rgba(29,158,117,.25)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9FE1CB' }}>5 nouvelles commandes Easy Sell</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>Synchronisées automatiquement · il y a 12 secondes</p>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', top: -14, right: -14, background: '#1D9E75', color: '#fff', borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 800, boxShadow: '0 8px 24px rgba(29,158,117,.4)' }}>
              ⚡ Sync auto 60s
            </div>
          </div>
        </div>
      </section>

      {/* COURBE */}
      <div style={{ background: '#06060F', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ width: '100%', height: 56, display: 'block' }}>
          <path d="M0,0 C480,56 960,0 1440,36 L1440,56 L0,56 Z" fill="#0A0A18" />
        </svg>
      </div>

      {/* STATS */}
      <div ref={statsRef} style={{ background: '#0A0A18', padding: '60px 5vw' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { val: c1 + '+', lbl: 'Boutiques actives', sub: 'font confiance à Dropzi', color: '#7F77DD' },
            { val: c2 + 's', lbl: 'Délai sync maximum', sub: 'Google Sheet → Dropzi', color: '#1D9E75' },
            { val: c3 + '%', lbl: 'Taux de satisfaction', sub: 'utilisateurs satisfaits', color: '#BA7517' },
          ].map((s, i) => (
            <div key={i} id={`stat-${i}`} data-animate="true" style={{ textAlign: 'center', background: 'rgba(255,255,255,.03)', borderRadius: 20, padding: '32px 16px', border: '1px solid rgba(255,255,255,.06)', transition: 'all .6s', opacity: isVis(`stat-${i}`) ? 1 : 0, transform: isVis(`stat-${i}`) ? 'translateY(0)' : 'translateY(24px)' }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: s.color, letterSpacing: -2.5, lineHeight: 1, marginBottom: 10 }}>{s.val}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{s.lbl}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* COURBE */}
      <div style={{ background: '#0A0A18', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ width: '100%', height: 56, display: 'block' }}>
          <path d="M0,36 C360,0 1080,56 1440,18 L1440,56 L0,56 Z" fill="#0D0D22" />
        </svg>
      </div>

      {/* FEATURES */}
      <section id="features" style={{ background: '#0D0D22', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div id="feat-title" data-animate="true" style={{ textAlign: 'center', marginBottom: 56, transition: 'all .6s', opacity: isVis('feat-title') ? 1 : 0, transform: isVis('feat-title') ? 'none' : 'translateY(20px)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Ce que fait Dropzi</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16 }}>
              6 fonctionnalités qui<br />
              <span style={{ color: '#7F77DD' }}>automatisent tout</span>
            </h2>
          </div>

          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} id={`feat-${i}`} data-animate="true" onClick={() => setActiveFeat(i)}
                style={{ background: activeFeat === i ? `rgba(${f.color === '#7F77DD' ? '127,119,221' : f.color === '#1D9E75' ? '29,158,117' : f.color === '#BA7517' ? '186,117,23' : f.color === '#534AB7' ? '83,74,183' : f.color === '#E24B4A' ? '226,75,74' : '55,138,221'},.12)` : 'rgba(255,255,255,.03)', border: `1px solid ${activeFeat === i ? f.color + '44' : 'rgba(255,255,255,.07)'}`, borderRadius: 20, padding: '22px 20px', cursor: 'pointer', transition: 'all .3s', opacity: isVis(`feat-${i}`) ? 1 : 0, transform: isVis(`feat-${i}`) ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${i * 0.07}s` }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: activeFeat === i ? f.color + '22' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14, transition: 'all .3s' }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: activeFeat === i ? '#fff' : 'rgba(255,255,255,.75)' }}>{f.titre}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURBE */}
      <div style={{ background: '#0D0D22', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ width: '100%', height: 56, display: 'block' }}>
          <path d="M0,18 C720,56 720,0 1440,36 L1440,56 L0,56 Z" fill="#080814" />
        </svg>
      </div>

      {/* PRICING */}
      <section id="pricing" style={{ background: '#080814', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div id="price-title" data-animate="true" style={{ textAlign: 'center', marginBottom: 56, transition: 'all .6s', opacity: isVis('price-title') ? 1 : 0, transform: isVis('price-title') ? 'none' : 'translateY(20px)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Tarifs</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, letterSpacing: -2, marginBottom: 14 }}>Simple. Transparent. Africain.</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 15 }}>Paiement sécurisé · Wave · Orange Money · Carte bancaire</p>
          </div>

          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {PLANS.map((p, i) => (
              <div key={p.id} id={`plan-${i}`} data-animate="true" className="plan-card"
                style={{ background: (p as any).star ? 'rgba(127,119,221,.06)' : 'rgba(255,255,255,.03)', border: `2px solid ${(p as any).star ? '#7F77DD' : 'rgba(255,255,255,.08)'}`, borderRadius: 24, padding: '28px 22px', position: 'relative', transition: 'all .6s', opacity: isVis(`plan-${i}`) ? 1 : 0, transform: isVis(`plan-${i}`) ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${i * 0.1}s` }}>
                {(p as any).star && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 18px', borderRadius: 20, whiteSpace: 'nowrap' }}>⭐ Le plus populaire</div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, color: p.couleur, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14 }}>{p.nom}</div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 46, fontWeight: 800, color: '#fff', letterSpacing: -2.5 }}>{fmt(p.prix)}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', marginLeft: 4 }}>FCFA/mois</span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', marginBottom: 24 }}>Renouvellement mensuel automatique</p>
                <div style={{ height: 1, background: 'rgba(255,255,255,.08)', marginBottom: 22 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: p.couleur, flexShrink: 0, fontWeight: 800, fontSize: 14 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" style={{ display: 'block', textAlign: 'center', background: (p as any).star ? 'linear-gradient(135deg,#7F77DD,#534AB7)' : p.bg, color: '#fff', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: 'none', border: (p as any).star ? 'none' : `1px solid ${p.border}` }}>
                  S'abonner — {fmt(p.prix)} FCFA
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURBE */}
      <div style={{ background: '#080814', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ width: '100%', height: 56, display: 'block' }}>
          <path d="M0,28 C480,56 960,0 1440,42 L1440,56 L0,56 Z" fill="#0C0C1E" />
        </svg>
      </div>

      {/* TEMOIGNAGES */}
      <section style={{ background: '#0C0C1E', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div id="testi-title" data-animate="true" style={{ textAlign: 'center', marginBottom: 48, transition: 'all .6s', opacity: isVis('testi-title') ? 1 : 0, transform: isVis('testi-title') ? 'none' : 'translateY(20px)' }}>
            <h2 style={{ fontSize: 'clamp(24px,4vw,46px)', fontWeight: 800, letterSpacing: -1.5 }}>Ce que disent nos utilisateurs</h2>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {TEMOIGNAGES.map((t, i) => (
              <div key={i} id={`testi-${i}`} data-animate="true" className="testi-card"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '24px 20px', transition: 'all .6s', opacity: isVis(`testi-${i}`) ? 1 : 0, transform: isVis(`testi-${i}`) ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${i * 0.1}s` }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, j) => <span key={j} style={{ color: '#BA7517', fontSize: 16 }}>★</span>)}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>"{t.texte}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{t.nom.slice(0, 1)}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.nom}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>{t.boutique}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURBE */}
      <div style={{ background: '#0C0C1E', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ width: '100%', height: 56, display: 'block' }}>
          <path d="M0,42 C720,0 720,56 1440,14 L1440,56 L0,56 Z" fill="#06060F" />
        </svg>
      </div>

      {/* FORMULAIRE */}
      <section style={{ background: '#06060F', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div id="form-title" data-animate="true" style={{ textAlign: 'center', marginBottom: 36, transition: 'all .6s', opacity: isVis('form-title') ? 1 : 0, transform: isVis('form-title') ? 'none' : 'translateY(20px)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Démarrer maintenant</p>
            <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, letterSpacing: -1.5, marginBottom: 12 }}>Rejoins Dropzi aujourd'hui</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 15 }}>Configure ta boutique en moins de 3 minutes.</p>
          </div>

          <div id="form-box" data-animate="true" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 28, padding: '36px 32px', transition: 'all .6s', opacity: isVis('form-box') ? 1 : 0, transform: isVis('form-box') ? 'scale(1)' : 'scale(.96)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>Nom de ta boutique</label>
                  <input placeholder="Ex: FashionDakar" style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>Téléphone</label>
                  <input placeholder="77 000 00 00" style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>Email</label>
                <input type="email" placeholder="ton@email.com" style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>Choisir ton plan</label>
                <select style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, cursor: 'pointer' }}>
                  <option value="starter" style={{ background: '#0C0C1E' }}>Starter — 3 000 FCFA/mois</option>
                  <option value="business" style={{ background: '#0C0C1E' }}>Business — 5 000 FCFA/mois ⭐</option>
                  <option value="elite" style={{ background: '#0C0C1E' }}>Elite — 15 000 FCFA/mois</option>
                </select>
              </div>
              <Link href="/login" className="glow-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '16px', borderRadius: 16, fontSize: 16, fontWeight: 800, textDecoration: 'none', marginTop: 4, boxShadow: '0 4px 24px rgba(127,119,221,.4)' }}>
                Créer mon compte <span style={{ fontSize: 20 }}>→</span>
              </Link>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.2)' }}>
                🔒 Paiement sécurisé · Wave · Orange Money · Carte bancaire
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '28px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, background: '#06060F' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>© 2025 Dropzi · Fait avec ❤️ pour l'Afrique 🌍</span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[['#features','Fonctionnalités'],['#pricing','Tarifs'],['/tutoriels','Tutoriels'],['/login','Connexion']].map(([h,l]) => (
            <Link key={h} href={h} style={{ color: 'rgba(255,255,255,.25)', fontSize: 13, textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
