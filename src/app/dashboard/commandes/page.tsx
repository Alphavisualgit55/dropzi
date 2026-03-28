'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const STATUT_LABEL: Record<string, string> = {
  en_attente: '⏳ En attente', en_livraison: '🚚 En livraison',
  livre: '✅ Livré', annule: '❌ Annulé', echec: '⚠️ Échec'
}
const STATUTS = ['en_attente', 'en_livraison', 'livre', 'annule', 'echec']
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

export default function CommandesPage() {
  const supabase = createClient()
  const [commandes, setCommandes] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [livreurs, setLivreurs] = useState<any[]>([])
  const [produits, setProduits] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filtre, setFiltre] = useState('tous')

  const [form, setForm] = useState({
    telephone: '', nom: '', adresse: '',
    zone_id: '', livreur_id: '', notes: '',
    items: [{ produit_id: '', quantite: 1 }]
  })

  async function load() {
    const [c, z, l, p] = await Promise.all([
      supabase.from('commandes_detail').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('zones').select('*').order('nom'),
      supabase.from('livreurs').select('*').eq('actif', true).order('nom'),
      supabase.from('produits').select('*').eq('actif', true).order('nom'),
    ])
    setCommandes(c.data || [])
    setZones(z.data || [])
    setLivreurs(l.data || [])
    setProduits(p.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('cmd').on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Quand zone change → auto-remplir coût livraison
  const selectedZone = zones.find(z => z.id === form.zone_id)
  const coutLivraison = selectedZone?.cout_livraison || 0

  // Livreurs filtrés par zone sélectionnée
  const livreursZone = form.zone_id
    ? livreurs.filter(l => l.zone_id === form.zone_id || !l.zone_id)
    : livreurs

  const totalForm = form.items.reduce((s, it) => {
    const p = produits.find(p => p.id === it.produit_id)
    return s + (p ? p.prix_vente * it.quantite : 0)
  }, 0)

  const beneficeForm = totalForm - form.items.reduce((s, it) => {
    const p = produits.find(p => p.id === it.produit_id)
    return s + (p ? p.cout_achat * it.quantite : 0)
  }, 0) - coutLivraison

  async function supprimerCommande(id: string) {
    if (!confirm('Supprimer cette commande définitivement ?')) return
    await supabase.from('commande_items').delete().eq('commande_id', id)
    await supabase.from('commandes').delete().eq('id', id)
    load()
  }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let client_id: string | null = null
    if (form.telephone || form.nom) {
      const { data: nc } = await supabase.from('clients').insert({
        user_id: user.id,
        nom: form.nom || form.telephone || 'Client',
        telephone: form.telephone,
        adresse: form.adresse
      }).select('id').single()
      client_id = nc?.id || null
    }

    const { data: cmd } = await supabase.from('commandes').insert({
      user_id: user.id, client_id,
      zone_id: form.zone_id || null,
      livreur_id: form.livreur_id || null,
      cout_livraison: coutLivraison,
      notes: form.notes,
    }).select('id').single()

    if (cmd) {
      const items = form.items.filter(i => i.produit_id).map(i => {
        const prod = produits.find(p => p.id === i.produit_id)!
        return { commande_id: cmd.id, produit_id: i.produit_id, quantite: i.quantite, prix_unitaire: prod.prix_vente, cout_unitaire: prod.cout_achat }
      })
      if (items.length) await supabase.from('commande_items').insert(items)
    }

    setShowForm(false)
    setForm({ telephone: '', nom: '', adresse: '', zone_id: '', livreur_id: '', notes: '', items: [{ produit_id: '', quantite: 1 }] })
    setSaving(false)
    load()
  }

  async function updateStatut(id: string, statut: string) {
    await supabase.from('commandes').update({ statut, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  function addItem() { setForm(f => ({ ...f, items: [...f.items, { produit_id: '', quantite: 1 }] })) }
  function updateItem(i: number, k: string, v: any) {
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items } })
  }
  function removeItem(i: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  }

  const commandesFiltrees = filtre === 'tous' ? commandes : commandes.filter(c => c.statut === filtre)

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Commandes</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Nouvelle</button>
      </div>

      {/* Formulaire rapide */}
      {showForm && (
        <div className="card border-2 border-[#7F77DD] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Nouvelle commande</h2>
            <span className="text-xs text-gray-400">Seul le produit est obligatoire</span>
          </div>

          {/* Client optionnel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Téléphone (optionnel)</label>
              <input className="input" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="77 000 00 00" />
            </div>
            <div>
              <label className="label">Nom (optionnel)</label>
              <input className="input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Fatou Diallo" />
            </div>
          </div>
          <div>
            <label className="label">Adresse (optionnel)</label>
            <input className="input" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Rue 10, Médina" />
          </div>

          {/* Zone → coût auto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Zone de livraison</label>
              <select className="input" value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value, livreur_id: '' }))}>
                <option value="">Choisir une zone</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.nom} — {fmt(z.cout_livraison)} F</option>)}
              </select>
            </div>
            <div>
              <label className="label">Coût livraison (auto)</label>
              <div className="input bg-gray-50 text-gray-600">{fmt(coutLivraison)} FCFA</div>
            </div>
          </div>

          {/* Livreur filtré par zone */}
          <div>
            <label className="label">Livreur {form.zone_id ? '(zone sélectionnée)' : ''}</label>
            <select className="input" value={form.livreur_id} onChange={e => setForm(f => ({ ...f, livreur_id: e.target.value }))}>
              <option value="">Choisir un livreur</option>
              {livreursZone.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
            </select>
          </div>

          {/* Produits */}
          <div>
            <label className="label">Produits *</label>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select className="input flex-1" value={item.produit_id} onChange={e => updateItem(i, 'produit_id', e.target.value)}>
                    <option value="">Choisir un produit</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom} — {fmt(p.prix_vente)} F (stock: {p.stock_total})</option>)}
                  </select>
                  <input className="input w-16" type="number" min="1" value={item.quantite} onChange={e => updateItem(i, 'quantite', +e.target.value)} />
                  {form.items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1">✕</button>}
                </div>
              ))}
            </div>
            <button onClick={addItem} className="text-[#7F77DD] text-sm mt-2 hover:underline">+ Ajouter produit</button>
          </div>

          <div>
            <label className="label">Notes</label>
            <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Instructions spéciales..." />
          </div>

          {/* Récap */}
          {totalForm > 0 && (
            <div className="bg-[#EEEDFE] rounded-xl p-4">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Total vente</span><span className="font-medium">{fmt(totalForm)} F</span></div>
              <div className="flex justify-between text-sm mt-1"><span className="text-gray-600">Livraison</span><span className="text-red-500">- {fmt(coutLivraison)} F</span></div>
              <div className="flex justify-between text-sm mt-1 pt-2 border-t border-purple-200"><span className="font-medium text-[#534AB7]">Bénéfice estimé</span><span className="font-medium text-green-600">{fmt(beneficeForm)} F</span></div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Annuler</button>
            <button onClick={save} disabled={saving || !form.items.some(i => i.produit_id)} className="btn-primary text-sm">
              {saving ? 'Enregistrement...' : '✓ Créer commande'}
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[['tous', 'Toutes'], ['en_attente', '⏳ En attente'], ['en_livraison', '🚚 En livraison'], ['livre', '✅ Livrées'], ['annule', '❌ Annulées']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFiltre(val)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${filtre === val ? 'bg-[#7F77DD] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Liste */}
      {commandesFiltrees.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-500">Aucune commande</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-4">+ Créer la première</button>
        </div>
      ) : (
        <div className="space-y-3">
          {commandesFiltrees.map((c: any) => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{c.numero_commande}</span>
                    <span className={`badge-${c.statut}`}>{STATUT_LABEL[c.statut]}</span>
                  </div>
                  <p className="font-medium text-sm mt-1">{c.client_nom || c.client_tel || 'Client anonyme'}</p>
                  <p className="text-xs text-gray-400">{c.zone_nom || '—'} {c.livreur_nom ? `· ${c.livreur_nom}` : ''}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{new Date(c.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium">{fmt(c.total_vente || 0)} F</p>
                  {c.statut === 'livre'
                    ? <p className="text-xs text-green-600 font-medium">+{fmt(c.benefice || 0)} F bénéf.</p>
                    : <p className="text-xs text-gray-400">—</p>
                  }
                </div>
              </div>
              {/* Statuts rapides */}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                {STATUTS.map(s => (
                  <button key={s} onClick={() => updateStatut(c.id, s)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${c.statut === s ? 'bg-[#7F77DD] text-white border-[#7F77DD]' : 'border-gray-200 text-gray-400 hover:border-[#7F77DD] hover:text-[#7F77DD]'}`}>
                    {STATUT_LABEL[s]}
                  </button>
                ))}
                <button onClick={() => supprimerCommande(c.id)}
                  className="ml-auto text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 transition-colors">
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
