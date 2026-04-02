'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
const PLAN_CFG: Record<string, { color: string; bg: string; prix: number }> = {
  starter:  { color: '#92400E', bg: '#FEF3C7', prix: 3000 },
  business: { color: '#3730A3', bg: '#EEF2FF', prix: 5000 },
  elite:    { color: '#065F46', bg: '#ECFDF5', prix: 15000 },
  aucun:    { color: '#6B7280', bg: '#F3F4F6', prix: 0 },
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editPlan, setEditPlan] = useState('')
  const [editExpires, setEditExpires] = useState('')
  const [resetConfirm, setResetConfirm] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, abonnements(plan, statut, fin, montant, debut, paydunya_token)')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function activerDirectement(userId: string, planChoisi: string) {
    if (!confirm(`Activer le plan ${planChoisi} pour cet utilisateur ?`)) return
    setSaving(true)
    const fin = new Date(); fin.setDate(fin.getDate() + 30)
    const finStr = fin.toISOString()

    await supabase.from('profiles').update({ plan: planChoisi, plan_expires: finStr }).eq('id', userId)
    await supabase.from('abonnements').upsert({
      user_id: userId, plan: planChoisi, statut: 'actif',
      montant: PLAN_CFG[planChoisi]?.prix || 0,
      debut: new Date().toISOString(), fin: finStr, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    await supabase.from('notifications_user').insert({
      user_id: userId,
      titre: `🎉 Plan ${planChoisi} activé !`,
      message: `Ton abonnement Dropzi ${planChoisi} a été activé par l'admin. Profite de toutes les fonctionnalités !`,
      type: 'success',
    })
    setSaving(false)
    alert(`✅ Plan ${planChoisi} activé jusqu'au ${fin.toLocaleDateString('fr-FR')}`)
    load()
  }

  async function updatePlan(userId: string) {
    setSaving(true)
    try {
      // Appel API server-side avec service_role (bypass RLS)
      const res = await fetch('/api/admin/set-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_plan',
          userId,
          plan: editPlan,
          expires: editExpires || null,
        })
      })
      const data = await res.json()
      if (!data.ok) {
        alert('Erreur : ' + (data.error || 'inconnue'))
        setSaving(false); return
      }
      alert(`✅ Plan ${editPlan} activé pour cet utilisateur !`)
    } catch (e: any) {
      alert('Erreur réseau : ' + e.message)
    }
    setSaving(false); setSelected(null); load()
  }

  async function resetUser(userId: string) {
    setSaving(true)
    // Supprimer toutes les données
    await supabase.from('commande_items').delete().in('commande_id',
      (await supabase.from('commandes').select('id').eq('user_id', userId)).data?.map((c: any) => c.id) || []
    )
    await supabase.from('commandes').delete().eq('user_id', userId)
    await supabase.from('produits').delete().eq('user_id', userId)
    await supabase.from('clients').delete().eq('user_id', userId)
    await supabase.from('zones').delete().eq('user_id', userId)
    await supabase.from('livreurs').delete().eq('user_id', userId)
    await supabase.from('sync_config').delete().eq('user_id', userId)
    await supabase.from('sync_imported').delete().eq('user_id', userId)
    await supabase.from('notifications_user').delete().eq('user_id', userId)
    setSaving(false); setResetConfirm(null); load()
  }

  async function supprimerUser(userId: string) {
    if (!confirm('Supprimer définitivement ce compte ?')) return
    await resetUser(userId)
    await supabase.from('abonnements').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)
    load()
  }

  async function envoyerNotif(userId: string, titre: string, message: string) {
    await supabase.from('notifications_user').insert({ user_id: userId, titre, message, type: 'info' })
    alert('Notification envoyée !')
  }

  const filtered = users
    .filter(u => filtre === 'tous' || u.plan === filtre)
    .filter(u => !search || [u.email, u.nom_boutique].some(v => (v || '').toLowerCase().includes(search.toLowerCase())))

  const now = new Date()
  const isActif = (u: any) => u.plan && u.plan !== 'aucun' && u.plan_expires && new Date(u.plan_expires) > now

  const S: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.urow{transition:background .15s;cursor:pointer;}.urow:hover{background:rgba(255,255,255,.04)!important;}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Utilisateurs</h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: 4 }}>{users.length} comptes enregistrés · {users.filter(isActif).length} actifs</p>
        </div>
        <button onClick={load} style={{ background: 'rgba(127,119,221,.15)', border: '1px solid rgba(127,119,221,.3)', color: '#7F77DD', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          🔄 Actualiser
        </button>
      </div>

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher email, boutique..." style={{ ...S, flex: 1, minWidth: 200 }} />
        {['tous','starter','business','elite','aucun'].map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${filtre === f ? '#7F77DD' : 'rgba(255,255,255,.1)'}`, background: filtre === f ? 'rgba(127,119,221,.2)' : 'transparent', color: filtre === f ? '#AFA9EC' : 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {f === 'tous' ? 'Tous' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((u: any) => {
            const actif = isActif(u)
            const plan = u.plan || 'aucun'
            const cfg = PLAN_CFG[plan] || PLAN_CFG['aucun']
            const expire = u.plan_expires ? new Date(u.plan_expires) : null
            const expiresIn = expire ? Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
            const isOpen = selected === u.id

            return (
              <div key={u.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${isOpen ? 'rgba(127,119,221,.4)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, overflow: 'hidden' }}>
                <div className="urow" onClick={() => { setSelected(isOpen ? null : u.id); setEditPlan(plan); setEditExpires(expire ? expire.toISOString().slice(0, 10) : '') }}
                  style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: actif ? 'rgba(127,119,221,.2)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: actif ? '#AFA9EC' : 'rgba(255,255,255,.3)', flexShrink: 0 }}>
                    {(u.email || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                      {u.nom_boutique && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>· {u.nom_boutique}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{plan.toUpperCase()}</span>
                      {actif && expiresIn !== null && (
                        <span style={{ fontSize: 11, color: expiresIn <= 7 ? '#F59E0B' : 'rgba(255,255,255,.3)' }}>
                          {expiresIn <= 0 ? '⚠️ Expiré' : `Expire dans ${expiresIn}j`}
                        </span>
                      )}
                      {!actif && plan !== 'aucun' && <span style={{ fontSize: 11, color: '#E24B4A' }}>⚠️ Expiré</span>}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  {/* MRR */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: actif ? '#9FE1CB' : 'rgba(255,255,255,.2)' }}>{fmt(cfg.prix)} F</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>/mois</p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 14 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* PANEL GESTION */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '16px 18px', background: 'rgba(0,0,0,.2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>

                      {/* Modifier plan */}
                      <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '14px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>✏️ Modifier l'abonnement</p>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Plan</label>
                          <select value={editPlan} onChange={e => setEditPlan(e.target.value)} style={{ ...S }}>
                            <option value="aucun">Aucun (bloqué)</option>
                            <option value="starter">Starter — 3 000 F/mois</option>
                            <option value="business">Business — 5 000 F/mois</option>
                            <option value="elite">Elite — 15 000 F/mois</option>
                          </select>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 5 }}>Date d'expiration</label>
                          <input type="date" value={editExpires} onChange={e => setEditExpires(e.target.value)} style={{ ...S }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setEditExpires(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)) }}
                            style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>+30j</button>
                          <button onClick={() => { setEditExpires(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)) }}
                            style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>+1 an</button>
                          <button onClick={() => { setEditExpires('2099-12-31') }}
                            style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>∞ illimité</button>
                        </div>
                        <button onClick={() => updatePlan(u.id)} disabled={saving}
                          style={{ marginTop: 12, width: '100%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {saving ? '⏳...' : '✓ Appliquer les modifications'}
                        </button>
                        <div style={{ marginTop: 10 }}>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 6 }}>⚡ Activation rapide (+30j)</p>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {['starter','business','elite'].map(p => (
                              <button key={p} onClick={() => activerDirectement(u.id, p)} disabled={saving}
                                style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', background: p === 'starter' ? 'rgba(245,158,11,.2)' : p === 'business' ? 'rgba(127,119,221,.2)' : 'rgba(29,158,117,.2)', color: p === 'starter' ? '#F59E0B' : p === 'business' ? '#AFA9EC' : '#9FE1CB', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions rapides */}
                      <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '14px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>⚡ Actions rapides</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button onClick={() => envoyerNotif(u.id, '👋 Message de l\'équipe Dropzi', 'Bonjour ! N\'hésitez pas à nous contacter si vous avez des questions.')}
                            style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                            🔔 Envoyer une notification
                          </button>
                          <button onClick={() => { if (resetConfirm === u.id) { resetUser(u.id) } else { setResetConfirm(u.id) } }}
                            style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${resetConfirm === u.id ? '#F59E0B' : 'rgba(255,255,255,.1)'}`, background: resetConfirm === u.id ? 'rgba(245,158,11,.1)' : 'rgba(255,255,255,.05)', color: resetConfirm === u.id ? '#F59E0B' : 'rgba(255,255,255,.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                            {resetConfirm === u.id ? '⚠️ Confirmer la réinitialisation ?' : '🗑️ Réinitialiser les données'}
                          </button>
                          <button onClick={() => supprimerUser(u.id)}
                            style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(226,75,74,.3)', background: 'rgba(226,75,74,.08)', color: '#F09595', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                            ❌ Supprimer le compte
                          </button>
                        </div>
                      </div>

                      {/* Infos paiement */}
                      {u.abonnements && (
                        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '14px' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>💳 Paiement</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                              ['Montant payé', fmt(u.abonnements.montant || 0) + ' FCFA'],
                              ['Token PayDunya', u.abonnements.paydunya_token?.slice(0, 12) + '...' || 'N/A'],
                              ['Début', u.abonnements.debut ? new Date(u.abonnements.debut).toLocaleDateString('fr-FR') : 'N/A'],
                              ['Fin', u.abonnements.fin ? new Date(u.abonnements.fin).toLocaleDateString('fr-FR') : 'N/A'],
                              ['Statut', u.abonnements.statut || 'N/A'],
                            ].map(([l, v]) => (
                              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{l}</span>
                                <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, textAlign: 'right' }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,.3)' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>👤</p>
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
