'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function AdminSubscriptionsPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').neq('statut', 'supprime').order('plan').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function updatePlan(id: string, plan: string, expires?: string) {
    setSaving(id)
    const montant = plan === 'elite' ? 15000 : plan === 'business' ? 5000 : 3000
    await supabase.from('profiles').update({
      plan,
      montant_mensuel: montant,
      plan_expires: expires || null
    }).eq('id', id)
    setSaving(null)
    load()
  }

  const planConfig: Record<string, any> = {
    basic: { color: '#888', price: 3000, label: 'Basic' },
    business: { color: '#7F77DD', price: 5000, label: 'Business' },
    elite: { color: '#1D9E75', price: 15000, label: 'Elite' },
  }

  const totalMRR = users.reduce((s, u) => s + (planConfig[u.plan || 'basic']?.price || 0), 0)

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>Abonnements</h1>
        <p className="text-gray-500 text-sm mt-1">Gérer les plans de tous les utilisateurs</p>
      </div>

      {/* MRR summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'MRR total', val: fmt(totalMRR) + ' F', color: '#1D9E75' },
          ...Object.entries(planConfig).map(([k, v]: any) => ({
            label: `Plan ${v.label}`, color: v.color,
            val: `${users.filter(u => (u.plan || 'basic') === k).length} users · ${fmt(users.filter(u => (u.plan || 'basic') === k).length * v.price)} F`
          }))
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 16 }}>
            <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ color: s.color, fontWeight: 800, fontSize: 16 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              {['Boutique', 'Email', 'Plan actuel', 'Expire le', 'Changer plan', 'Statut'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <td style={{ padding: '12px 16px', color: '#fff', fontSize: 13, fontWeight: 600 }}>{u.nom_boutique || '—'}</td>
                <td style={{ padding: '12px 16px', color: '#555', fontSize: 12 }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${planConfig[u.plan || 'basic']?.color}22`, color: planConfig[u.plan || 'basic']?.color }}>
                    {(u.plan || 'BASIC').toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: u.plan_expires ? '#1D9E75' : '#444', fontSize: 12 }}>
                  {u.plan_expires ? new Date(u.plan_expires).toLocaleDateString('fr-FR') : '∞ Illimité'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['basic', 'business', 'elite'].map(p => (
                      <button key={p} onClick={() => updatePlan(u.id, p)} disabled={saving === u.id}
                        style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${(u.plan || 'basic') === p ? planConfig[p].color : 'rgba(255,255,255,.1)'}`, background: (u.plan || 'basic') === p ? `${planConfig[p].color}22` : 'transparent', color: (u.plan || 'basic') === p ? planConfig[p].color : '#555', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', opacity: saving === u.id ? 0.5 : 1 }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: (u.statut || 'actif') === 'actif' ? '#1D9E75' : '#E24B4A' }}>
                    {(u.statut || 'actif').toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
