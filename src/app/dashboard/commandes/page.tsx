'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const S: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  en_attente:   { label: 'En attente',   bg: '#FAEEDA', color: '#633806', dot: '#BA7517' },
  en_livraison: { label: 'En livraison', bg: '#E6F1FB', color: '#0C447C', dot: '#378ADD' },
  livre:        { label: 'Livré',        bg: '#E1F5EE', color: '#085041', dot: '#1D9E75' },
  annule:       { label: 'Annulé',       bg: '#FCEBEB', color: '#501313', dot: '#E24B4A' },
  echec:        { label: 'Échec',        bg: '#F1EFE8', color: '#444441', dot: '#888'    },
}
const STATUTS = ['en_attente', 'en_livraison', 'livre', 'annule', 'echec']
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function CommandesPage() {
  const supabase = createClient()
  const [all, setAll] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [livreurs, setLivreurs] = useState<any[]>([])
  const [produits, setProduits] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filtre, setFiltre] = useState('tous')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({ telephone: '', nom: '', adresse: '', zone_id: '', livreur_id: '', notes: '', items: [{ produit_id: '', quantite: 1 }] })

  const load = useCallback(async () => {
    const [c, z, l, p] = await Promise.all([
      supabase.from('commandes_detail').select('*, commande_items(quantite, prix_unitaire, produits(nom, image_url))').order('created_at', { ascending: false }),
      supabase.from('zones').select('*').order('nom'),
      supabase.from('livreurs').select('*').eq('actif', true).order('nom'),
      supabase.from('produits').select('*').eq('actif', true).order('nom'),
    ])
    setAll(c.data || [])
    setZones(z.data || [])
    setLivreurs(l.data || [])
    setProduits(p.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, 10000)
    const ch = supabase.channel('cmd').on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, load).subscribe()
    return () => { clearInterval(iv); supabase.removeChannel(ch) }
  }, [load])

  const zone = zones.find(z => z.id === form.zone_id)
  const coutLiv = zone?.cout_livraison || 0
  const livZ = form.zone_id ? livreurs.filter(l => !l.zone_id || l.zone_id === form.zone_id) : livreurs
  const totalF = form.items.reduce((s, it) => { const p = produits.find(p => p.id === it.produit_id); return s + (p ? p.prix_vente * it.quantite : 0) }, 0)
  const benef = totalF - form.items.reduce((s, it) => { const p = produits.find(p => p.id === it.produit_id); return s + (p ? p.cout_achat * it.quantite : 0) }, 0) - coutLiv

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    let cid: string | null = null
    if (form.telephone || form.nom) {
      const { data: nc } = await supabase.from('clients').insert({ user_id: user.id, nom: form.nom || form.telephone, telephone: form.telephone, adresse: form.adresse }).select('id').single()
      cid = nc?.id || null
    }
    const { data: cmd, error: cmdError } = await supabase.from('commandes').insert({ user_id: user.id, client_id: cid, zone_id: form.zone_id || null, livreur_id: form.livreur_id || null, cout_livraison: coutLiv, notes: form.notes }).select('id').single()
    if (cmdError) {
      if (cmdError.code === '42501' || cmdError.message?.includes('check_plan_limit') || cmdError.message?.includes('new row')) {
        alert('🚫 Limite de commandes atteinte ! Upgrade ton plan pour continuer.')
        window.location.href = '/dashboard/abonnement'
      } else {
        alert('Erreur : ' + cmdError.message)
      }
      return
    }
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
    await supabase.from('commandes').update({ statut }).eq('id', id)
    load()
  }

  async function del(id: string) {
    if (!confirm('Supprimer cette commande ?')) return
    await supabase.from('commande_items').delete().eq('commande_id', id)
    await supabase.from('commandes').delete().eq('id', id)
    if (expanded === id) setExpanded(null)
    load()
  }

  const filtered = all
    .filter(c => filtre === 'tous' || c.statut === filtre)
    .filter(c => !search || [c.client_nom, c.client_tel, c.numero_commande, c.zone_nom].some(v => (v || '').toLowerCase().includes(search.toLowerCase())))

  const counts: Record<string, number> = {}
  STATUTS.forEach(s => { counts[s] = all.filter(c => c.statut === s).length })

  const F: React.CSSProperties = { width: '100%', border: '1.5px solid #EBEBEB', borderRadius: 12, padding: '11px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#FAFAFA', color: '#111', boxSizing: 'border-box' }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style><div style={{ width: 32, height: 32, border: '3px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'sp .8s linear infinite' }} /></div>

  return (
    <>
      <style>{`
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes fd{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .ccard{transition:box-shadow .18s,border-color .18s;}
        .ccard:hover{box-shadow:0 4px 20px rgba(0,0,0,.07)!important;}
        .sbt{transition:all .15s;font-family:inherit;cursor:pointer;}
        .sbt:hover{opacity:.85;}
        @media(max-width:580px){
          .hrow{flex-direction:column!important;align-items:flex-start!important;}
          .sgrid{grid-template-columns:repeat(3,1fr)!important;}
          .fgrid{grid-template-columns:1fr!important;}
          .rgrid{grid-template-columns:1fr!important;}
          .cgrid{grid-template-columns:1fr!important;}
          .swrap{flex-wrap:wrap!important;}
        }
      `}</style>

      <div style={{ maxWidth: 660, margin: '0 auto', paddingBottom: 48 }}>

        {/* ── HEADER ── */}
        <div className="hrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C0C1E', letterSpacing: -.8, margin: 0 }}>Commandes</h1>
            <p style={{ fontSize: 12, color: '#C0C0C0', margin: '5px 0 0' }}>{all.length} commande{all.length > 1 ? 's' : ''} au total</p>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={{ flexShrink: 0, background: showForm ? '#534AB7' : 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 18px rgba(127,119,221,.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{showForm ? '✕' : '+'}</span> {showForm ? 'Fermer' : 'Nouvelle'}
          </button>
        </div>

        {/* ── STATS COMPACTES ── */}
        <div className="sgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16 }}>
          {STATUTS.map(s => {
            const cfg = S[s]; const on = filtre === s; const n = counts[s] || 0
            return (
              <button key={s} className="sbt" onClick={() => setFiltre(on ? 'tous' : s)} style={{ background: on ? cfg.bg : '#fff', border: `1.5px solid ${on ? cfg.dot : '#EBEBEB'}`, borderRadius: 14, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: on ? cfg.dot : (n > 0 ? '#1a1a2e' : '#D0D0D0'), letterSpacing: -.5, lineHeight: 1, marginBottom: 4 }}>{n}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: on ? cfg.color : '#C0C0C0', lineHeight: 1.3 }}>{cfg.label}</div>
              </button>
            )
          })}
        </div>

        {/* ── BOUTON TOUTES LES COMMANDES ── */}
        <Link href="/dashboard/commandes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#0C0C1E,#1a1a3a)', borderRadius: 16, padding: '14px 18px', marginBottom: 14, textDecoration: 'none', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>📦</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Toutes les commandes</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{all.length} commandes · sync toutes les 10s</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#7F77DD', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>{all.length}</span>
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 18 }}>→</span>
          </div>
        </Link>

        {/* ── RECHERCHE ── */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#C8C8C8' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, téléphone, N° commande..." style={{ ...F, paddingLeft: 42, borderRadius: 14, background: '#fff' }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#C8C8C8', fontSize: 18, lineHeight: 1 }}>✕</button>}
        </div>

        {/* ── FORMULAIRE ── */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 20, border: '2px solid #CECBF6', padding: 20, marginBottom: 16, animation: 'fd .2s ease', boxShadow: '0 8px 32px rgba(127,119,221,.1)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0C0C1E', margin: '0 0 16px' }}>Nouvelle commande</h2>
            <div className="fgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Téléphone</label><input style={F} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="77 000 00 00" /></div>
              <div><label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Nom client</label><input style={F} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Fatou Diallo" /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Adresse</label><input style={F} value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Rue 10, Médina, Dakar" /></div>
            <div className="fgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Zone</label>
                <select style={{ ...F, cursor: 'pointer' }} value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value, livreur_id: '' }))}>
                  <option value="">Choisir une zone</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.nom} — {fmt(z.cout_livraison)} F</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Livreur</label>
                <select style={{ ...F, cursor: 'pointer' }} value={form.livreur_id} onChange={e => setForm(f => ({ ...f, livreur_id: e.target.value }))}>
                  <option value="">Choisir</option>
                  {livZ.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Produits *</label>
              {form.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <select style={{ ...F, flex: 1, fontSize: 13 }} value={item.produit_id} onChange={e => { const it = [...form.items]; it[i] = { ...it[i], produit_id: e.target.value }; setForm(f => ({ ...f, items: it })) }}>
                    <option value="">Choisir un produit</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom} — {fmt(p.prix_vente)} F</option>)}
                  </select>
                  <input style={{ ...F, width: 60, textAlign: 'center' }} type="number" min="1" value={item.quantite} onChange={e => { const it = [...form.items]; it[i] = { ...it[i], quantite: +e.target.value }; setForm(f => ({ ...f, items: it })) }} />
                  {form.items.length > 1 && <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} style={{ background: '#FEF2F2', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: '#E24B4A', fontSize: 16, flexShrink: 0 }}>✕</button>}
                </div>
              ))}
              <button onClick={() => setForm(f => ({ ...f, items: [...f.items, { produit_id: '', quantite: 1 }] }))} style={{ color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, padding: 0 }}>+ Ajouter</button>
            </div>
            <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>Notes</label><input style={F} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Instructions..." /></div>
            {totalF > 0 && (
              <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, background: '#F5F4FE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                {[['Vente', fmt(totalF) + ' F', '#534AB7'], ['Livraison', '-' + fmt(coutLiv) + ' F', '#E24B4A'], ['Bénéfice', fmt(benef) + ' F', '#1D9E75']].map(([l, v, c]) => (
                  <div key={l as string} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#9090B0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: c as string }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="sbt" onClick={() => setShowForm(false)} style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px solid #EBEBEB', background: '#fff', color: '#666', fontSize: 14, fontWeight: 600 }}>Annuler</button>
              <button className="sbt" onClick={save} disabled={saving || !form.items.some(i => i.produit_id)} style={{ padding: '10px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, opacity: (!form.items.some(i => i.produit_id) || saving) ? 0.5 : 1 }}>
                {saving ? '⏳ Création...' : '✓ Créer'}
              </button>
            </div>
          </div>
        )}

        {/* ── RÉSULTAT INFO ── */}
        {(search || filtre !== 'tous') && (
          <p style={{ fontSize: 12, color: '#ABABAB', marginBottom: 10 }}>
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            {filtre !== 'tous' ? ` · ${S[filtre]?.label}` : ''}
            {search ? ` · "${search}"` : ''}
            {' '}<button onClick={() => { setSearch(''); setFiltre('tous') }} style={{ color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Effacer</button>
          </p>
        )}

        {/* ── LISTE ── */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '56px 24px', textAlign: 'center', border: '1.5px solid #EBEBEB' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>{search ? 'Aucun résultat' : 'Aucune commande'}</p>
            <p style={{ fontSize: 14, color: '#ABABAB', marginBottom: 24 }}>{search ? 'Essaie un autre terme' : 'Crée ta première commande'}</p>
            {!search && <button className="sbt" onClick={() => setShowForm(true)} style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 14, padding: '13px 28px', fontSize: 15, fontWeight: 700 }}>+ Nouvelle commande</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((c: any) => {
              const cfg = S[c.statut] || S['en_attente']
              const isOpen = expanded === c.id
              const tel = c.client_tel || ''
              const nom = c.client_nom || ''
              const init = (nom || tel || 'C').slice(0, 2).toUpperCase()

              return (
                <div key={c.id} className="ccard" style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${isOpen ? '#CECBF6' : '#EBEBEB'}`, overflow: 'hidden', boxShadow: isOpen ? '0 4px 24px rgba(127,119,221,.1)' : 'none' }}>

                  {/* ROW */}
                  <div onClick={() => setExpanded(isOpen ? null : c.id)} style={{ padding: '13px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Avatar */}
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.dot}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: cfg.dot, flexShrink: 0 }}>{init}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>{nom || 'Client anonyme'}</span>
                        {tel && <span style={{ fontSize: 11, color: '#534AB7', background: '#EEEDFE', padding: '2px 9px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>{tel}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
                        {c.numero_commande && <span style={{ fontSize: 10, color: '#C8C8C8', fontFamily: 'monospace', flexShrink: 0 }}>{c.numero_commande}</span>}
                        {c.zone_nom && <span style={{ fontSize: 10, color: '#C0C0C0', flexShrink: 0 }}>📍 {c.zone_nom}</span>}
                      </div>
                      <p style={{ fontSize: 10, color: '#D8D8D8', margin: '4px 0 0' }}>{new Date(c.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    {/* Prix */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: c.statut === 'livre' ? '#1D9E75' : '#0C0C1E' }}>{fmt(c.total_vente || 0)} F</div>
                      {c.statut === 'livre' && c.benefice > 0 && <div style={{ fontSize: 10, color: '#1D9E75', fontWeight: 700 }}>+{fmt(c.benefice)} F</div>}
                      <div style={{ fontSize: 13, color: '#D0D0D0', marginTop: 4 }}>{isOpen ? '▲' : '▼'}</div>
                    </div>
                  </div>

                  {/* DÉTAIL */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #F5F5F5', background: '#FAFAFE', animation: 'fd .15s ease' }}>
                      <div style={{ padding: '14px 16px 0' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Client</p>
                        <div className="cgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#fff', borderRadius: 14, padding: 14, border: '1.5px solid #EBEBEB', marginBottom: 10 }}>
                          {nom && <div><div style={{ fontSize: 10, color: '#C8C8C8', marginBottom: 3 }}>Nom</div><div style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>{nom}</div></div>}
                          {tel && (
                            <div>
                              <div style={{ fontSize: 10, color: '#C8C8C8', marginBottom: 5 }}>Téléphone</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E', marginBottom: 8 }}>{tel}</div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <a href={`tel:${tel}`} style={{ background: '#1D9E75', color: '#fff', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>📞 Appeler</a>
                                <a href={`https://wa.me/${tel.replace(/[\s\-+()\[\]]/g, '')}`} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: '#fff', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>💬 WA</a>
                              </div>
                            </div>
                          )}
                          {c.client_adresse && <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 10, color: '#C8C8C8', marginBottom: 3 }}>Adresse</div><div style={{ fontSize: 13, color: '#333' }}>📍 {c.client_adresse}</div></div>}
                          {c.livreur_nom && <div><div style={{ fontSize: 10, color: '#C8C8C8', marginBottom: 3 }}>Livreur</div><div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>🏍️ {c.livreur_nom}</div></div>}
                        </div>
                        {c.notes && <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#633806', border: '1px solid #FDE68A' }}>📝 {c.notes}</div>}
                      </div>
                      <div style={{ padding: '0 16px 14px' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Statut</p>
                        <div className="swrap" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {STATUTS.map(s => {
                            const sc = S[s]; const on = c.statut === s
                            return <button key={s} className="sbt" onClick={() => updateStatut(c.id, s)} style={{ padding: '7px 13px', borderRadius: 11, fontSize: 12, fontWeight: 700, border: `1.5px solid ${on ? sc.dot : '#EBEBEB'}`, background: on ? sc.bg : '#fff', color: on ? sc.color : '#ABABAB' }}>{sc.label}</button>
                          })}
                          <button className="sbt" onClick={() => del(c.id)} style={{ marginLeft: 'auto', padding: '7px 13px', borderRadius: 11, fontSize: 12, fontWeight: 700, background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626' }}>🗑️ Supprimer</button>
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
