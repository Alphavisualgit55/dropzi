'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Produit } from '@/types'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

export default function ProduitsPage() {
  const supabase = createClient()
  const [produits, setProduits] = useState<Produit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nom: '', prix_vente: 0, cout_achat: 0, stock_total: 0 })

  async function load() {
    const { data } = await supabase.from('produits_avec_marge').select('*').eq('actif', true).order('created_at', { ascending: false })
    setProduits((data || []) as Produit[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditId(null); setForm({ nom:'', prix_vente:0, cout_achat:0, stock_total:0 }); setShowForm(true) }
  function openEdit(p: Produit) { setEditId(p.id); setForm({ nom:p.nom, prix_vente:p.prix_vente, cout_achat:p.cout_achat, stock_total:p.stock_total }); setShowForm(true) }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (editId) {
      await supabase.from('produits').update(form).eq('id', editId)
    } else {
      await supabase.from('produits').insert({ ...form, user_id: user.id })
    }
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    await supabase.from('produits').update({ actif: false }).eq('id', id)
    load()
  }

  const marge = form.prix_vente > 0 ? Math.round((form.prix_vente - form.cout_achat) * 100 / form.prix_vente) : 0

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Produits</h1>
        <button onClick={openNew} className="btn-primary text-sm">+ Nouveau</button>
      </div>

      {showForm && (
        <div className="card border border-[#7F77DD] space-y-4">
          <h2 className="font-medium text-sm">{editId ? 'Modifier produit' : 'Nouveau produit'}</h2>
          <div>
            <label className="label">Nom du produit *</label>
            <input className="input" value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} placeholder="Ex: Robe wax taille M"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prix de vente (FCFA)</label>
              <input className="input" type="number" value={form.prix_vente} onChange={e => setForm(f => ({...f, prix_vente: +e.target.value}))}/>
            </div>
            <div>
              <label className="label">Coût d'achat (FCFA)</label>
              <input className="input" type="number" value={form.cout_achat} onChange={e => setForm(f => ({...f, cout_achat: +e.target.value}))}/>
            </div>
          </div>
          <div>
            <label className="label">Stock initial</label>
            <input className="input" type="number" value={form.stock_total} onChange={e => setForm(f => ({...f, stock_total: +e.target.value}))}/>
          </div>
          {form.prix_vente > 0 && (
            <div className={`text-sm p-3 rounded-xl ${marge >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              Marge : {fmt(form.prix_vente - form.cout_achat)} FCFA ({marge}%)
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Annuler</button>
            <button onClick={save} disabled={saving || !form.nom} className="btn-primary text-sm">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {produits.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="text-gray-500">Aucun produit encore</p>
          <button onClick={openNew} className="btn-primary text-sm mt-4">Ajouter le premier</button>
        </div>
      ) : (
        <div className="space-y-3">
          {produits.map(p => (
            <div key={p.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEEDFE] flex items-center justify-center text-lg flex-shrink-0">🛍️</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.nom}</p>
                <p className="text-xs text-gray-400">Coût : {fmt(p.cout_achat)} F · Marge : {(p as any).marge_pct ?? 0}%</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-medium text-sm">{fmt(p.prix_vente)} F</p>
                <p className={`text-xs ${p.stock_total <= 5 ? 'text-red-500' : 'text-gray-400'}`}>Stock : {p.stock_total}</p>
              </div>
              <div className="flex gap-1 ml-1">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 text-sm">✏️</button>
                <button onClick={() => supprimer(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 text-sm">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
