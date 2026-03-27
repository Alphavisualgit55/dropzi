'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
    setLoading(true)
    setError('')
    setSuccess('')

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
    <div className="min-h-screen bg-[#0C0C1E] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#7F77DD] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 5L12 3L21 5L19 15L12 20L5 15L3 5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/>
                <path d="M12 3L12 20" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
              </svg>
            </div>
            <span className="text-3xl font-serif text-white tracking-tight">Dropzi</span>
          </div>
          <p className="text-gray-400 text-sm">Gérez. Livrez. Encaissez.</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-5">
            {isSignup ? 'Créer un compte' : 'Connexion'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="toi@example.com" />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input className="input" type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" minLength={6} />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
            {success && <p className="text-green-700 text-sm bg-green-50 p-3 rounded-xl">{success}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-[#7F77DD] text-white font-medium py-3 rounded-xl hover:bg-[#534AB7] transition-colors disabled:opacity-60">
              {loading ? 'Chargement...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            {isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button onClick={() => setIsSignup(!isSignup)}
              className="text-[#7F77DD] font-medium hover:underline">
              {isSignup ? 'Se connecter' : 'Créer un compte gratuit'}
            </button>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">7 jours gratuits · Aucune carte requise</p>
      </div>
    </div>
  )
}
