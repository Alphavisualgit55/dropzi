'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function ProduitsPage() {
  const supabase = createClient()
  const [produits, setProduits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({ nom: '', prix_vente: '', cout_achat: '', stock_total: '', image_url: '' })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      charger(user.id)
    })
  }, [])

  async function charger(uid: string) {
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('user_id', uid)
      .eq('actif', true)
      .order('created_at', { ascending: false })
    if (!error) setProduits(data || [])
    setLoading(false)
  }

  async function uploadImage(file: File) {
    if (!userId) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `produits/${userId}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('images').upload(path, file, { upsert: true })
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
      setForm(f => ({ ...f, image_url: urlData.publicUrl }))
    }
    setUploading(false)
  }

  async function sauvegarder() {
    if (!userId || !form.nom || !form.prix_vente) return
    setSaving(true)
    const payload = {
      user_id: userId,
      nom: form.nom,
      prix_vente: +form.prix_vente,
      cout_achat: +(form.cout_achat || 0),
      stock_total: +(form.stock_total || 0),
      image_url: form.image_url || null,
      actif: true,
    }
    if (editId) {
      await supabase.from('produits').update(payload).eq('id', editId).eq('user_id', userId)
    } else {
      const { error: prodError } = await supabase.from('produits').insert(payload)
    if (prodError) {
      if (prodError.code === '42501' || prodError.message?.includes('check_plan_limit') || prodError.message?.includes('new row')) {
        alert('🚫 Limite de produits atteinte ! Upgrade ton plan pour ajouter plus de produits.')
        window.location.href = '/dashboard/abonnement'
        return
      } else {
        alert('Erreur : ' + prodError.message)
        return
      }
    }
    }
    setForm({ nom: '', prix_vente: '', cout_achat: '', stock_total: '', image_url: '' })
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    charger(userId)
  }

  async function supprimer(id: string) {
    if (!userId || !confirm('Supprimer ce produit ?')) return
    await supabase.from('produits').update({ actif: false }).eq('id', id).eq('user_id', userId)
    charger(userId)
  }

  function editer(p: any) {
    setForm({ nom: p.nom, prix_vente: String(p.prix_vente), cout_achat: String(p.cout_achat), stock_total: String(p.stock_total), image_url: p.image_url || '' })
    setEditId(p.id)
    setShowForm(true)
  }

  function annuler() {
    setForm({ nom: '', prix_vente: '', cout_achat: '', stock_total: '', image_url: '' })
    setEditId(null)
    setShowForm(false)
  }

  const marge = (p: any) => p.prix_vente > 0 ? Math.round((p.prix_vente - p.cout_achat) * 100 / p.prix_vente) : 0

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Produits</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Nouveau</button>
      </div>

      {showForm && (
        <div className="card border-2 border-[#7F77DD] space-y-3">
          <h2 className="font-medium text-sm">{editId ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          {/* Photo produit */}
          <div>
            <label className="label">Photo du produit</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: 16, background: '#F0F0F8', border: '2px dashed #CECBF6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {form.image_url ? <img src={form.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ fontSize: 28 }}>📷</span>}
              </div>
              <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]) }} style={{ display: 'none' }} id="img-upload" />
                <label htmlFor="img-upload" style={{ display: 'inline-block', background: uploading ? '#ccc' : '#EEEDFE', color: '#534AB7', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {uploading ? '⏳ Upload...' : '📷 Choisir une photo'}
                </label>
                {form.image_url && <button onClick={() => setForm(f => ({ ...f, image_url: '' }))} style={{ display: 'block', color: '#E24B4A', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', marginTop: 6 }}>Supprimer la photo</button>}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Nom du produit *</label>
            <input className="input" value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: Bracelet doré" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Prix de vente (F) *</label>
              <input className="input" type="number" min="0" value={form.prix_vente}
                onChange={e => setForm(f => ({ ...f, prix_vente: e.target.value }))}
                placeholder="10000" />
            </div>
            <div>
              <label className="label">Coût d'achat (F)</label>
              <input className="input" type="number" min="0" value={form.cout_achat}
                onChange={e => setForm(f => ({ ...f, cout_achat: e.target.value }))}
                placeholder="5000" />
            </div>
            <div>
              <label className="label">Stock initial</label>
              <input className="input" type="number" min="0" value={form.stock_total}
                onChange={e => setForm(f => ({ ...f, stock_total: e.target.value }))}
                placeholder="50" />
            </div>
          </div>
          {form.prix_vente && form.cout_achat && (
            <div className="bg-[#EEEDFE] rounded-xl px-4 py-2 text-sm text-[#534AB7] font-medium">
              Marge : {Math.round(((+form.prix_vente - +form.cout_achat) / +form.prix_vente) * 100)}% · Bénéfice : {fmt(+form.prix_vente - +form.cout_achat)} F
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={annuler} className="btn-secondary text-sm">Annuler</button>
            <button onClick={sauvegarder} disabled={saving || !form.nom || !form.prix_vente} className="btn-primary text-sm">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {produits.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="text-gray-500 font-medium">Aucun produit encore</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-4">
            Ajouter mon premier produit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {produits.map(p => (
            <div key={p.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEEDFE] flex items-center justify-center text-lg flex-shrink-0">🛍️</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{p.nom}</p>
                <p className="text-xs text-gray-400 mt-0.5">Coût : {fmt(p.cout_achat)} F · Marge : {marge(p)}%</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-medium text-sm">{fmt(p.prix_vente)} F</p>
                <p className={`text-xs mt-0.5 font-medium ${p.stock_total <= 5 ? 'text-red-500' : 'text-gray-400'}`}>Stock : {p.stock_total}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => editer(p)} className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-[#7F77DD]">✏️</button>
                <button onClick={() => supprimer(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
