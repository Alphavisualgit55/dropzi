'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))

export default function AdminPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    total_users: 0, users_basic: 0, users_business: 0, users_elite: 0,
    nouveaux_mois: 0, commandes_mois: 0, mrr: 0,
    total_commandes: 0, commandes_livrees: 0, total_produits: 0,
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentCommandes, setRecentCommandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const loadData = useCallback(async () => {
    const now = new Date()
    const moisDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [
      { count: totalUsers },
      { count: usersBasic },
      { count: usersBusiness },
      { count: usersElite },
      { count: nouveauxMois },
      { count: commandesMois },
      { count: totalCommandes },
      { count: commandesLivrees },
      { count: totalProduits },
      { data: users },
      { data: commandes },
      { data: profiles },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'basic'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'business'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'elite'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', moisDebut),
      supabase.from('commandes').select('*', { count: 'exact', head: true }).gte('created_at', moisDebut),
      supabase.from('commandes').select('*', { count: 'exact', head: true }),
      supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('statut', 'livre'),
      supabase.from('produits').select('*', { count: 'exact', head: true }).eq('actif', true),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(6),
      supabase.from('commandes').select('*, profiles(nom_boutique,email)').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('montant_mensuel, plan'),
    ])

    const mrr = (profiles || []).reduce((s: number, p: any) => {
      const prix = p.plan === 'elite' ? 15000 : p.plan === 'business' ? 5000 : 3000
      return s + prix
    }, 0)

    setStats({
      total_users: totalUsers || 0,
      users_basic: usersBasic || 0,
      users_business: usersBusiness || 0,
      users_elite: usersElite || 0,
      nouveaux_mois: nouveauxMois || 0,
      commandes_mois: commandesMois || 0,
      mrr,
      total_commandes: totalCommandes || 0,
      commandes_livrees: commandesLivrees || 0,
      total_produits: totalProduits || 0,
    })
    setRecentUsers(users || [])
    setRecentCommandes(commandes || [])
    setLastUpdate(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    // Realtime toutes les 30 secondes
    const interval = setInterval(loadData, 30000)
    // Realtime Supabase sur nouvelles commandes
    const ch = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'commandes' }, loadData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, loadData)
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(ch) }
  }, [loadData])

  const planColor = (p: string) => p === 'elite' ? '#1D9E75' : p === 'business' ? '#7F77DD' : '#666'
  const total = stats.users_basic + stats.users_business + stats.users_elite || 1

  const S = {
    card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 18 } as React.CSSProperties,
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -.5 }}>Dashboard Admin</h1>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, marginTop: 4 }}>Données en temps réel — Dropzi</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>Mis à jour : {lastUpdate.toLocaleTimeString('fr-FR')}</span>
          <button onClick={loadData} style={{ background: 'rgba(127,119,221,.15)', border: '1px solid rgba(127,119,221,.3)', color: '#7F77DD', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { icon: '👥', val: fmt(stats.total_users), lbl: 'Utilisateurs totaux', sub: `+${stats.nouveaux_mois} ce mois`, c: '#7F77DD' },
          { icon: '💰', val: fmt(stats.mrr) + ' F', lbl: 'MRR estimé', sub: 'Revenu mensuel récurrent', c: '#1D9E75' },
          { icon: '📦', val: fmt(stats.total_commandes), lbl: 'Total commandes', sub: `${stats.commandes_mois} ce mois`, c: '#BA7517' },
          { icon: '✅', val: fmt(stats.commandes_livrees), lbl: 'Commandes livrées', sub: stats.total_commandes > 0 ? Math.round(stats.commandes_livrees * 100 / stats.total_commandes) + '% taux livraison' : '—', c: '#1D9E75' },
          { icon: '🛍️', val: fmt(stats.total_produits), lbl: 'Produits actifs', sub: 'Sur toute la plateforme', c: '#7F77DD' },
          { icon: '🚀', val: fmt(stats.nouveaux_mois), lbl: 'Nouveaux ce mois', sub: 'Inscriptions récentes', c: '#BA7517' },
        ].map((k, i) => (
          <div key={i} style={S.card}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{k.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.c, letterSpacing: -1, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 5 }}>{k.lbl}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Plans */}
        <div style={S.card}>
          <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Répartition des plans</p>
          {[
            { name: 'Basic', count: stats.users_basic, color: '#666', price: 3000 },
            { name: 'Business', count: stats.users_business, color: '#7F77DD', price: 5000 },
            { name: 'Elite', count: stats.users_elite, color: '#1D9E75', price: 15000 },
          ].map(p => (
            <div key={p.name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: p.color, fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,.25)', fontSize: 11 }}>{fmt(p.count * p.price)} F/mois</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{p.count} users</span>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 6, height: 7, overflow: 'hidden' }}>
                <div style={{ width: `${(p.count / total) * 100}%`, height: '100%', background: p.color, borderRadius: 6, transition: 'width .6s ease', minWidth: p.count > 0 ? 8 : 0 }} />
              </div>
              <div style={{ color: 'rgba(255,255,255,.2)', fontSize: 10, marginTop: 3 }}>{Math.round((p.count / total) * 100)}% des abonnés</div>
            </div>
          ))}
          <div style={{ background: 'rgba(127,119,221,.1)', border: '1px solid rgba(127,119,221,.2)', borderRadius: 11, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>MRR total</span>
            <span style={{ color: '#7F77DD', fontSize: 20, fontWeight: 800 }}>{fmt(stats.mrr)} FCFA</span>
          </div>
        </div>

        {/* Derniers inscrits */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Derniers inscrits</p>
            <Link href="/admin/users" style={{ color: '#7F77DD', fontSize: 12 }}>Voir tous →</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucun utilisateur</p>
          ) : recentUsers.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(u.nom_boutique || u.email || '?').slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_boutique || 'Sans nom'}</div>
                <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: planColor(u.plan || 'basic') + '22', color: planColor(u.plan || 'basic') }}>{(u.plan || 'BASIC').toUpperCase()}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dernières commandes */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Dernières commandes (toute la plateforme)</p>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>Temps réel</span>
        </div>
        {recentCommandes.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucune commande</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['N°', 'Boutique', 'Statut', 'Montant', 'Date'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: 'rgba(255,255,255,.25)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid rgba(255,255,255,.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentCommandes.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#7F77DD', fontWeight: 600 }}>{c.numero_commande || c.id.slice(0, 8)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#fff' }}>{(c.profiles as any)?.nom_boutique || (c.profiles as any)?.email || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: c.statut === 'livre' ? 'rgba(29,158,117,.15)' : c.statut === 'en_attente' ? 'rgba(186,117,23,.15)' : 'rgba(127,119,221,.15)', color: c.statut === 'livre' ? '#1D9E75' : c.statut === 'en_attente' ? '#BA7517' : '#7F77DD' }}>
                      {c.statut?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#fff' }}>—</td>
                  <td style={{ padding: '10px 12px', fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Actions rapides */}
      <div style={{ ...S.card, marginTop: 14 }}>
        <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Actions rapides</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
          {[
            { label: 'Utilisateurs', href: '/admin/users', icon: '👥', color: '#7F77DD' },
            { label: 'Abonnements', href: '/admin/subscriptions', icon: '💳', color: '#1D9E75' },
            { label: 'Statistiques', href: '/admin/stats', icon: '📈', color: '#BA7517' },
            { label: 'Notifications', href: '/admin/notifications', icon: '🔔', color: '#E24B4A' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ background: a.color + '11', border: `1px solid ${a.color}33`, borderRadius: 12, padding: '14px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>{a.icon}</span>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
