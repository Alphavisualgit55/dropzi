'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function AffiliationLandingPage() {
  const supabase = createClient()
  const [step, setStep] = useState<'landing' | 'signup' | 'success'>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  async function sInscrire(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) { setError('Le nom complet est requis'); return }
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères minimum)'); return }
    setLoading(true); setError('')

    // 1. Créer le compte Supabase Auth
    const { data, error: signupError } = await supabase.auth.signUp({ email, password })
    if (signupError) {
      setError(signupError.message === 'User already registered' ? 'Cet email est déjà utilisé' : signupError.message)
      setLoading(false); return
    }

    if (data.user) {
      // 2. Mettre à jour le profil
      await supabase.from('profiles').update({ nom_boutique: nom, telephone }).eq('id', data.user.id)

      // 3. Générer un code affilié unique
      const base = nom.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
      const suffix = Math.floor(Math.random() * 90 + 10)
      const genCode = (base || 'DROP') + suffix

      // 4. Créer le compte affilié automatiquement
      await supabase.from('affilies').insert({
        user_id: data.user.id,
        code: genCode,
        statut: 'actif',
        solde: 0,
        total_gains: 0,
        total_retire: 0,
        nb_filleuls: 0,
      })

      setCode(genCode)
      setStep('success')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 12,
    padding: '13px 16px', fontSize: 15, outline: 'none', fontFamily: 'inherit',
    background: 'rgba(255,255,255,.07)', color: '#fff', boxSizing: 'border-box',
    transition: 'border-color .2s',
  }

  const METHODES = [
    {
      icon: '🎵',
      titre: 'TikTok & Instagram Reels',
      badge: 'Le plus viral',
      badgeColor: '#E24B4A',
      desc: 'Filme ton écran Dropzi en action — tes commandes qui arrivent automatiquement, ton dashboard, tes stats. Les e-commerçants adorent voir des outils qui marchent vraiment.',
      tips: ['Film une vidéo "avant/après Dropzi"', 'Montre la sync Shopify en temps réel', 'Partage tes stats de la semaine', 'Tague des boutiques Shopify locales'],
      gain: '1 vidéo virale = 10-50 nouveaux clients potentiels',
    },
    {
      icon: '👥',
      titre: 'Groupes WhatsApp & Facebook',
      badge: 'Le plus rapide',
      badgeColor: '#1D9E75',
      desc: 'Tu connais sûrement des groupes de commerçants, revendeurs, dropshippers. Partage ton expérience Dropzi + ton lien. Un message bien rédigé peut toucher des centaines de personnes.',
      tips: ['Groupes e-commerce Sénégal', 'Groupes dropshipping Afrique', 'Groupes revendeurs par ville', 'Groupes femmes entrepreneures'],
      gain: 'Un groupe actif = 5 à 20 inscriptions en quelques jours',
    },
    {
      icon: '🤝',
      titre: 'Bouche à oreille direct',
      badge: 'Le plus fiable',
      badgeColor: '#7F77DD',
      desc: 'Parle de Dropzi aux commerçants que tu croises — marchés, boutiques, vendeurs en ligne. Montre-leur directement sur ton téléphone comment ça marche. Rien ne vaut une démo en direct.',
      tips: ['Marchands Shopify autour de toi', 'Tes amis qui vendent en ligne', 'Contacts dans les marchés HLM, Sandaga', 'Revendeurs de produits importés'],
      gain: 'Chaque conversation = potentiellement 2 500 F/mois de commission',
    },
    {
      icon: '✍️',
      titre: 'Contenu éducatif',
      badge: 'Le plus durable',
      badgeColor: '#F59E0B',
      desc: 'Écris des posts LinkedIn, Facebook ou des threads Twitter sur la gestion e-commerce en Afrique. Donne des conseils utiles, mentionne Dropzi naturellement avec ton lien.',
      tips: ['Posts "comment gérer ses livraisons"', '"5 erreurs que font les dropshippers"', '"Comment calculer ses vrais bénéfices"', 'Articles sur le e-commerce africain'],
      gain: 'Une audience fidèle = des commissions récurrentes',
    },
  ]

  const FAQS = [
    ['Je reçois ma commission quand exactement ?', 'Dès qu\'une personne invitée paye son abonnement, 50% est crédité sur ton solde Dropzi automatiquement. Tu peux faire une demande de retrait à tout moment.'],
    ['Comment retirer mon argent ?', 'Depuis ton tableau de bord, tu fais une demande de retrait avec ton numéro Wave ou Orange Money. Le paiement est effectué sous 24-48h par l\'équipe Dropzi.'],
    ['Est-ce que je gagne sur les renouvellements ?', 'Actuellement la commission est versée sur le premier paiement de chaque personne invitée. Les renouvellements seront ajoutés prochainement.'],
    ['Il faut avoir un compte Dropzi payant pour participer ?', 'Non. Tu peux rejoindre le programme d\'affiliation gratuitement, même sans abonnement Dropzi actif.'],
    ['Est-ce qu\'il y a une limite de personnes à inviter ?', 'Aucune limite. Plus tu invites, plus tu gagnes. Le programme est illimité.'],
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#06060F', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200%}100%{background-position:200%}}
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        .btn{transition:all .2s;cursor:pointer;font-family:inherit;}
        .btn:hover{transform:translateY(-2px);}
        .card{transition:all .25s;cursor:default;}
        .card:hover{transform:translateY(-4px);border-color:rgba(127,119,221,.3)!important;}
        ::placeholder{color:rgba(255,255,255,.3);}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #1a1a2e inset!important;-webkit-text-fill-color:#fff!important;}
        @media(max-width:640px){
          .hero-title{font-size:34px!important;letter-spacing:-1px!important;}
          .methodes-grid{grid-template-columns:1fr!important;}
          .hide-mobile{display:none!important;}
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(6,6,15,.95)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,.06)' : 'none', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .3s' }}>
        <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: -.5 }}>Dropzi</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(29,158,117,.2)', color: '#9FE1CB', letterSpacing: '.06em' }}>AFFILIATION</span>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/login" className="btn hide-mobile" style={{ color: 'rgba(255,255,255,.5)', fontSize: 14, textDecoration: 'none', padding: '8px 16px' }}>Connexion</Link>
          <button className="btn" onClick={() => setStep('signup')}
            style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 12, padding: '9px 20px', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(127,119,221,.3)' }}>
            Rejoindre →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(circle,rgba(127,119,221,.1),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '8%', width: 220, height: 220, background: 'radial-gradient(circle,rgba(29,158,117,.08),transparent 70%)', pointerEvents: 'none', animation: 'float 7s ease-in-out infinite' }} />

        <div style={{ maxWidth: 680, animation: 'fadeUp .5s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(29,158,117,.12)', border: '1px solid rgba(29,158,117,.25)', borderRadius: 20, padding: '6px 16px', marginBottom: 28 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, color: '#9FE1CB', fontWeight: 600 }}>Programme ouvert à tous — 100% gratuit</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: 58, fontWeight: 900, letterSpacing: -2.5, lineHeight: 1.05, marginBottom: 24 }}>
            Recommande Dropzi.<br />
            <span style={{ background: 'linear-gradient(135deg,#7F77DD,#9FE1CB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Gagne de l'argent.
            </span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.5)', lineHeight: 1.75, marginBottom: 16, maxWidth: 520, margin: '0 auto 16px' }}>
            Invite des commerçants à utiliser Dropzi et reçois <strong style={{ color: '#fff' }}>50% de commission</strong> sur chaque abonnement — directement sur ton Wave ou Orange Money.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', marginBottom: 40 }}>Pas besoin d'être expert. Pas besoin d'investir. Juste partager.</p>

          <button className="btn" onClick={() => setStep('signup')}
            style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 16, padding: '16px 40px', fontSize: 17, fontWeight: 800, boxShadow: '0 4px 24px rgba(127,119,221,.4)', marginBottom: 16 }}>
            🚀 Créer mon compte affilié — Gratuit
          </button>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>Ton lien de parrainage est prêt en 30 secondes</p>

          {/* 3 chiffres simples */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
            {[['50%','Commission sur chaque abonnement'],['24-48h','Délai de paiement Wave/OM'],['0 F','Aucun investissement requis']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: -1.5, lineHeight: 1, marginBottom: 6 }}>{val}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', maxWidth: 120 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMBIEN TU GAGNES */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.5, textAlign: 'center', marginBottom: 12 }}>Ce que tu gagnes concrètement</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', textAlign: 'center', marginBottom: 40 }}>50% du prix de l'abonnement souscrit par chaque personne que tu invites</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
            {[
              { plan: 'Starter', prix: '3 000 F', commission: '1 500 F', icon: '🥉', color: '#9B9B9B' },
              { plan: 'Business', prix: '5 000 F', commission: '2 500 F', icon: '🥈', color: '#AFA9EC', popular: true },
              { plan: 'Elite', prix: '15 000 F', commission: '7 500 F', icon: '🥇', color: '#9FE1CB' },
            ].map(p => (
              <div key={p.plan} className="card" style={{ background: p.popular ? 'rgba(127,119,221,.08)' : 'rgba(255,255,255,.03)', border: `1px solid ${p.popular ? 'rgba(127,119,221,.3)' : 'rgba(255,255,255,.07)'}`, borderRadius: 18, padding: '22px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{p.icon}</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>Plan {p.plan}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.25)', marginBottom: 16 }}>{p.prix}/mois</p>
                <div style={{ background: 'rgba(29,158,117,.1)', border: '1px solid rgba(29,158,117,.2)', borderRadius: 12, padding: '12px' }}>
                  <p style={{ fontSize: 10, color: '#9FE1CB', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Tu reçois</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: '#9FE1CB', letterSpacing: -1 }}>{p.commission}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Exemples réalistes */}
          <div style={{ background: 'rgba(127,119,221,.06)', border: '1px solid rgba(127,119,221,.15)', borderRadius: 18, padding: '24px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#AFA9EC', marginBottom: 16 }}>📊 Exemples de revenus réalistes</p>
            {[
              ['Tu invites 3 amis e-commerçants', '3 × 2 500 F', '7 500 F'],
              ['Tu postes 1 vidéo TikTok qui marche', '8 × 2 500 F (moy.)', '20 000 F'],
              ['Tu animes un groupe WhatsApp de 200 marchands', '15 × 2 500 F', '37 500 F'],
            ].map(([action, calc, total]) => (
              <div key={action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.05)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', flex: 1, minWidth: 200 }}>{action}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>{calc}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#9FE1CB', minWidth: 80, textAlign: 'right' }}>{total}</span>
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', marginTop: 12 }}>* Les résultats varient selon ton réseau et ta régularité.</p>
          </div>
        </div>
      </section>

      {/* MÉTHODES */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.5, textAlign: 'center', marginBottom: 12 }}>Comment inviter des gens ?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', textAlign: 'center', marginBottom: 48 }}>4 méthodes concrètes que tu peux commencer aujourd'hui</p>

          <div className="methodes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {METHODES.map((m, i) => (
              <div key={i} className="card" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '24px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{m.icon}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{m.titre}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: m.badgeColor + '20', color: m.badgeColor, border: `1px solid ${m.badgeColor}40` }}>{m.badge}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.6 }}>{m.desc}</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Idées concrètes :</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {m.tips.map((tip, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(127,119,221,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#AFA9EC', flexShrink: 0, fontWeight: 700 }}>→</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'rgba(29,158,117,.08)', border: '1px solid rgba(29,158,117,.15)', borderRadius: 12, padding: '10px 14px' }}>
                  <p style={{ fontSize: 12, color: '#9FE1CB', fontWeight: 600 }}>💡 {m.gain}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.5, textAlign: 'center', marginBottom: 12 }}>Comment ça marche ?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', textAlign: 'center', marginBottom: 48 }}>Simple comme envoyer un message</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { num: '01', icon: '✍️', titre: 'Tu crées ton compte', desc: 'Remplis le formulaire sur cette page. Ton code unique est généré instantanément. Ton compte Dropzi est créé en même temps.' },
              { num: '02', icon: '🔗', titre: 'Tu partages ton lien', desc: 'Envoie ton lien sur WhatsApp, TikTok, Facebook ou à tes contacts directs. Chaque personne qui clique est liée à toi.' },
              { num: '03', icon: '📲', titre: 'Ils s\'inscrivent et souscrivent', desc: 'Dès qu\'un contact crée son compte via ton lien et prend un abonnement, la commission est calculée automatiquement.' },
              { num: '04', icon: '💸', titre: 'Tu reçois 50%', desc: 'Le montant est crédité sur ton solde Dropzi. Tu fais une demande de retrait et tu reçois l\'argent sur ton Wave ou OM.' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, padding: '20px 22px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(127,119,221,.2),rgba(83,74,183,.1))', border: '1px solid rgba(127,119,221,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{e.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#7F77DD', letterSpacing: '.1em' }}>ÉTAPE {e.num}</span>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{e.titre}</p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', lineHeight: 1.6 }}>{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.5, textAlign: 'center', marginBottom: 40 }}>Questions fréquentes</h2>
          {FAQS.map(([q, a], i) => (
            <div key={i} onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${activeFaq === i ? 'rgba(127,119,221,.3)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, padding: '18px 20px', marginBottom: 10, cursor: 'pointer', transition: 'all .2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{q}</p>
                <span style={{ fontSize: 20, color: '#7F77DD', flexShrink: 0, transition: 'transform .2s', transform: activeFaq === i ? 'rotate(45deg)' : 'none', display: 'inline-block' }}>+</span>
              </div>
              {activeFaq === i && (
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)' }}>{a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 20, animation: 'float 3s ease-in-out infinite' }}>🤝</div>
          <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: -2, marginBottom: 16 }}>Commence à gagner<br />dès aujourd'hui</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.4)', marginBottom: 32 }}>Gratuit. Sans investissement. Ton lien est prêt en 30 secondes.</p>
          <button className="btn" onClick={() => setStep('signup')}
            style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 16, padding: '16px 44px', fontSize: 17, fontWeight: 800, boxShadow: '0 4px 24px rgba(127,119,221,.4)' }}>
            🚀 Créer mon compte — Gratuit
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.25)' }}>© 2025 Dropzi — Programme d'affiliation</span>
      </footer>

      {/* MODAL INSCRIPTION */}
      {step === 'signup' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'linear-gradient(160deg,#0C0C1E,#1a1a3e)', border: '1px solid rgba(127,119,221,.3)', borderRadius: 24, padding: '32px 28px', maxWidth: 420, width: '100%', animation: 'fadeUp .3s ease', position: 'relative' }}>
            <button onClick={() => setStep('landing')}
              style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.08)', border: 'none', color: 'rgba(255,255,255,.5)', borderRadius: '50%', width: 32, height: 32, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🤝</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.5, marginBottom: 6 }}>Crée ton compte affilié</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>Ton compte Dropzi + ton code de parrainage sont créés en même temps</p>
            </div>

            <form onSubmit={sInscrire} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Nom complet *</label>
                <input required value={nom} onChange={e => setNom(e.target.value)} placeholder="Alpha Diagne" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Téléphone (Wave/OM)</label>
                <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="77 000 00 00" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Email *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@example.com" style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Mot de passe *</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="6 caractères minimum" style={inp} />
              </div>

              {error && (
                <div style={{ background: 'rgba(226,75,74,.12)', border: '1px solid rgba(226,75,74,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#F09595' }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ background: loading ? 'rgba(127,119,221,.3)' : 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(127,119,221,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                {loading
                  ? <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />Création du compte...</>
                  : '🚀 Créer mon compte affilié'}
              </button>
            </form>

            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(29,158,117,.08)', border: '1px solid rgba(29,158,117,.15)', borderRadius: 12 }}>
              <p style={{ fontSize: 12, color: '#9FE1CB', lineHeight: 1.5 }}>
                ✓ Compte Dropzi créé instantanément<br />
                ✓ Code parrainage unique généré<br />
                ✓ Prêt à partager en 30 secondes
              </p>
            </div>

            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,.2)' }}>
              En créant un compte tu acceptes les conditions Dropzi
            </p>
          </div>
        </div>
      )}

      {/* PAGE SUCCÈS */}
      {step === 'success' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(12px)', overflowY: 'auto' }}>
          <div style={{ background: 'linear-gradient(160deg,#0C0C1E,#1a1a3e)', border: '1px solid rgba(29,158,117,.35)', borderRadius: 24, padding: '36px 28px', maxWidth: 440, width: '100%', textAlign: 'center', animation: 'fadeUp .4s ease' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: -.8, marginBottom: 8 }}>Compte créé avec succès !</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', marginBottom: 28 }}>Ton code de parrainage est prêt. Commence à partager maintenant.</p>

            {/* Code */}
            <div style={{ background: 'rgba(127,119,221,.1)', border: '1px solid rgba(127,119,221,.25)', borderRadius: 16, padding: '20px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Ton code de parrainage</p>
              <p style={{ fontSize: 40, fontWeight: 900, color: '#AFA9EC', letterSpacing: 6, marginBottom: 16 }}>{code}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 8 }}>Ton lien de parrainage</p>
              <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 11, color: '#AFA9EC', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>dropzi.io/login?ref={code}</p>
                <button onClick={() => { navigator.clipboard.writeText(`https://dropzi.io/login?ref=${code}`); alert('✅ Lien copié !') }}
                  style={{ background: '#7F77DD', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  Copier
                </button>
              </div>
            </div>

            {/* Partage WhatsApp */}
            <a href={`https://wa.me/?text=Je%20g%C3%A8re%20mes%20commandes%20Shopify%20avec%20Dropzi%20et%20c%27est%20super%20%F0%9F%94%A5%20Tu%20peux%20essayer%20avec%20mon%20lien%20%3A%20https%3A%2F%2Fdropzi.io%2Flogin%3Fref%3D${code}`}
              target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 700, textDecoration: 'none', marginBottom: 10 }}>
              💬 Partager sur WhatsApp maintenant
            </a>

            {/* Prochaine étape : abonnement */}
            <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#FCD34D', marginBottom: 6 }}>⚡ Prochaine étape</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>
                Pour utiliser toutes les fonctionnalités Dropzi (sync Shopify, dashboard, factures...) choisis un abonnement.
              </p>
            </div>

            <Link href="/dashboard/abonnement"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 10, boxShadow: '0 4px 16px rgba(127,119,221,.3)' }}>
              💳 Choisir mon abonnement Dropzi →
            </Link>

            <Link href="/dashboard/affiliation"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', borderRadius: 14, padding: '12px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              📊 Voir mon tableau de bord affiliation
            </Link>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', marginTop: 14 }}>Vérifie ton email pour confirmer ton compte</p>
          </div>
        </div>
      )}
    </div>
  )
}

