'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

const PAIN_POINTS = [
  'Tu passes des heures à recopier les commandes WhatsApp dans un tableau Excel.',
  'Tu ne sais jamais exactement combien tu as gagné ce mois-ci.',
  'Tes livreurs ne savent pas toujours où livrer ni quand.',
  'Tu crées tes factures à la main sur WhatsApp — sans professionnel.',
  'Quand ton stock tombe à zéro, tu t\'en rends compte trop tard.',
]

const FEATURES = [
  {
    icon: '🔄',
    tag: 'SYNCHRONISATION',
    titre: 'Connexion Shopify & Easy Sell en 1 minute',
    desc: 'Colle juste le lien de ton Google Sheet. Dropzi détecte chaque nouvelle commande en moins de 10 secondes et la crée automatiquement dans ton dashboard. Zéro saisie manuelle. Zéro erreur.',
    points: ['Détection automatique en 10 secondes', 'Compatible Easy Sell, Shopify, WooCommerce', 'Import de toutes les colonnes : client, produit, adresse, prix', 'Notification immédiate dans l\'app'],
    color: '#7F77DD',
    bg: '#EEEDFE',
  },
  {
    icon: '💰',
    tag: 'FINANCES',
    titre: 'Vois ton bénéfice exact en temps réel',
    desc: 'Plus besoin de calculer à la main. Dropzi calcule automatiquement ton bénéfice après déduction du coût d\'achat, des frais de livraison et de toutes tes dépenses. À chaque commande livrée.',
    points: ['Bénéfice brut et net calculés automatiquement', 'Comparaison avec hier, la semaine, le mois', 'Suivi du CA, panier moyen, taux de livraison', 'Rapports hebdomadaires et mensuels automatiques'],
    color: '#1D9E75',
    bg: '#E1F5EE',
  },
  {
    icon: '📦',
    tag: 'STOCK',
    titre: 'Suivi de stock automatique à chaque livraison',
    desc: 'Ton stock se met à jour tout seul dès qu\'une commande est marquée livrée. Tu reçois une alerte quand un produit est sur le point de s\'épuiser. Plus jamais de commande impossible à honorer.',
    points: ['Déduction automatique du stock à la livraison', 'Alerte stock faible personnalisable', 'Historique des mouvements de stock', 'Gestion multi-produits et multi-variantes'],
    color: '#BA7517',
    bg: '#FAEEDA',
  },
  {
    icon: '🔔',
    tag: 'NOTIFICATIONS',
    titre: 'Notifications en temps réel partout',
    desc: 'Reçois une notification dans l\'app dès qu\'une nouvelle commande arrive, dès qu\'un livreur marque une livraison, ou dès qu\'un stock est critique. Tu es toujours informé — même le téléphone dans la poche.',
    points: ['Notifications in-app en temps réel', 'Alertes commandes Easy Sell importées', 'Alertes stock critique', 'Historique complet des notifications'],
    color: '#E24B4A',
    bg: '#FCEBEB',
  },
  {
    icon: '🧾',
    tag: 'FACTURES',
    titre: '5 modèles de factures professionnels',
    desc: 'Génère une facture en 1 clic depuis n\'importe quelle commande. Choisis parmi 5 modèles premium — Sombre, Corporate, Minimaliste, Africain, Luxe. Partage en PDF ou directement sur WhatsApp.',
    points: ['5 modèles premium personnalisables', 'Génération en 1 clic depuis la commande', 'Export PDF haute qualité', 'Partage WhatsApp en un tap'],
    color: '#534AB7',
    bg: '#EEEDFE',
  },
  {
    icon: '🚚',
    tag: 'LIVRAISONS',
    titre: 'Gestion des livreurs et zones simplifiée',
    desc: 'Crée tes zones de livraison avec leurs coûts. Assigne un livreur à chaque commande. Le livreur reçoit les détails sur WhatsApp automatiquement. Suivi du statut en temps réel.',
    points: ['Zones de livraison avec coûts personnalisés', 'Assignation livreur en 1 clic', 'Notification WhatsApp automatique au livreur', 'Suivi statut : En attente → En livraison → Livré'],
    color: '#378ADD',
    bg: '#E6F1FB',
  },
]

const TEMOIGNAGES = [
  { nom: 'Fatou D.', boutique: 'FashionDakar', texte: 'Avant Dropzi je passais 2h par jour à recopier les commandes WhatsApp. Maintenant ça se fait tout seul en 10 secondes. J\'ai gagné du temps et de l\'argent.', note: 5 },
  { nom: 'Moussa S.', boutique: 'ElectroPro SN', texte: 'Le suivi du bénéfice en temps réel a changé ma façon de gérer mon business. Je sais exactement où j\'en suis à chaque instant.', note: 5 },
  { nom: 'Aïcha B.', boutique: 'CosmétiqueAfrik', texte: 'Les factures professionnelles ont changé l\'image de ma boutique. Mes clients me font plus confiance maintenant.', note: 5 },
]

