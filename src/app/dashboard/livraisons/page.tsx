'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LivraisonsPage() {
  const supabase = createClient()
  const [zones, setZones] = useState<any[]>([])
  const [livreurs, setLivreurs] = useState<any[]>([])
  const [tab, setTab] = useState<'zones' | 'livreurs'>('zones')
  const [loading, setLoading] = useState(true)
  const [newZone, setNewZone] = useState('')
  const [newLivreur, setNewLivreur] = useState({ nom: '', telephone: '' })

  async function load() {
    const [z, l] = await Promise.all([
      supabase.from('zones').select('*').order('nom'),
      supabase.from('livreurs').select('*').eq('actif', true).order('nom'),
    ])
    setZones(z.data || [])
    setLivreurs(l.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addZone() {
    if (!newZone.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('zones').insert({ nom: newZone.trim(), user_id: user?.id })
    setNewZone('')
    load()
  }

  async function addLivreur() {
    if (!newLivreur.nom.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('livreurs').insert({ ...newLivreur, user_id: user?.id })
    setNewLivreur({ nom: '', telephone: '' })
    load()
  }

  async function deleteZone(id: string) {
    if (!confirm('Supprimer cette zone ?')) return
    await supabase.from('zones').delete().eq('id', id)
    load()
  }

  async function deleteLivreur(id: string) {
    await supabase.from('livreurs').update({ actif: false }).eq('id', id)
    load()
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-medium">Livraisons</h1>

      <div className="flex gap-2">
        {(['zones', 'livreurs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-[#7F77DD] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {t === 'zones' ? '📍 Zones' : '🛵 Livreurs'}
          </button>
        ))}
      </div>

      {tab === 'zones' && (
        <div className="space-y-3">
          <div className="card flex gap-2">
            <input className="input flex-1" value={newZone} onChange={e => setNewZone(e.target.value)}
              placeholder="Nom de la zone (ex: Dakar Centre)" onKeyDown={e => e.key === 'Enter' && addZone()}/>
            <button onClick={addZone} className="btn-primary text-sm">Ajouter</button>
          </div>
          {zones.length === 0 ? (
            <div className="card text-center py-8"><p className="text-gray-400 text-sm">Aucune zone définie</p></div>
          ) : zones.map(z => (
            <div key={z.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📍</span>
                <p className="font-medium text-sm">{z.nom}</p>
              </div>
              <button onClick={() => deleteZone(z.id)} className="text-red-400 hover:text-red-600 text-sm p-1">🗑️</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'livreurs' && (
        <div className="space-y-3">
          <div className="card space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Nom livreur</label>
                <input className="input" value={newLivreur.nom} onChange={e => setNewLivreur(f => ({...f, nom: e.target.value}))} placeholder="Oumar Diop"/>
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input className="input" value={newLivreur.telephone} onChange={e => setNewLivreur(f => ({...f, telephone: e.target.value}))} placeholder="77 000 00 00"/>
              </div>
            </div>
            <button onClick={addLivreur} className="btn-primary text-sm w-full">+ Ajouter livreur</button>
          </div>
          {livreurs.length === 0 ? (
            <div className="card text-center py-8"><p className="text-gray-400 text-sm">Aucun livreur</p></div>
          ) : livreurs.map(l => (
            <div key={l.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EEEDFE] flex items-center justify-center text-xs font-medium text-[#534AB7]">
                  {l.nom.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{l.nom}</p>
                  <p className="text-xs text-gray-400">{l.telephone || '—'}</p>
                </div>
              </div>
              <button onClick={() => deleteLivreur(l.id)} className="text-red-400 hover:text-red-600 text-sm p-1">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
