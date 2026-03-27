'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

export default function LivraisonsPage() {
  const supabase = createClient()
  const [zones, setZones] = useState<any[]>([])
  const [livreurs, setLivreurs] = useState<any[]>([])
  const [tab, setTab] = useState<'zones' | 'livreurs'>('zones')
  const [loading, setLoading] = useState(true)
  const [newZone, setNewZone] = useState({ nom: '', cout_livraison: 0 })
  const [newLivreur, setNewLivreur] = useState({ nom: '', telephone: '', zone_id: '' })
  const [editZone, setEditZone] = useState<any>(null)

  async function load() {
    const [z, l] = await Promise.all([
      supabase.from('zones').select('*').order('nom'),
      supabase.from('livreurs').select('*, zones(nom)').eq('actif', true).order('nom'),
    ])
    setZones(z.data || [])
    setLivreurs(l.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addZone() {
    if (!newZone.nom.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('zones').insert({ nom: newZone.nom.trim(), cout_livraison: newZone.cout_livraison, user_id: user?.id })
    setNewZone({ nom: '', cout_livraison: 0 })
    load()
  }

  async function saveEditZone() {
    if (!editZone) return
    await supabase.from('zones').update({ nom: editZone.nom, cout_livraison: editZone.cout_livraison }).eq('id', editZone.id)
    setEditZone(null)
    load()
  }

  async function deleteZone(id: string) {
    if (!confirm('Supprimer cette zone ?')) return
    await supabase.from('zones').delete().eq('id', id)
    load()
  }

  async function addLivreur() {
    if (!newLivreur.nom.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('livreurs').insert({ ...newLivreur, zone_id: newLivreur.zone_id || null, user_id: user?.id })
    setNewLivreur({ nom: '', telephone: '', zone_id: '' })
    load()
  }

  async function deleteLivreur(id: string) {
    await supabase.from('livreurs').update({ actif: false }).eq('id', id)
    load()
  }

  async function updateLivreurZone(id: string, zone_id: string) {
    await supabase.from('livreurs').update({ zone_id: zone_id || null }).eq('id', id)
    load()
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" /></div>

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
          {/* Formulaire nouvelle zone */}
          <div className="card space-y-3">
            <p className="text-sm font-medium">Nouvelle zone</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nom de la zone</label>
                <input className="input" value={newZone.nom} onChange={e => setNewZone(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Dakar Centre" onKeyDown={e => e.key === 'Enter' && addZone()} />
              </div>
              <div>
                <label className="label">Coût de livraison (FCFA)</label>
                <input className="input" type="number" value={newZone.cout_livraison}
                  onChange={e => setNewZone(f => ({ ...f, cout_livraison: +e.target.value }))} placeholder="2000" />
              </div>
            </div>
            <button onClick={addZone} className="btn-primary text-sm w-full">+ Ajouter la zone</button>
          </div>

          {zones.length === 0 ? (
            <div className="card text-center py-8"><p className="text-gray-400 text-sm">Aucune zone définie</p></div>
          ) : zones.map(z => (
            <div key={z.id}>
              {editZone?.id === z.id ? (
                <div className="card border border-[#7F77DD] space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" value={editZone.nom} onChange={e => setEditZone({ ...editZone, nom: e.target.value })} />
                    <input className="input" type="number" value={editZone.cout_livraison} onChange={e => setEditZone({ ...editZone, cout_livraison: +e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEditZone} className="btn-primary text-sm flex-1">Sauvegarder</button>
                    <button onClick={() => setEditZone(null)} className="btn-secondary text-sm">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="font-medium text-sm">{z.nom}</p>
                      <p className="text-xs text-[#7F77DD] font-medium">{fmt(z.cout_livraison)} FCFA livraison</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditZone(z)} className="text-gray-400 hover:text-[#7F77DD] p-1.5 rounded-lg hover:bg-purple-50">✏️</button>
                    <button onClick={() => deleteZone(z.id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'livreurs' && (
        <div className="space-y-3">
          <div className="card space-y-3">
            <p className="text-sm font-medium">Nouveau livreur</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nom</label>
                <input className="input" value={newLivreur.nom} onChange={e => setNewLivreur(f => ({ ...f, nom: e.target.value }))} placeholder="Oumar Diop" />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input className="input" value={newLivreur.telephone} onChange={e => setNewLivreur(f => ({ ...f, telephone: e.target.value }))} placeholder="77 000 00 00" />
              </div>
            </div>
            <div>
              <label className="label">Zone assignée</label>
              <select className="input" value={newLivreur.zone_id} onChange={e => setNewLivreur(f => ({ ...f, zone_id: e.target.value }))}>
                <option value="">Toutes les zones</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
              </select>
            </div>
            <button onClick={addLivreur} className="btn-primary text-sm w-full">+ Ajouter le livreur</button>
          </div>

          {livreurs.length === 0 ? (
            <div className="card text-center py-8"><p className="text-gray-400 text-sm">Aucun livreur</p></div>
          ) : livreurs.map((l: any) => (
            <div key={l.id} className="card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#EEEDFE] flex items-center justify-center text-sm font-medium text-[#534AB7] flex-shrink-0">
                  {l.nom.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{l.nom}</p>
                  <p className="text-xs text-gray-400">{l.telephone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select className="input text-xs py-1 px-2 w-36" value={l.zone_id || ''} onChange={e => updateLivreurZone(l.id, e.target.value)}>
                  <option value="">Toutes zones</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
                </select>
                <button onClick={() => deleteLivreur(l.id)} className="text-red-400 hover:text-red-600 p-1">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
