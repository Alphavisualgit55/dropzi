'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ParametresPage() {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({ nom_boutique: '', telephone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUser(user)
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => { if (data) setForm({ nom_boutique: data.nom_boutique || '', telephone: data.telephone || '' }) })
    })
  }, [])

  async function save() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update(form).eq('id', user.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-medium">Paramètres</h1>
      <div className="card space-y-4">
        <h2 className="font-medium text-sm">Mon profil</h2>
        <div>
          <label className="label">Nom de la boutique</label>
          <input className="input" value={form.nom_boutique}
            onChange={e => setForm(f => ({ ...f, nom_boutique: e.target.value }))}
            placeholder="Ma Boutique" />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input className="input" value={form.telephone}
            onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
            placeholder="77 000 00 00" />
        </div>
        <div>
          <label className="label">Email</label>
          <div className="input bg-gray-50 text-gray-400">{user?.email}</div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm w-full">
          {saving ? 'Enregistrement...' : saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
      <div className="card">
        <h2 className="font-medium text-sm mb-3">Mon plan</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Plan actuel</span>
          <span className="bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3 py-1 rounded-full">BUSINESS</span>
        </div>
      </div>
      <button onClick={logout} className="w-full btn-secondary text-sm">
        🚪 Déconnexion
      </button>
    </div>
  )
}
