'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const FEATURES = [
  { icon: '📦', titre: 'Commandes en temps réel', desc: 'Créez et gérez vos commandes en quelques secondes. Suivi du statut, livreur assigné, client notifié automatiquement.' },
  { icon: '🔄', titre: 'Sync Google Sheet auto', desc: 'Connectez votre boutique Easy Sell ou Shopify. Chaque nouvelle commande arrive dans Dropzi en moins de 10 secondes.' },
  { icon: '💰', titre: 'Bénéfice en temps réel', desc: 'Voyez votre bénéfice exact à chaque instant — après déduction des coûts produits et frais de livraison.' },
  { icon: '🧾', titre: 'Factures premium', desc: '5 modèles de factures professionnels. Générez et partagez en PDF ou WhatsApp en un seul clic.' },
  { icon: '🌍', titre: 'Fait pour l\'Afrique', desc: 'Zones de livraison flexibles, WhatsApp intégré, support FCFA. Dropzi comprend le marché africain.' },
  { icon: '📊', titre: 'Rapports & analytics', desc: 'Bilans hebdomadaires et mensuels automatiques. Partagez vos performances sur WhatsApp.' },
]

const PLANS = [
  { nom: 'Basic', prix: '3 000', couleur: '#888', bg: '#F8F8F8', features: ['50 commandes/mois', '5 produits', '1 livreur', 'Rapports basiques'] },
  { nom: 'Business', prix: '5 000', couleur: '#7F77DD', bg: '#EEEDFE', star: true, features: ['Commandes illimitées', 'Produits illimités', 'Sync Google Sheet', 'Factures premium', 'WhatsApp intégré'] },
  { nom: 'Elite', prix: '15 000', couleur: '#1D9E75', bg: '#E1F5EE', features: ['Tout Business +', 'Multi-boutiques', 'Analytics avancés', 'Support prioritaire', 'Formation 1-1'] },
]

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

