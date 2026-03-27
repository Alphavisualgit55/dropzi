'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

export default function RapportWhatsappPage() {
  const supabase = createClient()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [depenses, setDepenses] = useState<any[]>([])
  const [newDep, setNewDep] = useState({ type: 'pub', description: '', montant: 0 })
  const [profil, setProfil] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfil(data))
    })
  }, [])

  async function generer() {
    setLoading(true)
    const from = new Date(date); from.setHours(0, 0, 0, 0)
    const to = new Date(date); to.setHours(23, 59, 59, 999)

    const [cmd, dep] = await Promise.all([
      supabase.from('commandes_detail').select('*').gte('created_at', from.toISOString()).lte('created_at', to.toISOString()),
      supabase.from('depenses').select('*').eq('date', date),
    ])

    const commandes = cmd.data || []
    const deps = dep.data || []
    setDepenses(deps)

    const livrees = commandes.filter(c => c.statut === 'livre')
    const annulees = commandes.filter(c => c.statut === 'annule' || c.statut === 'echec')
    const en_cours = commandes.filter(c => c.statut === 'en_livraison' || c.statut === 'en_attente')

    const ca = livrees.reduce((s, c) => s + (c.total_vente || 0), 0)
    const cout_livraisons = livrees.reduce((s, c) => s + (c.cout_livraison || 0), 0)
    const cout_produits = livrees.reduce((s, c) => s + (c.total_cout_produits || 0), 0)
    const total_depenses = deps.reduce((s, d) => s + (d.montant || 0), 0)
    const dep_pub = deps.filter(d => d.type === 'pub').reduce((s, d) => s + d.montant, 0)
    const benefice_brut = ca - cout_livraisons - cout_produits
    const benefice_net = benefice_brut - total_depenses

    setData({ commandes, livrees, annulees, en_cours, ca, cout_livraisons, cout_produits, total_depenses, dep_pub, benefice_brut, benefice_net, deps })
    setLoading(false)
  }

  async function ajouterDepense() {
    if (!newDep.montant || !newDep.description) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('depenses').insert({ ...newDep, date, user_id: user?.id })
    setNewDep({ type: 'pub', description: '', montant: 0 })
    generer()
  }

  async function supprimerDepense(id: string) {
    await supabase.from('depenses').delete().eq('id', id)
    generer()
  }

  function genererTexteWhatsapp() {
    if (!data) return ''
    const d = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const boutique = profil?.nom_boutique || 'Ma Boutique'
    let t = `🛍️ *${boutique.toUpperCase()} — RAPPORT JOURNALIER*\n`
    t += `📅 ${d.charAt(0).toUpperCase() + d.slice(1)}\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    t += `📦 *COMMANDES*\n`
    t += `✅ Livrées : ${data.livrees.length}\n`
    t += `🚚 En cours : ${data.en_cours.length}\n`
    t += `❌ Annulées : ${data.annulees.length}\n`
    t += `📊 Total : ${data.commandes.length}\n\n`

    if (data.livrees.length > 0) {
      t += `━━━━━━━━━━━━━━━━━━━━━━━━\n`
      t += `📋 *DÉTAIL LIVRAISONS*\n`
      t += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      data.livrees.forEach((c: any, i: number) => {
        t += `${i + 1}️⃣ ${c.client_nom || c.client_tel || 'Client'} ${c.zone_nom ? `· ${c.zone_nom}` : ''}\n`
        t += `   💰 ${fmt(c.total_vente || 0)} F — Livr: ${fmt(c.cout_livraison || 0)} F\n`
        t += `   ➡ Net: *${fmt(c.benefice || 0)} F*\n\n`
      })
    }

    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n`
    t += `💵 *BILAN FINANCIER*\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    t += `💰 CA encaissé : *${fmt(data.ca)} FCFA*\n`
    t += `🚚 Frais livraison : -${fmt(data.cout_livraisons)} FCFA\n`
    t += `📦 Coût produits : -${fmt(data.cout_produits)} FCFA\n`
    if (data.dep_pub > 0) t += `📢 Pub/Marketing : -${fmt(data.dep_pub)} FCFA\n`
    if (data.total_depenses > data.dep_pub) t += `💸 Autres dépenses : -${fmt(data.total_depenses - data.dep_pub)} FCFA\n`
    t += `⸻\n`
    t += `✅ *BÉNÉFICE NET : ${fmt(data.benefice_net)} FCFA*\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n`
    t += `_Généré par Dropzi_`
    return t
  }

  function copier() {
    const texte = genererTexteWhatsapp()
    navigator.clipboard.writeText(texte).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-medium">Rapport journalier</h1>

      {/* Sélecteur date + génération */}
      <div className="card flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">Date du rapport</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <button onClick={generer} disabled={loading} className="btn-primary text-sm">
          {loading ? '⏳ Génération...' : '📊 Générer'}
        </button>
      </div>

      {/* Dépenses */}
      <div className="card space-y-3">
        <p className="text-sm font-medium">💸 Dépenses du jour</p>
        <div className="grid grid-cols-3 gap-2">
          <select className="input text-sm" value={newDep.type} onChange={e => setNewDep(f => ({ ...f, type: e.target.value }))}>
            <option value="pub">📢 Pub</option>
            <option value="achat">📦 Achat</option>
            <option value="autre">💸 Autre</option>
          </select>
          <input className="input text-sm" value={newDep.description} onChange={e => setNewDep(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
          <div className="flex gap-1">
            <input className="input text-sm flex-1" type="number" value={newDep.montant || ''} onChange={e => setNewDep(f => ({ ...f, montant: +e.target.value }))} placeholder="Montant F" />
            <button onClick={ajouterDepense} className="btn-primary text-sm px-3">+</button>
          </div>
        </div>
        {depenses.length > 0 && (
          <div className="space-y-1">
            {depenses.map(d => (
              <div key={d.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                <span className="text-gray-600">{d.type === 'pub' ? '📢' : d.type === 'achat' ? '📦' : '💸'} {d.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 font-medium">-{fmt(d.montant)} F</span>
                  <button onClick={() => supprimerDepense(d.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rapport généré */}
      {data && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e0e0e0', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0C0C1E 0%, #2D2A6E 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: '#7F77DD', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15L3 5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{profil?.nom_boutique || 'Ma Boutique'}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>RAPPORT JOURNALIER · DROPZI</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>
                {fmtDate(date)}
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1.5px solid #f0f0f0' }}>
            {[
              { lbl: 'CA encaissé', val: fmt(data.ca), unit: 'FCFA', bg: '#E1F5EE', color: '#0F6E56' },
              { lbl: 'Commandes', val: data.livrees.length, unit: `livrées / ${data.commandes.length}`, bg: '#EEEDFE', color: '#534AB7' },
              { lbl: 'Bénéfice net', val: fmt(data.benefice_net), unit: 'FCFA', bg: data.benefice_net >= 0 ? '#E1F5EE' : '#FCEBEB', color: data.benefice_net >= 0 ? '#0F6E56' : '#A32D2D' },
            ].map(k => (
              <div key={k.lbl} style={{ padding: '16px', textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{k.lbl}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.val}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{k.unit}</div>
              </div>
            ))}
          </div>

          {/* Livraisons détail */}
          {data.livrees.length > 0 && (
            <div style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📦 Commandes livrées ({data.livrees.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.livrees.map((c: any, i: number) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8F8FC', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: '#7F77DD', fontWeight: 600 }}>{i + 1}.</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{c.client_nom || c.client_tel || 'Client'}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{c.zone_nom || '—'} {c.livreur_nom ? `· ${c.livreur_nom}` : ''}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(c.total_vente || 0)} F</div>
                      <div style={{ fontSize: 11, color: '#1D9E75' }}>+{fmt(c.benefice || 0)} F</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bilan */}
          <div style={{ margin: '0 20px 16px', background: '#0C0C1E', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Bilan financier</p>
            {[
              { lbl: 'CA encaissé', val: fmt(data.ca) + ' F', color: '#fff' },
              { lbl: 'Frais livraison', val: '- ' + fmt(data.cout_livraisons) + ' F', color: '#F09595' },
              { lbl: 'Coût produits', val: '- ' + fmt(data.cout_produits) + ' F', color: '#F09595' },
              ...(data.dep_pub > 0 ? [{ lbl: '📢 Pub/Marketing', val: '- ' + fmt(data.dep_pub) + ' F', color: '#FAC775' }] : []),
              ...(data.total_depenses - data.dep_pub > 0 ? [{ lbl: '💸 Autres dépenses', val: '- ' + fmt(data.total_depenses - data.dep_pub) + ' F', color: '#FAC775' }] : []),
            ].map(r => (
              <div key={r.lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: r.color }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.lbl}</span>
                <span style={{ color: r.color, fontWeight: 500 }}>{r.val}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 600 }}>✅ Bénéfice net</span>
              <span style={{ color: data.benefice_net >= 0 ? '#9FE1CB' : '#F09595', fontSize: 18, fontWeight: 700 }}>{fmt(data.benefice_net)} FCFA</span>
            </div>
          </div>

          {/* Bouton copier WhatsApp */}
          <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
            <button onClick={copier} style={{
              flex: 1, background: copied ? '#1D9E75' : '#25D366', color: '#fff',
              border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              {copied ? '✅ Copié ! Colle sur WhatsApp' : '📋 Copier pour WhatsApp'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
