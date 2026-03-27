'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function RapportPage() {
  const supabase = createClient()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [vue, setVue] = useState<'generer' | 'historique' | 'mensuel'>('generer')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [depenses, setDepenses] = useState<any[]>([])
  const [newDep, setNewDep] = useState({ type: 'pub', description: '', montant: 0 })
  const [profil, setProfil] = useState<any>(null)
  const [historique, setHistorique] = useState<any[]>([])
  const [moisSel, setMoisSel] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfil(data))
    })
  }, [])

  async function loadHistorique() {
    const { data } = await supabase.from('rapports').select('*').order('date', { ascending: false }).limit(60)
    setHistorique(data || [])
  }

  useEffect(() => { if (vue === 'historique' || vue === 'mensuel') loadHistorique() }, [vue])

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
    const livrees = commandes.filter((c: any) => c.statut === 'livre')
    const annulees = commandes.filter((c: any) => ['annule', 'echec'].includes(c.statut))
    const en_cours = commandes.filter((c: any) => ['en_livraison', 'en_attente'].includes(c.statut))
    const ca = livrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const cout_livraisons = livrees.reduce((s: number, c: any) => s + (c.cout_livraison || 0), 0)
    const cout_produits = livrees.reduce((s: number, c: any) => s + (c.total_cout_produits || 0), 0)
    const total_depenses = deps.reduce((s: number, d: any) => s + (d.montant || 0), 0)
    const dep_pub = deps.filter((d: any) => d.type === 'pub').reduce((s: number, d: any) => s + d.montant, 0)
    const benefice_brut = ca - cout_livraisons - cout_produits
    const benefice_net = benefice_brut - total_depenses
    setData({ commandes, livrees, annulees, en_cours, ca, cout_livraisons, cout_produits, total_depenses, dep_pub, benefice_brut, benefice_net, deps })
    setLoading(false)
  }

  async function sauvegarderRapport() {
    if (!data) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const texte = genTexte()
    await supabase.from('rapports').upsert({
      user_id: user?.id, date, periode: 'jour',
      ca: data.ca, nb_commandes: data.commandes.length,
      nb_livrees: data.livrees.length, nb_annulees: data.annulees.length,
      cout_livraisons: data.cout_livraisons, cout_produits: data.cout_produits,
      total_depenses: data.total_depenses, dep_pub: data.dep_pub,
      benefice_brut: data.benefice_brut, benefice_net: data.benefice_net,
      texte_whatsapp: texte,
    }, { onConflict: 'user_id,date,periode' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function ajouterDep() {
    if (!newDep.montant || !newDep.description) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('depenses').insert({ ...newDep, date, user_id: user?.id })
    setNewDep({ type: 'pub', description: '', montant: 0 })
    generer()
  }

  async function suppDep(id: string) {
    await supabase.from('depenses').delete().eq('id', id)
    generer()
  }

  function genTexte() {
    if (!data) return ''
    const boutique = profil?.nom_boutique || 'Ma Boutique'
    const d = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    let t = `🛍️ *${boutique.toUpperCase()} — RAPPORT JOURNALIER*\n`
    t += `📅 ${d.charAt(0).toUpperCase() + d.slice(1)}\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    t += `📦 *COMMANDES*\n`
    t += `✅ Livrées : ${data.livrees.length}\n`
    t += `🚚 En cours : ${data.en_cours.length}\n`
    t += `❌ Annulées : ${data.annulees.length}\n`
    t += `📊 Total : ${data.commandes.length}\n\n`
    if (data.livrees.length > 0) {
      t += `━━━━━━━━━━━━━━━━━━━━━━━━\n📋 *DÉTAIL LIVRAISONS*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      data.livrees.forEach((c: any, i: number) => {
        t += `${i + 1}️⃣ ${c.client_nom || c.client_tel || 'Client'}`
        if (c.zone_nom) t += ` · ${c.zone_nom}`
        t += `\n   💰 ${fmt(c.total_vente)} F — Livr: ${fmt(c.cout_livraison)} F\n`
        t += `   ➡ Net: *${fmt(c.benefice)} F*\n\n`
      })
    }
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n💵 *BILAN FINANCIER*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    t += `💰 CA encaissé : *${fmt(data.ca)} FCFA*\n`
    t += `🚚 Frais livraison : -${fmt(data.cout_livraisons)} FCFA\n`
    t += `📦 Coût produits : -${fmt(data.cout_produits)} FCFA\n`
    if (data.dep_pub > 0) t += `📢 Pub/Marketing : -${fmt(data.dep_pub)} FCFA\n`
    if (data.total_depenses - data.dep_pub > 0) t += `💸 Autres dépenses : -${fmt(data.total_depenses - data.dep_pub)} FCFA\n`
    t += `⸻\n✅ *BÉNÉFICE NET : ${fmt(data.benefice_net)} FCFA*\n━━━━━━━━━━━━━━━━━━━━━━━━\n_Généré par Dropzi_`
    return t
  }

  function copier() {
    navigator.clipboard.writeText(genTexte()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 3000) })
  }

  // Bilan mensuel
  const rapportsMois = historique.filter(r => r.date.startsWith(moisSel))
  const bilanMensuel = {
    ca: rapportsMois.reduce((s, r) => s + r.ca, 0),
    benefice_net: rapportsMois.reduce((s, r) => s + r.benefice_net, 0),
    nb_commandes: rapportsMois.reduce((s, r) => s + r.nb_commandes, 0),
    nb_livrees: rapportsMois.reduce((s, r) => s + r.nb_livrees, 0),
    total_depenses: rapportsMois.reduce((s, r) => s + r.total_depenses, 0),
    dep_pub: rapportsMois.reduce((s, r) => s + r.dep_pub, 0),
    jours: rapportsMois.length,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-medium">Rapports</h1>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['generer', '📊 Générer'], ['historique', '📂 Historique'], ['mensuel', '📅 Bilan mensuel']].map(([val, lbl]) => (
          <button key={val} onClick={() => setVue(val as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${vue === val ? 'bg-[#7F77DD] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── GÉNÉRER ── */}
      {vue === 'generer' && (
        <>
          <div className="card flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Date du rapport</label>
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <button onClick={generer} disabled={loading} className="btn-primary text-sm">
              {loading ? '⏳...' : '📊 Générer'}
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
                <button onClick={ajouterDep} className="btn-primary text-sm px-3">+</button>
              </div>
            </div>
            {depenses.map(d => (
              <div key={d.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                <span className="text-gray-600">{d.type === 'pub' ? '📢' : d.type === 'achat' ? '📦' : '💸'} {d.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 font-medium">-{fmt(d.montant)} F</span>
                  <button onClick={() => suppDep(d.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Rapport visuel */}
          {data && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e0e0e0', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#3D3499)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {profil?.logo_url
                    ? <img src={profil.logo_url} alt="Logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                    : <div style={{ width: 40, height: 40, background: '#7F77DD', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏪</div>
                  }
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{profil?.nom_boutique || 'Ma Boutique'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>RAPPORT JOURNALIER · DROPZI</div>
                  </div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                  {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid #f0f0f0' }}>
                {[
                  { l: 'CA encaissé', v: fmt(data.ca), u: 'FCFA', c: '#0F6E56' },
                  { l: 'Commandes', v: data.livrees.length, u: `livrées / ${data.commandes.length}`, c: '#534AB7' },
                  { l: 'Bénéfice net', v: fmt(data.benefice_net), u: 'FCFA', c: data.benefice_net >= 0 ? '#0F6E56' : '#A32D2D' },
                ].map(k => (
                  <div key={k.l} style={{ padding: '16px', textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{k.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: k.c }}>{k.v}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{k.u}</div>
                  </div>
                ))}
              </div>

              {data.livrees.length > 0 && (
                <div style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>✅ Livraisons ({data.livrees.length})</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {data.livrees.map((c: any, i: number) => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#F8F8FC', borderRadius: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{i + 1}. {c.client_nom || c.client_tel || 'Client'}</div>
                          <div style={{ fontSize: 11, color: '#999' }}>{c.zone_nom || '—'}{c.livreur_nom ? ` · ${c.livreur_nom}` : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(c.total_vente)} F</div>
                          <div style={{ fontSize: 11, color: '#1D9E75' }}>+{fmt(c.benefice)} F</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ margin: '0 20px 12px', background: '#0C0C1E', borderRadius: 14, padding: '16px 20px' }}>
                <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Bilan financier</p>
                {[
                  { l: 'CA encaissé', v: `${fmt(data.ca)} F`, c: '#fff' },
                  { l: 'Frais livraison', v: `- ${fmt(data.cout_livraisons)} F`, c: '#F09595' },
                  { l: 'Coût produits', v: `- ${fmt(data.cout_produits)} F`, c: '#F09595' },
                  ...(data.dep_pub > 0 ? [{ l: '📢 Pub', v: `- ${fmt(data.dep_pub)} F`, c: '#FAC775' }] : []),
                  ...(data.total_depenses - data.dep_pub > 0 ? [{ l: '💸 Autres', v: `- ${fmt(data.total_depenses - data.dep_pub)} F`, c: '#FAC775' }] : []),
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
                    <span style={{ color: 'rgba(255,255,255,.5)' }}>{r.l}</span>
                    <span style={{ color: r.c, fontWeight: 500 }}>{r.v}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>✅ Bénéfice net</span>
                  <span style={{ color: data.benefice_net >= 0 ? '#9FE1CB' : '#F09595', fontSize: 18, fontWeight: 700 }}>{fmt(data.benefice_net)} FCFA</span>
                </div>
              </div>

              <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
                <button onClick={copier} style={{ flex: 1, background: copied ? '#1D9E75' : '#25D366', color: '#fff', border: 'none', padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {copied ? '✅ Copié ! Colle sur WhatsApp' : '📋 Copier pour WhatsApp'}
                </button>
                <button onClick={sauvegarderRapport} disabled={saving} style={{ background: saved ? '#1D9E75' : '#7F77DD', color: '#fff', border: 'none', padding: '13px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? '...' : saved ? '✅' : '💾 Sauvegarder'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── HISTORIQUE ── */}
      {vue === 'historique' && (
        <div className="space-y-3">
          {historique.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-3">📂</p>
              <p className="text-gray-500 text-sm">Aucun rapport sauvegardé encore</p>
              <p className="text-gray-400 text-xs mt-1">Génère un rapport et clique "Sauvegarder"</p>
            </div>
          ) : historique.map(r => (
            <div key={r.id} className="card flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">{new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <p className="text-xs text-gray-400">{r.nb_livrees} livrées · CA : {fmt(r.ca)} F</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-medium text-sm ${r.benefice_net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {r.benefice_net >= 0 ? '+' : ''}{fmt(r.benefice_net)} F
                </p>
                <button onClick={() => { navigator.clipboard.writeText(r.texte_whatsapp || '') }}
                  className="text-xs text-[#7F77DD] hover:underline mt-0.5">Copier WA</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BILAN MENSUEL ── */}
      {vue === 'mensuel' && (
        <div className="space-y-4">
          <div className="card flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Mois</label>
              <input className="input" type="month" value={moisSel} onChange={e => setMoisSel(e.target.value)} />
            </div>
          </div>

          {rapportsMois.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-gray-500 text-sm">Aucun rapport sauvegardé pour ce mois</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'CA mensuel', v: fmt(bilanMensuel.ca) + ' F', c: 'text-gray-900' },
                  { l: 'Bénéfice net', v: fmt(bilanMensuel.benefice_net) + ' F', c: bilanMensuel.benefice_net >= 0 ? 'text-green-600' : 'text-red-500' },
                  { l: 'Commandes totales', v: bilanMensuel.nb_commandes.toString(), c: 'text-gray-900' },
                  { l: 'Livrées', v: bilanMensuel.nb_livrees.toString(), c: 'text-green-600' },
                  { l: 'Dépenses totales', v: fmt(bilanMensuel.total_depenses) + ' F', c: 'text-red-500' },
                  { l: 'Jours actifs', v: bilanMensuel.jours.toString(), c: 'text-[#7F77DD]' },
                ].map(s => (
                  <div key={s.l} className="card">
                    <p className="text-xs text-gray-400">{s.l}</p>
                    <p className={`text-2xl font-medium mt-1 ${s.c}`}>{s.v}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                const mois = new Date(moisSel + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                const boutique = profil?.nom_boutique || 'Ma Boutique'
                let t = `📅 *${boutique.toUpperCase()} — BILAN ${mois.toUpperCase()}*\n`
                t += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
                t += `📊 *RÉSULTATS DU MOIS*\n`
                t += `💰 CA total : *${fmt(bilanMensuel.ca)} FCFA*\n`
                t += `📦 Commandes : ${bilanMensuel.nb_commandes} (${bilanMensuel.nb_livrees} livrées)\n`
                t += `💸 Dépenses : ${fmt(bilanMensuel.total_depenses)} FCFA\n`
                t += `📢 Pub : ${fmt(bilanMensuel.dep_pub)} FCFA\n`
                t += `📅 Jours actifs : ${bilanMensuel.jours}\n`
                t += `⸻\n✅ *BÉNÉFICE NET MENSUEL : ${fmt(bilanMensuel.benefice_net)} FCFA*\n`
                t += `━━━━━━━━━━━━━━━━━━━━━━━━\n_Généré par Dropzi_`
                navigator.clipboard.writeText(t)
              }} style={{ width: '100%', background: '#25D366', color: '#fff', border: 'none', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                📋 Copier le bilan mensuel WhatsApp
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
