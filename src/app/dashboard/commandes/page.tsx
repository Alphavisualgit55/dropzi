'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Commande, Zone, Livreur, Produit, Client } from '@/types'

const STATUTS = ['en_attente','en_livraison','livre','annule','echec']
const STATUT_LABEL: Record<string, string> = {
  en_attente: 'En attente', en_livraison: 'En livraison',
  livre: 'Livré', annule: 'Annulé', echec: 'Échec'
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

export default function CommandesPage() {
  const supabase = createClient()
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [livreurs, setLivreurs] = useState<Livreur[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    client_nom: '', client_tel: '', client_adresse: '',
    zone_id: '', livreur_id: '', cout_livraison: 0, notes: '',
    items: [{ produit_id: '', quantite: 1 }]
  })

  async function load() {
    const [c, z, l, p] = await Promise.all([
      supabase.from('commandes_detail').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('zones').select('*'),
      supabase.from('livreurs').select('*').eq('actif', true),
      supabase.from('produits').select('*').eq('actif', true),
    ])
    setCommandes((c.data || []) as Commande[])
    setZones((z.data || []) as Zone[])
    setLivreurs((l.data || []) as Livreur[])
    setProduits((p.data || []) as Produit[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let client_id: string | null = null
    if (form.client_nom) {
      const { data: existing } = await supabase.from('clients')
        .select('id').eq('telephone', form.client_tel).eq('user_id', user.id).single()
      if (existing) { client_id = existing.id }
      else {
        const { data: nc } = await supabase.from('clients').insert({
          user_id: user.id, nom: form.client_nom,
          telephone: form.client_tel, adresse: form.client_adresse
        }).select('id').single()
        client_id = nc?.id || null
      }
    }

    const { data: cmd } = await supabase.from('commandes').insert({
      user_id: user.id, client_id,
      zone_id: form.zone_id || null,
      livreur_id: form.livreur_id || null,
      cout_livraison: form.cout_livraison,
      notes: form.notes,
    }).select('id').single()

    if (cmd) {
      const items = form.items.filter(i => i.produit_id).map(i => {
        const prod = produits.find(p => p.id === i.produit_id)!
        return { commande_id: cmd.id, produit_id: i.produit_id,
          quantite: i.quantite, prix_unitaire: prod.prix_vente, cout_unitaire: prod.cout_achat }
      })
      if (items.length) await supabase.from('commande_items').insert(items)
    }

    setShowForm(false)
    setForm({ client_nom:'', client_tel:'', client_adresse:'', zone_id:'', livreur_id:'', cout_livraison:0, notes:'', items:[{ produit_id:'', quantite:1 }] })
    setSaving(false)
    load()
  }

  async function updateStatut(id: string, statut: string) {
    await supabase.from('commandes').update({ statut }).eq('id', id)
    load()
  }

  function addItem() { setForm(f => ({ ...f, items: [...f.items, { produit_id: '', quantite: 1 }] })) }
  function updateItem(i: number, k: string, v: any) {
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items } })
  }

  const totalForm = form.items.reduce((s, it) => {
    const p = produits.find(p => p.id === it.produit_id)
    return s + (p ? p.prix_vente * it.quantite : 0)
  }, 0)

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Commandes</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Nouvelle</button>
      </div>

      {/* Formulaire nouvelle commande */}
      {showForm && (
        <div className="card space-y-4 border-[#7F77DD] border">
          <h2 className="font-medium text-sm">Nouvelle commande</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nom client *</label>
              <input className="input" value={form.client_nom} onChange={e => setForm(f => ({...f, client_nom: e.target.value}))} placeholder="Fatou Diallo"/>
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={form.client_tel} onChange={e => setForm(f => ({...f, client_tel: e.target.value}))} placeholder="77 000 00 00"/>
            </div>
          </div>
          <div>
            <label className="label">Adresse</label>
            <input className="input" value={form.client_adresse} onChange={e => setForm(f => ({...f, client_adresse: e.target.value}))} placeholder="Rue 10, Médina"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Zone de livraison</label>
              <select className="input" value={form.zone_id} onChange={e => setForm(f => ({...f, zone_id: e.target.value}))}>
                <option value="">Choisir une zone</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Livreur</label>
              <select className="input" value={form.livreur_id} onChange={e => setForm(f => ({...f, livreur_id: e.target.value}))}>
                <option value="">Choisir</option>
                {livreurs.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Frais de livraison (FCFA)</label>
            <input className="input" type="number" value={form.cout_livraison} onChange={e => setForm(f => ({...f, cout_livraison: +e.target.value}))}/>
          </div>

          {/* Produits */}
          <div>
            <label className="label">Produits</label>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <select className="input flex-1" value={item.produit_id} onChange={e => updateItem(i, 'produit_id', e.target.value)}>
                    <option value="">Choisir un produit</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom} — {fmt(p.prix_vente)} F</option>)}
                  </select>
                  <input className="input w-20" type="number" min="1" value={item.quantite} onChange={e => updateItem(i, 'quantite', +e.target.value)}/>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="text-[#7F77DD] text-sm mt-2 hover:underline">+ Ajouter un produit</button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Total commande</p>
              <p className="text-lg font-medium">{fmt(totalForm)} FCFA</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Annuler</button>
              <button onClick={save} disabled={saving || !form.client_nom} className="btn-primary text-sm">
                {saving ? 'Enregistrement...' : 'Créer commande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste commandes */}
      {commandes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-500">Aucune commande encore</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-4">Créer la première</button>
        </div>
      ) : (
        <div className="space-y-3">
          {commandes.map((c: any) => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{c.client_nom || 'Client'}</p>
                    <span className={`badge-${c.statut}`}>{STATUT_LABEL[c.statut]}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{c.zone_nom || '—'} · {c.client_tel || ''}</p>
                  <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium text-sm">{fmt(c.total_vente || 0)} F</p>
                  <p className="text-xs text-green-600">+{fmt(c.benefice || 0)} F</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex gap-2 flex-wrap">
                {STATUTS.map(s => (
                  <button key={s} onClick={() => updateStatut(c.id, s)}
                    className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                      c.statut === s ? 'bg-[#7F77DD] text-white border-[#7F77DD]' : 'border-gray-200 text-gray-500 hover:border-[#7F77DD] hover:text-[#7F77DD]'
                    }`}>
                    {STATUT_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
