'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const STATUT_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  en_attente:   { label: 'En attente',   bg: '#FAEEDA', color: '#633806', dot: '#BA7517' },
  en_livraison: { label: 'En livraison', bg: '#E6F1FB', color: '#0C447C', dot: '#378ADD' },
  livre:        { label: 'Livré',        bg: '#E1F5EE', color: '#085041', dot: '#1D9E75' },
  annule:       { label: 'Annulé',       bg: '#FCEBEB', color: '#501313', dot: '#E24B4A' },
  echec:        { label: 'Échec',        bg: '#F1EFE8', color: '#444441', dot: '#888' },
}
const STATUTS = ['en_attente', 'en_livraison', 'livre', 'annule', 'echec']
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

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
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date>(new Date())

  const [form, setForm] = useState({
    telephone: '', nom: '', adresse: '',
    zone_id: '', livreur_id: '', notes: '',
    items: [{ produit_id: '', quantite: 1 }]
  })

  async function load() {
    const [c, z, l, p] = await Promise.all([
      supabase.from('commandes_detail').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('zones').select('*').order('nom'),
      supabase.from('livreurs').select('*').eq('actif', true).order('nom'),
      supabase.from('produits').select('*').eq('actif', true).order('nom'),
    ])
    setCommandes(c.data || [])
    setZones(z.data || [])
    setLivreurs(l.data || [])
    setProduits(p.data || [])
    setLastSync(new Date())
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Sync toutes les 10 secondes
    const interval = setInterval(load, 10000)
    const ch = supabase.channel('cmd-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, load)
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(ch) }
  }, [])

  const selectedZone = zones.find(z => z.id === form.zone_id)
  const coutLivraison = selectedZone?.cout_livraison || 0
  const livreursZone = form.zone_id ? livreurs.filter(l => l.zone_id === form.zone_id || !l.zone_id) : livreurs

  const totalForm = form.items.reduce((s, it) => {
    const p = produits.find(p => p.id === it.produit_id)
    return s + (p ? p.prix_vente * it.quantite : 0)
  }, 0)
  const beneficeForm = totalForm - form.items.reduce((s, it) => {
    const p = produits.find(p => p.id === it.produit_id)
    return s + (p ? p.cout_achat * it.quantite : 0)
  }, 0) - coutLivraison

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

  async function supprimerCommande(id: string) {
    if (!confirm('Supprimer cette commande ?')) return
    await supabase.from('commande_items').delete().eq('commande_id', id)
    await supabase.from('commandes').delete().eq('id', id)
    load()
  }

  function addItem() { setForm(f => ({ ...f, items: [...f.items, { produit_id: '', quantite: 1 }] })) }
  function updateItem(i: number, k: string, v: any) {
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items } })
  }
  function removeItem(i: number) { setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })) }

  const commandesFiltrees = commandes
    .filter(c => filtre === 'tous' || c.statut === filtre)
    .filter(c => {
      if (!search) return true
      const s = search.toLowerCase()
      return (c.client_nom || '').toLowerCase().includes(s) ||
        (c.client_tel || '').includes(s) ||
        (c.numero_commande || '').toLowerCase().includes(s) ||
        (c.zone_nom || '').toLowerCase().includes(s)
    })

  const counts = STATUTS.reduce((acc, s) => {
    acc[s] = commandes.filter(c => c.statut === s).length
    return acc
  }, {} as Record<string, number>)

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Commandes</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Sync : {lastSync.toLocaleTimeString('fr-FR')} · {commandes.length} total
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Nouvelle</button>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
        {STATUTS.map(s => {
          const cfg = STATUT_CONFIG[s]
          return (
            <button key={s} onClick={() => setFiltre(filtre === s ? 'tous' : s)} style={{
              background: filtre === s ? cfg.bg : '#fff',
              border: `1px solid ${filtre === s ? cfg.dot : '#eee'}`,
              borderRadius: 12, padding: '8px 4px', cursor: 'pointer', textAlign: 'center', transition: 'all .15s'
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: cfg.dot }}>{counts[s] || 0}</div>
              <div style={{ fontSize: 9, color: cfg.color, fontWeight: 600, marginTop: 1, lineHeight: 1.2 }}>{cfg.label.split(' ')[0]}</div>
            </button>
          )
        })}
      </div>

      {/* Recherche */}
      <input className="input" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Rechercher client, téléphone, numéro commande..." />

      {/* Formulaire */}
      {showForm && (
        <div className="card border-2 border-[#7F77DD] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Nouvelle commande</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">📞 Téléphone</label><input className="input" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="77 000 00 00" /></div>
            <div><label className="label">👤 Nom</label><input className="input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Fatou Diallo" /></div>
          </div>
          <div><label className="label">📍 Adresse</label><input className="input" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Rue 10, Médina" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Zone de livraison</label>
              <select className="input" value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value, livreur_id: '' }))}>
                <option value="">Choisir une zone</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.nom} — {fmt(z.cout_livraison)} F</option>)}
              </select>
            </div>
            <div>
              <label className="label">Coût livraison</label>
              <div className="input bg-gray-50 text-gray-600 font-medium">{fmt(coutLivraison)} FCFA</div>
            </div>
          </div>
          <div>
            <label className="label">Livreur</label>
            <select className="input" value={form.livreur_id} onChange={e => setForm(f => ({ ...f, livreur_id: e.target.value }))}>
              <option value="">Choisir un livreur</option>
              {livreursZone.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Produits *</label>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select className="input flex-1 text-sm" value={item.produit_id} onChange={e => updateItem(i, 'produit_id', e.target.value)}>
                    <option value="">Choisir un produit</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom} — {fmt(p.prix_vente)} F</option>)}
                  </select>
                  <input className="input w-16 text-sm" type="number" min="1" value={item.quantite} onChange={e => updateItem(i, 'quantite', +e.target.value)} />
                  {form.items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 p-1">✕</button>}
                </div>
              ))}
            </div>
            <button onClick={addItem} className="text-[#7F77DD] text-xs mt-2 hover:underline">+ Ajouter produit</button>
          </div>
          <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Instructions spéciales..." /></div>
          {totalForm > 0 && (
            <div className="bg-[#EEEDFE] rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
              <div><div className="text-xs text-gray-500">Total vente</div><div className="font-bold text-sm text-[#534AB7]">{fmt(totalForm)} F</div></div>
              <div><div className="text-xs text-gray-500">Livraison</div><div className="font-bold text-sm text-red-400">-{fmt(coutLivraison)} F</div></div>
              <div><div className="text-xs text-gray-500">Bénéfice</div><div className="font-bold text-sm text-green-600">{fmt(beneficeForm)} F</div></div>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Annuler</button>
            <button onClick={save} disabled={saving || !form.items.some(i => i.produit_id)} className="btn-primary text-sm">
              {saving ? '⏳...' : '✓ Créer commande'}
            </button>
          </div>
        </div>
      )}

      {/* Liste commandes */}
      {commandesFiltrees.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-500 text-sm">{search ? 'Aucun résultat' : 'Aucune commande'}</p>
          {!search && <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-4">+ Créer la première</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {commandesFiltrees.map((c: any) => {
            const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG['en_attente']
            const isExpanded = expanded === c.id
            const tel = c.client_tel || ''
            const nom = c.client_nom || ''
            const initiales = (nom || tel || 'C').slice(0, 2).toUpperCase()
            return (
              <div key={c.id} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${isExpanded ? '#CECBF6' : '#eee'}`, overflow: 'hidden', transition: 'all .2s' }}>
                {/* Ligne principale */}
                <div style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                  onClick={() => setExpanded(isExpanded ? null : c.id)}>

                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#EEEDFE,#CECBF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#534AB7', flexShrink: 0 }}>
                    {initiales}
                  </div>

                  {/* Infos client */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E' }}>
                        {nom || 'Client anonyme'}
                      </span>
                      {tel && (
                        <span style={{ fontSize: 11, color: '#7F77DD', background: '#EEEDFE', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>
                          {tel}
                        </span>
                      )}
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                      {c.numero_commande && <span style={{ fontSize: 10, color: '#bbb', fontFamily: 'monospace' }}>{c.numero_commande}</span>}
                      {c.zone_nom && <span style={{ fontSize: 10, color: '#aaa' }}>📍 {c.zone_nom}</span>}
                      {c.livreur_nom && <span style={{ fontSize: 10, color: '#aaa' }}>🏍️ {c.livreur_nom}</span>}
                      <span style={{ fontSize: 10, color: '#ccc' }}>{new Date(c.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Prix + chevron */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.statut === 'livre' ? '#1D9E75' : '#0C0C1E' }}>
                      {fmt(c.total_vente || 0)} F
                    </div>
                    {c.statut === 'livre' && c.benefice > 0 && (
                      <div style={{ fontSize: 10, color: '#1D9E75', fontWeight: 600 }}>+{fmt(c.benefice)} F</div>
                    )}
                    <div style={{ fontSize: 11, color: '#ccc', marginTop: 2 }}>{isExpanded ? '▲' : '▼'}</div>
                  </div>
                </div>

                {/* Détails expandés */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f5f5f5', padding: '12px 14px', background: '#FAFAFE' }}>
                    {/* Infos client complètes */}
                    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 12, border: '1px solid #eee' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Informations client</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {nom && (
                          <div>
                            <div style={{ fontSize: 10, color: '#bbb' }}>Nom</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0C0C1E' }}>{nom}</div>
                          </div>
                        )}
                        {tel && (
                          <div>
                            <div style={{ fontSize: 10, color: '#bbb' }}>Téléphone</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#0C0C1E' }}>{tel}</span>
                              <a href={`tel:${tel}`} style={{ background: '#1D9E75', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                📞 Appeler
                              </a>
                              <a href={`https://wa.me/${tel.replace(/\s/g, '')}`} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                                💬 WA
                              </a>
                            </div>
                          </div>
                        )}
                        {c.client_adresse && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: 10, color: '#bbb' }}>Adresse</div>
                            <div style={{ fontSize: 13, color: '#0C0C1E' }}>📍 {c.client_adresse}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {c.notes && (
                      <div style={{ background: '#FFFBEB', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#633806', border: '1px solid #FDE68A' }}>
                        📝 {c.notes}
                      </div>
                    )}

                    {/* Changer statut */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Changer le statut</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {STATUTS.map(s => {
                          const scfg = STATUT_CONFIG[s]
                          return (
                            <button key={s} onClick={() => updateStatut(c.id, s)} style={{
                              padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                              background: c.statut === s ? scfg.bg : '#fff',
                              border: `1.5px solid ${c.statut === s ? scfg.dot : '#eee'}`,
                              color: c.statut === s ? scfg.color : '#999',
                            }}>
                              {scfg.label}
                            </button>
                          )
                        })}
                        <button onClick={() => supprimerCommande(c.id)} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626' }}>
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
