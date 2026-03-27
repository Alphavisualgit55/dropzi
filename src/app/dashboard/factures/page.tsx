'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

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
      client_nom: form.client_nom || 'Client',
      client_tel: form.client_tel, client_adresse: form.client_adresse,
      montant_ht: totalHT(), frais_livraison: form.frais_livraison,
      montant_total: totalTTC(), notes: form.notes, statut: 'emise'
    }).select().single()

    if (error) { alert('Erreur : ' + error.message); setSaving(false); return }
    if (facture) {
      setPreview({ ...facture, items: form.items, profil })
      setShowForm(false)
      setForm({ commande_id: '', client_nom: '', client_tel: '', client_adresse: '', notes: '', items: [{ description: '', quantite: 1, prix: 0 }], frais_livraison: 0 })
    }
    setSaving(false)
    charger()
  }

  function addItem() { setForm(f => ({ ...f, items: [...f.items, { description: '', quantite: 1, prix: 0 }] })) }
  function updateItem(i: number, k: string, v: any) { setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items } }) }
  function removeItem(i: number) { setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })) }

  function texteWa(f: any) {
    const b = profil?.nom_boutique || 'Ma Boutique'
    let t = `🧾 *FACTURE ${f.numero}*\n🏪 ${b}\n📅 ${new Date(f.created_at).toLocaleDateString('fr-FR')}\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n👤 *${f.client_nom || 'Client'}*\n`
    if (f.client_tel) t += `📞 ${f.client_tel}\n`
    if (f.client_adresse) t += `📍 ${f.client_adresse}\n`
    t += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📦 *PRODUITS*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    ;(f.items || []).forEach((i: any) => { t += `• ${i.description} × ${i.quantite} = *${fmt(i.prix * i.quantite)} F*\n` })
    t += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n`
    t += `💰 Sous-total : ${fmt(f.montant_ht)} F\n`
    if (f.frais_livraison > 0) t += `🚚 Livraison : ${fmt(f.frais_livraison)} F\n`
    t += `⸻\n✅ *TOTAL : ${fmt(f.montant_total)} FCFA*\n`
    if (f.notes) t += `\n📝 ${f.notes}\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n_Dropzi_`
    return t
  }

  function copierWa(f: any) {
    navigator.clipboard.writeText(texteWa(f)).then(() => { setCopied(f.id); setTimeout(() => setCopied(null), 2500) })
  }

  function imprimerPDF(f: any) {
    const b = profil?.nom_boutique || 'Ma Boutique'
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Facture ${f.numero}</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:system-ui,sans-serif;padding:48px;max-width:720px;margin:0 auto;color:#1a1a2e;}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:3px solid #7F77DD;}
.logo-icon{width:48px;height:48px;background:linear-gradient(135deg,#7F77DD,#534AB7);border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:800;margin-bottom:8px;}
.logo-name{font-size:22px;font-weight:800;}.logo-sub{font-size:13px;color:#888;margin-top:2px;}
.inv-num{font-size:26px;font-weight:800;color:#7F77DD;text-align:right;}.inv-date{font-size:13px;color:#888;text-align:right;margin-top:4px;}
.badge{display:inline-block;background:#E1F5EE;color:#0F6E56;font-size:11px;font-weight:600;padding:3px 12px;border-radius:20px;margin-top:8px;}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:36px;}
.plbl{font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;}
.pname{font-size:17px;font-weight:700;}.pdet{font-size:13px;color:#666;margin-top:4px;}
table{width:100%;border-collapse:collapse;margin-bottom:28px;}
thead tr{background:#F8F8FC;}th{padding:11px 14px;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.06em;}
th:last-child,td:last-child{text-align:right;}td{padding:13px 14px;border-bottom:1px solid #f0f0f0;font-size:14px;}
.totals{margin-left:auto;width:300px;}.trow{display:flex;justify-content:space-between;padding:8px 0;font-size:14px;color:#555;border-bottom:1px solid #f5f5f5;}
.tfinal{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:linear-gradient(135deg,#7F77DD,#534AB7);border-radius:14px;color:#fff;margin-top:10px;}
.notes{background:#F8F8FC;border-radius:12px;padding:14px 18px;margin-bottom:28px;font-size:13px;color:#555;}
.footer{margin-top:52px;padding-top:20px;border-top:1px solid #f0f0f0;text-align:center;color:#ccc;font-size:12px;}
@media print{body{padding:20px;}}</style></head><body>
<div class="header">
  <div><div class="logo-icon">D</div><div class="logo-name">Dropzi</div><div class="logo-sub">${b}</div></div>
  <div><div class="inv-num">${f.numero}</div><div class="inv-date">${new Date(f.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div><div style="text-align:right"><span class="badge">✓ Émise</span></div></div>
</div>
<div class="parties">
  <div><div class="plbl">De</div><div class="pname">${b}</div></div>
  <div><div class="plbl">Facturé à</div><div class="pname">${f.client_nom || 'Client'}</div>${f.client_tel ? `<div class="pdet">📞 ${f.client_tel}</div>` : ''}${f.client_adresse ? `<div class="pdet">📍 ${f.client_adresse}</div>` : ''}</div>
</div>
<table><thead><tr><th style="text-align:left">Description</th><th style="text-align:right">Qté</th><th style="text-align:right">Prix</th><th>Total</th></tr></thead>
<tbody>${(f.items || []).map((i: any) => `<tr><td>${i.description}</td><td style="text-align:right">${i.quantite}</td><td style="text-align:right">${fmt(i.prix)} F</td><td style="text-align:right;font-weight:600">${fmt(i.prix * i.quantite)} F</td></tr>`).join('')}</tbody></table>
${f.notes ? `<div class="notes">📝 ${f.notes}</div>` : ''}
<div class="totals">
  <div class="trow"><span>Sous-total</span><span><b>${fmt(f.montant_ht)} FCFA</b></span></div>
  ${f.frais_livraison > 0 ? `<div class="trow"><span>🚚 Livraison</span><span><b>${fmt(f.frais_livraison)} FCFA</b></span></div>` : ''}
  <div class="tfinal"><span style="font-weight:600;font-size:16px">Total à payer</span><span style="font-size:24px;font-weight:800">${fmt(f.montant_total)} FCFA</span></div>
</div>
<div class="footer">Facture générée par Dropzi · ${new Date().toLocaleDateString('fr-FR')} · Merci pour votre confiance 🙏</div>
<script>window.onload=()=>window.print()<\/script></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Factures</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Nouvelle facture</button>
      </div>

      {showForm && (
        <div className="card border-2 border-[#7F77DD] space-y-4">
          <h2 className="font-medium">Nouvelle facture</h2>
          <div>
            <label className="label">Pré-remplir depuis une commande (optionnel)</label>
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
            <label className="label">Produits / Services *</label>
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
            <div><label className="label">Frais de livraison (F)</label><input className="input" type="number" min="0" value={form.frais_livraison} onChange={e => setForm(f => ({ ...f, frais_livraison: +e.target.value }))} /></div>
            <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Paiement à réception..." /></div>
          </div>
          <div className="bg-[#EEEDFE] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Sous-total</span><span className="font-medium">{fmt(totalHT())} F</span></div>
            {form.frais_livraison > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Livraison</span><span>{fmt(form.frais_livraison)} F</span></div>}
            <div className="flex justify-between font-medium pt-2 border-t border-purple-200 text-[#534AB7]"><span>Total</span><span className="text-lg">{fmt(totalTTC())} FCFA</span></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Annuler</button>
            <button onClick={creerFacture} disabled={saving || !form.client_nom || form.items.every(i => !i.description)} className="btn-primary text-sm">
              {saving ? '⏳ Création...' : '✓ Créer la facture'}
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #7F77DD', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{preview.numero}</div><div style={{ color: 'rgba(255,255,255,.55)', fontSize: 12 }}>{new Date(preview.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
            <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '5px 14px', color: '#fff', fontSize: 13, fontWeight: 600 }}>✓ Émise</div>
          </div>
          <div style={{ padding: '18px 22px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Client</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{preview.client_nom}</div>
                {preview.client_tel && <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>📞 {preview.client_tel}</div>}
                {preview.client_adresse && <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>📍 {preview.client_adresse}</div>}
              </div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Boutique</div><div style={{ fontWeight: 700, fontSize: 15 }}>{profil?.nom_boutique || 'Ma Boutique'}</div></div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead><tr style={{ background: '#F8F8FC' }}>
                {['Produit', 'Qté', 'Prix', 'Total'].map((h, i) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{(preview.items || []).map((item: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>{item.description}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14 }}>{item.quantite}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14 }}>{fmt(item.prix)} F</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 600 }}>{fmt(item.prix * item.quantite)} F</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ marginLeft: 'auto', width: 260 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#555', borderBottom: '1px solid #f0f0f0' }}><span>Sous-total</span><span style={{ fontWeight: 600 }}>{fmt(preview.montant_ht)} F</span></div>
              {(preview.frais_livraison || 0) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#555', borderBottom: '1px solid #f0f0f0' }}><span>🚚 Livraison</span><span style={{ fontWeight: 600 }}>{fmt(preview.frais_livraison)} F</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', borderRadius: 12, color: '#fff', marginTop: 8 }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={{ fontSize: 22, fontWeight: 800 }}>{fmt(preview.montant_total)} FCFA</span>
              </div>
            </div>
            {preview.notes && <div style={{ marginTop: 14, background: '#F8F8FC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#666' }}>📝 {preview.notes}</div>}
          </div>
          <div style={{ padding: '0 22px 20px', display: 'flex', gap: 10 }}>
            <button onClick={() => copierWa(preview)} style={{ flex: 1, background: copied === preview.id ? '#1D9E75' : '#25D366', color: '#fff', border: 'none', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {copied === preview.id ? '✅ Copié !' : '📋 Copier WhatsApp'}
            </button>
            <button onClick={() => imprimerPDF(preview)} style={{ flex: 1, background: '#EEEDFE', color: '#534AB7', border: 'none', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              📄 Imprimer / PDF
            </button>
            <button onClick={() => setPreview(null)} style={{ background: '#f5f5f5', border: 'none', color: '#888', padding: '13px 16px', borderRadius: 12, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        </div>
      )}

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
                <div className="flex items-center gap-2"><span className="font-medium text-sm">{f.numero}</span><span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Émise</span></div>
                <p className="text-sm text-gray-600 mt-0.5">{f.client_nom || 'Client'}{f.client_tel ? ` · ${f.client_tel}` : ''}</p>
                <p className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <p className="font-medium text-sm flex-shrink-0">{fmt(f.montant_total)} F</p>
              <div className="flex gap-1">
                <button onClick={() => setPreview({ ...f, items: [], profil })} className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-[#7F77DD] text-base">👁️</button>
                <button onClick={() => copierWa({ ...f, items: [] })} className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 text-base">📋</button>
                <button onClick={() => imprimerPDF({ ...f, items: [], profil })} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 text-base">📄</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
