import Link from 'next/link'

const VIDEO_1 = 'https://drive.google.com/file/d/11mtrpIoHoeKDQU2wQ4FZ1_R-1KSbf60X/preview'
const VIDEO_2 = 'https://drive.google.com/file/d/1GB9DGAubo0dQbybwL-q8gdzNPjVRqYUR/preview'

const tutoriels = [
  {
    id: 1,
    embed: VIDEO_1,
    badge: '🚀 Démarrage',
    titre: 'Configuration complète de Dropzi',
    description: 'Apprends à configurer ton compte Dropzi de A à Z : créer tes zones de livraison, ajouter tes produits, paramétrer tes livreurs et créer ta première commande en moins de 10 minutes.',
    duree: '~10 min',
    niveau: 'Débutant',
    points: [
      'Créer et configurer ton compte',
      'Ajouter tes zones et coûts de livraison',
      'Importer tes produits avec prix et stock',
      'Créer ta première commande en 10 secondes',
      'Lire ton bénéfice en temps réel',
    ]
  },
  {
    id: 2,
    embed: VIDEO_2,
    badge: '⚡ Avancé',
    titre: 'Synchronisation automatique Google Sheet',
    description: 'Découvre la fonctionnalité ultime de Dropzi : connecte ton Google Sheet Easy Sell / Shopify et tes commandes s\'importent automatiquement toutes les minutes. Zéro saisie manuelle.',
    duree: '~8 min',
    niveau: 'Intermédiaire',
    points: [
      'Publier ton Google Sheet en CSV',
      'Connecter Easy Sell / Shopify à Dropzi',
      'Activer la sync automatique (1 min)',
      'Recevoir les notifications en temps réel',
      'Importer manuellement si besoin',
    ]
  }
]

export default function TutorielsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#06060F', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color: '#fff' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,6,15,.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0 5vw', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(127,119,221,.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <span style={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Dropzi</span>
        </Link>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link href="/landing" style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, textDecoration: 'none' }}>Accueil</Link>
          <Link href="/login" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Démarrer gratuitement →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '72px 5vw 48px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse,rgba(127,119,221,.12),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(127,119,221,.1)', border: '1px solid rgba(127,119,221,.25)', borderRadius: 100, padding: '5px 16px', marginBottom: 24 }}>
          <span style={{ fontSize: 12 }}>🎓</span>
          <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 500 }}>Tutoriels gratuits — 100% Dropzi</span>
        </div>
        <h1 style={{ fontSize: 'clamp(32px,6vw,64px)', fontWeight: 800, letterSpacing: -2.5, lineHeight: 1, marginBottom: 18 }}>
          Maîtrise Dropzi<br />
          <span style={{ background: 'linear-gradient(90deg,#7F77DD,#AFA9EC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>en quelques minutes</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 17, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          2 vidéos pour tout comprendre — de la configuration initiale à la synchronisation automatique avec Shopify.
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
          {[
            { val: '2', lbl: 'Vidéos complètes' },
            { val: '100%', lbl: 'Gratuit' },
            { val: '-18 min', lbl: 'Pour tout maîtriser' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#7F77DD', letterSpacing: -1 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 3 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VIDEOS */}
      <section style={{ padding: '0 5vw 80px', maxWidth: 1000, margin: '0 auto' }}>
        {tutoriels.map((tuto, idx) => (
          <div key={tuto.id} style={{ marginBottom: idx < tutoriels.length - 1 ? 64 : 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{tuto.id}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, letterSpacing: -.5 }}>{tuto.titre}</h2>
                  <span style={{ background: 'rgba(127,119,221,.15)', color: '#AFA9EC', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{tuto.badge}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>⏱ {tuto.duree}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>📊 {tuto.niveau}</span>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div style={{ display: 'grid', gridTemplateColumns: idx % 2 === 0 ? '1.4fr 1fr' : '1fr 1.4fr', gap: 32, alignItems: 'start' }}>
              {/* Vidéo */}
              <div style={{ order: idx % 2 === 0 ? 0 : 1 }}>
                <div style={{ background: '#0A0A18', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 20px 60px rgba(0,0,0,.5)', position: 'relative', paddingTop: '56.25%' }}>
                  <iframe
                    src={tuto.embed}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="autoplay"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Infos */}
              <div style={{ order: idx % 2 === 0 ? 1 : 0 }}>
                <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>{tuto.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Ce que tu vas apprendre</p>
                  {tuto.points.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(29,158,117,.15)', border: '1px solid #1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#1D9E75', flexShrink: 0, marginTop: 1 }}>✓</div>
                      <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {idx < tutoriels.length - 1 && (
              <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '64px 0 0' }} />
            )}
          </div>
        ))}
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '60px 5vw 80px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <h2 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, letterSpacing: -2, marginBottom: 16 }}>
            Prêt à te lancer ?
          </h2>
        </div>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 16, marginBottom: 36 }}>
          7 jours gratuits · Aucune carte bancaire · Annulation à tout moment
        </p>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', padding: '18px 48px', borderRadius: 16, fontSize: 17, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 48px rgba(127,119,221,.4)' }}>
          Créer mon compte gratuit <span style={{ fontSize: 20 }}>→</span>
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '24px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 13 }}>© 2025 Dropzi · Fait avec ❤️ pour l'Afrique 🌍</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/landing" style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, textDecoration: 'none' }}>Accueil</Link>
          <Link href="/login" style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, textDecoration: 'none' }}>Connexion</Link>
        </div>
      </footer>

      <style>{`
        @media(max-width:768px){
          div[style*="gridTemplateColumns"]{
            display:flex!important;
            flex-direction:column!important;
          }
          div[style*="order: 1"]{order:0!important;}
        }
      `}</style>
    </div>
  )
}
