'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
const PLAN_PRIX: Record<string, number> = { starter: 3000, business: 5000, elite: 15000 }

export default function AdminPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ users: 0, actifs: 0, mrr: 0, commandes: 0, visiteurs: 0, live: 0, starter: 0, business: 0, elite: 0, expires7j: 0 })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentAbos, setRecentAbos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [])

  async function load() {
    const now = new Date()
    const in7j = new Date(now); in7j.setDate(now.getDate() + 7)

    const [profiles, commandes, visites, live, abos] = await Promise.all([
      supabase.from('profiles').select('*, abonnements(plan, statut, fin, montant, created_at)').order('created_at', { ascending: false }),
      supabase.from('commandes').select('id', { count: 'exact', head: true }),
      supabase.from('visites').select('id', { count: 'exact', head: true }),
      supabase.from('sessions_live').select('id', { count: 'exact', head: true }).gte('updated_at', new Date(Date.now() - 35000).toISOString()),
      supabase.from('abonnements').select('*, profiles(email, nom_boutique)').eq('statut', 'actif').order('created_at', { ascending: false }).limit(5),
    ])

    const users = profiles.data || []
    const actifs = users.filter((u: any) => u.plan && u.plan !== 'aucun' && u.plan_expires && new Date(u.plan_expires) > now)
    const mrr = actifs.reduce((s: number, u: any) => s + (PLAN_PRIX[u.plan] || 0), 0)
    const expires7j = users.filter((u: any) => u.plan_expires && new Date(u.plan_expires) > now && new Date(u.plan_expires) <= in7j).length

    setStats({
      users: users.length,
      actifs: actifs.length,
      mrr,
      commandes: commandes.count || 0,
      visiteurs: visites.count || 0,
      live: live.count || 0,
      starter: actifs.filter((u: any) => u.plan === 'starter').length,
      business: actifs.filter((u: any) => u.plan === 'business').length,
      elite: actifs.filter((u: any) => u.plan === 'elite').length,
      expires7j,
    })
    setRecentUsers(users.slice(0, 5))
    setRecentAbos(abos.data || [])
    setLoading(false)
  }

  const KPIS = [
    { lbl: 'Utilisateurs', val: stats.users, icon: '👥', color: '#AFA9EC', bg: 'rgba(127,119,221,.12)', href: '/admin/users' },
    { lbl: 'Abonnés actifs', val: stats.actifs, icon: '✅', color: '#9FE1CB', bg: 'rgba(29,158,117,.12)', href: '/admin/subscriptions' },
    { lbl: 'MRR', val: fmt(stats.mrr) + ' F', icon: '💰', color: '#F5C842', bg: 'rgba(245,200,66,.12)', href: '/admin/subscriptions' },
    { lbl: 'Commandes total', val: fmt(stats.commandes), icon: '📦', color: '#93C5FD', bg: 'rgba(37,99,235,.12)', href: '/admin/users' },
    { lbl: 'Visiteurs total', val: fmt(stats.visiteurs), icon: '👁️', color: '#C4B5FD', bg: 'rgba(124,58,237,.12)', href: '/admin/stats' },
    { lbl: 'En ligne maintenant', val: stats.live, icon: '🟢', color: '#9FE1CB', bg: 'rgba(29,158,117,.12)', href: '/admin/stats' },
    { lbl: 'Plan Starter', val: stats.starter, icon: '🥉', color: '#FAC775', bg: 'rgba(217,119,6,.12)', href: '/admin/subscriptions' },
    { lbl: 'Plan Business', val: stats.business, icon: '🥈', color: '#AFA9EC', bg: 'rgba(127,119,221,.12)', href: '/admin/subscriptions' },
    { lbl: 'Plan Elite', val: stats.elite, icon: '🥇', color: '#9FE1CB', bg: 'rgba(22,163,74,.12)', href: '/admin/subscriptions' },
    { lbl: 'Expire dans 7j', val: stats.expires7j, icon: '⚠️', color: '#F09595', bg: 'rgba(226,75,74,.12)', href: '/admin/subscriptions' },
  ]

  return (
    <div style={{ maxWidth: 1000 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5, margin: 0 }}>Dashboard Admin</h1>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, marginTop: 4 }}>Vue d'ensemble de Dropzi</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(29,158,117,.12)', border: '1px solid rgba(29,158,117,.25)', borderRadius: 20, padding: '6px 14px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: '#9FE1CB', fontWeight: 600 }}>{stats.live} visiteur{stats.live > 1 ? 's' : ''} en ligne</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10, marginBottom: 28 }}>
        {KPIS.map(k => (
          <Link key={k.lbl} href={k.href} style={{ textDecoration: 'none', background: k.bg, border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: '16px', display: 'block', transition: 'transform .15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{k.icon}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', fontWeight: 600 }}>→</span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: k.color, letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>{k.val}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{k.lbl}</p>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Derniers utilisateurs */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '18px', gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700 }}>Derniers inscrits</p>
            <Link href="/admin/users" style={{ fontSize: 12, color: '#7F77DD', textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          {loading ? <div style={{ color: 'rgba(255,255,255,.2)', fontSize: 13 }}>Chargement...</div> : recentUsers.map((u: any) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(127,119,221,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#AFA9EC', flexShrink: 0 }}>
                {(u.email || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_boutique || u.email}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{u.email}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: u.plan === 'elite' ? 'rgba(22,163,74,.2)' : u.plan === 'business' ? 'rgba(127,119,221,.2)' : u.plan === 'starter' ? 'rgba(217,119,6,.2)' : 'rgba(255,255,255,.06)', color: u.plan === 'elite' ? '#9FE1CB' : u.plan === 'business' ? '#AFA9EC' : u.plan === 'starter' ? '#FAC775' : 'rgba(255,255,255,.3)', flexShrink: 0 }}>
                {(u.plan || 'aucun').toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Derniers abonnements */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700 }}>Derniers paiements</p>
            <Link href="/admin/subscriptions" style={{ fontSize: 12, color: '#7F77DD', textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          {loading ? <div style={{ color: 'rgba(255,255,255,.2)', fontSize: 13 }}>Chargement...</div> : recentAbos.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13 }}>Aucun abonnement</p>
          ) : recentAbos.map((a: any) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(29,158,117,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>💳</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.profiles?.nom_boutique || a.profiles?.email || 'Utilisateur'}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>Plan {a.plan} · {fmt(a.montant || 0)} F</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 11, color: '#9FE1CB', fontWeight: 700 }}>+{fmt(a.montant || 0)} F</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>
                  {a.fin ? new Date(a.fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginTop: 16 }}>
        {[
          { href: '/admin/users', icon: '👥', lbl: 'Gérer utilisateurs', sub: `${stats.users} comptes` },
          { href: '/admin/subscriptions', icon: '💳', lbl: 'Gérer abonnements', sub: `${stats.actifs} actifs · ${fmt(stats.mrr)} F MRR` },
          { href: '/admin/notifications', icon: '🔔', lbl: 'Envoyer notification', sub: 'À tous ou un utilisateur' },
          { href: '/admin/stats', icon: '📊', lbl: 'Voir statistiques', sub: `${fmt(stats.visiteurs)} visiteurs` },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{ textDecoration: 'none', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{a.icon}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{a.lbl}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{a.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
