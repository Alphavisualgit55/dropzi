'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
const PLANS = ['basic', 'business', 'elite']
const STATUTS = ['actif', 'suspendu', 'supprime']

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [selected, setSelected] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [userStats, setUserStats] = useState<Record<string, any>>({})

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const list = data || []
    setUsers(list)
    setFiltered(list)
    setLoading(false)

    // Charger stats par user
    const stats: Record<string, any> = {}
    for (const u of list.slice(0, 20)) {
      const [cmd, fac] = await Promise.all([
        supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        supabase.from('factures').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
      ])
      stats[u.id] = { commandes: cmd.count || 0, factures: fac.count || 0 }
    }
    setUserStats(stats)
  }

  useEffect(() => {
    let result = users
    if (search) result = result.filter(u =>
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.nom_boutique || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.telephone || '').includes(search)
    )
    if (filterPlan !== 'tous') result = result.filter(u => u.plan === filterPlan)
    if (filterStatut !== 'tous') result = result.filter(u => (u.statut || 'actif') === filterStatut)
    setFiltered(result)
  }, [search, filterPlan, filterStatut, users])

  async function updateUser(id: string, changes: any) {
    setSaving(true)
    await supabase.from('profiles').update(changes).eq('id', id)
    setSaving(false)
    load()
    if (selected?.id === id) setSelected({ ...selected, ...changes })
  }

  async function supprimerUser(id: string) {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return
    await supabase.from('profiles').update({ statut: 'supprime' }).eq('id', id)
    setSelected(null)
    load()
  }

  const planColor = (p: string) => p === 'elite' ? '#1D9E75' : p === 'business' ? '#7F77DD' : '#888'
  const statutColor = (s: string) => s === 'actif' ? '#1D9E75' : s === 'suspendu' ? '#BA7517' : '#E24B4A'

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>Utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} / {users.length} utilisateurs</p>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher email, boutique, téléphone..."
          style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
          style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 14 }}>
          <option value="tous">Tous les plans</option>
          {PLANS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 14 }}>
          <option value="tous">Tous statuts</option>
          {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Liste */}
        <div className="lg:col-span-2 space-y-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {filtered.map(u => (
            <div key={u.id} onClick={() => setSelected(u)}
              style={{
                background: selected?.id === u.id ? 'rgba(127,119,221,.1)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${selected?.id === u.id ? 'rgba(127,119,221,.4)' : 'rgba(255,255,255,.07)'}`,
                borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all .2s',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {(u.nom_boutique || u.email || '?').slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_boutique || 'Sans nom'}</div>
                <div style={{ color: '#555', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                <div style={{ color: '#444', fontSize: 11, marginTop: 2 }}>{new Date(u.created_at).toLocaleDateString('fr-FR')} · {userStats[u.id]?.commandes || 0} cmd</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${planColor(u.plan || 'basic')}22`, color: planColor(u.plan || 'basic') }}>{(u.plan || 'BASIC').toUpperCase()}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${statutColor(u.statut || 'actif')}22`, color: statutColor(u.statut || 'actif') }}>{(u.statut || 'actif').toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Détail utilisateur */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 20 }}>
          {!selected ? (
            <div style={{ textAlign: 'center', color: '#444', paddingTop: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👆</div>
              <div>Clique sur un utilisateur pour voir les détails</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 auto 10px' }}>
                  {(selected.nom_boutique || selected.email || '?').slice(0, 1).toUpperCase()}
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{selected.nom_boutique || 'Sans nom'}</div>
                <div style={{ color: '#555', fontSize: 12 }}>{selected.email}</div>
                <div style={{ color: '#444', fontSize: 11, marginTop: 4 }}>Inscrit le {new Date(selected.created_at).toLocaleDateString('fr-FR')}</div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { l: 'Commandes', v: userStats[selected.id]?.commandes || 0 },
                  { l: 'Factures', v: userStats[selected.id]?.factures || 0 },
                ].map(s => (
                  <div key={s.l} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                    <div style={{ color: '#7F77DD', fontSize: 22, fontWeight: 800 }}>{s.v}</div>
                    <div style={{ color: '#555', fontSize: 11 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Changer plan */}
              <div>
                <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Plan abonnement</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {PLANS.map(p => (
                    <button key={p} onClick={() => updateUser(selected.id, { plan: p })} disabled={saving}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: `1px solid ${(selected.plan || 'basic') === p ? planColor(p) : 'rgba(255,255,255,.1)'}`, background: (selected.plan || 'basic') === p ? `${planColor(p)}22` : 'transparent', color: (selected.plan || 'basic') === p ? planColor(p) : '#666', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Changer statut */}
              <div>
                <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Statut du compte</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {STATUTS.map(s => (
                    <button key={s} onClick={() => updateUser(selected.id, { statut: s })} disabled={saving}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: `1px solid ${(selected.statut || 'actif') === s ? statutColor(s) : 'rgba(255,255,255,.1)'}`, background: (selected.statut || 'actif') === s ? `${statutColor(s)}22` : 'transparent', color: (selected.statut || 'actif') === s ? statutColor(s) : '#666', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Infos */}
              <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '12px 14px' }}>
                {[
                  { l: 'Téléphone', v: selected.telephone || '—' },
                  { l: 'Plan expire', v: selected.plan_expires ? new Date(selected.plan_expires).toLocaleDateString('fr-FR') : '—' },
                  { l: 'ID', v: selected.id.slice(0, 8) + '...' },
                ].map(i => (
                  <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 13 }}>
                    <span style={{ color: '#555' }}>{i.l}</span>
                    <span style={{ color: '#fff' }}>{i.v}</span>
                  </div>
                ))}
              </div>

              {/* Actions danger */}
              <button onClick={() => supprimerUser(selected.id)}
                style={{ width: '100%', background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.25)', color: '#E24B4A', borderRadius: 12, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                🗑️ Supprimer le compte
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
