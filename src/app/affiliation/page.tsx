'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

export default function AffiliationLandingPage() {
  const supabase = createClient()
  const [step, setStep] = useState<'landing'|'signup'|'success'>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function sInscrire(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) { setError('Le nom est requis'); return }
    setLoading(true); setError('')

    const { data, error: signupError } = await supabase.auth.signUp({ email, password })
    if (signupError) { setError(signupError.message); setLoading(false); return }

    if (data.user) {
      // Sauvegarder le profil
      await supabase.from('profiles').update({ nom_boutique: nom, telephone }).eq('id', data.user.id)

      // Générer un code unique
      const base = nom.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
      const genCode = base + Math.floor(Math.random() * 100)

      // Créer le compte affilié
      const { data: aff } = await supabase.from('affilies').insert({
        user_id: data.user.id,
        code: genCode,
        statut: 'actif',
        solde: 0,
        total_gains: 0,
        total_retire: 0,
        nb_filleuls: 0,
      }).select().single()

      setCode(genCode)
      setStep('success')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 12,
    padding: '13px 16px', fontSize: 15, outline: 'none', fontFamily: 'inherit',
    background: 'rgba(255,255,255,.07)', color: '#fff', boxSizing: 'border-box',
  }

  const PLANS = [
    { plan: 'Starter', prix: 3000, commission: 1500, icon: '🥉' },
    { plan: 'Business', prix: 5000, commission: 2500, icon: '🥈' },
    { plan: 'Elite', prix: 15000, commission: 7500, icon: '🥇' },
  ]

  const ETAPES = [
    { num: '01', titre: 'Crée ton compte', desc: 'Inscris-toi gratuitement en 2 minutes et reçois ton code unique.', icon: '✍️' },
    { num: '02', titre: 'Partage ton lien', desc: 'Envoie ton lien à des commerçants qui vendent en ligne.', icon: '🔗' },
    { num: '03', titre: 'Ils s\'abonnent', desc: 'Tes contacts créent leur compte et choisissent un plan Dropzi.', icon: '📲' },
    { num: '04', titre: 'Tu encaisses', desc: '50% de commission créditée automatiquement sur ton solde.', icon: '💰' },
  ]

  const FAQS = [
    ['Comment sont calculées les commissions ?', 'Tu reçois 50% du montant de chaque abonnement payé par les personnes que tu as invitées. Par exemple : si quelqu\'un prend le plan Business à 5 000 FCFA, tu reçois 2 500 FCFA instantanément.'],
    ['Quand puis-je retirer mon argent ?', 'Tu peux faire une demande de retrait à tout moment via ton tableau de bord. Le paiement est effectué sur ton numéro Wave ou Orange Money sous 24-48h.'],
    ['Y a-t-il une limite de contacts à inviter ?', 'Aucune limite ! Plus tu invites, plus tu gagnes. Le programme est illimité.'],
    ['Est-ce que les commissions continuent chaque mois ?', 'Actuellement les commissions sont versées sur le premier paiement. Les renouvellements mensuels seront inclus prochainement.'],
    ['Comment rejoindre le programme ?', 'Remplis le formulaire sur cette page. Tu reçois ton code et ton lien immédiatement après inscription. C\'est gratuit.'],
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#06060F', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        *{box-sizing:border-box;margin:0;padding:0}
        .btn-primary{transition:all .2s;cursor:pointer;font-family:inherit;}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(127,119,221,.5)!important;}
        .faq-item{transition:all .2s;cursor:pointer;}
        .faq-item:hover{background:rgba(255,255,255,.05)!important;}
        .plan-card{transition:all .2s;}
        .plan-card:hover{transform:translateY(-4px);}
        ::placeholder{color:rgba(255,255,255,.35);}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #1a1a2e inset!important;-webkit-text-fill-color:#fff!important;}
        @media(max-width:640px){
          .hero-title{font-size:36px!important;}
          .plans-grid{grid-template-columns:1fr!important;}
          .steps-grid{grid-template-columns:1fr 1fr!important;}
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(6,6,15,.95)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,.06)' : 'none', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -.5 }}>Dropzi</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(127,119,221,.2)', color: '#AFA9EC', letterSpacing: '.08em' }}>AFFILIATION</span>
        </div>
        <button className="btn-primary" onClick={() => setStep('signup')}
          style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 12, padding: '9px 20px', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(127,119,221,.3)' }}>
          Rejoindre →
        </button>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Fond déco */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle,rgba(127,119,221,.15),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: 200, height: 200, background: 'radial-gradient(circle,rgba(29,158,117,.1),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 180, height: 180, background: 'radial-gradient(circle,rgba(245,158,11,.08),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, animation: 'fadeUp .6s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(29,158,117,.15)', border: '1px solid rgba(29,158,117,.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 28 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, color: '#9FE1CB', fontWeight: 600 }}>Programme d'affiliation ouvert</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: 64, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05, marginBottom: 24 }}>
            Gagne de l'argent en<br />
            <span style={{ background: 'linear-gradient(135deg,#7F77DD,#9FE1CB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              recommandant Dropzi
            </span>
          </h1>

          <p style={{ fontSize: 20, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Invite des commerçants à utiliser Dropzi et reçois <strong style={{ color: '#9FE1CB' }}>50% de commission</strong> sur chaque abonnement payé. Automatiquement.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <button className="btn-primary" onClick={() => setStep('signup')}
              style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 16, padding: '16px 36px', fontSize: 17, fontWeight: 800, boxShadow: '0 4px 24px rgba(127,119,221,.4)' }}>
              🚀 Créer mon compte affilié — Gratuit
            </button>
            <a href="#comment" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', borderRadius: 16, padding: '16px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Comment ça marche ↓
            </a>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['50%','De commission','sur chaque abonnement'],['24-48h','Paiement rapide','Wave · Orange Money'],['∞','Sans limite','d\'invitations']].map(([val, label, sub]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: -1.5 }}>{val}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#AFA9EC', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMBIEN TU PEUX GAGNER */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1.5, textAlign: 'center', marginBottom: 12 }}>Combien tu peux gagner ?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.45)', textAlign: 'center', marginBottom: 48 }}>Plus tu invites, plus tu gagnes. Sans plafond.</p>

          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
            {PLANS.map((p, i) => (
              <div key={p.plan} className="plan-card" style={{ background: i === 1 ? 'linear-gradient(135deg,rgba(127,119,221,.15),rgba(83,74,183,.1))' : 'rgba(255,255,255,.04)', border: `1px solid ${i === 1 ? 'rgba(127,119,221,.4)' : 'rgba(255,255,255,.08)'}`, borderRadius: 20, padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
                {i === 1 && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Le plus populaire</div>}
                <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>Plan {p.plan}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 20 }}>{fmt(p.prix)} FCFA/mois</p>
                <div style={{ background: 'rgba(29,158,117,.15)', border: '1px solid rgba(29,158,117,.25)', borderRadius: 14, padding: '14px' }}>
                  <p style={{ fontSize: 11, color: '#9FE1CB', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Ta commission</p>
                  <p style={{ fontSize: 32, fontWeight: 900, color: '#9FE1CB', letterSpacing: -1 }}>{fmt(p.commission)} F</p>
                </div>
              </div>
            ))}
          </div>

          {/* Calculateur visuel */}
          <div style={{ background: 'rgba(127,119,221,.08)', border: '1px solid rgba(127,119,221,.2)', borderRadius: 20, padding: '24px 28px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#AFA9EC', marginBottom: 16, textAlign: 'center' }}>💡 Exemple de revenus mensuels</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['5 contacts — plan Business', '5 × 2 500 F', '12 500 F/mois'],
                ['10 contacts — plan Business', '10 × 2 500 F', '25 000 F/mois'],
                ['20 contacts — plans mixtes', 'moyenne 3 000 F', '60 000 F/mois'],
                ['50 contacts — plans mixtes', 'moyenne 3 000 F', '150 000 F/mois'],
              ].map(([label, calc, gain]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,.04)', borderRadius: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>{calc}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#9FE1CB', minWidth: 130, textAlign: 'right' }}>→ {gain}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1.5, textAlign: 'center', marginBottom: 12 }}>Comment ça marche ?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.45)', textAlign: 'center', marginBottom: 56 }}>4 étapes simples pour commencer à gagner</p>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {ETAPES.map((e, i) => (
              <div key={e.num} style={{ textAlign: 'center', position: 'relative' }}>
                {i < ETAPES.length - 1 && (
                  <div style={{ position: 'absolute', top: 28, left: '60%', right: '-40%', height: 1, background: 'rgba(127,119,221,.3)', zIndex: 0 }} />
                )}
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(127,119,221,.2),rgba(83,74,183,.1))', border: '1px solid rgba(127,119,221,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, position: 'relative', zIndex: 1 }}>
                  {e.icon}
                </div>
                <p style={{ fontSize: 10, color: '#7F77DD', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Étape {e.num}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{e.titre}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1.5, textAlign: 'center', marginBottom: 48 }}>Questions fréquentes</h2>
          {FAQS.map(([q, a], i) => (
            <FaqItem key={i} question={q} reponse={a} />
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 56, marginBottom: 24, animation: 'float 3s ease-in-out infinite' }}>💰</div>
          <h2 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -2, marginBottom: 16 }}>Prêt à gagner<br />avec Dropzi ?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.45)', marginBottom: 36 }}>Rejoins le programme gratuitement et commence à partager ton lien dès aujourd'hui.</p>
          <button className="btn-primary" onClick={() => setStep('signup')}
            style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 18, padding: '18px 48px', fontSize: 18, fontWeight: 800, boxShadow: '0 8px 32px rgba(127,119,221,.4)' }}>
            🚀 Créer mon compte — Gratuit
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>© 2025 Dropzi — Programme d'affiliation</span>
      </footer>

      {/* MODAL INSCRIPTION */}
      {step === 'signup' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', border: '1px solid rgba(127,119,221,.3)', borderRadius: 24, padding: '32px 28px', maxWidth: 420, width: '100%', animation: 'fadeUp .3s ease', position: 'relative' }}>
            <button onClick={() => setStep('landing')}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.08)', border: 'none', color: 'rgba(255,255,255,.5)', borderRadius: '50%', width: 32, height: 32, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.5, marginBottom: 6 }}>Crée ton compte affilié</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)' }}>Gratuit · Reçois ton code instantanément</p>
            </div>

            <form onSubmit={sInscrire} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Nom complet *</label>
                <input required value={nom} onChange={e => setNom(e.target.value)} placeholder="Alpha Diagne" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Téléphone</label>
                <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="77 000 00 00" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Email *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@example.com" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Mot de passe *</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="8 caractères minimum" style={inp} />
              </div>

              {error && (
                <div style={{ background: 'rgba(226,75,74,.15)', border: '1px solid rgba(226,75,74,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#F09595' }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ background: loading ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '15px', fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(127,119,221,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.5)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />Création...</> : '🚀 Créer mon compte affilié'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,.25)' }}>
              En t'inscrivant tu acceptes les conditions d'utilisation de Dropzi
            </p>
          </div>
        </div>
      )}

      {/* SUCCÈS */}
      {step === 'success' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#1a1a3e)', border: '1px solid rgba(29,158,117,.4)', borderRadius: 24, padding: '40px 32px', maxWidth: 440, width: '100%', textAlign: 'center', animation: 'fadeUp .3s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -.8, marginBottom: 8 }}>Bienvenue dans le programme !</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', marginBottom: 28 }}>Ton compte affilié est créé. Voici ton code et ton lien :</p>

            <div style={{ background: 'rgba(127,119,221,.1)', border: '1px solid rgba(127,119,221,.3)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Ton code de parrainage</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: '#AFA9EC', letterSpacing: 4, marginBottom: 16 }}>{code}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Ton lien de parrainage</p>
              <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 11, color: '#AFA9EC', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  dropzi.netlify.app/login?ref={code}
                </p>
                <button onClick={() => { navigator.clipboard.writeText(`https://dropzi.netlify.app/login?ref=${code}`); alert('Lien copié !') }}
                  style={{ background: '#7F77DD', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  Copier
                </button>
              </div>
            </div>

            <a href={`https://wa.me/?text=Rejoins%20Dropzi%20avec%20mon%20code%20${code}%20!%20https://dropzi.netlify.app/login?ref=${code}`}
              target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 700, textDecoration: 'none', marginBottom: 12 }}>
              💬 Partager sur WhatsApp maintenant
            </a>

            <a href="/dashboard/affiliation"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              📊 Voir mon tableau de bord →
            </a>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', marginTop: 16 }}>Vérifie ton email pour confirmer ton compte</p>
          </div>
        </div>
      )}
    </div>
  )
}

function FaqItem({ question, reponse }: { question: string, reponse: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item" onClick={() => setOpen(v => !v)}
      style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '18px 20px', marginBottom: 10, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{question}</p>
        <span style={{ fontSize: 20, color: '#7F77DD', flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </div>
      {open && <p style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)' }}>{reponse}</p>}
    </div>
  )
}
