'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [typed, setTyped] = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [count1, setCount1] = useState(0)
  const [count2, setCount2] = useState(0)
  const [count3, setCount3] = useState(0)
  const [statsVisible, setStatsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const words = ['Gérez.', 'Livrez.', 'Encaissez.', 'Grandissez.']

  useEffect(() => {
    const h = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    let i = 0, del = false, word = words[wordIdx]
    const t = setInterval(() => {
      if (!del) { i++; setTyped(word.slice(0, i)); if (i === word.length) del = true }
      else { i--; setTyped(word.slice(0, i)); if (i === 0) { del = false; setWordIdx(w => (w + 1) % words.length); clearInterval(t) } }
    }, del ? 55 : 95)
    return () => clearInterval(t)
  }, [wordIdx])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!statsVisible) return
    let step = 0
    const t = setInterval(() => {
      step++
      const p = 1 - Math.pow(1 - step / 60, 3)
      setCount1(Math.round(p * 500))
      setCount2(Math.round(p * 24))
      setCount3(Math.round(p * 98))
      if (step >= 60) clearInterval(t)
    }, 33)
    return () => clearInterval(t)
  }, [statsVisible])

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(f => (f + 1) % 6), 3000)
    return () => clearInterval(t)
  }, [])

  const features = [
    { icon: '⚡', title: 'Commande en 10 secondes', desc: "Téléphone + produit + zone. C'est tout. Aucune paperasse." },
    { icon: '💰', title: 'Bénéfice en temps réel', desc: "Combien j'ai gagné aujourd'hui ? La réponse est là, maintenant." },
    { icon: '📦', title: 'Stock automatique', desc: 'Livraison confirmée → stock mis à jour. Zéro effort humain.' },
    { icon: '📊', title: 'Rapport WhatsApp', desc: 'Rapport complet en 1 clic. Tu copies. Tu colles. Envoyé.' },
    { icon: '🗺️', title: 'Zones intelligentes', desc: 'Chaque zone = son coût. Chaque livreur = sa zone. Automatique.' },
    { icon: '📈', title: 'Bilans & historique', desc: 'Rapports sauvegardés. Bilans hebdo et mensuel.' },
  ]

  const s: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
  }

  return (
    <div style={{ ...s, background: '#06060F', minHeight: '100vh', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes pulseDot{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
        .u1{animation:fadeUp .8s ease both}
        .u2{animation:fadeUp .8s .12s ease both}
        .u3{animation:fadeUp .8s .24s ease both}
        .u4{animation:fadeUp .8s .36s ease both}
        .cursor{display:inline-block;width:3px;height:.85em;background:#7F77DD;margin-left:3px;animation:blink 1s infinite;vertical-align:-.1em;border-radius:2px}
        .shimmer{background:linear-gradient(90deg,#fff 0%,#7F77DD 25%,#fff 50%,#C0BCFF 75%,#fff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite}
        .fcard{transition:all .3s ease}
        .fcard:hover{transform:translateY(-4px)}
        .btn-main{transition:all .3s}
        .btn-main:hover{transform:translateY(-2px);box-shadow:0 0 64px rgba(127,119,221,.6)!important}
        .tcard{transition:all .3s}
        .tcard:hover{transform:translateY(-4px);border-color:rgba(127,119,221,.3)!important}
        @media(max-width:768px){
          .hero-h1{font-size:clamp(40px,11vw,80px)!important;letter-spacing:-2px!important}
          .hero-ctas{flex-direction:column!important;align-items:stretch!important}
          .hero-ctas a{text-align:center!important;justify-content:center!important}
          .stats-grid{grid-template-columns:1fr!important}
          .stat-item{border-right:none!important;border-bottom:1px solid rgba(255,255,255,.06)!important}
          .stat-item:last-child{border-bottom:none!important}
          .features-grid{grid-template-columns:1fr!important}
          .rapport-grid{grid-template-columns:1fr!important;gap:32px!important}
          .testi-grid{grid-template-columns:1fr!important}
          .pricing-grid{grid-template-columns:1fr!important}
          .nav-links-desktop{display:none!important}
          .nav-burger{display:flex!important}
          .problem-grid{grid-template-columns:1fr 1fr!important}
          .hero-trust{flex-direction:column!important;align-items:center!important;gap:8px!important}
          .cta-h2{font-size:clamp(36px,9vw,64px)!important;letter-spacing:-2px!important}
        }
        @media(max-width:480px){
          .problem-grid{grid-template-columns:1fr!important}
          .hero-mockup{max-width:280px!important}
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        padding: '0 5vw', height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrollY > 40 ? 'rgba(6,6,15,.92)' : 'transparent',
        backdropFilter: scrollY > 40 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 40 ? '1px solid rgba(255,255,255,.07)' : 'none',
        transition: 'all .3s ease'
      }}>
        <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(127,119,221,.5)', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: -1 }}>Dropzi</span>
        </Link>

        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#features" style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, textDecoration: 'none' }}>Fonctionnalités</a>
          <a href="#rapport" style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, textDecoration: 'none' }}>Rapport</a>
          <a href="#tarifs" style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, textDecoration: 'none' }}>Tarifs</a>
          <Link href="/login" style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, textDecoration: 'none' }}>Connexion</Link>
          <Link href="/login" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '9px 22px', borderRadius: 11, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 18px rgba(127,119,221,.35)' }}>Démarrer →</Link>
        </div>

        <button className="nav-burger" onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
          <span style={{ display: 'block', width: 24, height: 2, background: '#fff', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 24, height: 2, background: '#fff', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 24, height: 2, background: '#fff', borderRadius: 2 }} />
        </button>
      </nav>

      {/* MENU MOBILE */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, top: 68, background: 'rgba(6,6,15,.98)', zIndex: 199, display: 'flex', flexDirection: 'column', padding: '32px 5vw', gap: 24 }}>
          {['#features', '#rapport', '#tarifs'].map((href, i) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ color: '#fff', fontSize: 22, fontWeight: 600, textDecoration: 'none' }}>
              {['Fonctionnalités', 'Rapport WhatsApp', 'Tarifs'][i]}
            </a>
          ))}
          <Link href="/login" style={{ color: '#fff', fontSize: 22, fontWeight: 600, textDecoration: 'none' }}>Connexion</Link>
          <Link href="/login" onClick={() => setMenuOpen(false)} style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '16px', borderRadius: 14, fontSize: 18, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
            Commencer gratuitement →
          </Link>
        </div>
      )}

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 5vw 60px', position: 'relative', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(127,119,221,.15),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(29,158,117,.08),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, width: '100%', position: 'relative', zIndex: 1 }}>
          <div className="u1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(127,119,221,.1)', border: '1px solid rgba(127,119,221,.25)', borderRadius: 100, padding: '6px 18px', marginBottom: 32 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', display: 'inline-block', boxShadow: '0 0 8px #1D9E75', animation: 'pulseDot 2s infinite' }} />
            <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 500 }}>L'outil e-commerce #1 pensé pour l'Afrique 🌍</span>
          </div>

          <h1 className="u2 hero-h1" style={{ fontSize: 'clamp(48px,9vw,104px)', fontWeight: 800, lineHeight: 1.0, letterSpacing: -3, marginBottom: 20, color: '#fff' }}>
            Vends plus.<br />
            <span className="shimmer">{typed}</span><span className="cursor" />
          </h1>

          <p className="u3" style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'rgba(255,255,255,.4)', maxWidth: 540, margin: '0 auto 48px', lineHeight: 1.75, fontWeight: 400 }}>
            Tes concurrents gèrent encore leurs commandes sur du papier. Toi, tu vois ton bénéfice en temps réel — depuis ton téléphone.
          </p>

          <div className="u4 hero-ctas" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
            <Link href="/login" className="btn-main" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '17px 36px', borderRadius: 16, fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 48px rgba(127,119,221,.45)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Essayer gratuitement 7 jours <span style={{ fontSize: 20 }}>→</span>
            </Link>
            <Link href="/tutoriels" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)', padding: '17px 36px', borderRadius: 16, fontSize: 16, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              ▶ Voir comment ça marche
            </Link>
          </div>

          <div className="hero-trust" style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['✓ Aucune carte requise', '✓ 7 jours gratuits', '✓ Annulation à tout moment'].map(t => (
              <span key={t} style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>{t}</span>
            ))}
          </div>

          {/* Phone mockup */}
          <div className="hero-mockup" style={{ margin: '56px auto 0', maxWidth: 320, animation: 'float 6s ease-in-out 1s infinite' }}>
            <div style={{ background: 'linear-gradient(145deg,#1A1A2E,#0D0D1F)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 32, padding: '18px 14px', boxShadow: '0 40px 100px rgba(0,0,0,.6),0 0 60px rgba(127,119,221,.12)' }}>
              <div style={{ width: 70, height: 5, background: 'rgba(255,255,255,.1)', borderRadius: 4, margin: '0 auto 18px' }} />
              <div style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', borderRadius: 18, padding: 18, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Mon bénéfice aujourd'hui</div>
                <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, color: '#fff' }}>87 500 <span style={{ fontSize: 18 }}>F</span></div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 6 }}>CA: 310 000 F · 24 commandes livrées</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>24</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Commandes</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1D9E75' }}>18</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Livrées ✅</div>
                </div>
              </div>
              {[['FD', 'Fatou Diallo', 'Plateau', '+8 500 F'], ['MS', 'Moussa Sow', 'Pikine', '+6 200 F']].map(([av, name, zone, price]) => (
                <div key={name} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{av}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{name}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>📍 {zone}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1D9E75' }}>{price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section ref={statsRef} style={{ padding: '70px 5vw', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="stats-grid" style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { val: count1 + '+', label: 'Commerçants actifs', sub: 'et ça augmente chaque jour' },
            { val: count2 + 'M+', label: 'Millions FCFA/jour', sub: 'gérés sur la plateforme' },
            { val: count3 + '%', label: 'Gain de temps moyen', sub: 'versus Excel et cahiers' },
          ].map((s, i) => (
            <div key={i} className="stat-item" style={{ textAlign: 'center', padding: '36px 16px', borderRight: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, color: '#7F77DD', letterSpacing: -2, lineHeight: 1 }}>{s.val}</div>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginTop: 10 }}>{s.label}</div>
              <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEME */}
      <section style={{ padding: '90px 5vw', background: 'rgba(127,119,221,.02)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ color: '#7F77DD', fontSize: 12, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 16 }}>Le vrai problème</div>
          <h2 style={{ fontSize: 'clamp(28px,5vw,56px)', fontWeight: 800, letterSpacing: -2, marginBottom: 52, color: '#fff', lineHeight: 1.05 }}>Combien tu perds<br />à cause du désordre ?</h2>
          <div className="problem-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              { e: '😩', t: 'Notes papier perdues', d: 'Commande griffonnée. Client qui rappelle. Introuvable. Conflit.' },
              { e: '📊', t: 'Excel qui ment', d: 'Formules cassées. Bénéfice faux. Tu crois gagner mais tu perds.' },
              { e: '⏰', t: '2h de saisie le soir', d: 'Recopier les commandes du jour à 22h. À la main. Chaque soir.' },
              { e: '😤', t: 'Stock invisible', d: 'Tu vends un produit épuisé. Client furieux. Remboursement.' },
            ].map(p => (
              <div key={p.t} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, padding: 24, transition: 'all .3s' }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{p.e}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#fff' }}>{p.t}</div>
                <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 13, lineHeight: 1.65 }}>{p.d}</div>
              </div>
            ))}
          </div>
          <div style={{ maxWidth: 560, margin: '44px auto 0', background: 'rgba(127,119,221,.1)', border: '1px solid rgba(127,119,221,.25)', borderRadius: 14, padding: '16px 28px', fontSize: 17, fontWeight: 500, color: 'rgba(255,255,255,.7)' }}>
            <strong style={{ color: '#fff' }}>Dropzi règle tout ça.</strong> En moins de 5 minutes.
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '90px 5vw' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ color: '#7F77DD', fontSize: 12, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 16 }}>Fonctionnalités</div>
            <h2 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: -2, color: '#fff', lineHeight: 1.05 }}>Tout ce qu'il te faut.<br />Rien de superflu.</h2>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {features.map((f, i) => (
              <div key={i} className="fcard" onClick={() => setActiveFeature(i)} style={{
                background: activeFeature === i ? 'rgba(127,119,221,.1)' : 'rgba(255,255,255,.02)',
                border: `1px solid ${activeFeature === i ? 'rgba(127,119,221,.4)' : 'rgba(255,255,255,.07)'}`,
                borderRadius: 20, padding: 26, cursor: 'pointer'
              }}>
                <div style={{ fontSize: 38, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#fff', letterSpacing: -.3 }}>{f.title}</div>
                <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</div>
                {activeFeature === i && <div style={{ marginTop: 12, color: '#7F77DD', fontSize: 12, fontWeight: 600 }}>✓ Inclus dans tous les plans</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RAPPORT */}
      <section id="rapport" style={{ padding: '90px 5vw', background: 'rgba(127,119,221,.02)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div className="rapport-grid" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#25D366', fontSize: 12, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 16 }}>📊 Rapport WhatsApp</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 800, letterSpacing: -2, marginBottom: 18, color: '#fff', lineHeight: 1.05 }}>Ton rapport du jour,<br />en 1 clic.</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 15, lineHeight: 1.8, marginBottom: 28, fontWeight: 400 }}>
              CA, bénéfice net, dépenses pub, détail par livraison. Tu cliques Copier. Tu colles sur WhatsApp. En 10 secondes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Rapport journalier avec historique sauvegardé', 'Bilan hebdomadaire & mensuel automatique', 'Dépenses pub et achat déduites du bénéfice', 'Copier-coller WhatsApp formaté en 1 clic'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,209,122,.15)', border: '1px solid #1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#1D9E75', flexShrink: 0 }}>✓</span>
                  <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 14 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#1A1A3E,#2D2A6E)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, background: '#7F77DD', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>D</div>
                <div><div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Ma Boutique</div><div style={{ color: 'rgba(255,255,255,.3)', fontSize: 11 }}>RAPPORT JOURNALIER</div></div>
              </div>
              <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 12 }}>Vendredi 27 mars</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              {[['CA', '310k', 'FCFA'], ['Livrées', '24', 'cmd'], ['Bénéfice', '87k', 'FCFA net']].map(([l, v, u]) => (
                <div key={l} style={{ padding: '14px 10px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#7F77DD', margin: '3px 0', letterSpacing: -1 }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>{u}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[['Fatou D. · Plateau', '25 000 F', '+8 500 F'], ['Moussa S. · Pikine', '18 000 F', '+6 200 F'], ['📢 Pub Facebook', '', '-15 000 F']].map(([n, c, b]) => (
                <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 11px', background: 'rgba(255,255,255,.03)', borderRadius: 9 }}>
                  <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>{n}</span>
                  <div><span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{c}</span><span style={{ fontSize: 11, marginLeft: 8, color: b.startsWith('+') ? '#1D9E75' : '#F09595', fontWeight: 600 }}>{b}</span></div>
                </div>
              ))}
            </div>
            <div style={{ margin: '0 16px', background: '#0A0A1E', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 4 }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>✅ Bénéfice NET</span>
                <span style={{ color: '#9FE1CB', fontSize: 18, fontWeight: 800 }}>72 500 F</span>
              </div>
            </div>
            <div style={{ margin: '0 16px 16px', background: '#25D366', borderRadius: 11, padding: '12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
              📋 Copier pour WhatsApp
            </div>
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{ padding: '90px 5vw' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 800, letterSpacing: -2, color: '#fff' }}>Ils ont testé. Ils sont restés.</h2>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { n: 'Aminata D.', r: 'Boutique mode, Dakar', t: "Avant je perdais 2h par jour sur Excel. Maintenant mon rapport WhatsApp est prêt en 30 secondes.", a: 'AD', c: 'linear-gradient(135deg,#7F77DD,#C084FC)' },
              { n: 'Moussa K.', r: 'Dropshipper, Abidjan', t: "Je gère 80 commandes par semaine depuis mon téléphone. Dropzi a tout changé.", a: 'MK', c: 'linear-gradient(135deg,#1D9E75,#059669)' },
              { n: 'Fatou S.', r: 'E-commerce, Dakar', t: "Enfin je sais vraiment combien je gagne après les dépenses pub.", a: 'FS', c: 'linear-gradient(135deg,#F59E0B,#DC2626)' },
            ].map(t => (
              <div key={t.n} className="tcard" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 26 }}>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: 44, color: '#7F77DD', lineHeight: .7, marginBottom: 14 }}>"</div>
                <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, lineHeight: 1.75, marginBottom: 20 }}>{t.t}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: t.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff' }}>{t.a}</div>
                  <div><div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{t.n}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>{t.r}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" style={{ padding: '90px 5vw', background: 'rgba(127,119,221,.02)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ color: '#7F77DD', fontSize: 12, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 16 }}>Tarifs</div>
            <h2 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: -2, color: '#fff' }}>Simple. Transparent. Africain.</h2>
          </div>
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { name: 'Basic', price: '3 000', c: 'rgba(255,255,255,.4)', features: ['20 produits max', 'Commandes illimitées', 'Rapport journalier', '1 utilisateur'] },
              { name: 'Business', price: '5 000', c: '#7F77DD', hot: true, features: ['Produits illimités', 'Stock multi-zones', 'Rapport WhatsApp', 'Historique & bilans', 'Dépenses & pub', 'Livreurs par zone'] },
              { name: 'Elite', price: '15 000', c: '#1D9E75', features: ['Tout Business +', 'Multi-utilisateurs', 'Export Excel/PDF', 'Support prioritaire', 'Branding custom'] },
            ].map(p => (
              <div key={p.name} style={{ background: p.hot ? 'rgba(127,119,221,.08)' : 'rgba(255,255,255,.02)', border: `1px solid ${p.hot ? 'rgba(127,119,221,.35)' : 'rgba(255,255,255,.07)'}`, borderRadius: 20, padding: 28, position: 'relative' }}>
                {p.hot && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', fontSize: 11, fontWeight: 700, padding: '3px 16px', borderRadius: 100, color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 0 18px rgba(127,119,221,.4)' }}>⭐ RECOMMANDÉ</div>}
                <div style={{ fontSize: 15, fontWeight: 700, color: p.c, marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>{p.price}<span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,.35)' }}> F/mois</span></div>
                <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: p.hot ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.25)', fontSize: 13 }}>✓</span>
                      <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 14 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" style={{ display: 'block', padding: '13px', borderRadius: 12, textAlign: 'center', background: p.hot ? 'linear-gradient(135deg,#7F77DD,#534AB7)' : 'rgba(255,255,255,.06)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, boxShadow: p.hot ? '0 0 20px rgba(127,119,221,.3)' : 'none' }}>
                  Démarrer →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '110px 5vw', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse,rgba(127,119,221,.1),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
          <h2 className="cta-h2" style={{ fontSize: 'clamp(36px,7vw,72px)', fontWeight: 800, letterSpacing: -3, lineHeight: .95, marginBottom: 22, color: '#fff' }}>
            Ton business mérite<br /><span style={{ background: 'linear-gradient(90deg,#7F77DD,#C084FC,#1D9E75)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>mieux qu'Excel.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 18, marginBottom: 44 }}>7 jours gratuits. Accès complet. Aucune carte bancaire.</p>
          <Link href="/login" className="btn-main" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '20px 48px', borderRadius: 16, fontSize: 18, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 64px rgba(127,119,221,.4)', display: 'inline-block' }}>
            Créer mon compte Dropzi →
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '26px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 13 }}>© 2025 Dropzi · Fait avec ❤️ pour l'Afrique 🌍</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Confidentialité', 'CGU', 'Contact'].map(l => (
            <a key={l} href="#" style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