const METHODES = [
  {
    icon: '🎵',
    titre: 'TikTok & Instagram Reels',
    badge: 'Le plus viral',
    badgeColor: '#E24B4A',
    desc: 'Filme ton écran Dropzi en action — tes commandes qui arrivent automatiquement, ton dashboard, tes stats. Les e-commerçants adorent voir des outils qui marchent vraiment.',
    tips: ['Film une vidéo "avant/après Dropzi"', 'Montre la sync Shopify en temps réel', 'Partage tes stats de la semaine', 'Tague des boutiques Shopify locales'],
    gain: '1 vidéo virale = 10 à 50 nouveaux contacts potentiels',
  },
  {
    icon: '👥',
    titre: 'Groupes WhatsApp & Facebook',
    badge: 'Le plus rapide',
    badgeColor: '#1D9E75',
    desc: 'Tu connais sûrement des groupes de commerçants, revendeurs, dropshippers. Partage ton expérience Dropzi avec ton lien. Un message bien rédigé touche des centaines de personnes.',
    tips: ['Groupes e-commerce Sénégal', 'Groupes dropshipping Afrique', 'Groupes revendeurs par ville', 'Groupes femmes entrepreneures'],
    gain: 'Un groupe actif = 5 à 20 inscriptions en quelques jours',
  },
  {
    icon: '🤝',
    titre: 'Bouche à oreille direct',
    badge: 'Le plus fiable',
    badgeColor: '#7F77DD',
    desc: 'Parle de Dropzi aux commerçants que tu croises. Montre-leur directement sur ton téléphone comment ça marche. Rien ne vaut une démo en direct.',
    tips: ['Marchands Shopify autour de toi', 'Tes amis qui vendent en ligne', 'Contacts dans les marchés HLM, Sandaga', 'Revendeurs de produits importés'],
    gain: 'Chaque conversation = potentiellement 2 500 F de commission',
  },
  {
    icon: '✍️',
    titre: 'Contenu éducatif',
    badge: 'Le plus durable',
    badgeColor: '#F59E0B',
    desc: 'Écris des posts LinkedIn, Facebook sur la gestion e-commerce en Afrique. Donne des conseils utiles, mentionne Dropzi naturellement avec ton lien.',
    tips: ['"Comment gérer ses livraisons Shopify"', '"5 erreurs que font les dropshippers"', '"Comment calculer ses vrais bénéfices"', 'Articles sur le e-commerce africain'],
    gain: 'Une audience fidèle = des commissions régulières',
  },
]

const FAQS = [
  ['Je reçois ma commission quand exactement ?', 'Dès qu\'une personne invitée paye son abonnement, 50% est crédité sur ton solde Dropzi automatiquement. Tu peux faire une demande de retrait à tout moment.'],
  ['Comment retirer mon argent ?', 'Depuis ton tableau de bord, tu fais une demande de retrait avec ton numéro Wave ou Orange Money. Le paiement est effectué sous 24-48h par l\'équipe Dropzi.'],
  ['Est-ce que je gagne sur les renouvellements ?', 'Actuellement la commission est versée sur le premier paiement de chaque personne invitée. Les renouvellements seront ajoutés prochainement.'],
  ['Il faut avoir un abonnement Dropzi pour participer ?', 'Non. Tu peux rejoindre le programme d\'affiliation gratuitement, même sans abonnement Dropzi actif. Mais prendre un abonnement te permet aussi d\'utiliser l\'outil toi-même.'],
  ['Est-ce qu\'il y a une limite de personnes à inviter ?', 'Aucune limite. Plus tu invites, plus tu gagnes. Le programme est totalement illimité.'],
]
