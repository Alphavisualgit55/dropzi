'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function RapportsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'jour' | 'semaine' | 'mois'>('jour')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [rapport, setRapport] = useState<any>(null)
  const [historique, setHistorique] = useState<any[]>([])
  const [depenses, setDepenses] = useState<any[]>([])
  const [newDep, setNewDep] = useState({ type: 'pub', description: '', montant: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notes, setNotes] = useState('')
  const [profil, setProfil] = useState<any>(null)
  const [view, setView] = useState<'generer' | 'historique'>('generer')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfil(data))
    })
  }, [])

  useEffect(() => { chargerHistorique() }, [tab])

  async function chargerHistorique() {
    const { data, error } = await supabase
      .from('rapports_sauvegardes')
      .select('*')
      .eq('periode', tab)
      .order('date_debut', { ascending: false })
      .limit(30)
    if (!error) setHistorique(data || [])
  }

  function getRange() {
    const d = new Date(date + 'T12:00:00')
    if (tab === 'jour') {
      const from = new Date(d); from.setHours(0, 0, 0, 0)
      const to = new Date(d); to.setHours(23, 59, 59, 999)
      return { from, to, debut: from.toISOString().split('T')[0], fin: to.toISOString().split('T')[0] }
    }
    if (tab === 'semaine') {
      const day = d.getDay()
      const from = new Date(d)
      from.setDate(d.getDate() - ((day + 6) % 7))
      from.setHours(0, 0, 0, 0)
      const to = new Date(from)
      to.setDate(from.getDate() + 6)
      to.setHours(23, 59, 59, 999)
      return { from, to, debut: from.toISOString().split('T')[0], fin: to.toISOString().split('T')[0] }
    }
    const from = new Date(d.getFullYear(), d.getMonth(), 1)
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    return { from, to, debut: from.toISOString().split('T')[0], fin: to.toISOString().split('T')[0] }
  }

  function getLabel() {
    const { from, to } = getRange()
    if (tab === 'jour') return new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (tab === 'semaine') return `Sem. du ${from.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${to.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
    return new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  async function generer() {
    setLoading(true)
    const { from, to, debut } = getRange()

    const [cmdRes, depRes] = await Promise.all([
      supabase.from('commandes_detail').select('*')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString()),
      supabase.from('depenses').select('*')
        .gte('date', from.toISOString().split('T')[0])
        .lte('date', to.toISOString().split('T')[0])
    ])

    const commandes = cmdRes.data || []
    const deps = depRes.data || []
    setDepenses(deps)

    const livrees = commandes.filter((c: any) => c.statut === 'livre')
    const annulees = commandes.filter((c: any) => ['annule', 'echec'].includes(c.statut))
    const ca = livrees.reduce((s: number, c: any) => s + (c.total_vente || 0), 0)
    const cout_livraisons = livrees.reduce((s: number, c: any) => s + (c.cout_livraison || 0), 0)
    const cout_produits = livrees.reduce((s: number, c: any) => s + (c.total_cout_produits || 0), 0)
    const dep_pub = deps.filter((d: any) => d.type === 'pub').reduce((s: number, d: any) => s + d.montant, 0)
    const dep_achat = deps.filter((d: any) => d.type === 'achat').reduce((s: number, d: any) => s + d.montant, 0)
    const dep_autre = deps.filter((d: any) => d.type === 'autre').reduce((s: number, d: any) => s + d.montant, 0)
    const total_depenses = dep_pub + dep_achat + dep_autre
    const benefice_brut = ca - cout_livraisons - cout_produits
    const benefice_net = benefice_brut - total_depenses
    const panier_moyen = livrees.length > 0 ? Math.round(ca / livrees.length) : 0

    const byZone: Record<string, { nb: number; ca: number; benefice: number }> = {}
    livrees.forEach((c: any) => {
      const z = c.zone_nom || 'Sans zone'
      if (!byZone[z]) byZone[z] = { nb: 0, ca: 0, benefice: 0 }
      byZone[z].nb++
      byZone[z].ca += c.total_vente || 0
      byZone[z].benefice += c.benefice || 0
    })

    setRapport({ commandes, livrees, annulees, ca, cout_livraisons, cout_produits, dep_pub, dep_achat, dep_autre, total_depenses, benefice_brut, benefice_net, panier_moyen, deps, byZone })
    setLoading(false)
  }

  async function sauvegarder() {
    if (!rapport) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { from, to, debut, fin } = getRange()

    const payload = {
      user_id: user.id,
      date_debut: debut,
      date_fin: fin,
      periode: tab,
      ca: rapport.ca,
      benefice_brut: rapport.benefice_brut,
      benefice_net: rapport.benefice_net,
      cout_livraisons: rapport.cout_livraisons,
      cout_produits: rapport.cout_produits,
      total_depenses: rapport.total_depenses,
      dep_pub: rapport.dep_pub,
      dep_achat: rapport.dep_achat,
      dep_autre: rapport.dep_autre,
      nb_commandes: rapport.commandes.length,
      nb_livrees: rapport.livrees.length,
      nb_annulees: rapport.annulees.length,
      panier_moyen: rapport.panier_moyen,
      notes,
      data_json: { byZone: rapport.byZone, deps: rapport.deps },
      updated_at: new Date().toISOString()
    }

    // Vérifier si existe déjà
    const { data: existing } = await supabase
      .from('rapports_sauvegardes')
      .select('id')
      .eq('user_id', user.id)
      .eq('date_debut', debut)
      .eq('periode', tab)
      .single()

    if (existing) {
      await supabase.from('rapports_sauvegardes').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('rapports_sauvegardes').insert(payload)
    }

    setSaving(false)
    chargerHistorique()
    alert('✅ Rapport sauvegardé !')
  }

  async function ajouterDepense() {
    if (!newDep.montant || !newDep.description) return
    const { data: { user } } = await supabase.auth.getUser()
    const { from } = getRange()
    await supabase.from('depenses').insert({
      type: newDep.type,
      description: newDep.description,
      montant: +newDep.montant,
      date: from.toISOString().split('T')[0],
      user_id: user?.id
    })
    setNewDep({ type: 'pub', description: '', montant: '' })
    if (rapport) generer()
  }

  async function supprimerDepense(id: string) {
    await supabase.from('depenses').delete().eq('id', id)
    if (rapport) generer()
  }

  async function supprimerRapport(id: string) {
    if (!confirm('Supprimer ce rapport ?')) return
    await supabase.from('rapports_sauvegardes').delete().eq('id', id)
    chargerHistorique()
  }

  function texteWhatsapp(r: any = rapport, label: string = getLabel()) {
    if (!r) return ''
    const boutique = profil?.nom_boutique || 'Ma Boutique'
    const p = tab === 'jour' ? 'RAPPORT JOURNALIER' : tab === 'semaine' ? 'BILAN HEBDOMADAIRE' : 'BILAN MENSUEL'
    let t = `🛍️ *${boutique.toUpperCase()} — ${p}*\n`
    t += `📅 ${label.charAt(0).toUpperCase() + label.slice(1)}\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    t += `📦 *COMMANDES*\n`
    t += `✅ Livrées : ${r.nb_livrees ?? r.livrees?.length ?? 0}\n`
    t += `❌ Annulées : ${r.nb_annulees ?? r.annulees?.length ?? 0}\n`
    t += `📊 Total : ${r.nb_commandes ?? r.commandes?.length ?? 0}\n`
    if (r.panier_moyen > 0) t += `🛒 Panier moyen : ${fmt(r.panier_moyen)} FCFA\n`
    t += `\n`
    const zones = r.byZone || r.data_json?.byZone || {}
    if (Object.keys(zones).length > 0) {
      t += `━━━━━━━━━━━━━━━━━━━━━━━━\n🗺️ *PAR ZONE*\n`
      Object.entries(zones).forEach(([zone, info]: any) => {
        t += `• ${zone} : ${info.nb} cmd — ${fmt(info.ca)} F\n`
      })
      t += `\n`
    }
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n💵 *BILAN FINANCIER*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    t += `💰 CA encaissé : *${fmt(r.ca)} FCFA*\n`
    t += `🚚 Livraisons : -${fmt(r.cout_livraisons)} FCFA\n`
    t += `📦 Coût produits : -${fmt(r.cout_produits)} FCFA\n`
    if ((r.dep_pub || 0) > 0) t += `📢 Pub : -${fmt(r.dep_pub)} FCFA\n`
    if ((r.dep_achat || 0) > 0) t += `🛒 Achats : -${fmt(r.dep_achat)} FCFA\n`
    if ((r.dep_autre || 0) > 0) t += `💸 Autres : -${fmt(r.dep_autre)} FCFA\n`
    t += `⸻\n✅ *BÉNÉFICE NET : ${fmt(r.benefice_net)} FCFA*\n`
    if (r.notes) t += `\n📝 ${r.notes}\n`
    t += `━━━━━━━━━━━━━━━━━━━━━━━━\n_Généré par Dropzi_`
    return t
  }

  function copier(r?: any, label?: string) {
    navigator.clipboard.writeText(texteWhatsapp(r, label || getLabel())).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    })
  }

  const periodeLabel = tab === 'jour' ? 'Journalier' : tab === 'semaine' ? 'Hebdomadaire' : 'Mensuel'

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-medium">Rapports</h1>
        <div className="flex gap-2">
          <button onClick={() => setView('generer')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${view === 'generer' ? 'bg-[#7F77DD] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
            📊 Générer
          </button>
          <button onClick={() => { setView('historique'); chargerHistorique() }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${view === 'historique' ? 'bg-[#7F77DD] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
            🗂️ Historique ({historique.length})
          </button>
        </div>
      </div>

      {/* TABS PERIODE */}
      <div className="flex gap-2">
        {(['jour', 'semaine', 'mois'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-[#0C0C1E] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
            {t === 'jour' ? '📅 Jour' : t === 'semaine' ? '📆 Semaine' : '📈 Mois'}
          </button>
        ))}
      </div>

      {/* VUE GENERER */}
      {view === 'generer' && (
        <>
          {/* Sélecteur date */}
          <div className="card flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">{tab === 'mois' ? 'Mois' : tab === 'semaine' ? 'Choisir un jour de la semaine' : 'Date'}</label>
              <input className="input" type={tab === 'mois' ? 'month' : 'date'}
                value={tab === 'mois' ? date.slice(0, 7) : date}
                onChange={e => setDate(tab === 'mois' ? e.target.value + '-01' : e.target.value)} />
            </div>
            <button onClick={generer} disabled={loading} className="btn-primary text-sm">
              {loading ? '⏳ Calcul...' : '📊 Générer'}
            </button>
          </div>

          {/* Dépenses */}
          <div className="card space-y-3">
            <p className="text-sm font-medium">💸 Dépenses — {getLabel()}</p>
            <div className="grid grid-cols-3 gap-2">
              <select className="input text-sm col-span-1" value={newDep.type}
                onChange={e => setNewDep(f => ({ ...f, type: e.target.value }))}>
                <option value="pub">📢 Pub</option>
                <option value="achat">📦 Achat</option>
                <option value="autre">💸 Autre</option>
              </select>
              <input className="input text-sm" value={newDep.description}
                onChange={e => setNewDep(f => ({ ...f, description: e.target.value }))}
                placeholder="Description" />
              <div className="flex gap-1">
                <input className="input text-sm flex-1" type="number" value={newDep.montant}
                  onChange={e => setNewDep(f => ({ ...f, montant: e.target.value }))}
                  placeholder="Montant F" />
                <button onClick={ajouterDepense} className="btn-primary text-sm px-3">+</button>
              </div>
            </div>
            {depenses.map(d => (
              <div key={d.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                <span className="text-gray-500">{d.type === 'pub' ? '📢' : d.type === 'achat' ? '📦' : '💸'} {d.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 font-medium">-{fmt(d.montant)} F</span>
                  <button onClick={() => supprimerDepense(d.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* RAPPORT AFFICHÉ */}
          {rapport && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8e8f0', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg,#0C0C1E,#2D2A6E)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{profil?.nom_boutique || 'Ma Boutique'}</div>
                  <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 11 }}>{periodeLabel.toUpperCase()}</div>
                </div>
                <div style={{ textAlign: 'right', color: 'rgba(255,255,255,.5)', fontSize: 12, textTransform: 'capitalize' }}>{getLabel()}</div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid #f0f0f0' }}>
                {[
                  { l: 'CA encaissé', v: fmt(rapport.ca), c: '#1D9E75' },
                  { l: 'Commandes', v: `${rapport.livrees.length}/${rapport.commandes.length}`, c: '#7F77DD' },
                  { l: 'Bénéfice NET', v: fmt(rapport.benefice_net), c: rapport.benefice_net >= 0 ? '#0F6E56' : '#A32D2D' },
                ].map(k => (
                  <div key={k.l} style={{ padding: '16px 10px', textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{k.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: k.c }}>{k.v}</div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '12px 16px', gap: 8 }}>
                {[
                  { l: 'Livrées', v: rapport.livrees.length, c: '#1D9E75' },
                  { l: 'Annulées', v: rapport.annulees.length, c: '#E24B4A' },
                  { l: 'Panier moy.', v: fmt(rapport.panier_moyen) + ' F', c: '#7F77DD' },
                  { l: 'Dépenses', v: fmt(rapport.total_depenses) + ' F', c: '#854F0B' },
                ].map(s => (
                  <div key={s.l} style={{ background: '#F8F8FC', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.l}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: s.c, marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Par zone */}
              {Object.keys(rapport.byZone).length > 0 && (
                <div style={{ padding: '0 16px 12px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Par zone</p>
                  {Object.entries(rapport.byZone).map(([zone, info]: any) => (
                    <div key={zone} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: '#F8F8FC', borderRadius: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#555' }}>📍 {zone}</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 12, color: '#7F77DD', fontWeight: 600 }}>{info.nb} cmd</span>
                        <span style={{ fontSize: 12, color: '#333', fontWeight: 600 }}>{fmt(info.ca)} F</span>
                        <span style={{ fontSize: 12, color: '#1D9E75' }}>+{fmt(info.benefice)} F</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bilan financier */}
              <div style={{ margin: '0 16px', background: '#0C0C1E', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
                <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Décomposition</p>
                {[
                  { l: 'CA encaissé', v: fmt(rapport.ca) + ' F', c: '#fff' },
                  { l: 'Frais livraison', v: '-' + fmt(rapport.cout_livraisons) + ' F', c: '#F09595' },
                  { l: 'Coût produits', v: '-' + fmt(rapport.cout_produits) + ' F', c: '#F09595' },
                  ...(rapport.dep_pub > 0 ? [{ l: '📢 Pub', v: '-' + fmt(rapport.dep_pub) + ' F', c: '#FAC775' }] : []),
                  ...(rapport.dep_achat > 0 ? [{ l: '🛒 Achats', v: '-' + fmt(rapport.dep_achat) + ' F', c: '#FAC775' }] : []),
                  ...(rapport.dep_autre > 0 ? [{ l: '💸 Autres', v: '-' + fmt(rapport.dep_autre) + ' F', c: '#FAC775' }] : []),
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ color: 'rgba(255,255,255,.4)' }}>{r.l}</span>
                    <span style={{ color: r.c, fontWeight: 500 }}>{r.v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 4 }}>
                  <span style={{ color: '#fff', fontWeight: 700 }}>✅ Bénéfice net</span>
                  <span style={{ color: rapport.benefice_net >= 0 ? '#9FE1CB' : '#F09595', fontSize: 20, fontWeight: 800 }}>
                    {fmt(rapport.benefice_net)} F
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div style={{ padding: '0 16px 12px' }}>
                <input className="input text-sm" value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="📝 Ajouter une note (optionnel)..." />
              </div>

              {/* Actions */}
              <div style={{ padding: '0 16px 16px', display: 'flex', gap: 10 }}>
                <button onClick={() => copier()} style={{
                  flex: 1, background: copied ? '#1D9E75' : '#25D366', color: '#fff',
                  border: 'none', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}>
                  {copied ? '✅ Copié ! Colle sur WhatsApp' : '📋 Copier pour WhatsApp'}
                </button>
                <button onClick={sauvegarder} disabled={saving} style={{
                  background: '#EEEDFE', color: '#534AB7', border: 'none',
                  padding: '13px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0
                }}>
                  {saving ? '⏳' : '💾 Sauvegarder'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* VUE HISTORIQUE */}
      {view === 'historique' && (
        <div className="space-y-3">
          {historique.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-3">🗂️</p>
              <p className="text-gray-500 font-medium">Aucun rapport sauvegardé</p>
              <p className="text-gray-400 text-sm mt-1">Génère un rapport et clique "Sauvegarder"</p>
              <button onClick={() => setView('generer')} className="btn-primary text-sm mt-4">
                Générer mon premier rapport
              </button>
            </div>
          ) : historique.map(h => {
            const label = tab === 'jour'
              ? new Date(h.date_debut + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              : tab === 'semaine'
              ? `Sem. du ${new Date(h.date_debut + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
              : new Date(h.date_debut + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            return (
              <div key={h.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize">{label}</p>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">CA : <strong className="text-gray-700">{fmt(h.ca)} F</strong></span>
                      <span className="text-xs text-gray-400">Bénéf. : <strong className={h.benefice_net >= 0 ? 'text-green-600' : 'text-red-500'}>{fmt(h.benefice_net)} F</strong></span>
                      <span className="text-xs text-gray-400">{h.nb_livrees}/{h.nb_commandes} livrées</span>
                      {h.total_depenses > 0 && <span className="text-xs text-amber-600">Dép : {fmt(h.total_depenses)} F</span>}
                    </div>
                    {h.notes && <p className="text-xs text-gray-400 mt-1 italic">📝 {h.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => copier({ ...h, byZone: h.data_json?.byZone || {}, deps: h.data_json?.deps || [] }, label)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 text-base" title="Copier WhatsApp">
                      📋
                    </button>
                    <button onClick={() => supprimerRapport(h.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-400 text-base">
                      🗑️
                    </button>
                  </div>
                </div>
                {/* Mini bilan */}
                <div style={{ background: '#F8F8FC', borderRadius: 10, padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { l: 'CA', v: fmt(h.ca) + ' F', c: '#333' },
                    { l: 'Bénéfice brut', v: fmt(h.benefice_brut) + ' F', c: '#7F77DD' },
                    { l: 'Bénéfice net', v: fmt(h.benefice_net) + ' F', c: h.benefice_net >= 0 ? '#1D9E75' : '#E24B4A' },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#999' }}>{s.l}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