const STEPS = [
  { num: '01', titre: 'Crée ton compte', desc: 'Inscription en 30 secondes. Aucune carte bancaire requise. 7 jours gratuits complets.' },
  { num: '02', titre: 'Connecte ta boutique', desc: 'Colle le lien de ton Google Sheet Easy Sell ou Shopify. Dropzi se connecte en 1 minute.' },
  { num: '03', titre: 'Gère en automatique', desc: 'Les commandes arrivent toutes seules. Tu gères, livres, factures — Dropzi calcule tout.' },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activePain, setActivePain] = useState(0)
  const [activeFeat, setActiveFeat] = useState(0)
  const [counter1, setCounter1] = useState(0)
  const [counter2, setCounter2] = useState(0)
  const [counter3, setCounter3] = useState(0)
  const statsRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActivePain(p => (p + 1) % PAIN_POINTS.length), 2800)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true
        let i = 0
        const t = setInterval(() => {
          i++
          setCounter1(Math.min(Math.round(i * 38 / 60), 38))
          setCounter2(Math.min(Math.round(i * 10 / 60), 10))
          setCounter3(Math.min(Math.round(i * 97 / 60), 97))
          if (i >= 60) clearInterval(t)
        }, 25)
      }
    }, { threshold: .3 })
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: '#06060F', color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes glow{0%,100%{box-shadow:0 0 40px rgba(127,119,221,.3)}50%{box-shadow:0 0 80px rgba(127,119,221,.6)}}
        @keyframes shine{from{left:-100%}to{left:200%}}
        .fade-up{animation:fadeUp .6s ease forwards;}
        .float{animation:float 5s ease-in-out infinite;}
        .glow{animation:glow 3s ease-in-out infinite;}
        a,button{cursor:pointer;}
        .nav-link{color:rgba(255,255,255,.5);font-size:14px;text-decoration:none;transition:color .2s;}
        .nav-link:hover{color:#fff;}
        .feat-tab{transition:all .2s;border:none;cursor:pointer;font-family:inherit;}
        .plan-card{transition:transform .2s,box-shadow .2s;}
        .plan-card:hover{transform:translateY(-4px);}
        .cta-main{position:relative;overflow:hidden;}
        .cta-main::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:shine 2.5s ease-in-out infinite;}
        @media(max-width:768px){
          .hero-grid,.feat-grid,.steps-grid,.plans-grid{grid-template-columns:1fr!important;}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
          .hero-title{font-size:clamp(36px,10vw,56px)!important;}
          .nav-links{display:none!important;}
          .pain-box{font-size:15px!important;}
          .testi-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 5vw', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(6,6,15,.95)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,.07)' : 'none', transition: 'all .3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(127,119,221,.5)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.8"/></svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -.5 }}>Dropzi</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a href="#features" className="nav-link">Fonctionnalités</a>
          <a href="#how" className="nav-link">Comment ça marche</a>
          <a href="#pricing" className="nav-link">Tarifs</a>
          <Link href="/tutoriels" className="nav-link">Tutoriels</Link>
        </div>
        <Link href="/login" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '9px 22px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(127,119,221,.4)' }}>
          S'abonner →
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 5vw 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '15%', left: '-8%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(127,119,221,.18),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(29,158,117,.12),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 60, alignItems: 'center' }}>
          <div className="fade-up">
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(127,119,221,.1)', border: '1px solid rgba(127,119,221,.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', display: 'inline-block', animation: 'pulse 2s infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', fontWeight: 600 }}>🌍 L'outil logistique e-commerce N°1 en Afrique</span>
            </div>

            <h1 className="hero-title" style={{ fontSize: 'clamp(40px,5vw,72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: -3, marginBottom: 20 }}>
              La logistique<br />
              e-commerce en Afrique<br />
              <span style={{ background: 'linear-gradient(90deg,#7F77DD,#AFA9EC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>enfin maîtrisée.</span>
            </h1>

            <p style={{ fontSize: 18, color: 'rgba(255,255,255,.55)', lineHeight: 1.8, maxWidth: 480, marginBottom: 14 }}>
              Dropzi centralise toute ta chaîne logistique — commandes, stock, livraisons, finances, factures — en un seul tableau de bord conçu pour le commerce africain.
            </p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.3)', marginBottom: 36 }}>
              Du vendeur solo au revendeur multi-boutiques. Simple. Puissant. Africain.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link href="/dashboard/abonnement" className="cta-main glow" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '17px 38px', borderRadius: 18, fontSize: 17, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(127,119,221,.4)' }}>
                S'abonner maintenant <span style={{ fontSize: 22 }}>→</span>
              </Link>
              <Link href="/tutoriels" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)', padding: '17px 28px', borderRadius: 18, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                ▶ Voir la démo
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {['✓ 7 jours gratuits', '✓ Sans carte bancaire', '✓ Annulation immédiate'].map(t => (
                <span key={t} style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginRight: 8 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="float" style={{ position: 'relative' }}>
            <div style={{ background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 26, padding: 22, boxShadow: '0 40px 100px rgba(0,0,0,.7)' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {['#E24B4A','#BA7517','#1D9E75'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', marginLeft: 8 }}>dropzi.netlify.app/dashboard</span>
              </div>
              <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', borderRadius: 18, padding: 18, marginBottom: 12 }}>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>Bénéfice aujourd'hui</p>
                <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: -2, color: '#fff', lineHeight: 1 }}>127 500 <span style={{ fontSize: 16, opacity: .5 }}>F</span></p>
                <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,.3)', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.07)' }}>
                  <span>CA : 420 000 F</span><span>·</span><span>38 commandes</span>
                  <span style={{ marginLeft: 'auto', background: 'rgba(29,158,117,.2)', color: '#9FE1CB', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>+18%</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 12 }}>
                {[['24','Livrées','#1D9E75'],['8','En cours','#378ADD'],['2','Annulées','#E24B4A'],['14k','Panier','#7F77DD']].map(([v,l,c]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: c, letterSpacing: -.5 }}>{v}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,.25)', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              {/* Notification live */}
              <div style={{ background: 'rgba(29,158,117,.12)', border: '1px solid rgba(29,158,117,.25)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9FE1CB' }}>3 nouvelles commandes Easy Sell</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>Synchronisées automatiquement · il y a 8 secondes</p>
                </div>
              </div>
            </div>

            {/* Badge flottant */}
            <div style={{ position: 'absolute', top: -16, right: -16, background: '#1D9E75', color: '#fff', borderRadius: 14, padding: '8px 14px', fontSize: 12, fontWeight: 800, boxShadow: '0 8px 24px rgba(29,158,117,.4)', whiteSpace: 'nowrap' }}>
              ⚡ Sync en 10 secondes
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section style={{ background: '#0A0A18', padding: '70px 5vw' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#E24B4A', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 20 }}>La réalité du commerce en Afrique</p>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 800, letterSpacing: -1.5, marginBottom: 40, lineHeight: 1.2 }}>
            Tu vends. Mais ta logistique<br />
            <span style={{ color: 'rgba(255,255,255,.4)' }}>te coûte du temps et de l'argent.</span>
          </h2>
          <div className="pain-box" style={{ background: 'rgba(226,75,74,.08)', border: '1px solid rgba(226,75,74,.2)', borderRadius: 20, padding: '28px 32px', fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,.8)', lineHeight: 1.6, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s' }}>
            <span style={{ fontSize: 22, marginRight: 12 }}>😩</span> {PAIN_POINTS[activePain]}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            {PAIN_POINTS.map((_, i) => (
              <button key={i} onClick={() => setActivePain(i)} style={{ width: i === activePain ? 24 : 8, height: 8, borderRadius: 4, background: i === activePain ? '#E24B4A' : 'rgba(255,255,255,.15)', border: 'none', transition: 'all .3s' }} />
            ))}
          </div>
          <div style={{ marginTop: 40, background: 'linear-gradient(135deg,rgba(127,119,221,.1),rgba(29,158,117,.08))', border: '1px solid rgba(127,119,221,.2)', borderRadius: 20, padding: '24px 32px' }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Dropzi prend en charge toute ta logistique.</p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.45)' }}>Un seul outil. Toute la chaîne. Du stock à la facture.</p>
          </div>
        </div>
      </section>

      {/* Courbe */}
      <div style={{ background: '#0A0A18', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: 60, display: 'block' }}>
          <path d="M0,0 C480,60 960,0 1440,40 L1440,60 L0,60 Z" fill="#06060F" />
        </svg>
      </div>

      {/* ── STATS ── */}
      <div ref={statsRef} style={{ background: '#06060F', padding: '60px 5vw' }}>
        <div className="stats-grid" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { val: counter1 + '+', lbl: 'boutiques actives', sub: 'font confiance à Dropzi', color: '#7F77DD' },
            { val: counter2 + 's', lbl: 'synchronisation', sub: 'Google Sheet → Dropzi', color: '#1D9E75' },
            { val: counter3 + '%', lbl: 'satisfaction', sub: 'utilisateurs satisfaits', color: '#BA7517' },
          ].map(s => (
            <div key={s.lbl} style={{ textAlign: 'center', background: 'rgba(255,255,255,.03)', borderRadius: 20, padding: '32px 16px', border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: s.color, letterSpacing: -2.5, lineHeight: 1, marginBottom: 10 }}>{s.val}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{s.lbl}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Courbe */}
      <div style={{ background: '#06060F', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: 60, display: 'block' }}>
          <path d="M0,40 C360,0 1080,60 1440,20 L1440,60 L0,60 Z" fill="#0D0D22" />
        </svg>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: '#0D0D22', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Ce que fait Dropzi</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16 }}>Une logistique complète. Tout automatisé.</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>Dropzi couvre toute ta chaîne logistique — du premier clic client à la livraison et la facturation.</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
            {FEATURES.map((f, i) => (
              <button key={i} className="feat-tab" onClick={() => setActiveFeat(i)} style={{ padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 700, background: activeFeat === i ? f.color : 'rgba(255,255,255,.05)', color: activeFeat === i ? '#fff' : 'rgba(255,255,255,.45)', border: `1px solid ${activeFeat === i ? f.color : 'rgba(255,255,255,.1)'}` }}>
                {f.icon} {f.tag}
              </button>
            ))}
          </div>

          {/* Feature active */}
          {FEATURES.map((f, i) => i === activeFeat && (
            <div key={i} className="feat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: f.bg + '22', border: `1px solid ${f.color}44`, borderRadius: 10, padding: '5px 14px', marginBottom: 20 }}>
                  <span style={{ fontSize: 16 }}>{f.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '.1em' }}>{f.tag}</span>
                </div>
                <h3 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: -1.5, marginBottom: 18, lineHeight: 1.2 }}>{f.titre}</h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', lineHeight: 1.8, marginBottom: 28 }}>{f.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {f.points.map((p, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: f.bg + '33', border: `1.5px solid ${f.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: f.color, flexShrink: 0, fontWeight: 800 }}>✓</div>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: f.bg + '08', border: `1px solid ${f.color}22`, borderRadius: 24, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 80, marginBottom: 20 }}>{f.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: f.color, marginBottom: 8 }}>{f.titre}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', lineHeight: 1.6 }}>{f.desc.split('.')[0]}.</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Courbe */}
      <div style={{ background: '#0D0D22', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: 60, display: 'block' }}>
          <path d="M0,20 C720,60 720,0 1440,40 L1440,60 L0,60 Z" fill="#080814" />
        </svg>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ background: '#080814', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Simple comme bonjour</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -2, lineHeight: 1.1 }}>Toute ta logistique opérationnelle en 3 étapes</h2>
          </div>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', top: 24, left: '60%', width: '80%', height: 1, background: 'rgba(255,255,255,.08)', zIndex: 0 }} />
                )}
                <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 20px', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 18 }}>{s.num}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, letterSpacing: -.5 }}>{s.titre}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link href="/tutoriels" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', padding: '14px 32px', borderRadius: 14, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              ▶ Voir les tutoriels vidéo
            </Link>
          </div>
        </div>
      </section>

      {/* Courbe */}
      <div style={{ background: '#080814', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: 60, display: 'block' }}>
          <path d="M0,0 C360,60 1080,0 1440,50 L1440,60 L0,60 Z" fill="#0C0C20" />
        </svg>
      </div>

      {/* ── TÉMOIGNAGES ── */}
      <section style={{ background: '#0C0C20', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Ils nous font confiance</p>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,44px)', fontWeight: 800, letterSpacing: -1.5 }}>Ce que disent nos utilisateurs</h2>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {TEMOIGNAGES.map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '24px 20px' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                  {Array.from({ length: t.note }).map((_, j) => <span key={j} style={{ color: '#BA7517', fontSize: 16 }}>★</span>)}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>"{t.texte}"</p>
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

      {/* Courbe */}
      <div style={{ background: '#0C0C20', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: 60, display: 'block' }}>
          <path d="M0,40 C480,0 960,60 1440,10 L1440,60 L0,60 Z" fill="#08080F" />
        </svg>
      </div>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: '#08080F', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Tarifs</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -2, marginBottom: 14 }}>Transparent. Abordable. Sans surprise.</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 15 }}>Paiement sécurisé · Wave · Orange Money · Carte bancaire</p>
          </div>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { nom: 'Basic', prix: '3 000', couleur: '#888', features: ['50 commandes/mois', '5 produits', '1 livreur', 'Rapports basiques', 'Support email'] },
              { nom: 'Business', prix: '5 000', couleur: '#7F77DD', star: true, features: ['Commandes illimitées', 'Produits illimités', 'Sync Google Sheet auto', 'Factures premium (5 modèles)', 'Notifications temps réel', 'Suivi stock automatique', 'WhatsApp intégré', 'Rapports avancés'] },
              { nom: 'Elite', prix: '15 000', couleur: '#1D9E75', features: ['Tout Business +', 'Multi-boutiques', 'Analytics avancés', 'Export données', 'Support prioritaire 24/7', 'Formation personnalisée 1-1'] },
            ].map(p => (
              <div key={p.nom} className="plan-card" style={{ background: (p as any).star ? 'rgba(127,119,221,.06)' : 'rgba(255,255,255,.03)', border: `2px solid ${(p as any).star ? '#7F77DD' : 'rgba(255,255,255,.07)'}`, borderRadius: 24, padding: '28px 22px', position: 'relative' }}>
                {(p as any).star && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#7F77DD', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>⭐ Le plus populaire</div>}
                <div style={{ fontSize: 12, fontWeight: 700, color: p.couleur, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>{p.nom}</div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: -2 }}>{p.prix}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', marginLeft: 4 }}>FCFA/mois</span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', marginBottom: 22 }}>Accès immédiat après paiement</p>
                <div style={{ height: 1, background: 'rgba(255,255,255,.07)', marginBottom: 22 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: p.couleur, flexShrink: 0, fontWeight: 800, fontSize: 14 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/abonnement" style={{ display: 'block', textAlign: 'center', background: (p as any).star ? 'linear-gradient(135deg,#7F77DD,#534AB7)' : 'rgba(255,255,255,.06)', color: '#fff', padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', border: (p as any).star ? 'none' : '1px solid rgba(255,255,255,.1)' }}>
                  S'abonner maintenant
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courbe */}
      <div style={{ background: '#08080F', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: 60, display: 'block' }}>
          <path d="M0,30 C720,60 720,0 1440,30 L1440,60 L0,60 Z" fill="#06060F" />
        </svg>
      </div>

      {/* ── CTA FINAL ── */}
      <section style={{ background: '#06060F', padding: '80px 5vw 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 60px rgba(127,119,221,.4)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.8"/></svg>
          </div>
          <h2 style={{ fontSize: 'clamp(30px,5vw,56px)', fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.1, marginBottom: 18 }}>
            Prends le contrôle<br />de ta logistique.
          </h2>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 17, marginBottom: 12, lineHeight: 1.7 }}>
            Dropzi gère tout ce que tu faisais à la main — commandes, stock, livreurs, bénéfices, factures. Tu te concentres sur vendre. Dropzi gère le reste.
          </p>
          <p style={{ color: '#1D9E75', fontWeight: 700, fontSize: 15, marginBottom: 40 }}>
            ⚡ Connexion Google Sheet en 1 minute · Bénéfice visible immédiatement
          </p>
          <Link href="/dashboard/abonnement" className="cta-main glow" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '20px 52px', borderRadius: 20, fontSize: 19, fontWeight: 800, textDecoration: 'none', boxShadow: '0 0 60px rgba(127,119,221,.4)' }}>
            Créer mon compte gratuit <span style={{ fontSize: 24 }}>→</span>
          </Link>
          <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, marginTop: 20 }}>Paiement sécurisé via PayDunya · Wave · Orange Money</p>
        </div>
      </section>

      {/* ── FORMULAIRE CONTACT ── */}
      <section style={{ background: '#06060F', padding: '0 5vw 80px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 28, padding: '40px 36px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 10 }}>Démarrer maintenant</p>
            <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, letterSpacing: -1.5, marginBottom: 12 }}>Rejoins Dropzi aujourd'hui</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 15 }}>Crée ton compte et configure ta boutique en moins de 3 minutes.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '16px', borderRadius: 16, fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 24px rgba(127,119,221,.4)', marginTop: 4 }}>
              Créer mon compte <span style={{ fontSize: 20 }}>→</span>
            </Link>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.2)' }}>
              Paiement sécurisé · Wave · Orange Money · Carte bancaire
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '32px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, background: '#06060F' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 14 }}>© 2025 Dropzi</span>
            <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, marginLeft: 12 }}>Fait avec ❤️ pour l'Afrique 🌍</span>
          </div>
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
