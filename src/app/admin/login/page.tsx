'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'alphadiagne902@gmail.com'
const ADMIN_PASSWORD = 'azerty221'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Stocker la session admin dans localStorage
      localStorage.setItem('dropzi_admin', 'true')
      localStorage.setItem('dropzi_admin_email', email)
      router.push('/admin')
    } else {
      setError('Email ou mot de passe incorrect')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(127,119,221,.5)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>Dropzi</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, padding: '2px 12px', borderRadius: 20, background: 'rgba(127,119,221,.2)', color: '#AFA9EC', display: 'inline-block' }}>PANNEAU ADMIN</div>
        </div>

        <div style={{ background: '#0D0D1F', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 28 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Connexion Admin</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@email.com"
                style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Mot de passe</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            {error && (
              <div style={{ background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.3)', color: '#F09595', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none',
              borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
              boxShadow: '0 0 24px rgba(127,119,221,.3)'
            }}>
              {loading ? 'Connexion...' : 'Accéder au panneau admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
