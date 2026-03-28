'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const nav = [
  { href: '/dashboard', label: 'Accueil', icon: '🏠' },
  { href: '/dashboard/commandes', label: 'Commandes', icon: '📦' },
  { href: '/dashboard/produits', label: 'Produits', icon: '🛍️' },
  { href: '/dashboard/stock', label: 'Stock', icon: '🏪' },
  { href: '/dashboard/livraisons', label: 'Livraisons', icon: '🚚' },
  { href: '/dashboard/rapports', label: 'Rapports', icon: '📊' },
  { href: '/dashboard/factures', label: 'Factures', icon: '🧾' },
  { href: '/dashboard/import', label: 'Import Sheet', icon: '📥' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [boutique, setBoutique] = useState('Dropzi')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      supabase.from('profiles').select('nom_boutique').eq('id', user.id).single()
        .then(({ data }) => { if (data?.nom_boutique) setBoutique(data.nom_boutique) })
      // Charger notifications
      loadNotifs(user.id)
      // Realtime notifications
      const ch = supabase.channel('notifs-' + user.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications_user', filter: `user_id=eq.${user.id}` },
          () => loadNotifs(user.id))
        .subscribe()
      return () => { supabase.removeChannel(ch) }
    })
  }, [])

  async function loadNotifs(uid: string) {
    const { data } = await supabase.from('notifications_user').select('*')
      .eq('user_id', uid).eq('lu', false).order('created_at', { ascending: false }).limit(10)
    setNotifs(data || [])
  }

  async function marquerLu(id: string) {
    await supabase.from('notifications_user').update({ lu: true }).eq('id', id)
    if (userId) loadNotifs(userId)
  }

  async function tousLus() {
    if (!userId) return
    await supabase.from('notifications_user').update({ lu: true }).eq('user_id', userId).eq('lu', false)
    setNotifs([])
    setShowNotifs(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Mobile bottom nav — show only 5 most important
  const mobileNav = [
    { href: '/dashboard', icon: '🏠' },
    { href: '/dashboard/commandes', icon: '📦' },
    { href: '/dashboard/rapports', icon: '📊' },
    { href: '/dashboard/factures', icon: '🧾' },
    { href: '/dashboard/stock', icon: '🏪' },
  ]

  return (
    <div className="flex min-h-screen bg-[#F8F8FC]">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0C0C1E] min-h-screen p-4">
        <div className="flex items-center gap-2 px-2 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#7F77DD] flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 0 16px rgba(127,119,221,.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: 'Georgia, serif', letterSpacing: -0.5 }}>Dropzi</span>
        </div>

        <nav className="flex-1 space-y-0.5">
          {nav.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                pathname === item.href
                  ? 'bg-[#7F77DD] text-white font-medium shadow-sm'
                  : 'text-gray-400 hover:bg-white/8 hover:text-white'
              }`}
              style={pathname === item.href ? { boxShadow: '0 0 12px rgba(127,119,221,.3)' } : {}}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
              {item.href === '/dashboard/rapports' && (
                <span className="ml-auto bg-[#25D366] text-white text-xs px-1.5 py-0.5 rounded-full font-medium">WA</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4 mt-4 space-y-1">
          <Link href="/dashboard/parametres"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/8 hover:text-white transition-all">
            <span className="text-base w-5 text-center">⚙️</span> Paramètres
          </Link>
          <p className="text-gray-600 text-xs px-3 truncate">{boutique}</p>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-white/8 hover:text-white transition-all">
            <span className="text-base w-5 text-center">🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0C0C1E] border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7F77DD] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg" style={{ fontFamily: 'Georgia,serif' }}>Dropzi</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="text-gray-400 text-sm truncate max-w-32">{boutique}</span>
            <button onClick={() => setShowNotifs(!showNotifs)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              {notifs.length > 0 && <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, background: '#E24B4A', borderRadius: '50%', fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifs.length}</span>}
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {/* Panneau notifications */}
          {showNotifs && (
            <div style={{ position: 'fixed', top: 70, right: 16, width: 320, maxHeight: '70vh', overflowY: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,.15)', border: '1px solid #e8e8f0', zIndex: 200 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>🔔 Notifications ({notifs.length})</span>
                {notifs.length > 0 && <button onClick={tousLus} style={{ fontSize: 12, color: '#7F77DD', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Tout marquer lu</button>}
              </div>
              {notifs.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>Aucune notification</div>
              ) : notifs.map((n: any) => (
                <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f8f8f8', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'error' ? '❌' : 'ℹ️'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 3px', color: '#1a1a2e' }}>{n.titre}</p>
                    <p style={{ fontSize: 12, color: '#666', margin: '0 0 4px', lineHeight: 1.5 }}>{n.message}</p>
                    <p style={{ fontSize: 10, color: '#bbb', margin: 0 }}>{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                  <button onClick={() => marquerLu(n.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 2 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0C0C1E] border-t border-white/10 flex z-50">
        {mobileNav.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors relative ${
              pathname === item.href ? 'text-[#7F77DD]' : 'text-gray-500'
            }`}>
            <span className="text-xl">{item.icon}</span>
            {item.href === '/dashboard/rapports' && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#25D366] rounded-full" />
            )}
            {pathname === item.href && (
              <span className="w-1 h-1 rounded-full bg-[#7F77DD]" />
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}
