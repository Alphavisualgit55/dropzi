'use client'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

const PLANS = [
  {
    id: 'starter', nom: 'Starter', prix: 3000,
    couleur: '#888', bg: 'rgba(136,136,136,.08)', border: 'rgba(136,136,136,.2)',
    features: ['50 commandes / mois','5 produits maximum','1 zone de livraison','1 livreur','1 modèle de facture','Sync Google Sheet (1h)','Notifications in-app'],
  },
  {
    id: 'business', nom: 'Business', prix: 5000, star: true,
    couleur: '#7F77DD', bg: 'rgba(127,119,221,.08)', border: 'rgba(127,119,221,.3)',
    features: ['500 commandes / mois','25 produits maximum','5 zones de livraison','6 livreurs','3 modèles de factures','Sync Google Sheet (1 min)','Import produits Shopify','Notifications temps réel','Suivi stock automatique','Photo produit'],
  },
  {
    id: 'elite', nom: 'Elite', prix: 15000,
    couleur: '#1D9E75', bg: 'rgba(29,158,117,.08)', border: 'rgba(29,158,117,.3)',
    features: ['Commandes illimitées','Produits illimités','Zones illimitées','Livreurs illimités','5 modèles de factures premium','Sync Google Sheet (1 min)','Import produits Shopify','Analytics avancés','Export données','Support prioritaire','Nouvelles fonctionnalités en avant-première'],
  },
]

function AbonnementContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [profil, setProfil] = useState<any>(null)
  const [abonnement, setAbonnement] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const status = searchParams.get('status')
  const planParam = searchParams.get('plan')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      const charger = async () => {
        const [pr, ab] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('abonnements').select('*').eq('user_id', user.id).single(),
        ])
        setProfil(pr.data)
        setAbonnement(ab.data)
        return { profil: pr.data, abo: ab.data }
      }

      const { profil: pr, abo: ab } = await charger()
      setLoading(false)

      // Si retour de paiement → vérifier et activer automatiquement
      if (status === 'success' && user.id) {
        // Vérifier si le plan est déjà actif
        const planDejaActif = ab?.statut === 'actif' && ab?.fin && new Date(ab.fin) > new Date()
        if (!planDejaActif) {
          // Polling : vérifier toutes les 3s pendant max 30s
          let tentatives = 0
          const poll = setInterval(async () => {
            tentatives++
            try {
              const res = await fetch('/api/paydunya/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
              })
              const result = await res.json()
              if (result.ok) {
                clearInterval(poll)
                await charger() // Recharger les données
              }
            } catch(_) {}
            if (tentatives >= 10) clearInterval(poll)
          }, 3000)
        }
      }
    })
  }, [status])

  async function souscrire(planId: string) {
    if (!userId || !profil) return
    setPaying(planId)
    try {
      const res = await fetch('/api/paydunya', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, user_id: userId, email: profil.email, nom: profil.nom_boutique || 'Client Dropzi' })
      })
      const data = await res.json()
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        alert('Erreur : ' + (data.error || 'Impossible de créer le paiement'))
      }
    } catch (e) {
      alert('Erreur de connexion à PayDunya')
    }
    setPaying(null)
  }

  const planActuel = profil?.plan || 'gratuit'
  const planExpire = abonnement?.fin ? new Date(abonnement.fin) < new Date() : true
  const planActif = abonnement?.statut === 'actif' && !planExpire

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '3px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 48 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.plan-card{transition:transform .2s,box-shadow .2s;}.plan-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.1)!important;}`}</style>

      {status === 'success' && (
        <div style={{ background: '#E1F5EE', border: '1px solid #1D9E75', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🎉</span>
          <div>
            <p style={{ fontWeight: 800, color: '#085041', fontSize: 15 }}>Paiement réussi ! Ton plan {planParam} est activé.</p>
            <p style={{ color: '#1D9E75', fontSize: 13, marginTop: 2 }}>Tu recevras une notification de confirmation dans l'app.</p>
          </div>
        </div>
      )}

      {status === 'cancel' && (
        <div style={{ background: '#FAEEDA', border: '1px solid #BA7517', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <p style={{ color: '#633806', fontSize: 14 }}>Paiement annulé. Tu peux réessayer à tout moment.</p>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0C0C1E', letterSpacing: -1.5, marginBottom: 10 }}>Choisir ton plan Dropzi</h1>
        <p style={{ fontSize: 15, color: '#ABABAB', marginBottom: 16 }}>Paiement sécurisé via PayDunya · Wave, Orange Money, carte bancaire</p>
        {planActif && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E1F5EE', border: '1px solid #1D9E75', borderRadius: 20, padding: '6px 16px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75' }} />
            <span style={{ fontSize: 13, color: '#085041', fontWeight: 700 }}>
              Plan {planActuel.charAt(0).toUpperCase() + planActuel.slice(1)} actif · expire le {new Date(abonnement.fin).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, marginBottom: 32 }}>
        {PLANS.map(plan => {
          const isCurrent = planActuel === plan.id && planActif
          const isPaying = paying === plan.id
          return (
            <div key={plan.id} className="plan-card" style={{ background: '#fff', border: `2px solid ${isCurrent ? plan.couleur : (plan as any).star ? plan.border : '#EBEBEB'}`, borderRadius: 24, padding: '28px 22px', position: 'relative', boxShadow: isCurrent ? `0 0 0 3px ${plan.couleur}22` : 'none' }}>
              {(plan as any).star && !isCurrent && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#7F77DD', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  ⭐ Le plus populaire
                </div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.couleur, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  ✓ Plan actuel
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 700, color: plan.couleur, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>{plan.nom}</div>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 800, color: '#0C0C1E', letterSpacing: -2 }}>{fmt(plan.prix)}</span>
                <span style={{ fontSize: 14, color: '#ABABAB', marginLeft: 4 }}>FCFA/mois</span>
              </div>
              <p style={{ fontSize: 12, color: '#C0C0C0', marginBottom: 20 }}>Renouvellement mensuel</p>
              <div style={{ height: 1, background: '#F0F0F0', marginBottom: 20 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: plan.couleur, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: '#555', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => !isCurrent && souscrire(plan.id)} disabled={isCurrent || isPaying}
                style={{ width: '100%', background: isCurrent ? '#F0F0F0' : plan.id === 'business' ? 'linear-gradient(135deg,#7F77DD,#534AB7)' : plan.bg, color: isCurrent ? '#ABABAB' : plan.id === 'business' ? '#fff' : plan.couleur, border: `1.5px solid ${isCurrent ? '#E0E0E0' : plan.border}`, borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 700, cursor: isCurrent ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                {isPaying ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
                    Redirection...
                  </span>
                ) : isCurrent ? '✓ Plan actuel' : `Souscrire — ${fmt(plan.prix)} FCFA`}
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ background: '#F8F8FC', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 28 }}>🔒</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>Paiement 100% sécurisé via PayDunya</p>
          <p style={{ fontSize: 12, color: '#ABABAB', marginTop: 3 }}>Wave · Orange Money · Free Money · Carte bancaire</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Wave', 'Orange Money', 'Free Money'].map(m => (
            <span key={m} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#555' }}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 32, height: 32, border: '3px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    }>
      <AbonnementContent />
    </Suspense>
  )
}
