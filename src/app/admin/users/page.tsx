'use client'
import { useEffect, useState } from 'react'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const PLAN_CFG: Record<string, { color: string; bg: string; prix: number }> = {
  starter:  { color: '#92400E', bg: '#FEF3C7', prix: 3000 },
  business: { color: '#3730A3', bg: '#EEF2FF', prix: 5000 },
  elite:    { color: '#065F46', bg: '#ECFDF5', prix: 15000 },
  aucun:    { color: '#6B7280', bg: '#F3F4F6', prix: 0 },
}

async function adminApi(action: string, user_id: string, extra: any = {}) {
  const payload = { action, user_id, ...extra }
  console.log('🔵 adminApi call:', payload)
  const res = await fetch('/api/admin/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const result = await res.json()
  console.log('🟢 adminApi result:', result)
  return result
}

async function loadUsers() {
  const res = await fetch('/api/admin/users')
  const data = await res.json()
  return data.ok ? data.users : []
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editPlan, setEditPlan] = useState('aucun')
  const [editExpires, setEditExpires] = useState('')
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState<string | null>(null)

  const now = new Date()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await loadUsers()
    setUsers(data)
    setLoading(false)
  }

  async function doAction(action: string, userId: string, extra: any = {}, successMsg: string) {
    setSaving(true)
    const result = await adminApi(action, userId, extra)
    setSaving(false)
    if (result.ok) {
      alert('✅ ' + successMsg + (result.plan ? ` — Plan: ${result.plan}` : ''))
      setSelected(null); setConfirmDel(null); setConfirmReset(null)
      load()
    } else {
      alert('❌ Erreur: ' + (result.error || JSON.stringify(result)))
    }
  }

  async function activerPlan(userId: string, plan: string) {
    if (!confirm(`Activer le plan ${plan.toUpperCase()} pour cet utilisateur ?`)) return
    await doAction('set_plan', userId, { plan, expires_days: 30 }, `Plan ${plan} activé`)
  }

  async function appliquerModif(userId: string) {
    let expDays = 30
    if (editExpires) {
      expDays = Math.max(1, Math.ceil((new Date(editExpires).getTime() - Date.now()) / 86400000))
    }
    await doAction('set_plan', userId, { plan: editPlan, expires_days: expDays }, 'Plan mis à jour')
  }

  async function reinitialiser(userId: string) {
    await doAction('reset_data', userId, {}, 'Données réinitialisées')
  }

  async function supprimerCompte(userId: string) {
    await doAction('delete_user', userId, {}, 'Compte supprimé')
  }

  async function envoyerNotif(userId: string) {
    const titre = prompt('Titre de la notification :')
    if (!titre) return
    const message = prompt('Message :')
    if (!message) return
    await doAction('notify', userId, { titre, message, type: 'info' }, 'Notification envoyée')
  }

  const isActif = (u: any) => u.plan && u.plan !== 'aucun' && u.plan_expires && new Date(u.plan_expires) > now

  const filtered = users
    .filter(u => filtre === 'tous' || u.plan === filtre || (filtre === 'actif' && isActif(u)))
    .filter(u => !search || [u.email, u.nom_boutique].some((v: any) => (v || '').toLowerCase().includes(search.toLowerCase())))

  const S: React.CSSProperties = {
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 13,
    outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box'
  }

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.urow{transition:background .12s;cursor:pointer;}.urow:hover{background:rgba(255,255,255,.04)!important;}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Utilisateurs</h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: 4 }}>
            {users.length} comptes · {users.filter(isActif).length} actifs
          </p>
        </div>
        <button onClick={load} style={{ background: 'rgba(127,119,221,.15)', border: '1px solid rgba(127,119,221,.3)', color: '#AFA9EC', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          🔄 Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher email, boutique..."
          style={{ ...S, flex: 1, minWidth: 200 }} />
        {['tous','actif','starter','business','elite','aucun'].map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${filtre === f ? '#7F77DD' : 'rgba(255,255,255,.1)'}`, background: filtre === f ? 'rgba(127,119,221,.2)' : 'transparent', color: filtre === f ? '#AFA9EC' : 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {f}
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
            const joursRestants = expire ? Math.ceil((expire.getTime() - now.getTime()) / 86400000) : null
            const isOpen = selected === u.id

            return (
              <div key={u.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${isOpen ? 'rgba(127,119,221,.4)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, overflow: 'hidden' }}>

                {/* Ligne principale */}
                <div className="urow" onClick={() => {
                  if (isOpen) { setSelected(null) } else { setSelected(u.id); setEditPlan(plan); setEditExpires(expire ? expire.toISOString().slice(0,10) : '') }
                }} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: actif ? 'rgba(127,119,221,.2)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: actif ? '#AFA9EC' : 'rgba(255,255,255,.3)', flexShrink: 0 }}>
                    {(u.email || 'U').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                      {u.nom_boutique && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>· {u.nom_boutique}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{plan.toUpperCase()}</span>
                      {actif && joursRestants !== null && (
                        <span style={{ fontSize: 11, color: joursRestants <= 7 ? '#F59E0B' : 'rgba(255,255,255,.3)' }}>
                          {joursRestants <= 0 ? '⚠️ Expiré' : `${joursRestants}j restants`}
                        </span>
                      )}
                      {u.telephone && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>📞 {u.telephone}</span>}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.2)' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: actif ? '#9FE1CB' : 'rgba(255,255,255,.2)' }}>{fmt(cfg.prix)} F</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>/mois</p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 14, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Panel édition */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '20px 18px', background: 'rgba(0,0,0,.25)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16 }}>

                      {/* Modifier plan */}
                      <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '16px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>✏️ Modifier le plan</p>

                        {/* Boutons rapides */}
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 8 }}>⚡ Activation rapide (+30 jours)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 14 }}>
                          {['starter','business','elite'].map(p => (
                            <button key={p} onClick={() => activerPlan(u.id, p)} disabled={saving}
                              style={{ padding: '10px 4px', borderRadius: 10, border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
                                background: p === 'starter' ? 'rgba(245,158,11,.25)' : p === 'business' ? 'rgba(127,119,221,.25)' : 'rgba(29,158,117,.25)',
                                color: p === 'starter' ? '#FCD34D' : p === 'business' ? '#AFA9EC' : '#9FE1CB',
                              }}>
                              {saving ? '⏳' : p}
                            </button>
                          ))}
                        </div>

                        {/* Modification fine */}
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 4 }}>Plan</label>
                          <select value={editPlan} onChange={e => setEditPlan(e.target.value)} style={{ ...S }}>
                            <option value="aucun">Aucun</option>
                            <option value="starter">Starter — 3 000 F</option>
                            <option value="business">Business — 5 000 F</option>
                            <option value="elite">Elite — 15 000 F</option>
                          </select>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 4 }}>Expiration</label>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            {[['30j', 30], ['3 mois', 90], ['1 an', 365], ['∞', 3650]].map(([lbl, days]) => (
                              <button key={lbl} onClick={() => { const d = new Date(); d.setDate(d.getDate() + Number(days)); setEditExpires(d.toISOString().slice(0,10)) }}
                                style={{ flex: 1, padding: '5px 2px', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'none', color: 'rgba(255,255,255,.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                          <input type="date" value={editExpires} onChange={e => setEditExpires(e.target.value)} style={{ ...S }} />
                        </div>
                        <button onClick={() => appliquerModif(u.id)} disabled={saving}
                          style={{ width: '100%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? .6 : 1 }}>
                          {saving ? '⏳ Enregistrement...' : '✓ Appliquer'}
                        </button>
                      </div>

                      {/* Actions */}
                      <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '16px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>⚡ Actions</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button onClick={() => envoyerNotif(u.id)}
                            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                            🔔 Envoyer une notification
                          </button>

                          {confirmReset === u.id ? (
                            <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 10, padding: '10px' }}>
                              <p style={{ fontSize: 12, color: '#F59E0B', marginBottom: 8 }}>⚠️ Supprimer toutes les données ?</p>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => reinitialiser(u.id)} disabled={saving}
                                  style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  Confirmer
                                </button>
                                <button onClick={() => setConfirmReset(null)}
                                  style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'none', color: 'rgba(255,255,255,.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmReset(u.id)}
                              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(245,158,11,.2)', background: 'rgba(245,158,11,.08)', color: '#FCD34D', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                              🗑️ Réinitialiser les données
                            </button>
                          )}

                          {confirmDel === u.id ? (
                            <div style={{ background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.3)', borderRadius: 10, padding: '10px' }}>
                              <p style={{ fontSize: 12, color: '#F09595', marginBottom: 8 }}>⚠️ Supprimer définitivement ce compte ?</p>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => supprimerCompte(u.id)} disabled={saving}
                                  style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: '#E24B4A', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  Supprimer
                                </button>
                                <button onClick={() => setConfirmDel(null)}
                                  style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'none', color: 'rgba(255,255,255,.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDel(u.id)}
                              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(226,75,74,.2)', background: 'rgba(226,75,74,.08)', color: '#F09595', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                              ❌ Supprimer le compte
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Infos */}
                      <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '16px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>ℹ️ Informations</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {[
                            ['Email', u.email],
                            ['Boutique', u.nom_boutique || '—'],
                            ['Téléphone', u.telephone || '—'],
                            ['Plan actuel', plan.toUpperCase()],
                            ['Expire le', expire ? expire.toLocaleDateString('fr-FR') : '—'],
                            ['Inscrit le', new Date(u.created_at).toLocaleDateString('fr-FR')],
                            ['User ID', u.id?.slice(0,12) + '...'],
                          ].map(([l, v]) => (
                            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{l}</span>
                              <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, textAlign: 'right', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && !loading && (
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
