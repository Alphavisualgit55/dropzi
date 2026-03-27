'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

const S: Record<string, React.CSSProperties> = {
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 18 },
  label: { fontSize: 11, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 6 },
  title: { color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 14 },
}

export default function AdminPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [s, u] = await Promise.all([
        supabase.from('admin_stats').select('*').single(),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
      ])
      setStats(s.data)
      setUsers(u.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const planColor = (p: string) => p === 'elite' ? '#1D9E75' : p === 'business' ? '#7F77DD' : '#666'
  const planBg = (p: string) => p === 'elite' ? 'rgba(29,158,117,.15)' : p === 'business' ? 'rgba(127,119,221,.15)' : 'rgba(100,100,100,.15)'
  const total = (stats?.users_basic || 0) + (stats?.users_business || 0) + (stats?.users_elite || 0)
  const mrr = ((stats?.users_basic || 0) * 3000) + ((stats?.users_business || 0) * 5000) + ((stats?.users_elite || 0) * 15000)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 36, height: 36, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: -.5 }}>Dashboard</h1>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, marginTop: 4 }}>Vue globale de Dropzi en temps réel</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '👥', val: fmt(stats?.total_users || 0), lbl: 'Utilisateurs actifs', trend: `+${stats?.nouveaux_ce_mois || 0} ce mois`, up: true },
          { icon: '💰', val: fmt(mrr) + ' F', lbl: 'MRR estimé', trend: 'Revenus mensuels', up: true },
          { icon: '📦', val: fmt(stats?.commandes_ce_mois || 0), lbl: 'Commandes/mois', trend: '30 derniers jours', up: false },
          { icon: '⭐', val: fmt(stats?.users_business || 0), lbl: 'Plan Business', trend: total > 0 ? Math.round((stats?.users_business || 0) * 100 / total) + '% des abonnés' : '0%', up: false },
        ].map((k, i) => (
          <div key={i} style={S.card}>
            <div style={{ fontSize: 22, marginBottom: 12 }}>{k.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 5 }}>{k.lbl}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: k.up ? '#1D9E75' : 'rgba(255,255,255,.25)', marginTop: 6 }}>{k.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Plans */}
        <div style={S.card}>
          <p style={S.title}>Répartition des plans</p>
          {[
            { name: 'Basic', count: stats?.users_basic || 0, color: '#666', price: 3000 },
            { name: 'Business', count: stats?.users_business || 0, color: '#7F77DD', price: 5000 },
            { name: 'Elite', count: stats?.users_elite || 0, color: '#1D9E75', price: 15000 },
          ].map(p => (
            <div key={p.name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: p.color, fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 11 }}>{fmt(p.count * p.price)} F/mois</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{p.count}</span>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 6, height: 7, overflow: 'hidden' }}>
                <div style={{ width: `${total > 0 ? (p.count / total) * 100 : 0}%`, height: '100%', background: p.color, borderRadius: 6, transition: 'width .6s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ background: 'rgba(127,119,221,.1)', border: '1px solid rgba(127,119,221,.2)', borderRadius: 11, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>MRR total</span>
            <span style={{ color: '#7F77DD', fontSize: 18, fontWeight: 800 }}>{fmt(mrr)} FCFA</span>
          </div>
        </div>

        {/* Derniers inscrits */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ ...S.title, marginBottom: 0 }}>Derniers inscrits</p>
            <Link href="/admin/users" style={{ color: '#7F77DD', fontSize: 12, textDecoration: 'none' }}>Voir tous →</Link>
          </div>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(u.nom_boutique || u.email || '?').slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_boutique || 'Sans nom'}</div>
                <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: planBg(u.plan || 'basic'), color: planColor(u.plan || 'basic'), flexShrink: 0 }}>
                {(u.plan || 'BASIC').toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div style={S.card}>
        <p style={S.title}>Actions rapides</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
          {[
            { label: 'Gérer utilisateurs', href: '/admin/users', icon: '👥', color: '#7F77DD' },
            { label: 'Abonnements', href: '/admin/subscriptions', icon: '💳', color: '#1D9E75' },
            { label: 'Statistiques', href: '/admin/stats', icon: '📈', color: '#BA7517' },
            { label: 'Notifications', href: '/admin/notifications', icon: '🔔', color: '#E24B4A' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ background: `${a.color}11`, border: `1px solid ${a.color}33`, borderRadius: 12, padding: '14px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>{a.icon}</span>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 500, textAlign: 'center' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
