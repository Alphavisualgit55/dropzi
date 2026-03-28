'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const S: Record<string, { label: string; bg: string; color: string; dot: string; icon: string }> = {
  en_attente:   { label: 'En attente',   bg: '#FAEEDA', color: '#633806', dot: '#BA7517', icon: '⏳' },
  en_livraison: { label: 'En livraison', bg: '#E6F1FB', color: '#0C447C', dot: '#378ADD', icon: '🚚' },
  livre:        { label: 'Livré',        bg: '#E1F5EE', color: '#085041', dot: '#1D9E75', icon: '✅' },
  annule:       { label: 'Annulé',       bg: '#FCEBEB', color: '#501313', dot: '#E24B4A', icon: '❌' },
  echec:        { label: 'Échec',        bg: '#F1EFE8', color: '#444441', dot: '#888',    icon: '⚠️' },
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
  const [lastSync, setLastSync] = useState(new Date())
  const [form, setForm] = useState({ telephone: '', nom: '', adresse: '', zone_id: '', livreur_id: '', notes: '', items: [{ produit_id: '', quantite: 1 }] })

  const load = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    const ch = supabase.channel('cmd-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, load).subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(ch) }
  }, [load])

  const zone = zones.find(z => z.id === form.zone_id)
  const coutLiv = zone?.cout_livraison || 0
  const livreursZone = form.zone_id ? livreurs.filter(l => l.zone_id === form.zone_id || !l.zone_id) : livreurs
  const totalForm = form.items.reduce((s, it) => { const p = produits.find(p => p.id === it.produit_id); return s + (p ? p.prix_vente * it.quantite : 0) }, 0)
  const beneficeForm = totalForm - form.items.reduce((s, it) => { const p = produits.find(p => p.id === it.produit_id); return s + (p ? p.cout_achat * it.quantite : 0) }, 0) - coutLiv

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    let client_id: string | null = null
    if (form.telephone || form.nom) {
      const { data: nc } = await supabase.from('clients').insert({ user_id: user.id, nom: form.nom || form.telephone, telephone: form.telephone, adresse: form.adresse }).select('id').single()
      client_id = nc?.id || null
    }
    const { data: cmd } = await supabase.from('commandes').insert({ user_id: user.id, client_id, zone_id: form.zone_id || null, livreur_id: form.livreur_id || null, cout_livraison: coutLiv, notes: form.notes }).select('id').single()
    if (cmd) {
      const items = form.items.filter(i => i.produit_id).map(i => { const p = produits.find(p => p.id === i.produit_id)!; return { commande_id: cmd.id, produit_id: i.produit_id, quantite: i.quantite, prix_unitaire: p.prix_vente, cout_unitaire: p.cout_achat } })
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

  async function supprimer(id: string) {
    if (!confirm('Supprimer cette commande ?')) return
    await supabase.from('commande_items').delete().eq('commande_id', id)
    await supabase.from('commandes').delete().eq('id', id)
    if (expanded === id) setExpanded(null)
    load()
  }

  const filtered = commandes
    .filter(c => filtre === 'tous' || c.statut === filtre)
    .filter(c => !search || [c.client_nom, c.client_tel, c.numero_commande, c.zone_nom].some(v => (v || '').toLowerCase().includes(search.toLowerCase())))

  const counts: Record<string, number> = {}
  STATUTS.forEach(s => { counts[s] = commandes.filter(c => c.statut === s).length })

  if (loading) return <div className="flex justify-center items-center min-h-64"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 32px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.5 }}>Commandes</h1>
          <p style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>
            Sync : {lastSync.toLocaleTimeString('fr-FR')} · {commandes.length} commande{commandes.length > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(127,119,221,.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>+</span> Nouvelle commande
        </button>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16 }}>
        {STATUTS.map(s => {
          const cfg = S[s]
          const active = filtre === s
          return (
            <button key={s} onClick={() => setFiltre(active ? 'tous' : s)} style={{ background: active ? cfg.bg : '#fff', border: `1.5px solid ${active ? cfg.dot : '#eee'}`, borderRadius: 14, padding: '10px 6px', cursor: 'pointer', textAlign: 'center', transition: 'all .15s', boxShadow: active ? '0 2px 12px rgba(0,0,0,.08)' : 'none' }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{cfg.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: active ? cfg.dot : '#333', letterSpacing: -.5 }}>{counts[s] || 0}</div>
              <div style={{ fontSize: 9, color: cfg.color, fontWeight: 700, marginTop: 2, lineHeight: 1.2 }}>{cfg.label.split(' ')[0]}</div>
            </button>
          )
        })}
      </div>

      {/* RECHERCHE */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#ccc' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher client, téléphone, numéro..." style={{ width: '100%', background: '#fff', border: '1.5px solid #eee', borderRadius: 14, padding: '12px 14px 12px 42px', fontSize: 14, outline: 'none', color: '#333', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>

      {/* FORMULAIRE NOUVELLE COMMANDE */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #CECBF6', padding: 20, marginBottom: 16, boxShadow: '0 4px 24px rgba(127,119,221,.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0C0C1E' }}>Nouvelle commande</h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>📞 Téléphone</label><input className="input" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="77 000 00 00" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>👤 Nom client</label><input className="input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Fatou Diallo" /></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>📍 Adresse</label><input className="input" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Rue 10, Médina, Dakar" /></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Zone</label>
              <select className="input" value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value, livreur_id: '' }))}>
                <option value="">Choisir une zone</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.nom} — {fmt(z.cout_livraison)} F</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Livreur</label>
              <select className="input" value={form.livreur_id} onChange={e => setForm(f => ({ ...f, livreur_id: e.target.value }))}>
                <option value="">Choisir un livreur</option>
                {livreursZone.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Produits *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select className="input" style={{ flex: 1, fontSize: 13 }} value={item.produit_id} onChange={e => { const items = [...form.items]; items[i] = { ...items[i], produit_id: e.target.value }; setForm(f => ({ ...f, items })) }}>
                    <option value="">Choisir un produit</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom} — {fmt(p.prix_vente)} F</option>)}
                  </select>
                  <input className="input" style={{ width: 60, textAlign: 'center' }} type="number" min="1" value={item.quantite} onChange={e => { const items = [...form.items]; items[i] = { ...items[i], quantite: +e.target.value }; setForm(f => ({ ...f, items })) }} />
                  {form.items.length > 1 && <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))} style={{ color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>}
                </div>
              ))}
            </div>
            <button onClick={() => setForm(f => ({ ...f, items: [...f.items, { produit_id: '', quantite: 1 }] }))} style={{ color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, marginTop: 8, padding: 0 }}>+ Ajouter un produit</button>
          </div>

          <div style={{ marginBottom: 16 }}><label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Notes</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Instructions spéciales..." /></div>

          {totalForm > 0 && (
            <div style={{ background: 'linear-gradient(135deg,#EEEDFE,#E6E4F8)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
              <div><div style={{ fontSize: 10, color: '#7F77DD', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Total vente</div><div style={{ fontSize: 17, fontWeight: 800, color: '#534AB7' }}>{fmt(totalForm)} F</div></div>
              <div><div style={{ fontSize: 10, color: '#7F77DD', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Livraison</div><div style={{ fontSize: 17, fontWeight: 800, color: '#E24B4A' }}>-{fmt(coutLiv)} F</div></div>
              <div><div style={{ fontSize: 10, color: '#7F77DD', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Bénéfice</div><div style={{ fontSize: 17, fontWeight: 800, color: '#1D9E75' }}>{fmt(beneficeForm)} F</div></div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 12, border: '1.5px solid #eee', background: '#fff', color: '#666', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            <button onClick={save} disabled={saving || !form.items.some(i => i.produit_id)} style={{ padding: '10px 24px', borderRadius: 12, background: saving ? '#ccc' : 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: (!form.items.some(i => i.produit_id)) ? 0.5 : 1 }}>
              {saving ? '⏳ Création...' : '✓ Créer la commande'}
            </button>
          </div>
        </div>
      )}

      {/* LISTE COMMANDES */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: '48px 24px', textAlign: 'center', border: '1px solid #eee' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 6 }}>{search ? 'Aucun résultat' : 'Aucune commande'}</p>
          <p style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>{search ? 'Essaie un autre terme' : 'Crée ta première commande'}</p>
          {!search && <button onClick={() => setShowForm(true)} style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Nouvelle commande</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((c: any) => {
            const cfg = S[c.statut] || S['en_attente']
            const isOpen = expanded === c.id
            const tel = c.client_tel || ''
            const nom = c.client_nom || ''
            const initiales = (nom || tel || 'C').slice(0, 2).toUpperCase()

            return (
              <div key={c.id} style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${isOpen ? '#CECBF6' : '#f0f0f0'}`, overflow: 'hidden', transition: 'all .2s', boxShadow: isOpen ? '0 4px 20px rgba(127,119,221,.1)' : 'none' }}>

                {/* ROW PRINCIPALE */}
                <div onClick={() => setExpanded(isOpen ? null : c.id)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>

                  {/* Avatar */}
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg,${cfg.bg},${cfg.dot}22)`, border: `1.5px solid ${cfg.dot}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: cfg.dot, flexShrink: 0 }}>
                    {initiales}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>{nom || 'Client anonyme'}</span>
                      {tel && (
                        <span style={{ fontSize: 11, color: '#534AB7', background: '#EEEDFE', padding: '1px 8px', borderRadius: 20, fontWeight: 600 }}>{tel}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.icon} {cfg.label}</span>
                      {c.numero_commande && <span style={{ fontSize: 10, color: '#ccc', fontFamily: 'monospace' }}>{c.numero_commande}</span>}
                      {c.zone_nom && <span style={{ fontSize: 10, color: '#bbb' }}>📍 {c.zone_nom}</span>}
                    </div>
                  </div>

                  {/* Prix */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: c.statut === 'livre' ? '#1D9E75' : '#0C0C1E' }}>{fmt(c.total_vente || 0)} F</div>
                    {c.statut === 'livre' && c.benefice > 0 && <div style={{ fontSize: 10, color: '#1D9E75', fontWeight: 700 }}>+{fmt(c.benefice)} F</div>}
                    <div style={{ fontSize: 10, color: '#ddd', marginTop: 2 }}>{new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                    <div style={{ fontSize: 10, color: '#ccc', marginTop: 2 }}>{isOpen ? '▲' : '▼'}</div>
                  </div>
                </div>

                {/* DÉTAILS EXPANDÉS */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f5f5f5', background: '#FAFAFE' }}>
                    {/* Info client */}
                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Informations client</p>
                      <div style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', border: '1px solid #eee', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {nom && (
                          <div>
                            <div style={{ fontSize: 10, color: '#ccc', marginBottom: 3 }}>Nom</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0C0C1E' }}>{nom}</div>
                          </div>
                        )}
                        {tel && (
                          <div>
                            <div style={{ fontSize: 10, color: '#ccc', marginBottom: 3 }}>Téléphone</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#0C0C1E' }}>{tel}</span>
                              <a href={`tel:${tel}`} style={{ background: '#1D9E75', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>📞 Appeler</a>
                              <a href={`https://wa.me/${tel.replace(/[\s\-+]/g, '')}`} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>💬 WA</a>
                            </div>
                          </div>
                        )}
                        {c.client_adresse && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: 10, color: '#ccc', marginBottom: 3 }}>Adresse</div>
                            <div style={{ fontSize: 13, color: '#333' }}>📍 {c.client_adresse}</div>
                          </div>
                        )}
                        {c.livreur_nom && (
                          <div>
                            <div style={{ fontSize: 10, color: '#ccc', marginBottom: 3 }}>Livreur</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>🏍️ {c.livreur_nom}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 10, color: '#ccc', marginBottom: 3 }}>Date</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{new Date(c.created_at).toLocaleString('fr-FR')}</div>
                        </div>
                      </div>

                      {c.notes && (
                        <div style={{ background: '#FFFBEB', borderRadius: 10, padding: '10px 14px', marginTop: 10, fontSize: 13, color: '#633806', border: '1px solid #FDE68A', display: 'flex', gap: 8 }}>
                          <span>📝</span><span>{c.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Changer statut */}
                    <div style={{ padding: '0 16px 14px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Changer le statut</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {STATUTS.map(s => {
                          const scfg = S[s]
                          const active = c.statut === s
                          return (
                            <button key={s} onClick={() => updateStatut(c.id, s)} style={{ padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${active ? scfg.dot : '#eee'}`, background: active ? scfg.bg : '#fff', color: active ? scfg.color : '#aaa', transition: 'all .15s' }}>
                              {scfg.icon} {scfg.label}
                            </button>
                          )
                        })}
                        <button onClick={() => supprimer(c.id)} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626' }}>
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
