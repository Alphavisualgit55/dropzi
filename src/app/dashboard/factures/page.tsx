'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TEMPLATES, InvoiceData } from '@/lib/invoice-templates'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function FacturesPage() {
  const supabase = createClient()
  const [factures, setFactures] = useState<any[]>([])
  const [commandes, setCommandes] = useState<any[]>([])
  const [profil, setProfil] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('dark')
  const [showTemplates, setShowTemplates] = useState(false)
  const [form, setForm] = useState({
    commande_id: '', client_nom: '', client_tel: '', client_adresse: '',
    notes: '', items: [{ description: '', quantite: 1, prix: 0 }], frais_livraison: 0,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfil(data))
    })
    charger()
  }, [])

  async function charger() {
    const [f, c] = await Promise.all([
      supabase.from('factures').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('commandes_detail').select('*').order('created_at', { ascending: false }).limit(100),
    ])
    setFactures(f.data || [])
    setCommandes(c.data || [])
    setLoading(false)
  }

  async function selectionnerCommande(cmdId: string) {
    if (!cmdId) { setForm(f => ({ ...f, commande_id: '' })); return }
    const cmd = commandes.find(c => c.id === cmdId)
    if (!cmd) return
    const { data: items } = await supabase.from('commande_items').select('*, produits(nom)').eq('commande_id', cmdId)
    const formItems = items?.map((i: any) => ({ description: i.produits?.nom || 'Produit', quantite: i.quantite, prix: i.prix_unitaire })) || [{ description: '', quantite: 1, prix: 0 }]
    setForm(f => ({ ...f, commande_id: cmdId, client_nom: cmd.client_nom || '', client_tel: cmd.client_tel || '', client_adresse: cmd.client_adresse || '', frais_livraison: cmd.cout_livraison || 0, items: formItems }))
  }

  function totalHT() { return form.items.reduce((s, i) => s + (i.prix * i.quantite), 0) }
  function totalTTC() { return totalHT() + (form.frais_livraison || 0) }

  async function creerFacture() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { count } = await supabase.from('factures').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const numero = 'FAC-' + new Date().getFullYear() + '-' + String((count || 0) + 1).padStart(4, '0')
    const { data: facture, error } = await supabase.from('factures').insert({
      user_id: user.id, numero,
      commande_id: form.commande_id || null,
      client_nom: form.client_nom || 'Client', client_tel: form.client_tel,
      client_adresse: form.client_adresse, montant_ht: totalHT(),
      frais_livraison: form.frais_livraison, montant_total: totalTTC(),
      notes: form.notes, statut: 'emise'
    }).select().single()
    if (error) { alert('Erreur : ' + error.message); setSaving(false); return }
    if (facture) {
      setPreview({ ...facture, items: form.items })
      setShowForm(false)
      setForm({ commande_id: '', client_nom: '', client_tel: '', client_adresse: '', notes: '', items: [{ description: '', quantite: 1, prix: 0 }], frais_livraison: 0 })
    }
    setSaving(false)
    charger()
  }

  async function supprimerFacture(id: string) {
    if (!confirm('Supprimer cette facture définitivement ?')) return
    await supabase.from('factures').delete().eq('id', id)
    if (preview?.id === id) setPreview(null)
    charger()
  }

  function addItem() { setForm(f => ({ ...f, items: [...f.items, { description: '', quantite: 1, prix: 0 }] })) }
  function updateItem(i: number, k: string, v: any) { setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items } }) }
  function removeItem(i: number) { setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })) }

  function getInvoiceData(f: any): InvoiceData {
    return {
      numero: f.numero,
      created_at: f.created_at,
      client_nom: f.client_nom || 'Client',
      client_tel: f.client_tel,
      client_adresse: f.client_adresse,
      boutique: profil?.nom_boutique || 'Ma Boutique',
      boutique_tel: profil?.telephone,
      items: f.items || [],
      montant_ht: f.montant_ht || 0,
      frais_livraison: f.frais_livraison || 0,
      montant_total: f.montant_total || 0,
      notes: f.notes,
    }
  }

  function imprimer(f: any) {
    const tpl = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0]
    const html = tpl.fn(getInvoiceData(f))
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  function texteWa(f: any) {
    const b = profil?.nom_boutique || 'Ma Boutique'
    let t = `🧾 *FACTURE ${f.numero}*\n🏪 ${b}\n📅 ${new Date(f.created_at).toLocaleDateString('fr-FR')}\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n👤 *${f.client_nom || 'Client'}*\n`
    if (f.client_tel) t += `📞 ${f.client_tel}\n`
    if (f.client_adresse) t += `📍 ${f.client_adresse}\n`
    t += `\n📦 *PRODUITS*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    ;(f.items || []).forEach((i: any) => { t += `• ${i.description} × ${i.quantite} = *${fmt(i.prix * i.quantite)} F*\n` })
    t += `\n💰 Sous-total : ${fmt(f.montant_ht)} F\n`
    if (f.frais_livraison > 0) t += `🚚 Livraison : ${fmt(f.frais_livraison)} F\n`
    t += `⸻\n✅ *TOTAL : ${fmt(f.montant_total)} FCFA*\n`
    if (f.notes) t += `\n📝 ${f.notes}\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n_Dropzi_`
    return t
  }

  function copierWa(f: any) {
    navigator.clipboard.writeText(texteWa(f)).then(() => { setCopied(f.id); setTimeout(() => setCopied(null), 2500) })
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Factures</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplates(!showTemplates)}
            className="btn-secondary text-sm">🎨 Modèle</button>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Nouvelle</button>
        </div>
      </div>

      {/* Sélecteur de modèle */}
      {showTemplates && (
        <div className="card border-2 border-[#7F77DD]">
          <p className="font-medium text-sm mb-3">🎨 Choisir un modèle de facture</p>
          <div className="grid grid-cols-1 gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setShowTemplates(false) }}
                style={{ background: selectedTemplate === t.id ? '#EEEDFE' : '#F8F8FC', border: `1.5px solid ${selectedTemplate === t.id ? '#7F77DD' : '#e8e8f0'}`, borderRadius: 12, padding: '12px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: selectedTemplate === t.id ? 700 : 500, color: selectedTemplate === t.id ? '#534AB7' : '#333' }}>{t.name}</span>
                {selectedTemplate === t.id && <span style={{ color: '#7F77DD', fontWeight: 700 }}>✓ Actif</span>}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Modèle actif : <strong>{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</strong></p>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="card border-2 border-[#7F77DD] space-y-3">
          <h2 className="font-medium text-sm">Nouvelle facture</h2>
          <div>
            <label className="label">Pré-remplir depuis une commande</label>
            <select className="input" value={form.commande_id} onChange={e => selectionnerCommande(e.target.value)}>
              <option value="">Choisir une commande...</option>
              {commandes.slice(0, 50).map(c => (
                <option key={c.id} value={c.id}>{c.numero_commande || c.id.slice(0, 8)} — {c.client_nom || 'Client'} — {fmt(c.total_vente || 0)} F</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nom client *</label><input className="input" value={form.client_nom} onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))} placeholder="Fatou Diallo" /></div>
            <div><label className="label">Téléphone</label><input className="input" value={form.client_tel} onChange={e => setForm(f => ({ ...f, client_tel: e.target.value }))} placeholder="77 000 00 00" /></div>
          </div>
          <div><label className="label">Adresse</label><input className="input" value={form.client_adresse} onChange={e => setForm(f => ({ ...f, client_adresse: e.target.value }))} placeholder="Rue 10, Médina" /></div>
          <div>
            <label className="label">Produits *</label>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <input className="input col-span-2 text-sm" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description" />
                  <input className="input text-sm" type="number" min="1" value={item.quantite} onChange={e => updateItem(i, 'quantite', +e.target.value)} placeholder="Qté" />
                  <input className="input text-sm" type="number" min="0" value={item.prix || ''} onChange={e => updateItem(i, 'prix', +e.target.value)} placeholder="Prix F" />
                  {form.items.length > 1 ? <button onClick={() => removeItem(i)} className="text-red-400 text-sm text-center">✕</button> : <span />}
                </div>
              ))}
            </div>
            <button onClick={addItem} className="text-[#7F77DD] text-sm mt-2 hover:underline">+ Ajouter une ligne</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Frais livraison (F)</label><input className="input" type="number" min="0" value={form.frais_livraison} onChange={e => setForm(f => ({ ...f, frais_livraison: +e.target.value }))} /></div>
            <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Paiement à réception..." /></div>
          </div>
          <div className="bg-[#EEEDFE] rounded-xl p-4 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Sous-total</span><span className="font-medium">{fmt(totalHT())} F</span></div>
            {form.frais_livraison > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Livraison</span><span>{fmt(form.frais_livraison)} F</span></div>}
            <div className="flex justify-between font-bold pt-1 border-t border-purple-200 text-[#534AB7]"><span>Total</span><span className="text-lg">{fmt(totalTTC())} FCFA</span></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Annuler</button>
            <button onClick={creerFacture} disabled={saving || !form.client_nom || form.items.every(i => !i.description)} className="btn-primary text-sm">
              {saving ? '⏳...' : '✓ Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Aperçu facture créée */}
      {preview && (
        <div className="card border-2 border-[#7F77DD] space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">✅ Facture créée — {preview.numero}</p>
            <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>
          <div style={{ background: '#F8F8FC', borderRadius: 12, padding: '12px 16px' }}>
            <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Client</span><span className="font-medium">{preview.client_nom}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span><span className="font-bold text-[#7F77DD] text-base">{fmt(preview.montant_total)} FCFA</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => copierWa(preview)} style={{ flex: 1, background: copied === preview.id ? '#1D9E75' : '#25D366', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {copied === preview.id ? '✅ Copié !' : '📋 Copier WhatsApp'}
            </button>
            <button onClick={() => imprimer(preview)} style={{ flex: 1, background: '#EEEDFE', color: '#534AB7', border: 'none', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              📄 Imprimer PDF
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>
            Modèle : {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
          </p>
        </div>
      )}

      {/* Liste factures */}
      {factures.length === 0 && !preview ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-gray-500 font-medium">Aucune facture encore</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-4">+ Créer ma première facture</button>
        </div>
      ) : (
        <div className="space-y-3">
          {factures.map(f => (
            <div key={f.id} className="card flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{f.numero}</span>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Émise</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{f.client_nom || 'Client'}{f.client_tel ? ` · ${f.client_tel}` : ''}</p>
                <p className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <p className="font-medium text-sm flex-shrink-0">{fmt(f.montant_total)} F</p>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setPreview({ ...f, items: [] })} className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-[#7F77DD] text-base" title="Voir">👁️</button>
                <button onClick={() => copierWa({ ...f, items: [] })} className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 text-base" title="WhatsApp">📋</button>
                <button onClick={() => imprimer({ ...f, items: [] })} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 text-base" title="PDF">📄</button>
                <button onClick={() => supprimerFacture(f.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 text-base" title="Supprimer">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
