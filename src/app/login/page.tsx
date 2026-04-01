'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [refCode, setRefCode] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Détecter code parrain dans l'URL (?ref=CODE)
    const ref = searchParams.get('ref')
    if (ref) {
      setRefCode(ref.toUpperCase())
      setIsSignup(true) // Ouvrir directement le formulaire inscription
      localStorage.setItem('dropzi_ref', ref.toUpperCase())
    } else {
      // Récupérer depuis localStorage si déjà stocké
      const stored = localStorage.getItem('dropzi_ref')
      if (stored) setRefCode(stored)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')

    if (isSignup) {
      const { data, error: signupError } = await supabase.auth.signUp({ email, password })
      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      // Associer le code parrain si présent
      const finalRef = refCode || localStorage.getItem('dropzi_ref') || ''
      if (finalRef && data.user) {
        // Enregistrer le code parrain dans le profil
        await supabase.from('profiles').update({ parrain_code: finalRef }).eq('id', data.user.id)

        // Trouver l'affilié et créer le lien filleul
        const { data: affilie } = await supabase.from('affilies').select('id').eq('code', finalRef).single()
        if (affilie) {
          await supabase.from('filleuls').insert({ affilie_id: affilie.id, filleul_user_id: data.user.id }).catch(() => {})
          await supabase.from('profiles').update({ affilie_id: affilie.id }).eq('id', data.user.id)
          // Incrémenter le compteur de filleuls
          await supabase.rpc('increment_filleuls', { affilie_id: affilie.id }).catch(() => {})
        }
        localStorage.removeItem('dropzi_ref')
      }

      setSuccess('Compte créé ! Vérifie ton email pour confirmer.')
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) setError('Email ou mot de passe incorrect')
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: '11px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: '#06060F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(127,119,221,.5)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>Dropzi</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>L'outil logistique e-commerce N°1 en Afrique</p>
        </div>

        {/* Badge parrain */}
        {refCode && (
          <div style={{ background: 'rgba(29,158,117,.15)', border: '1px solid rgba(29,158,117,.3)', borderRadius: 14, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🎁</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#9FE1CB', marginBottom: 2 }}>Code parrainage actif : {refCode}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Tu as été invité par un membre Dropzi</p>
            </div>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 24, padding: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' }}>
            {isSignup ? 'Créer un compte' : 'Connexion'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@example.com" style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Mot de passe</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
            </div>

            {/* Code parrain manuel */}
            {isSignup && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Code parrainage (optionnel)</label>
                <input value={refCode} onChange={e => setRefCode(e.target.value.toUpperCase())} placeholder="Ex: ALPHA50" style={{ ...inp, border: refCode ? '1.5px solid #1D9E75' : '1.5px solid #e0e0e0', color: refCode ? '#1D9E75' : '#111', fontWeight: refCode ? 700 : 400 }} />
              </div>
            )}

            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>⚠️ {error}</div>}
            {success && <div style={{ background: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#15803D' }}>✅ {success}</div>}

            <button type="submit" disabled={loading}
              style={{ background: loading ? '#ccc' : 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(127,119,221,.4)' }}>
              {loading ? '⏳ Chargement...' : isSignup ? 'Créer mon compte →' : 'Se connecter →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={() => { setIsSignup(v => !v); setError(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', color: '#7F77DD', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              {isSignup ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
          Paiement sécurisé · Wave · Orange Money · Carte
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#06060F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}>
      <LoginContent />
    </Suspense>
  )
}
