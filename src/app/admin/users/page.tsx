'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
const PLANS = ['basic', 'business', 'elite']
const STATUTS = ['actif', 'suspendu', 'supprime']

const planColor = (p: string) => p === 'elite' ? '#1D9E75' : p === 'business' ? '#7F77DD' : '#666'
const planBg = (p: string) => p === 'elite' ? 'rgba(29,158,117,.12)' : p === 'business' ? 'rgba(127,119,221,.12)' : 'rgba(100,100,100,.12)'
const statColor = (s: string) => s === 'actif' ? '#1D9E75' : s === 'suspendu' ? '#BA7517' : '#E24B4A'
const statBg = (s: string) => s === 'actif' ? 'rgba(29,158,117,.12)' : s === 'suspendu' ? 'rgba(186,117,23,.12)' : 'rgba(226,75,74,.12)'

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('tous')
  const [selected, setSelected] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  useEffect(() => {
    let r = users
    if (search) r = r.filter(u => (u.email || '').toLowerCase().includes(search.toLowerCase()) || (u.nom_boutique || '').toLowerCase().includes(search.toLowerCase()))
    if (filterPlan !== 'tous') r = r.filter(u => u.plan === filterPlan)
    setFiltered(r)
  }, [search, filterPlan, users])

  async function updateUser(id: string, changes: any) {
    setSaving(true)
    await supabase.from('profiles').update(changes).eq('id', id)
    setSaving(false)
    if (selected?.id === id) setSelected({ ...selected, ...changes })
    load()
  }

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 14px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: -.5 }}>Utilisateurs</h1>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, marginTop: 4 }}>{filtered.length} / {users.length} utilisateurs</p>
      </div>

      {/* Filtres */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 14, display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher par email ou boutique..."
          style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={{ ...selectStyle, minWidth: 140 }}>
          <option value="tous">Tous les plans</option>
          {PLANS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>
        {/* Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
          {filtered.map(u => (
            <div key={u.id} onClick={() => setSelected(u)} style={{
              background: selected?.id === u.id ? 'rgba(127,119,221,.1)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${selected?.id === u.id ? 'rgba(127,119,221,.35)' : 'rgba(255,255,255,.07)'}`,
              borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(u.nom_boutique || u.email || '?').slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_boutique || 'Sans nom'}</div>
                <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: planBg(u.plan || 'basic'), color: planColor(u.plan || 'basic') }}>{(u.plan || 'BASIC').toUpperCase()}</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: statBg(u.statut || 'actif'), color: statColor(u.statut || 'actif') }}>{(u.statut || 'actif').toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Détail */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 20, height: 'fit-content' }}>
          {!selected ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,.2)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👆</div>
              <div style={{ fontSize: 13 }}>Clique sur un utilisateur</div>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 auto 10px' }}>
                  {(selected.nom_boutique || selected.email || '?').slice(0, 1).toUpperCase()}
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{selected.nom_boutique || 'Sans nom'}</div>
                <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 12, marginTop: 2 }}>{selected.email}</div>
                <div style={{ color: 'rgba(255,255,255,.2)', fontSize: 11, marginTop: 4 }}>Inscrit le {new Date(selected.created_at).toLocaleDateString('fr-FR')}</div>
              </div>

              {/* Plan */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Plan abonnement</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {PLANS.map(p => (
                    <button key={p} onClick={() => updateUser(selected.id, { plan: p })} disabled={saving} style={{
                      flex: 1, padding: '8px 4px', borderRadius: 9, cursor: 'pointer', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      border: `1px solid ${(selected.plan || 'basic') === p ? planColor(p) : 'rgba(255,255,255,.1)'}`,
                      background: (selected.plan || 'basic') === p ? planBg(p) : 'transparent',
                      color: (selected.plan || 'basic') === p ? planColor(p) : 'rgba(255,255,255,.3)',
                      fontFamily: 'inherit', opacity: saving ? 0.6 : 1,
                    }}>{p}</button>
                  ))}
                </div>
              </div>

              {/* Statut */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Statut du compte</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {STATUTS.map(s => (
                    <button key={s} onClick={() => updateUser(selected.id, { statut: s })} disabled={saving} style={{
                      flex: 1, padding: '8px 4px', borderRadius: 9, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                      border: `1px solid ${(selected.statut || 'actif') === s ? statColor(s) : 'rgba(255,255,255,.1)'}`,
                      background: (selected.statut || 'actif') === s ? statBg(s) : 'transparent',
                      color: (selected.statut || 'actif') === s ? statColor(s) : 'rgba(255,255,255,.3)',
                      fontFamily: 'inherit', opacity: saving ? 0.6 : 1,
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Infos */}
              <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '10px 12px' }}>
                {[
                  { l: 'Téléphone', v: selected.telephone || '—' },
                  { l: 'ID Supabase', v: selected.id.slice(0, 12) + '...' },
                ].map(i => (
                  <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,.3)' }}>{i.l}</span>
                    <span style={{ color: '#fff' }}>{i.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