export default function LandingPage() {
  const [typed, setTyped] = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [activeFeat, setActiveFeat] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const words = ['Gérez.', 'Livrez.', 'Encaissez.', 'Grandissez.']

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let i = 0, del = false
    const word = words[wordIdx]
    const t = setInterval(() => {
      if (!del) { i++; setTyped(word.slice(0, i)); if (i === word.length) { del = true } }
      else { i--; setTyped(word.slice(0, i)); if (i === 0) { del = false; setWordIdx(w => (w + 1) % words.length); clearInterval(t) } }
    }, del ? 50 : 90)
    return () => clearInterval(t)
  }, [wordIdx])

  useEffect(() => {
    const t = setInterval(() => setActiveFeat(f => (f + 1) % FEATURES.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ background: '#06060F', color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden' }}>

      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 40px rgba(127,119,221,.3)}50%{box-shadow:0 0 80px rgba(127,119,221,.6)}}
        .fade-up{animation:fadeUp .7s ease forwards;}
        .float{animation:float 4s ease-in-out infinite;}
        .glow{animation:glow 3s ease-in-out infinite;}
        .feat-btn{transition:all .2s;cursor:pointer;border:none;background:none;}
        .plan-card{transition:transform .2s,box-shadow .2s;}
        .plan-card:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.3)!important;}
        .cta-btn{transition:all .2s;cursor:pointer;}
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(127,119,221,.5)!important;}
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr!important;}
          .feat-grid{grid-template-columns:1fr!important;}
          .plans-grid{grid-template-columns:1fr!important;}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
          .hero-title{font-size:clamp(36px,10vw,80px)!important;}
          .hide-mobile{display:none!important;}
          .nav-links{display:none!important;}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 5vw', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(6,6,15,.92)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,.07)' : 'none', transition: 'all .3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(127,119,221,.5)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.8"/></svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -.5 }}>Dropzi</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {[['#features', 'Fonctionnalités'], ['#pricing', 'Tarifs'], ['/tutoriels', 'Tutoriels']].map(([h, l]) => (
            <Link key={h} href={h} style={{ color: 'rgba(255,255,255,.5)', fontSize: 14, textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.5)')}>{l}</Link>
          ))}
        </div>
        <Link href="/login" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '9px 22px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(127,119,221,.4)' }}>
          Commencer →
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', padding: '100px 5vw 0', overflow: 'hidden' }}>
        {/* Orbes décoratifs */}
        <div style={{ position: 'absolute', top: '10%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(127,119,221,.15),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(29,158,117,.1),transparent 70%)', pointerEvents: 'none' }} />

        {/* Grille déco */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div className="fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(127,119,221,.12)', border: '1px solid rgba(127,119,221,.25)', borderRadius: 100, padding: '5px 16px', marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>Fait pour les commerçants africains</span>
            </div>

            <h1 className="hero-title" style={{ fontSize: 'clamp(44px,5.5vw,80px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: -3, marginBottom: 12 }}>
              Vends plus.<br />
              <span style={{ background: 'linear-gradient(90deg,#7F77DD,#AFA9EC,#7F77DD)', backgroundSize: '200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {typed}<span style={{ opacity: Math.random() > .5 ? 1 : 0 }}>|</span>
              </span>
            </h1>

            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.45)', lineHeight: 1.8, maxWidth: 440, marginBottom: 36 }}>
              Le premier outil de gestion e-commerce pensé pour l'Afrique. Commandes, livraisons, factures, bénéfices — tout en un.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/login" className="cta-btn glow" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '16px 36px', borderRadius: 16, fontSize: 16, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                Commencer gratuitement <span style={{ fontSize: 20 }}>→</span>
              </Link>
              <Link href="/tutoriels" className="cta-btn" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)', padding: '16px 28px', borderRadius: 16, fontSize: 15, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                ▶ Voir comment ça marche
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap' }}>
              {[['38+', 'Boutiques actives'], ['10s', 'Sync automatique'], ['7j', 'Essai gratuit']].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#7F77DD', letterSpacing: -1 }}>{v}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="float hide-mobile" style={{ position: 'relative' }}>
            <div style={{ background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, padding: 24, boxShadow: '0 40px 120px rgba(0,0,0,.6)' }}>
              {/* Mini header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E24B4A' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#BA7517' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1D9E75' }} />
                <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,.3)' }}>dropzi.netlify.app</span>
              </div>
              {/* Bénéfice card */}
              <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', borderRadius: 18, padding: 20, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(127,119,221,.15)', borderRadius: '50%' }} />
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Bénéfice aujourd'hui</p>
                <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: -2 }}>87 500 <span style={{ fontSize: 18, opacity: .6 }}>F</span></p>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
                  <span>CA : 310 000 F</span>
                  <span>· 24 commandes</span>
                  <span style={{ marginLeft: 'auto', background: 'rgba(29,158,117,.2)', color: '#9FE1CB', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>+12%</span>
                </div>
              </div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                {[['18', 'Livrées', '#1D9E75'], ['4', 'En cours', '#378ADD'], ['2', 'Annulées', '#E24B4A'], ['12.9k', 'Panier', '#7F77DD']].map(([v, l, c]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: c as string, letterSpacing: -.5 }}>{v}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              {/* Commande sample */}
              {[['Fatou Diallo', '221 77 000 0000', 'Livré', '#1D9E75', '#E1F5EE'], ['Moussa Sow', '221 78 000 0000', 'En livraison', '#378ADD', '#E6F1FB']].map(([n, t, s, c, bg]) => (
                <div key={n as string} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(127,119,221,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#AFA9EC', flexShrink: 0 }}>{(n as string).slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{n as string}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{t as string}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: bg as string, color: c as string }}>{s as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COURBE SVG 1 ── */}
      <div style={{ marginTop: -2, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: 80, display: 'block' }}>
          <path d="M0,0 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#0D0D20" />
        </svg>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: '#0D0D20', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Fonctionnalités</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16 }}>
              Tout ce dont tu as besoin<br />
              <span style={{ color: '#7F77DD' }}>pour gérer ton business</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>De la première commande au bilan mensuel — Dropzi gère tout automatiquement.</p>
          </div>

          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} onMouseEnter={() => setActiveFeat(i)} style={{ background: activeFeat === i ? 'rgba(127,119,221,.1)' : 'rgba(255,255,255,.03)', border: `1px solid ${activeFeat === i ? 'rgba(127,119,221,.3)' : 'rgba(255,255,255,.07)'}`, borderRadius: 20, padding: 24, cursor: 'default', transition: 'all .3s' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: activeFeat === i ? 'rgba(127,119,221,.2)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16, transition: 'all .3s' }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: activeFeat === i ? '#fff' : 'rgba(255,255,255,.8)' }}>{f.titre}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COURBE SVG 2 ── */}
      <div style={{ lineHeight: 0, background: '#0D0D20' }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: 80, display: 'block' }}>
          <path d="M0,60 C480,0 960,80 1440,20 L1440,80 L0,80 Z" fill="#080816" />
        </svg>
      </div>

      {/* ── STATS ── */}
      <section style={{ background: '#080816', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -2 }}>
              Des résultats <span style={{ color: '#1D9E75' }}>concrets</span>
            </h2>
          </div>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {[['38+', 'Boutiques actives', '#7F77DD'], ['10s', 'Sync automatique', '#1D9E75'], ['5', 'Modèles de factures', '#BA7517'], ['100%', 'Gratuit à l\'essai', '#E24B4A']].map(([v, l, c]) => (
              <div key={l as string} style={{ textAlign: 'center', background: 'rgba(255,255,255,.03)', borderRadius: 20, padding: '28px 16px', border: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: c as string, letterSpacing: -2, marginBottom: 8 }}>{v}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COURBE SVG 3 ── */}
      <div style={{ lineHeight: 0, background: '#080816' }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: 80, display: 'block' }}>
          <path d="M0,20 C360,80 1080,0 1440,50 L1440,80 L0,80 Z" fill="#0A0A1A" />
        </svg>
      </div>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: '#0A0A1A', padding: '80px 5vw 100px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Tarifs</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, letterSpacing: -2, marginBottom: 16 }}>Simple et transparent</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 15 }}>7 jours gratuits · Aucune carte bancaire · Annulation à tout moment</p>
          </div>

          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {PLANS.map(p => (
              <div key={p.nom} className="plan-card" style={{ background: p.star ? 'rgba(127,119,221,.08)' : 'rgba(255,255,255,.03)', border: `2px solid ${p.star ? '#7F77DD' : 'rgba(255,255,255,.08)'}`, borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
                {p.star && <div style={{ position: 'absolute', top: 16, right: 16, background: '#7F77DD', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>⭐ POPULAIRE</div>}
                <div style={{ fontSize: 13, fontWeight: 700, color: p.couleur, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>{p.nom}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: -2 }}>{p.prix}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.35)' }}>FCFA/mois</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '20px 0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: p.couleur, flexShrink: 0, fontWeight: 700 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" className="cta-btn" style={{ display: 'block', textAlign: 'center', background: p.star ? 'linear-gradient(135deg,#7F77DD,#534AB7)' : 'rgba(255,255,255,.06)', color: '#fff', padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', border: p.star ? 'none' : '1px solid rgba(255,255,255,.1)' }}>
                  Commencer gratuitement
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COURBE SVG 4 ── */}
      <div style={{ lineHeight: 0, background: '#0A0A1A' }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: 80, display: 'block' }}>
          <path d="M0,40 C720,80 720,0 1440,40 L1440,80 L0,80 Z" fill="#06060F" />
        </svg>
      </div>

      {/* ── CTA FINAL ── */}
      <section style={{ background: '#06060F', padding: '80px 5vw 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 60px rgba(127,119,221,.4)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.8"/></svg>
          </div>
          <h2 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.1, marginBottom: 20 }}>
            Lance-toi aujourd'hui.<br />
            <span style={{ color: '#7F77DD' }}>C'est gratuit.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 16, marginBottom: 40, lineHeight: 1.7 }}>
            Rejoins les commerçants africains qui gèrent leur business intelligemment avec Dropzi.
          </p>
          <Link href="/login" className="cta-btn glow" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '18px 48px', borderRadius: 18, fontSize: 18, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 48px rgba(127,119,221,.4)' }}>
            Créer mon compte gratuit <span style={{ fontSize: 22 }}>→</span>
          </Link>
          <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 12, marginTop: 20 }}>7 jours gratuits · Aucune carte bancaire</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '28px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: '#06060F' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>© 2025 Dropzi · Fait avec ❤️ pour l'Afrique 🌍</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['#features', 'Fonctionnalités'], ['#pricing', 'Tarifs'], ['/tutoriels', 'Tutoriels'], ['/login', 'Connexion']].map(([h, l]) => (
            <Link key={h} href={h} style={{ color: 'rgba(255,255,255,.25)', fontSize: 13, textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
