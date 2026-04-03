'use client'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

const PLANS = [
  {
    id: 'starter', nom: 'Starter', prix: 3000,
    grad: 'linear-gradient(135deg,#F59E0B,#D97706)',
    color: '#F59E0B', glow: 'rgba(245,158,11,.35)',
    badge: null,
    features: ['50 commandes / mois', '5 produits', '1 zone · 1 livreur', 'Sync Shopify', 'Factures basiques', 'Support standard'],
  },
  {
    id: 'business', nom: 'Business', prix: 5000,
    grad: 'linear-gradient(135deg,#818CF8,#6366F1)',
    color: '#818CF8', glow: 'rgba(129,140,248,.4)',
    badge: '⭐ Populaire',
    features: ['500 commandes / mois', '25 produits', '5 zones · 6 livreurs', 'Sync Shopify (1 min)', 'Toutes les factures', 'Import produits Shopify', 'Stats avancées', 'Photos produits'],
  },
  {
    id: 'elite', nom: 'Elite', prix: 15000,
    grad: 'linear-gradient(135deg,#34D399,#10B981)',
    color: '#34D399', glow: 'rgba(52,211,153,.4)',
    badge: '👑 Premium',
    features: ['Commandes illimitées', 'Produits illimités', 'Zones & livreurs illimités', 'Toutes les fonctionnalités', 'Support prioritaire 24/7', 'Nouvelles fonctionnalités en avant-première', 'Export données', 'Analytics complets'],
  },
]

function AbonnementContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [profil, setProfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const status = searchParams.get('status')

  useEffect(() => {
    let poll: any = null
    let channel: any = null

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      const charger = async () => {
        const { data: p } = await supabase.from('profiles').select('*, abonnements(*)').eq('id', user.id).single()
        setProfil(p)
        return p
      }

      const p = await charger()
      setLoading(false)

      channel = supabase.channel('abo-live')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, charger)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'abonnements', filter: `user_id=eq.${user.id}` }, charger)
        .subscribe()

      if (status === 'success') {
        const dejaActif = p?.plan && p.plan !== 'aucun' && p.plan_expires && new Date(p.plan_expires) > new Date()
        if (!dejaActif) {
          setVerifying(true)
          let tries = 0
          poll = setInterval(async () => {
            tries++
            try {
              const res = await fetch('/api/paydunya/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id }) })
              const result = await res.json()
              if (result.ok) { clearInterval(poll); setVerifying(false); charger() }
            } catch (_) {}
            const { data: fresh } = await supabase.from('profiles').select('plan, plan_expires').eq('id', user.id).single()
            if (fresh?.plan && fresh.plan !== 'aucun' && fresh.plan_expires && new Date(fresh.plan_expires) > new Date()) {
              clearInterval(poll); setVerifying(false); charger()
            }
            if (tries >= 20) { clearInterval(poll); setVerifying(false) }
          }, 3000)
        }
      }
    })
    return () => { if (poll) clearInterval(poll); if (channel) supabase.removeChannel(channel) }
  }, [status])

  async function souscrire(planId: string) {
    if (!userId || !profil) return
    setPaying(planId)
    try {
      const res = await fetch('/api/paydunya', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, user_id: userId, email: profil.email, nom: profil.nom_boutique || 'Client' })
      })
      const data = await res.json()
      if (data.checkout_url) window.location.href = data.checkout_url
      else alert('Erreur: ' + (data.error || 'Impossible de créer le paiement'))
    } catch { alert('Erreur de connexion') }
    setPaying(null)
  }

  const planActuel = profil?.plan || null
  const planExpire = profil?.plan_expires ? new Date(profil.plan_expires) : null
  const planActif = planActuel && planActuel !== 'aucun' && planExpire && planExpire > new Date()
  const planCourant = PLANS.find(p => p.id === planActuel)
  const joursRestants = planExpire ? Math.ceil((planExpire.getTime() - Date.now()) / 86400000) : 0

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: '3px solid #818CF8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 48 }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .plan-card{transition:transform .2s,box-shadow .2s;}
        .plan-card:hover{transform:translateY(-4px);}
        .btn-pay{transition:all .2s;cursor:pointer;font-family:inherit;border:none;}
        .btn-pay:hover{transform:translateY(-2px);}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: -.8, margin: 0 }}>Mon abonnement</h1>
        <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 6 }}>Choisis le plan adapté à ta boutique</p>
      </div>

      {/* Vérification en cours */}
      {verifying && (
        <div style={{ background: 'linear-gradient(135deg,#818CF8,#6366F1)', borderRadius: 18, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 24px rgba(129,140,248,.3)', animation: 'fadeUp .3s ease' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Vérification du paiement en cours...</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>Ton plan sera activé automatiquement dans quelques secondes</p>
          </div>
        </div>
      )}

      {/* Status succès */}
      {status === 'success' && planActif && (
        <div style={{ background: 'linear-gradient(135deg,#34D399,#10B981)', borderRadius: 18, padding: '20px', marginBottom: 24, boxShadow: '0 8px 32px rgba(52,211,153,.3)', animation: 'fadeUp .4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 40, animation: 'float 2s ease-in-out infinite' }}>🎉</div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Paiement réussi !</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.8)' }}>Ton plan {planActuel} est maintenant actif. Profite de toutes les fonctionnalités !</p>
            </div>
          </div>
        </div>
      )}

      {/* Plan actuel */}
      {planActif && planCourant && (
        <div style={{ background: '#0F0F1A', borderRadius: 22, padding: '22px', marginBottom: 28, position: 'relative', overflow: 'hidden', boxShadow: `0 8px 32px ${planCourant.glow}` }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: planCourant.grad }} />
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: `radial-gradient(circle,${planCourant.glow},transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Plan actuel</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -.8 }}>{planCourant.nom}</p>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: planCourant.color + '20', color: planCourant.color, border: `1px solid ${planCourant.color}40` }}>✓ Actif</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 6 }}>
                Expire le {planExpire?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {joursRestants <= 7 && <span style={{ color: '#F59E0B', fontWeight: 700 }}> · ⚠ {joursRestants}j restants</span>}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 28, fontWeight: 900, color: planCourant.color, letterSpacing: -1 }}>{fmt(planCourant.prix)} F</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>/ mois</p>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PLANS.map((plan, i) => {
          const isCurrent = planActuel === plan.id && planActif
          const isPaying = paying === plan.id
          return (
            <div key={plan.id} className="plan-card"
              style={{ background: isCurrent ? '#0F0F1A' : '#fff', borderRadius: 20, overflow: 'hidden', border: isCurrent ? `1px solid ${plan.color}30` : '1px solid #E8EAF0', boxShadow: isCurrent ? `0 8px 32px ${plan.glow}` : '0 2px 12px rgba(0,0,0,.06)', animation: `fadeUp .4s ease ${i * 80}ms both`, position: 'relative' }}>

              {/* Barre top */}
              {plan.badge && <div style={{ background: plan.grad, padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '.04em' }}>{plan.badge}</span>
                <div style={{ marginLeft: 'auto', height: 1, flex: 1, background: 'rgba(255,255,255,.3)' }} />
              </div>}

              <div style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 13, background: plan.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: `0 4px 16px ${plan.glow}`, flexShrink: 0 }}>
                        {i === 0 ? '🥉' : i === 1 ? '🥈' : '🥇'}
                      </div>
                      <div>
                        <p style={{ fontSize: 20, fontWeight: 900, color: isCurrent ? '#fff' : '#0F172A', letterSpacing: -.5 }}>{plan.nom}</p>
                        {isCurrent && <span style={{ fontSize: 11, fontWeight: 700, color: plan.color }}>✓ Ton plan actuel</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 32, fontWeight: 900, color: isCurrent ? plan.color : '#0F172A', letterSpacing: -1.5, lineHeight: 1 }}>{fmt(plan.prix)}</p>
                    <p style={{ fontSize: 12, color: isCurrent ? 'rgba(255,255,255,.4)' : '#94A3B8' }}>FCFA / mois</p>
                  </div>
                </div>

                {/* Features */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 18 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: plan.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: plan.color, fontWeight: 800 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 12, color: isCurrent ? 'rgba(255,255,255,.6)' : '#64748B', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Bouton */}
                {isCurrent ? (
                  <div style={{ background: plan.color + '15', border: `1px solid ${plan.color}30`, borderRadius: 14, padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: plan.color }}>✓ Plan actif jusqu'au {planExpire?.toLocaleDateString('fr-FR')}</p>
                  </div>
                ) : (
                  <button className="btn-pay" onClick={() => souscrire(plan.id)} disabled={!!paying}
                    style={{ width: '100%', background: isPaying ? '#ccc' : plan.grad, color: '#fff', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, boxShadow: isPaying ? 'none' : `0 6px 20px ${plan.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative', overflow: 'hidden' }}>
                    {!isPaying && <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)', animation: 'shimmer 2s infinite' }} />}
                    {isPaying ? <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.5)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />Redirection...</> : `Souscrire au plan ${plan.nom} →`}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Paiements acceptés */}
      <div style={{ textAlign: 'center', marginTop: 24, padding: '16px', background: '#fff', borderRadius: 16, border: '1px solid #E8EAF0' }}>
        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Paiement sécurisé via PayDunya</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['💛 Wave', '🟠 Orange Money', '💳 Carte bancaire', '📱 Free Money'].map(m => (
            <span key={m} style={{ fontSize: 12, fontWeight: 600, color: '#64748B', background: '#F8F9FA', padding: '4px 12px', borderRadius: 20 }}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div style={{ width: 32, height: 32, border: '3px solid #818CF8', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}>
      <AbonnementContent />
    </Suspense>
  )
}
