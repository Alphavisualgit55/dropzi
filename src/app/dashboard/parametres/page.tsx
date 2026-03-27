'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

export default function ParametresPage() {
  const supabase = createClient()
  const [profil, setProfil] = useState<any>({ nom_boutique: '', telephone: '', adresse: '', logo_url: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfil(data) })
    })
  }, [])

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      nom_boutique: profil.nom_boutique,
      telephone: profil.telephone,
      adresse: profil.adresse,
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
      await supabase.from('profiles').update({ logo_url: publicUrl }).eq('id', user.id)
      setProfil((p: any) => ({ ...p, logo_url: publicUrl }))
    }
    setUploading(false)
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-medium">Paramètres boutique</h1>
      <p className="text-sm text-gray-400">Ces informations apparaissent dans tous tes rapports WhatsApp.</p>

      {/* Logo */}
      <div className="card space-y-4">
        <p className="text-sm font-medium">Logo de la boutique</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
            {profil.logo_url
              ? <img src={profil.logo_url} alt="Logo" className="w-full h-full object-cover" />
              : <span className="text-3xl">🏪</span>
            }
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()}
              className="btn-primary text-sm" disabled={uploading}>
              {uploading ? 'Upload...' : '📷 Choisir un logo'}
            </button>
            <p className="text-xs text-gray-400 mt-2">PNG ou JPG · Max 2MB<br/>Apparaît dans tes rapports WhatsApp</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
          </div>
        </div>
      </div>

      {/* Infos boutique */}
      <div className="card space-y-4">
        <p className="text-sm font-medium">Informations boutique</p>
        <div>
          <label className="label">Nom de la boutique *</label>
          <input className="input" value={profil.nom_boutique || ''} onChange={e => setProfil((p: any) => ({ ...p, nom_boutique: e.target.value }))}
            placeholder="Ex: Ma Boutique Dakar" />
          <p className="text-xs text-gray-400 mt-1">Apparaît en haut de tous tes rapports</p>
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input className="input" value={profil.telephone || ''} onChange={e => setProfil((p: any) => ({ ...p, telephone: e.target.value }))}
            placeholder="77 000 00 00" />
        </div>
        <div>
          <label className="label">Adresse</label>
          <input className="input" value={profil.adresse || ''} onChange={e => setProfil((p: any) => ({ ...p, adresse: e.target.value }))}
            placeholder="Dakar, Sénégal" />
        </div>
        <button onClick={save} disabled={saving}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${saved ? 'bg-green-500 text-white' : 'btn-primary'}`}>
          {saving ? 'Enregistrement...' : saved ? '✅ Enregistré !' : 'Sauvegarder'}
        </button>
      </div>

      {/* Aperçu rapport */}
      {profil.nom_boutique && (
        <div className="card">
          <p className="text-sm font-medium mb-3">Aperçu dans le rapport WhatsApp</p>
          <div className="bg-[#0C0C1E] rounded-xl p-4 font-mono text-xs text-green-400 whitespace-pre-line">
{`🛍️ *${(profil.nom_boutique || 'MA BOUTIQUE').toUpperCase()} — RAPPORT JOURNALIER*
📅 ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
━━━━━━━━━━━━━━━━━━━━━━━━`}
          </div>
        </div>
      )}
    </div>
  )
}
