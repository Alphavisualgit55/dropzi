'use client'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F8F8FC', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ background: '#0C0C1E', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#7F77DD', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 5L12 3L21 5L19 15L12 20L5 15L3 5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontSize: 22, fontFamily: 'Georgia, serif', letterSpacing: -0.5 }}>Dropzi</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" style={{ color: '#9F9BDD', fontSize: 14, textDecoration: 'none' }}>Connexion</Link>
          <Link href="/login" style={{ background: '#7F77DD', color: '#fff', padding: '8px 18px', borderRadius: 10, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Commencer gratuitement</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: '#0C0C1E', padding: '80px 24px 100px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(127,119,221,0.15)', border: '1px solid rgba(127,119,221,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#AFA9EC', marginBottom: 24 }}>
          🚀 Le SaaS e-commerce #1 en Afrique
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 700, color: '#fff', letterSpacing: -1, lineHeight: 1.1, marginBottom: 20, fontFamily: 'Georgia, serif' }}>
          Gérez. Livrez.<br/><span style={{ color: '#7F77DD' }}>Encaissez.</span>
        </h1>
        <p style={{ fontSize: 18, color: '#888', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Dropzi remplace Excel, WhatsApp et les notes papier. Commandes, stock, livraisons, bénéfices — tout en un, depuis votre téléphone.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{ background: '#7F77DD', color: '#fff', padding: '16px 32px', borderRadius: 14, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
            Essayer gratuitement 7 jours →
          </Link>
          <span style={{ color: '#555', fontSize: 13, alignSelf: 'center' }}>Aucune carte requise</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
          {[['500+', 'Commerçants actifs'], ['2M+', 'FCFA gérés/jour'], ['< 10s', 'Par commande']].map(([val, lbl]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#7F77DD', fontFamily: 'Georgia, serif' }}>{val}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 12, fontFamily: 'Georgia, serif' }}>Tout ce dont tu as besoin</h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: 48 }}>Conçu pour les e-commerçants africains. Aucune formation nécessaire.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { icon: '⚡', title: 'Commande en 10 secondes', desc: 'Crée une commande avec juste un numéro de téléphone et un produit. Ultra rapide.' },
            { icon: '💰', title: 'Bénéfice en temps réel', desc: 'Vois ton bénéfice net du jour instantanément. Seulement sur les commandes livrées.' },
            { icon: '📦', title: 'Stock automatique', desc: 'Quand une commande est livrée, le stock se met à jour tout seul. Zéro effort.' },
            { icon: '🗺️', title: 'Zones et livreurs', desc: 'Crée tes zones avec leur coût. Assigne un livreur par zone. Simple.' },
            { icon: '📊', title: 'Rapport WhatsApp', desc: 'Génère ton rapport journalier en 1 clic et copie-colle directement sur WhatsApp.' },
            { icon: '💸', title: 'Dépenses pub & achats', desc: 'Ajoute tes dépenses pub, achats etc. Le bénéfice réel est calculé automatiquement.' },
          ].map(f => (
            <div key={f.title} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '0.5px solid #e8e8f0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '80px 24px', background: '#0C0C1E' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 48, fontFamily: 'Georgia, serif' }}>Tarifs simples</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 800, margin: '0 auto' }}>
          {[
            { name: 'Basic', price: '3 000', color: '#444', features: ['20 produits', 'Commandes illimitées', 'Rapport journalier', '1 utilisateur'] },
            { name: 'Business', price: '5 000', color: '#7F77DD', hot: true, features: ['Produits illimités', 'Stock multi-zones', 'Rapport WhatsApp', 'Dépenses & pub', 'Livreurs illimités'] },
            { name: 'Elite', price: '15 000', color: '#1D9E75', features: ['Tout Business +', 'Multi-utilisateurs', 'Support prioritaire', 'Export Excel/PDF', 'Branding custom'] },
          ].map(p => (
            <div key={p.name} style={{ background: p.hot ? '#7F77DD' : 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 28, border: p.hot ? 'none' : '0.5px solid rgba(255,255,255,0.1)', position: 'relative' }}>
              {p.hot && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#FAC775', color: '#633806', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>RECOMMANDÉ</div>}
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>{p.price}<span style={{ fontSize: 14, fontWeight: 400 }}> FCFA/mois</span></div>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                    <span style={{ color: p.hot ? '#fff' : '#7F77DD' }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: 16 }}>Prêt à booster ton business ?</h2>
        <p style={{ color: '#888', marginBottom: 32 }}>7 jours gratuits. Accès complet. Aucune carte bancaire.</p>
        <Link href="/login" style={{ background: '#7F77DD', color: '#fff', padding: '18px 40px', borderRadius: 16, fontSize: 18, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
          Créer mon compte Dropzi →
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0C0C1E', padding: '24px', textAlign: 'center', color: '#444', fontSize: 13 }}>
        © 2025 Dropzi · Fait avec ❤️ pour l'Afrique
      </footer>
    </div>
  )
}
