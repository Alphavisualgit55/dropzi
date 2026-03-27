'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const PLAN_CONFIG: Record<string, { color: string; bg: string; price: number }> = {
  basic:    { color: '#888', bg: 'rgba(136,136,136,.12)', price: 3000 },
  business: { color: '#7F77DD', bg: 'rgba(127,119,221,.12)', price: 5000 },
  elite:    { color: '#1D9E75', bg: 'rgba(29,158,117,.12)', price: 15000 },
}

export default function AdminSubscriptionsPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('plan').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function changePlan(id: string, plan: string) {
    setSaving(id)
    const montant = PLAN_CONFIG[plan]?.price || 0
    await supabase.from('profiles').update({ plan, montant_mensuel: montant }).eq('id', id)
    setSaving(null)
    load()
  }

  const mrr = users.reduce((s, u) => s + (PLAN_CONFIG[u.plan || 'basic']?.price || 0), 0)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -.5 }}>Abonnements</h1>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, marginTop: 4 }}>Gérer les plans de tous les utilisateurs</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>MRR total</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1D9E75', letterSpacing: -1 }}>{fmt(mrr)} F</div>
        </div>
        {['basic', 'business', 'elite'].map(p => {
          const count = users.filter(u => (u.plan || 'basic') === p).length
          return (
            <div key={p} style={{ background: PLAN_CONFIG[p].bg, border: `1px solid ${PLAN_CONFIG[p].color}33`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: PLAN_CONFIG[p].color, marginBottom: 6 }}>Plan {p}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>{count}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>{fmt(count * PLAN_CONFIG[p].price)} F/mois</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr', gap: 12 }}>
          {['Boutique', 'Email', 'Plan actuel', 'Changer plan', 'Statut'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{h}</div>
          ))}
        </div>
        {users.map((u, i) => {
          const plan = u.plan || 'basic'
          const cfg = PLAN_CONFIG[plan]
          return (
            <div key={u.id} style={{ padding: '12px 20px', borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr', gap: 12, alignItems: 'center', transition: 'background .15s' }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_boutique || '—'}</div>
              <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{plan.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['basic', 'business', 'elite'].map(p => (
                  <button key={p} onClick={() => changePlan(u.id, p)} disabled={saving === u.id}
                    style={{
                      padding: '4px 8px', borderRadius: 7, fontSize: 9, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
                      border: `1px solid ${plan === p ? PLAN_CONFIG[p].color : 'rgba(255,255,255,.1)'}`,
                      background: plan === p ? PLAN_CONFIG[p].bg : 'transparent',
                      color: plan === p ? PLAN_CONFIG[p].color : 'rgba(255,255,255,.3)',
                      fontFamily: 'inherit', opacity: saving === u.id ? 0.5 : 1, transition: 'all .15s',
                    }}>{p}</button>
                ))}
              </div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 600, color: (u.statut || 'actif') === 'actif' ? '#1D9E75' : '#E24B4A' }}>
                  {(u.statut || 'actif').toUpperCase()}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
