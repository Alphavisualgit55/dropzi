'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RapportsHistoriquePage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'jour' | 'semaine' | 'mois'>('jour')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [rapportData, setRapportData] = useState<any>(null)
  const [historique, setHistorique] = useState<any[]>([])
  const [depenses, setDepenses] = useState<any[]>([])
  const [newDep, setNewDep] = useState({ type: 'pub', description: '', montant: 0 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [profil, setProfil] = useState<any>(null)
  const [selectedHistorique, setSelectedHistorique] = useState<any>(null)
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfil(data))
    })
    loadHistorique()
  }, [tab])

  async function loadHistorique() {
    const { data } = await supabase
      .from('rapports')
      .select('*')
      .eq('periode', tab)
      .order('date', { ascending: false })
      .limit(30)
    setHistorique(data || [])
  }

  function getRange() {
    const d = new Date(date)
    if (tab === 'jour') {
      const from = new Date(d); from.setHours(0, 0, 0, 0)
      const to = new Date(d); to.setHours(23, 59, 59, 999)
      return { from, to, label: fmtDate(date) }
    }
    if (tab === 'semaine') {
      const day = d.getDay()
      const from = new Date(d); from.setDate(d.getDate() - ((day + 6) % 7)); from.setHours(0, 0, 0, 0)
      const to = new Date(from); to.setDate(from.getDate() + 6); to.setHours(23, 59, 59, 999)
      return { from, to, label: `Semaine du ${from.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` }
    }
    const from = new Date(d.getFullYear(), d.getMonth(), 1)
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    return { from, to, label: new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }
  }

  async function generer() {
    setLoading(true)
    const { from, to } = getRange()
    const dateKey = tab === 'jour' ? date : tab === 'semaine'
      ? new Date(new Date(date).setDate(new Date(date).getDate() - ((new Date(date).getDay() + 6) % 7))).toISOString().split('T')[0]
      : date.slice(0, 7) + '-01'

    const [cmd, dep] = await Promise.all([
      supabase.from('commandes_detail').select('*').gte('created_at', from.toISOString()).lte('created_at', to.toISOString()),
      supabase.from('depenses').select('*').gte('date', from.toISOString().split('T')[0]).lte('date', to.toISOString().split('T')[0]),
    ])

    const commandes = cmd.data || []
    const deps = dep.data || []
    setDepenses(deps)

    const livrees = commandes.filter((c: any) => c.statut === 'livre')
    const annulees = commandes.filter((c: any) => ['annule', 'echec'].includes(c.statut))
    const ca = livrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const cout_livraisons = livrees.reduce((s: number, c: any) => s + (c.cout_livraison || 0), 0)
    const cout_produits = livrees.reduce((s: number, c: any) => s + (c.total_cout_produits || 0), 0)
    const total_depenses = deps.reduce((s: number, d: any) => s + (d.montant || 0), 0)
    const dep_pub = deps.filter((d: any) => d.type === 'pub').reduce((s: number, d: any) => s + d.montant, 0)
    const dep_achat = deps.filter((d: any) => d.type === 'achat').reduce((s: number, d: any) => s + d.montant, 0)
    const dep_autre = deps.filter((d: any) => d.type === 'autre').reduce((s: number, d: any) => s + d.montant, 0)
    const benefice_brut = ca - cout_livraisons - cout_produits
    const benefice_net = benefice_brut - total_depenses
    const panier_moyen = livrees.length > 0 ? Math.round(ca / livrees.length) : 0

    // Grouper par zone
    const byZone: Record<string, { nb: number; ca: number }> = {}
    livrees.forEach((c: any) => {
      const z = c.zone_nom || 'Sans zone'
      if (!byZone[z]) byZone[z] = { nb: 0, ca: 0 }
      byZone[z].nb++
      byZone[z].ca += c.total_vente || 0
    })

    // Top produits (approximatif via données disponibles)
    const result = {
      commandes, livrees, annulees, ca, cout_livraisons, cout_produits,
      total_depenses, dep_pub, dep_achat, dep_autre,
      benefice_brut, benefice_net, panier_moyen, deps, byZone,
      dateKey
    }
    setRapportData(result)
    setLoading(false)
  }

  async function sauvegarder() {
    if (!rapportData) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { dateKey, ca, benefice_brut, benefice_net, cout_livraisons, cout_produits, total_depenses, livrees, annulees, commandes, deps, byZone } = rapportData

    const payload = {
      user_id: user?.id,
      date: dateKey,
      periode: tab,
      ca, benefice_brut, benefice_net,
      cout_livraisons, cout_produits, total_depenses,
      nb_commandes: commandes.length,
      nb_livrees: livrees.length,
      nb_annulees: annulees.length,
      notes: editNotes,
      data_json: { byZone, deps },
      updated_at: new Date().toISOString()
    }

    // Upsert par user+date+periode
    const existing = historique.find(h => h.date === dateKey && h.periode === tab)
    if (existing) {
      await supabase.from('rapports').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('rapports').insert(payload)
    }
    setSaving(false)
    loadHistorique()
  }

  async function ajouterDepense() {
    if (!newDep.montant || !newDep.description) return
    const { data: { user } } = await supabase.auth.getUser()
    const { from } = getRange()
    await supabase.from('depenses').insert({ ...newDep, date: from.toISOString().split('T')[0], user_id: user?.id })
    setNewDep({ type: 'pub', description: '', montant: 0 })
    generer()
  }

  async function supprimerDepense(id: string) {
    await supabase.from('depenses').delete().eq('id', id)
    generer()
  }

  async function supprimerRapport(id: string) {
    if (!confirm('Supprimer ce rapport ?')) return
    await supabase.from('rapports').delete().eq('id', id)
    loadHistorique()
  }

  function genererWhatsapp(data: any = rapportData) {
    if (!data) return ''
    const { from, label } = getRange()
    const boutique = profil?.nom_boutique || 'Ma Boutique'
    const periode_label = tab === 'jour' ? 'RAPPORT JOURNALIER' : tab === 'semaine' ? 'BILAN HEBDOMADAIRE' : 'BILAN MENSUEL'
    let t = `🛍️ *${boutique.toUpperCase()} — ${periode_label}*\n`
    t += `📅 ${label.charAt(0).toUpperCase() + label.slice(1)}\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    t += `📦 *COMMANDES*\n`
    t += `✅ Livrées : ${data.nb_livrees || data.livrees?.length || 0}\n`
    t += `❌ Annulées : ${data.nb_annulees || data.annulees?.length || 0}\n`
    t += `📊 Total : ${data.nb_commandes || data.commandes?.length || 0}\n\n`

    if (data.byZone) {
      t += `━━━━━━━━━━━━━━━━━━━━━━━━\n`
      t += `🗺️ *PAR ZONE*\n`
      Object.entries(data.byZone).forEach(([zone, info]: any) => {
        t += `• ${zone} : ${info.nb} cmd — ${fmt(info.ca)} F\n`
      })
      t += `\n`
    }

    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n`
    t += `💵 *BILAN FINANCIER*\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    t += `💰 CA encaissé : *${fmt(data.ca)} FCFA*\n`
    t += `🚚 Livraisons : -${fmt(data.cout_livraisons)} FCFA\n`
    t += `📦 Coût produits : -${fmt(data.cout_produits)} FCFA\n`
    if ((data.dep_pub || 0) > 0) t += `📢 Pub : -${fmt(data.dep_pub)} FCFA\n`
    if ((data.dep_achat || 0) > 0) t += `🛒 Achats : -${fmt(data.dep_achat)} FCFA\n`
    if ((data.dep_autre || 0) > 0) t += `💸 Autres : -${fmt(data.dep_autre)} FCFA\n`
    t += `⸻\n`
    t += `✅ *BÉNÉFICE NET : ${fmt(data.benefice_net)} FCFA*\n`
    if (data.notes) t += `\n📝 ${data.notes}\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n`
    t += `_Généré par Dropzi_`
    return t
  }

  function copier(data?: any) {
    navigator.clipboard.writeText(genererWhatsapp(data)).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    })
  }

  const { label } = getRange()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-medium">Rapports & Bilans</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['jour', 'semaine', 'mois'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-[#7F77DD] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {t === 'jour' ? '📅 Journalier' : t === 'semaine' ? '📆 Hebdo' : '📈 Mensuel'}
          </button>
        ))}
      </div>

      {/* Sélecteur date */}
      <div className="card flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">{tab === 'jour' ? 'Date' : tab === 'semaine' ? 'Semaine (choisir un jour)' : 'Mois'}</label>
          <input className="input" type={tab === 'mois' ? 'month' : 'date'} value={tab === 'mois' ? date.slice(0, 7) : date}
            onChange={e => setDate(tab === 'mois' ? e.target.value + '-01' : e.target.value)} />
        </div>
        <button onClick={generer} disabled={loading} className="btn-primary text-sm">
          {loading ? '⏳...' : '📊 Générer'}
        </button>
      </div>

      {/* Dépenses */}
      <div className="card space-y-3">
        <p className="text-sm font-medium">💸 Dépenses — {tab === 'jour' ? 'du jour' : tab === 'semaine' ? 'de la semaine' : 'du mois'}</p>
        <div className="grid grid-cols-3 gap-2">
          <select className="input text-sm" value={newDep.type} onChange={e => setNewDep(f => ({ ...f, type: e.target.value }))}>
            <option value="pub">📢 Pub</option>
            <option value="achat">📦 Achat</option>
            <option value="autre">💸 Autre</option>
          </select>
          <input className="input text-sm" value={newDep.description} onChange={e => setNewDep(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
          <div className="flex gap-1">
            <input className="input text-sm flex-1" type="number" value={newDep.montant || ''} onChange={e => setNewDep(f => ({ ...f, montant: +e.target.value }))} placeholder="Montant" />
            <button onClick={ajouterDepense} className="btn-primary text-sm px-3">+</button>
          </div>
        </div>
        {depenses.length > 0 && (
          <div className="space-y-1.5">
            {depenses.map(d => (
              <div key={d.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                <span className="text-gray-500">{d.type === 'pub' ? '📢' : d.type === 'achat' ? '📦' : '💸'} {d.description} · {d.date}</span>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 font-medium">-{fmt(d.montant)} F</span>
                  <button onClick={() => supprimerDepense(d.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RAPPORT GÉNÉRÉ */}
      {rapportData && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8e8f0', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#2D2A6E)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{profil?.nom_boutique || 'Ma Boutique'}</div>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, marginTop: 2 }}>
                {tab === 'jour' ? 'RAPPORT JOURNALIER' : tab === 'semaine' ? 'BILAN HEBDOMADAIRE' : 'BILAN MENSUEL'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontSize: 12, textTransform: 'capitalize' }}>{label}</div>
              <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 11, marginTop: 2 }}>{rapportData.livrees.length} livrée{rapportData.livrees.length > 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid #f0f0f0' }}>
            {[
              { l: 'CA encaissé', v: fmt(rapportData.ca), u: 'FCFA', c: '#1D9E75' },
              { l: 'Bénéfice brut', v: fmt(rapportData.benefice_brut), u: 'FCFA', c: '#7F77DD' },
              { l: 'Bénéfice NET', v: fmt(rapportData.benefice_net), u: 'FCFA', c: rapportData.benefice_net >= 0 ? '#0F6E56' : '#A32D2D' },
            ].map(k => (
              <div key={k.l} style={{ padding: '16px 10px', textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{k.l}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.c }}>{k.v}</div>
                <div style={{ fontSize: 10, color: '#bbb' }}>{k.u}</div>
              </div>
            ))}
          </div>

          {/* Stats commandes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '12px 20px', gap: 8 }}>
            {[
              { l: 'Total', v: rapportData.commandes.length, c: '#333' },
              { l: 'Livrées', v: rapportData.livrees.length, c: '#1D9E75' },
              { l: 'Annulées', v: rapportData.annulees.length, c: '#E24B4A' },
              { l: 'Panier moy.', v: fmt(rapportData.panier_moyen) + ' F', c: '#7F77DD' },
            ].map(s => (
              <div key={s.l} style={{ background: '#F8F8FC', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.c, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Par zone */}
          {Object.keys(rapportData.byZone).length > 0 && (
            <div style={{ padding: '0 20px 12px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Par zone</p>
              {Object.entries(rapportData.byZone).map(([zone, info]: any) => (
                <div key={zone} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: '#F8F8FC', borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#555' }}>📍 {zone}</span>
                  <div>
                    <span style={{ fontSize: 12, color: '#7F77DD', fontWeight: 600 }}>{info.nb} cmd</span>
                    <span style={{ fontSize: 12, color: '#888', marginLeft: 10 }}>{fmt(info.ca)} F</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bilan financier */}
          <div style={{ margin: '0 20px', background: '#0C0C1E', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
            <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Décomposition bénéfice</p>
            {[
              { l: 'CA encaissé', v: fmt(rapportData.ca) + ' F', c: '#fff' },
              { l: 'Frais livraison', v: '-' + fmt(rapportData.cout_livraisons) + ' F', c: '#F09595' },
              { l: 'Coût produits', v: '-' + fmt(rapportData.cout_produits) + ' F', c: '#F09595' },
              ...(rapportData.dep_pub > 0 ? [{ l: '📢 Pub', v: '-' + fmt(rapportData.dep_pub) + ' F', c: '#FAC775' }] : []),
              ...(rapportData.dep_achat > 0 ? [{ l: '🛒 Achats', v: '-' + fmt(rapportData.dep_achat) + ' F', c: '#FAC775' }] : []),
              ...(rapportData.dep_autre > 0 ? [{ l: '💸 Autres', v: '-' + fmt(rapportData.dep_autre) + ' F', c: '#FAC775' }] : []),
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <span style={{ color: 'rgba(255,255,255,.45)' }}>{r.l}</span>
                <span style={{ color: r.c, fontWeight: 500 }}>{r.v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 4 }}>
              <span style={{ color: '#fff', fontWeight: 700 }}>✅ Bénéfice net</span>
              <span style={{ color: rapportData.benefice_net >= 0 ? '#9FE1CB' : '#F09595', fontSize: 20, fontWeight: 800 }}>{fmt(rapportData.benefice_net)} F</span>
            </div>
          </div>

          {/* Notes */}
          <div style={{ padding: '0 20px 14px' }}>
            <input className="input text-sm" value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Ajouter une note (optionnel)..." />
          </div>

          {/* Actions */}
          <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
            <button onClick={() => copier()} style={{
              flex: 1, background: copied ? '#1D9E75' : '#25D366', color: '#fff',
              border: 'none', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>
              {copied ? '✅ Copié !' : '📋 Copier pour WhatsApp'}
            </button>
            <button onClick={sauvegarder} disabled={saving} style={{
              background: '#EEEDFE', color: '#534AB7', border: 'none',
              padding: '13px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>
              {saving ? '⏳' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      )}

      {/* HISTORIQUE */}
      <div>
        <p className="text-sm font-medium text-gray-500 mb-3">
          Historique — {tab === 'jour' ? 'rapports journaliers' : tab === 'semaine' ? 'bilans hebdomadaires' : 'bilans mensuels'} ({historique.length})
        </p>
        {historique.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400 text-sm">Aucun rapport sauvegardé encore</p>
            <p className="text-gray-300 text-xs mt-1">Génère et sauvegarde un rapport pour le voir ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historique.map(h => (
              <div key={h.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize">{new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">CA : <strong className="text-gray-700">{fmt(h.ca)} F</strong></span>
                      <span className="text-xs text-gray-400">Bénéf. : <strong className={h.benefice_net >= 0 ? 'text-green-600' : 'text-red-500'}>{fmt(h.benefice_net)} F</strong></span>
                      <span className="text-xs text-gray-400">{h.nb_livrees}/{h.nb_commandes} livrées</span>
                    </div>
                    {h.notes && <p className="text-xs text-gray-400 mt-1 italic">📝 {h.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => {
                      const data = { ...h, byZone: h.data_json?.byZone || {}, deps: h.data_json?.deps || [], dep_pub: 0, dep_achat: 0, dep_autre: 0, livrees: { length: h.nb_livrees }, annulees: { length: h.nb_annulees }, commandes: { length: h.nb_commandes } }
                      copier(data)
                    }} className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 text-sm" title="Copier WhatsApp">📋</button>
                    <button onClick={() => supprimerRapport(h.id)} className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-400 text-sm">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
