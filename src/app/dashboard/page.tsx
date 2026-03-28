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
  const [form, setForm] = useState({
    telephone: '', nom: '', adresse: '',
    zone_id: '', livreur_id: '', notes: '',
    items: [{ produit_id: '', quantite: 1 }]
  })

  const load = useCallback(async () => {
    const [c, z, l, p] = await Promise.all([
      supabase.from('commandes_detail').select('*').order('created_at', { ascending: false }),
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
    const ch = supabase.channel('cmd-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, load)
      .subscribe()
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
      const { data: nc } = await supabase.from('clients').insert({
        user_id: user.id, nom: form.nom || form.telephone,
        telephone: form.telephone, adresse: form.adresse
      }).select('id').single()
      client_id = nc?.id || null
    }
    const { data: cmd } = await supabase.from('commandes').insert({
      user_id: user.id, client_id, zone_id: form.zone_id || null,
      livreur_id: form.livreur_id || null, cout_livraison: coutLiv, notes: form.notes,
    }).select('id').single()
    if (cmd) {
      const items = form.items.filter(i => i.produit_id).map(i => {
        const p = produits.find(p => p.id === i.produit_id)!
        return { commande_id: cmd.id, produit_id: i.produit_id, quantite: i.quantite, prix_unitaire: p.prix_vente, cout_unitaire: p.cout_achat }
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

  async function supprimer(id: string) {
    if (!confirm('Supprimer cette commande ?')) return
    await supabase.from('commande_items').delete().eq('commande_id', id)
    await supabase.from('commandes').delete().eq('id', id)
    if (expanded === id) setExpanded(null)
    load()
  }

  const filtered = commandes
    .filter(c => filtre === 'tous' || c.statut === filtre)
    .filter(c => !search || [c.client_nom, c.client_tel, c.numero_commande, c.zone_nom]
      .some(v => (v || '').toLowerCase().includes(search.toLowerCase())))

  const counts: Record<string, number> = {}
  STATUTS.forEach(s => { counts[s] = commandes.filter(c => c.statut === s).length })

  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }
  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #eee', borderRadius: 12, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#111', boxSizing: 'border-box' }
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .cmd-card{transition:box-shadow .2s,border-color .2s;}
        .cmd-card:hover{box-shadow:0 2px 16px rgba(0,0,0,.07);}
        .statut-btn{transition:all .15s;}
        .statut-btn:hover{opacity:.85;}
        @media(max-width:600px){
          .grid-stats{grid-template-columns:repeat(3,1fr)!important;}
          .grid-form-2{grid-template-columns:1fr!important;}
          .grid-recap{grid-template-columns:1fr!important;}
          .client-grid{grid-template-columns:1fr!important;}
          .statuts-wrap{flex-wrap:wrap!important;}
          .header-row{flex-direction:column!important;align-items:flex-start!important;}
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 40 }}>

        {/* HEADER */}
        <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.5, margin: 0 }}>Commandes</h1>
            <p style={{ fontSize: 12, color: '#bbb', margin: '4px 0 0' }}>
              {commandes.length} au total · Sync {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ flexShrink: 0, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 22px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 18px rgba(127,119,221,.35)', whiteSpace: 'nowrap' }}>
            + Nouvelle
          </button>
        </div>

        {/* STATS FILTRES */}
        <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 14 }}>
          {STATUTS.map(s => {
            const cfg = S[s]; const on = filtre === s
            return (
              <button key={s} onClick={() => setFiltre(on ? 'tous' : s)} style={{ background: on ? cfg.bg : '#fff', border: `2px solid ${on ? cfg.dot : '#f0f0f0'}`, borderRadius: 14, padding: '10px 4px', cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 3 }}>{cfg.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: on ? cfg.dot : '#222', letterSpacing: -.5, lineHeight: 1 }}>{counts[s] || 0}</div>
                <div style={{ fontSize: 9, color: cfg.color, fontWeight: 700, marginTop: 3, lineHeight: 1.2 }}>{cfg.label}</div>
              </button>
            )
          })}
        </div>

        {/* RECHERCHE */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nom, téléphone, numéro de commande..."
            style={{ ...inp, paddingLeft: 44, borderRadius: 14 }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18 }}>✕</button>}
        </div>

        {/* FORMULAIRE */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #CECBF6', padding: 20, marginBottom: 16, animation: 'slide .2s ease', boxShadow: '0 8px 32px rgba(127,119,221,.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0C0C1E', margin: 0 }}>📦 Nouvelle commande</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: '#888', fontSize: 16 }}>✕</button>
            </div>

            <div className="grid-form-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={lbl}>📞 Téléphone</label><input style={inp} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="77 000 00 00" /></div>
              <div><label style={lbl}>👤 Nom client</label><input style={inp} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Fatou Diallo" /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={lbl}>📍 Adresse de livraison</label><input style={inp} value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Rue 10, Médina, Dakar" /></div>
            <div className="grid-form-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={lbl}>Zone de livraison</label>
                <select style={sel} value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value, livreur_id: '' }))}>
                  <option value="">Choisir une zone</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.nom} — {fmt(z.cout_livraison)} F</option>)}
                </select>
              </div>
              <div><label style={lbl}>Livreur</label>
                <select style={sel} value={form.livreur_id} onChange={e => setForm(f => ({ ...f, livreur_id: e.target.value }))}>
                  <option value="">Choisir un livreur</option>
                  {livreursZone.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Produits *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {form.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select style={{ ...sel, flex: 1, fontSize: 13 }} value={item.produit_id}
                      onChange={e => { const items = [...form.items]; items[i] = { ...items[i], produit_id: e.target.value }; setForm(f => ({ ...f, items })) }}>
                      <option value="">Choisir un produit</option>
                      {produits.map(p => <option key={p.id} value={p.id}>{p.nom} — {fmt(p.prix_vente)} F (stock: {p.stock_total})</option>)}
                    </select>
                    <input style={{ ...inp, width: 64, textAlign: 'center' }} type="number" min="1" value={item.quantite}
                      onChange={e => { const items = [...form.items]; items[i] = { ...items[i], quantite: +e.target.value }; setForm(f => ({ ...f, items })) }} />
                    {form.items.length > 1 && (
                      <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}
                        style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#E24B4A', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setForm(f => ({ ...f, items: [...f.items, { produit_id: '', quantite: 1 }] }))}
                style={{ color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, marginTop: 8, padding: 0 }}>
                + Ajouter un produit
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Notes (optionnel)</label>
              <input style={inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Instructions spéciales..." />
            </div>

            {totalForm > 0 && (
              <div className="grid-recap" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, background: 'linear-gradient(135deg,#EEEDFE,#E8E6F8)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
                {[
                  { lbl: 'Total vente', val: fmt(totalForm) + ' F', c: '#534AB7' },
                  { lbl: 'Livraison', val: '-' + fmt(coutLiv) + ' F', c: '#E24B4A' },
                  { lbl: 'Bénéfice', val: fmt(beneficeForm) + ' F', c: '#1D9E75' },
                ].map(x => (
                  <div key={x.lbl} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#7F77DD', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{x.lbl}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: x.c }}>{x.val}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '11px 20px', borderRadius: 12, border: '1.5px solid #eee', background: '#fff', color: '#666', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={save} disabled={saving || !form.items.some(i => i.produit_id)}
                style={{ padding: '11px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: (!form.items.some(i => i.produit_id) || saving) ? 0.5 : 1 }}>
                {saving ? '⏳ Création...' : '✓ Créer la commande'}
              </button>
            </div>
          </div>
        )}

        {/* RÉSULTAT */}
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 10 }}>
          {filtered.length} commande{filtered.length > 1 ? 's' : ''} {filtre !== 'tous' ? `· filtre: ${S[filtre]?.label}` : ''}
          {search ? ` · "${search}"` : ''}
        </p>

        {/* LISTE */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '52px 24px', textAlign: 'center', border: '1px solid #eee' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📦</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>{search ? 'Aucun résultat' : 'Aucune commande'}</p>
            <p style={{ fontSize: 14, color: '#aaa', marginBottom: 24 }}>{search ? 'Essaie un autre terme de recherche' : 'Crée ta première commande maintenant'}</p>
            {!search && <button onClick={() => setShowForm(true)} style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>+ Nouvelle commande</button>}
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
                <div key={c.id} className="cmd-card" style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${isOpen ? '#CECBF6' : '#f0f0f0'}`, overflow: 'hidden', boxShadow: isOpen ? '0 4px 24px rgba(127,119,221,.12)' : 'none', transition: 'all .2s' }}>

                  {/* LIGNE PRINCIPALE — cliquable */}
                  <div onClick={() => setExpanded(isOpen ? null : c.id)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>

                    {/* Avatar */}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.dot}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: cfg.dot, flexShrink: 0 }}>
                      {initiales}
                    </div>

                    {/* Contenu principal */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Nom + téléphone */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#0C0C1E' }}>{nom || 'Client anonyme'}</span>
                        {tel && <span style={{ fontSize: 12, color: '#534AB7', background: '#EEEDFE', padding: '2px 10px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap' }}>{tel}</span>}
                      </div>
                      {/* Badges infos */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.icon} {cfg.label}</span>
                        {c.numero_commande && <span style={{ fontSize: 10, color: '#ccc', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.numero_commande}</span>}
                        {c.zone_nom && <span style={{ fontSize: 10, color: '#bbb', whiteSpace: 'nowrap' }}>📍 {c.zone_nom}</span>}
                        {c.livreur_nom && <span style={{ fontSize: 10, color: '#bbb', whiteSpace: 'nowrap' }}>🏍️ {c.livreur_nom}</span>}
                      </div>
                      {/* Date */}
                      <p style={{ fontSize: 11, color: '#ddd', margin: '4px 0 0' }}>{new Date(c.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    {/* Prix + chevron */}
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: c.statut === 'livre' ? '#1D9E75' : '#0C0C1E', whiteSpace: 'nowrap' }}>{fmt(c.total_vente || 0)} F</div>
                      {c.statut === 'livre' && c.benefice > 0 && <div style={{ fontSize: 11, color: '#1D9E75', fontWeight: 700, whiteSpace: 'nowrap' }}>+{fmt(c.benefice)} F bén.</div>}
                      <div style={{ fontSize: 14, color: '#ccc', marginTop: 4 }}>{isOpen ? '▲' : '▼'}</div>
                    </div>
                  </div>

                  {/* DÉTAIL EXPANDÉ */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #f0f0f0', background: '#FAFAFE', animation: 'slide .15s ease' }}>

                      {/* Infos client */}
                      <div style={{ padding: '14px 16px 0' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Informations client</p>
                        <div className="client-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#fff', borderRadius: 14, padding: '14px', border: '1px solid #eee', marginBottom: 10 }}>
                          {nom && (
                            <div>
                              <div style={{ fontSize: 10, color: '#ccc', marginBottom: 4 }}>Nom complet</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>{nom}</div>
                            </div>
                          )}
                          {tel && (
                            <div>
                              <div style={{ fontSize: 10, color: '#ccc', marginBottom: 4 }}>Téléphone</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E', marginBottom: 6 }}>{tel}</div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <a href={`tel:${tel}`} style={{ background: '#1D9E75', color: '#fff', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>📞 Appeler</a>
                                <a href={`https://wa.me/${tel.replace(/[\s\-+()\[\]]/g, '')}`} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: '#fff', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>💬 WhatsApp</a>
                              </div>
                            </div>
                          )}
                          {c.client_adresse && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={{ fontSize: 10, color: '#ccc', marginBottom: 4 }}>Adresse de livraison</div>
                              <div style={{ fontSize: 14, color: '#333' }}>📍 {c.client_adresse}</div>
                            </div>
                          )}
                        </div>
                        {c.notes && (
                          <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#633806', border: '1px solid #FDE68A', display: 'flex', gap: 8 }}>
                            <span style={{ flexShrink: 0 }}>📝</span><span style={{ lineHeight: 1.5 }}>{c.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Changer statut */}
                      <div style={{ padding: '0 16px 14px' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Modifier le statut</p>
                        <div className="statuts-wrap" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {STATUTS.map(s => {
                            const scfg = S[s]; const active = c.statut === s
                            return (
                              <button key={s} className="statut-btn" onClick={() => updateStatut(c.id, s)} style={{ padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `2px solid ${active ? scfg.dot : '#eee'}`, background: active ? scfg.bg : '#fff', color: active ? scfg.color : '#aaa', whiteSpace: 'nowrap' }}>
                                {scfg.icon} {scfg.label}
                              </button>
                            )
                          })}
                          <button onClick={() => supprimer(c.id)} style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: '#FEF2F2', border: '2px solid #FECACA', color: '#DC2626', whiteSpace: 'nowrap' }}>
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
    </>
  )
}
