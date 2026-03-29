'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    id: 'welcome',
    icon: '👋',
    titre: 'Bienvenue sur Dropzi !',
    desc: 'Tu es à 4 étapes de gérer toute ta logistique automatiquement. Ça prend moins de 3 minutes.',
    action: 'Commencer →',
    skip: false,
  },
  {
    id: 'boutique',
    icon: '🏪',
    titre: 'Nomme ta boutique',
    desc: 'Ce nom apparaîtra sur tes factures et dans ton dashboard.',
    action: 'Continuer →',
    skip: false,
    field: { label: 'Nom de ta boutique', placeholder: 'Ex : FashionDakar, ElectroPro SN...', key: 'nom_boutique' },
  },
  {
    id: 'zone',
    icon: '📍',
    titre: 'Crée ta première zone de livraison',
    desc: 'Une zone = une ville ou un quartier avec son coût de livraison fixe.',
    action: 'Continuer →',
    skip: true,
    fields: [
      { label: 'Nom de la zone', placeholder: 'Ex : Dakar Centre, Plateau, Pikine...', key: 'zone_nom' },
      { label: 'Coût de livraison (FCFA)', placeholder: 'Ex : 2000', key: 'zone_cout', type: 'number' },
    ],
  },
  {
    id: 'produit',
    icon: '🛍️',
    titre: 'Ajoute ton premier produit',
    desc: 'Dropzi calculera automatiquement ta marge et ton bénéfice à chaque vente.',
    action: 'Continuer →',
    skip: true,
    fields: [
      { label: 'Nom du produit', placeholder: 'Ex : Orbe Projecteur', key: 'prod_nom' },
      { label: 'Prix de vente (FCFA)', placeholder: 'Ex : 9999', key: 'prod_prix', type: 'number' },
      { label: 'Coût d\'achat (FCFA)', placeholder: 'Ex : 3000', key: 'prod_cout', type: 'number' },
    ],
  },
  {
    id: 'done',
    icon: '🎉',
    titre: 'Tout est prêt !',
    desc: 'Ton espace Dropzi est configuré. Tu peux maintenant créer des commandes, synchroniser ton Google Sheet Easy Sell et suivre tes bénéfices en temps réel.',
    action: 'Accéder à mon dashboard →',
    skip: false,
  },
]

export default function WizardOnboarding() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [vals, setVals] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      // Vérifier si l'onboarding est déjà fait
      const done = localStorage.getItem(`dropzi_onboarding_${user.id}`)
      if (done) return

      // Vérifier si c'est un nouvel utilisateur (aucun produit, aucune zone)
      const [{ count: zones }, { count: produits }] = await Promise.all([
        supabase.from('zones').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('produits').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      if ((zones || 0) === 0 && (produits || 0) === 0) {
        setVisible(true)
      }
    })
  }, [])

  async function next() {
    if (!userId) return
    const current = STEPS[step]
    setSaving(true)

    try {
      if (current.id === 'boutique' && vals.nom_boutique) {
        await supabase.from('profiles').update({ nom_boutique: vals.nom_boutique }).eq('id', userId)
      }
      if (current.id === 'zone' && vals.zone_nom && vals.zone_cout) {
        await supabase.from('zones').insert({ user_id: userId, nom: vals.zone_nom, cout_livraison: +vals.zone_cout })
      }
      if (current.id === 'produit' && vals.prod_nom && vals.prod_prix) {
        await supabase.from('produits').insert({ user_id: userId, nom: vals.prod_nom, prix_vente: +vals.prod_prix, cout_achat: +(vals.prod_cout || 0), stock_total: 0, actif: true })
      }
      if (current.id === 'done') {
        localStorage.setItem(`dropzi_onboarding_${userId}`, 'done')
        setVisible(false)
        router.refresh()
        return
      }
    } catch (e) { console.error(e) }

    setSaving(false)
    setStep(s => s + 1)
  }

  function skip() {
    if (step === STEPS.length - 1) {
      localStorage.setItem(`dropzi_onboarding_${userId}`, 'done')
      setVisible(false)
    } else {
      setStep(s => s + 1)
    }
  }

  if (!visible) return null

  const current = STEPS[step]
  const pct = Math.round((step / (STEPS.length - 1)) * 100)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>

      <div style={{ background: '#0C0C1E', border: '1px solid rgba(127,119,221,.3)', borderRadius: 28, padding: 32, maxWidth: 440, width: '100%', animation: 'popIn .3s ease', position: 'relative' }}>

        {/* Skip */}
        {current.skip && (
          <button onClick={skip} style={{ position: 'absolute', top: 18, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,.25)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Passer
          </button>
        )}

        {/* Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>Étape {step + 1} sur {STEPS.length}</span>
            <span style={{ fontSize: 11, color: '#7F77DD', fontWeight: 700 }}>{pct}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, height: 5, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#7F77DD,#1D9E75)', borderRadius: 8, transition: 'width .4s ease' }} />
          </div>
        </div>

        {/* Icône */}
        <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(127,119,221,.15)', border: '1px solid rgba(127,119,221,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 20 }}>
          {current.icon}
        </div>

        {/* Titre + desc */}
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -.8, marginBottom: 10, lineHeight: 1.2 }}>{current.titre}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', lineHeight: 1.75, marginBottom: 24 }}>{current.desc}</p>

        {/* Champ boutique */}
        {'field' in current && current.field && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>{current.field.label}</label>
            <input value={vals[current.field.key] || ''} onChange={e => setVals(v => ({ ...v, [current.field!.key]: e.target.value }))}
              placeholder={current.field.placeholder}
              style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        )}

        {/* Champs multiples */}
        {'fields' in current && current.fields && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {current.fields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input type={f.type || 'text'} value={vals[f.key] || ''} onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
        )}

        {/* Tip pour done */}
        {current.id === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {['📦 Crée ta première commande', '🔄 Connecte ton Google Sheet Easy Sell', '🧾 Génère une facture professionnelle', '📊 Suis ton bénéfice en temps réel'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '10px 14px' }}>
                <span style={{ fontSize: 16 }}>{t.slice(0, 2)}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{t.slice(3)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bouton */}
        <button onClick={next} disabled={saving} style={{ width: '100%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 16, padding: '15px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .7 : 1, boxShadow: '0 4px 24px rgba(127,119,221,.4)' }}>
          {saving ? '⏳ Enregistrement...' : current.action}
        </button>

        {/* Dots navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? '#7F77DD' : 'rgba(255,255,255,.15)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
