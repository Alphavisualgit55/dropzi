'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function AdminPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<any>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [statsRes, usersRes] = await Promise.all([
        supabase.from('admin_stats').select('*').single(),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
      ])
      setStats(statsRes.data)
      setRecentUsers(usersRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const kpis = [
    { label: 'Utilisateurs actifs', val: fmt(stats?.total_users || 0), icon: '👥', color: '#7F77DD', sub: `+${stats?.nouveaux_ce_mois || 0} ce mois` },
    { label: 'MRR', val: fmt(stats?.mrr || 0) + ' F', icon: '💰', color: '#1D9E75', sub: 'Revenus mensuels récurrents' },
    { label: 'Commandes/mois', val: fmt(stats?.commandes_ce_mois || 0), icon: '📦', color: '#BA7517', sub: '30 derniers jours' },
    { label: 'Plan Business', val: fmt(stats?.users_business || 0), icon: '⭐', color: '#534AB7', sub: 'utilisateurs' },
  ]

  const planStats = [
    { plan: 'Basic', count: stats?.users_basic || 0, color: '#888', price: 3000 },
    { plan: 'Business', count: stats?.users_business || 0, color: '#7F77DD', price: 5000 },
    { plan: 'Elite', count: stats?.users_elite || 0, color: '#1D9E75', price: 15000 },
  ]
  const totalUsers = (stats?.users_basic || 0) + (stats?.users_business || 0) + (stats?.users_elite || 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>Dashboard Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Vue globale de Dropzi en temps réel</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '20px' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{k.icon}</span>
              <span style={{ background: `${k.color}22`, color: k.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.06em' }}>Live</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'Georgia,serif', letterSpacing: -1 }}>{k.val}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: k.color, marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition plans */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 24 }}>
          <h2 className="text-white font-semibold mb-5">Répartition des plans</h2>
          <div className="space-y-4">
            {planStats.map(p => (
              <div key={p.plan}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: p.color, fontWeight: 600, fontSize: 14 }}>{p.plan}</span>
                  <div className="flex items-center gap-3">
                    <span style={{ color: '#666', fontSize: 12 }}>{fmt(p.count * p.price)} FCFA/mois</span>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{p.count}</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${totalUsers > 0 ? (p.count / totalUsers) * 100 : 0}%`, height: '100%', background: p.color, borderRadius: 8, transition: 'width .5s ease' }} />
                </div>
                <div style={{ color: '#444', fontSize: 11, marginTop: 2 }}>{totalUsers > 0 ? Math.round((p.count / totalUsers) * 100) : 0}% des abonnés</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', marginTop: 16, paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666', fontSize: 13 }}>MRR total estimé</span>
            <span style={{ color: '#1D9E75', fontWeight: 800, fontSize: 18 }}>
              {fmt(((stats?.users_basic || 0) * 3000) + ((stats?.users_business || 0) * 5000) + ((stats?.users_elite || 0) * 15000))} FCFA
            </span>
          </div>
        </div>

        {/* Derniers inscrits */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 24 }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Derniers inscrits</h2>
            <Link href="/admin/users" style={{ color: '#7F77DD', fontSize: 12, textDecoration: 'none' }}>Voir tous →</Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {(u.nom_boutique || u.email || '?').slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_boutique || 'Sans nom'}</div>
                  <div style={{ color: '#555', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: u.plan === 'elite' ? 'rgba(29,158,117,.15)' : u.plan === 'business' ? 'rgba(127,119,221,.15)' : 'rgba(136,136,136,.1)', color: u.plan === 'elite' ? '#1D9E75' : u.plan === 'business' ? '#7F77DD' : '#888' }}>
                    {(u.plan || 'basic').toUpperCase()}
                  </div>
                  <div style={{ color: '#444', fontSize: 10, marginTop: 3 }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 24 }}>
        <h2 className="text-white font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Gérer utilisateurs', href: '/admin/users', icon: '👥', color: '#7F77DD' },
            { label: 'Abonnements', href: '/admin/subscriptions', icon: '💳', color: '#1D9E75' },
            { label: 'Statistiques', href: '/admin/stats', icon: '📈', color: '#BA7517' },
            { label: 'Notifications', href: '/admin/notifications', icon: '🔔', color: '#E24B4A' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ background: `${a.color}11`, border: `1px solid ${a.color}33`, borderRadius: 14, padding: '16px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all .2s' }}>
              <span style={{ fontSize: 28 }}>{a.icon}</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
