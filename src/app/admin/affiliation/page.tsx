'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function AdminAffiliationPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'retraits'|'affilies'|'commissions'>('retraits')
  const [retraits, setRetraits] = useState<any[]>([])
  const [affilies, setAffilies] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCode, setEditCode] = useState('')
  const [editSolde, setEditSolde] = useState('')
  const [editStatut, setEditStatut] = useState('')
  const [notifMsg, setNotifMsg] = useState('')
  const [notifTitre, setNotifTitre] = useState('')
  const [showNotifAll, setShowNotifAll] = useState(false)
  const [sendingNotif, setSendingNotif] = useState(false)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ totalAffilies: 0, totalInvites: 0, totalCommissions: 0, totalRetraits: 0, enAttente: 0, mrrAffiliation: 0 })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [r, a, c] = await Promise.all([
      supabase.from('retraits').select('*, profiles:user_id(email, nom_boutique, telephone)').order('created_at', { ascending: false }),
      supabase.from('affilies').select('*, profiles:user_id(email, nom_boutique, telephone, created_at)').order('total_gains', { ascending: false }),
      supabase.from('commissions').select('*, affilies(code, profiles:user_id(email)), filleul:profiles!commissions_filleul_user_id_fkey(email, nom_boutique)').order('created_at', { ascending: false }).limit(200),
    ])
    const allR = r.data || []
    const allA = a.data || []
    const allC = c.data || []
    setRetraits(allR)
    setAffilies(allA)
    setCommissions(allC)
    setStats({
      totalAffilies: allA.length,
      totalInvites: allA.reduce((s: number, a: any) => s + (a.nb_filleuls || 0), 0),
      totalCommissions: allC.reduce((s: number, c: any) => s + (c.montant || 0), 0),
      totalRetraits: allR.filter((r: any) => r.statut === 'paye').reduce((s: number, r: any) => s + (r.montant || 0), 0),
      enAttente: allR.filter((r: any) => r.statut === 'en_attente').length,
      mrrAffiliation: allA.reduce((s: number, a: any) => s + (a.solde || 0), 0),
    })
    setLoading(false)
  }

  async function updateAffilie(affilieId: string) {
    setProcessing(affilieId)
    const updates: any = { updated_at: new Date().toISOString() }
    if (editCode) updates.code = editCode.toUpperCase()
    if (editSolde !== '') updates.solde = parseInt(editSolde)
    if (editStatut) updates.statut = editStatut
    await supabase.from('affilies').update(updates).eq('id', affilieId)
    setEditingId(null); setEditCode(''); setEditSolde(''); setEditStatut('')
    setProcessing(null); load()
  }

  async function crediterManuellement(affilieId: string, userId: string, montant: number) {
    await supabase.from('affilies').update({ solde: montant, updated_at: new Date().toISOString() }).eq('id', affilieId)
    await supabase.from('notifications_user').insert({
      user_id: userId, titre: '💰 Solde mis à jour par l\'admin',
      message: `Ton solde d'affiliation a été ajusté à ${fmt(montant)} FCFA.`, type: 'info'
    })
    load()
  }

  async function payerRetrait(retrait: any) {
    setProcessing(retrait.id)
    await supabase.from('retraits').update({ statut: 'paye', updated_at: new Date().toISOString() }).eq('id', retrait.id)
    await supabase.from('affilies').update({
      total_retire: (retrait.affilie?.total_retire || 0) + retrait.montant,
      updated_at: new Date().toISOString()
    }).eq('id', retrait.affilie_id)
    await supabase.from('notifications_user').insert({
      user_id: retrait.user_id, titre: '💸 Retrait payé !',
      message: `Ton retrait de ${fmt(retrait.montant)} FCFA a été envoyé sur le ${retrait.numero_wave}.`, type: 'success'
    })
    setProcessing(null); load()
  }

  async function refuserRetrait(retrait: any) {
    const note = prompt('Motif du refus :')
    if (!note) return
    setProcessing(retrait.id)
    // Rembourser le solde
    const { data: af } = await supabase.from('affilies').select('solde').eq('id', retrait.affilie_id).single()
    await supabase.from('affilies').update({ solde: (af?.solde || 0) + retrait.montant, updated_at: new Date().toISOString() }).eq('id', retrait.affilie_id)
    await supabase.from('retraits').update({ statut: 'refuse', note_admin: note, updated_at: new Date().toISOString() }).eq('id', retrait.id)
    await supabase.from('notifications_user').insert({
      user_id: retrait.user_id, titre: '❌ Retrait refusé',
      message: `Ton retrait de ${fmt(retrait.montant)} FCFA a été refusé. Motif : ${note}. Montant recrédité.`, type: 'warning'
    })
    setProcessing(null); load()
  }

  async function supprimerAffilie(affilieId: string) {
    if (!confirm('Supprimer cet affilié et toutes ses données ?')) return
    await supabase.from('commissions').delete().eq('affilie_id', affilieId)
    await supabase.from('retraits').delete().eq('affilie_id', affilieId)
    await supabase.from('filleuls').delete().eq('affilie_id', affilieId)
    await supabase.from('affilies').delete().eq('id', affilieId)
    load()
  }

  async function envoyerNotifTous() {
    if (!notifTitre || !notifMsg) return
    setSendingNotif(true)
    for (const a of affilies.filter(a => a.statut === 'actif')) {
      await supabase.from('notifications_user').insert({ user_id: a.user_id, titre: notifTitre, message: notifMsg, type: 'info' })
    }
    setSendingNotif(false); setShowNotifAll(false); setNotifTitre(''); setNotifMsg('')
    alert(`✅ Notification envoyée à ${affilies.filter(a => a.statut === 'actif').length} affiliés`)
  }

  async function envoyerNotifIndividuel(userId: string) {
    const titre = prompt('Titre de la notification :')
    if (!titre) return
    const msg = prompt('Message :')
    if (!msg) return
    await supabase.from('notifications_user').insert({ user_id: userId, titre, message: msg, type: 'info' })
    alert('✅ Notification envoyée !')
  }

  const filteredAffilies = affilies.filter(a =>
    !search || [a.profiles?.email, a.profiles?.nom_boutique, a.code].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))
  )

  const S: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.sbt{transition:all .15s;cursor:pointer;font-family:inherit;}.arow{transition:background .15s;}`}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Affiliation — Contrôle total</h1>
          {stats.enAttente > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 20, padding: '4px 12px', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>⚠️ {stats.enAttente} retrait{stats.enAttente > 1 ? 's' : ''} en attente d'approbation</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowNotifAll(true)} className="sbt"
            style={{ background: 'rgba(127,119,221,.15)', border: '1px solid rgba(127,119,221,.3)', color: '#AFA9EC', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 600 }}>
            🔔 Notifier tous les affiliés
          </button>
          <button onClick={load} className="sbt"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', borderRadius: 10, padding: '7px 14px', fontSize: 13 }}>
            🔄
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { lbl: '👥 Affiliés', val: stats.totalAffilies, color: '#AFA9EC' },
          { lbl: '🤝 Contacts invités', val: stats.totalInvites, color: '#9FE1CB' },
          { lbl: '💰 Commissions totales', val: fmt(stats.totalCommissions) + ' F', color: '#FCD34D' },
          { lbl: '💎 Soldes en attente', val: fmt(stats.mrrAffiliation) + ' F', color: '#93C5FD' },
          { lbl: '💸 Total retraits payés', val: fmt(stats.totalRetraits) + ' F', color: '#F09595' },
        ].map(k => (
          <div key={k.lbl} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '14px 12px' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginBottom: 8, lineHeight: 1.4 }}>{k.lbl}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: -.5 }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* MODAL NOTIFICATION GLOBALE */}
      {showNotifAll && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0C0C1E', border: '1px solid rgba(127,119,221,.3)', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🔔 Notifier tous les affiliés actifs</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Titre</label>
              <input style={S} value={notifTitre} onChange={e => setNotifTitre(e.target.value)} placeholder="Ex: Nouvelle mise à jour !" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Message</label>
              <textarea style={{ ...S, height: 80, resize: 'none' }} value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="Contenu de la notification..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNotifAll(false)} className="sbt"
                style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', background: 'none', color: 'rgba(255,255,255,.5)' }}>
                Annuler
              </button>
              <button onClick={envoyerNotifTous} disabled={sendingNotif || !notifTitre || !notifMsg} className="sbt"
                style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', fontWeight: 700, opacity: !notifTitre || !notifMsg ? .5 : 1 }}>
                {sendingNotif ? '⏳...' : `📤 Envoyer à ${affilies.filter(a => a.statut === 'actif').length} affiliés`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: 4, marginBottom: 20 }}>
        {[
          ['retraits', `💸 Retraits${stats.enAttente > 0 ? ` (${stats.enAttente})` : ''}`],
          ['affilies', `👥 Affiliés (${affilies.length})`],
          ['commissions', `💰 Commissions (${commissions.length})`],
        ].map(([id, label]) => (
          <button key={id} className="sbt" onClick={() => setTab(id as any)}
            style={{ flex: 1, padding: '9px 4px', borderRadius: 11, border: 'none', background: tab === id ? 'rgba(127,119,221,.2)' : 'transparent', color: tab === id ? '#AFA9EC' : 'rgba(255,255,255,.4)', fontWeight: 700, fontSize: 12 }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* ── RETRAITS ── */}
          {tab === 'retraits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {retraits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,.3)' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>💸</p><p>Aucune demande de retrait</p>
                </div>
              ) : retraits.map((r: any) => {
                const isWaiting = r.statut === 'en_attente'
                const cfg = r.statut === 'paye' ? { color: '#9FE1CB', bg: 'rgba(29,158,117,.15)', label: '✅ Payé' }
                  : r.statut === 'approuve' ? { color: '#93C5FD', bg: 'rgba(37,99,235,.15)', label: '🔄 Approuvé' }
                  : r.statut === 'refuse' ? { color: '#F09595', bg: 'rgba(226,75,74,.15)', label: '❌ Refusé' }
                  : { color: '#FCD34D', bg: 'rgba(245,158,11,.15)', label: '⏳ En attente' }
                return (
                  <div key={r.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${isWaiting ? 'rgba(245,158,11,.4)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{fmt(r.montant)} FCFA</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>👤 {r.profiles?.email}</p>
                          {r.profiles?.nom_boutique && <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>🏪 {r.profiles.nom_boutique}</p>}
                          {r.profiles?.telephone && <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>📞 {r.profiles.telephone}</p>}
                          <p style={{ fontSize: 13, color: '#AFA9EC', fontWeight: 600 }}>📱 {r.numero_wave}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>🗓 {new Date(r.created_at).toLocaleString('fr-FR')}</p>
                          {r.note_admin && <p style={{ fontSize: 11, color: '#F59E0B', marginTop: 4 }}>📝 Note : {r.note_admin}</p>}
                        </div>
                      </div>
                      {isWaiting && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                          <button className="sbt" onClick={() => payerRetrait(r)} disabled={processing === r.id}
                            style={{ background: 'rgba(29,158,117,.2)', border: '1px solid rgba(29,158,117,.4)', color: '#9FE1CB', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, opacity: processing === r.id ? .6 : 1 }}>
                            {processing === r.id ? '⏳...' : '✅ Marquer comme payé'}
                          </button>
                          <button className="sbt" onClick={() => refuserRetrait(r)} disabled={processing === r.id}
                            style={{ background: 'rgba(226,75,74,.15)', border: '1px solid rgba(226,75,74,.3)', color: '#F09595', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700 }}>
                            ❌ Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── AFFILIÉS ── */}
          {tab === 'affilies' && (
            <div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher email, boutique, code..."
                style={{ ...S, marginBottom: 14, padding: '10px 14px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredAffilies.map((a: any) => {
                  const isEditing = editingId === a.id
                  return (
                    <div key={a.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${isEditing ? 'rgba(127,119,221,.4)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, overflow: 'hidden' }}>
                      {/* Header affilié */}
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{a.profiles?.email}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: a.statut === 'actif' ? 'rgba(29,158,117,.2)' : 'rgba(226,75,74,.15)', color: a.statut === 'actif' ? '#9FE1CB' : '#F09595' }}>
                              {a.statut}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                            {a.profiles?.nom_boutique && <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>🏪 {a.profiles.nom_boutique}</span>}
                            {a.profiles?.telephone && <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>📞 {a.profiles.telephone}</span>}
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>📅 {a.profiles?.created_at ? new Date(a.profiles.created_at).toLocaleDateString('fr-FR') : 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: '#AFA9EC', fontWeight: 700, background: 'rgba(127,119,221,.1)', padding: '2px 10px', borderRadius: 20 }}>Code : {a.code}</span>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>👤 {a.nb_filleuls || 0} invités</span>
                            <span style={{ fontSize: 12, color: '#9FE1CB' }}>💰 {fmt(a.total_gains)} F gagné</span>
                            <span style={{ fontSize: 12, color: '#FCD34D', fontWeight: 700 }}>💎 {fmt(a.solde)} F solde</span>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>💸 {fmt(a.total_retire)} F retiré</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                          <button className="sbt" onClick={() => { setEditingId(isEditing ? null : a.id); setEditCode(a.code); setEditSolde(String(a.solde)); setEditStatut(a.statut) }}
                            style={{ background: isEditing ? 'rgba(127,119,221,.3)' : 'rgba(127,119,221,.1)', border: '1px solid rgba(127,119,221,.3)', color: '#AFA9EC', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700 }}>
                            {isEditing ? '✕ Fermer' : '✏️ Modifier'}
                          </button>
                          <button className="sbt" onClick={() => envoyerNotifIndividuel(a.user_id)}
                            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700 }}>
                            🔔
                          </button>
                          <button className="sbt" onClick={() => supprimerAffilie(a.id)}
                            style={{ background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.2)', color: '#F09595', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700 }}>
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Panel d'édition */}
                      {isEditing && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '16px 18px', background: 'rgba(0,0,0,.2)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 14 }}>
                            <div>
                              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Code de parrainage</label>
                              <input style={S} value={editCode} onChange={e => setEditCode(e.target.value.toUpperCase())} placeholder="Ex: ALPHA50" />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Solde FCFA</label>
                              <input style={S} type="number" value={editSolde} onChange={e => setEditSolde(e.target.value)} placeholder="Ex: 15000" />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Statut</label>
                              <select style={S} value={editStatut} onChange={e => setEditStatut(e.target.value)}>
                                <option value="actif">Actif</option>
                                <option value="suspendu">Suspendu</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button className="sbt" onClick={() => updateAffilie(a.id)} disabled={processing === a.id}
                              style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, opacity: processing === a.id ? .6 : 1 }}>
                              {processing === a.id ? '⏳...' : '✓ Sauvegarder les modifications'}
                            </button>
                            {/* Ajustements rapides solde */}
                            {[1000, 5000, 10000, -5000].map(delta => (
                              <button key={delta} className="sbt"
                                onClick={() => setEditSolde(String(Math.max(0, (parseInt(editSolde) || a.solde) + delta)))}
                                style={{ background: delta > 0 ? 'rgba(29,158,117,.1)' : 'rgba(226,75,74,.1)', border: `1px solid ${delta > 0 ? 'rgba(29,158,117,.2)' : 'rgba(226,75,74,.2)'}`, color: delta > 0 ? '#9FE1CB' : '#F09595', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>
                                {delta > 0 ? '+' : ''}{fmt(delta)} F
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── COMMISSIONS ── */}
          {tab === 'commissions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>Total : <strong style={{ color: '#FCD34D' }}>{fmt(stats.totalCommissions)} FCFA</strong></span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{commissions.length} commissions générées</span>
              </div>
              {commissions.map((c: any) => (
                <div key={c.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#AFA9EC' }}>Code {c.affilies?.code}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>→</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{c.filleul?.email || c.affilies?.profiles?.email || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>Plan {c.plan}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                      <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, background: 'rgba(29,158,117,.15)', color: '#9FE1CB' }}>{c.statut}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#9FE1CB' }}>+{fmt(c.montant)} F</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>50% de {fmt(c.montant_abonnement)} F</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
