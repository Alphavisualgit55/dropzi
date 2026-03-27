'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Compte créé ! Vérifie ton email pour confirmer.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Email ou mot de passe incorrect')
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0C0C1E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(127,119,221,.5)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>Dropzi</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>Gérez. Livrez. Encaissez.</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' }}>
            {isSignup ? 'Créer un compte' : 'Connexion'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="toi@example.com"
                style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: '11px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Mot de passe</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" minLength={6}
                style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: '11px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>{error}</div>}
            {success && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>{success}</div>}
            <button type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
              {loading ? 'Chargement...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginTop: 20 }}>
            {isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button onClick={() => setIsSignup(!isSignup)} style={{ color: '#7F77DD', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
              {isSignup ? 'Se connecter' : 'Créer un compte gratuit'}
            </button>
          </p>
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 12, marginTop: 16 }}>7 jours gratuits · Aucune carte requise</p>
      </div>
    </div>
  )
}
