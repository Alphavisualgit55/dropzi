'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import WizardOnboarding from '@/components/WizardOnboarding'
import BackgroundSync from '@/components/BackgroundSync'

const NAV = [
  { href: '/dashboard',                  label: 'Accueil',        icon: '🏠' },
  { href: '/dashboard/commandes',        label: 'Commandes',      icon: '📦' },
  { href: '/dashboard/produits',         label: 'Produits',       icon: '🛍️' },
  { href: '/dashboard/stock',            label: 'Stock',          icon: '🏪' },
  { href: '/dashboard/livraisons',       label: 'Livraisons',     icon: '🚚' },
  { href: '/dashboard/rapports',         label: 'Rapports',       icon: '📊' },
  { href: '/dashboard/factures',         label: 'Factures',       icon: '🧾' },
  { href: '/dashboard/import',           label: 'Sync Shopify',   icon: '⚡' },
  { href: '/dashboard/import-produits',  label: 'Import Produits',icon: '📥' },
  { href: '/dashboard/flex',             label: 'Mes Stats',      icon: '📈' },
  { href: '/dashboard/affiliation',      label: 'Affiliation',    icon: '🤝' },
  { href: '/dashboard/abonnement',       label: 'Abonnement',     icon: '💳' },
  { href: '/dashboard/parametres',       label: 'Paramètres',     icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [boutique, setBoutique] = useState('Dropzi')
  const [notifs, setNotifs] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nom_boutique, plan, plan_expires')
        .eq('id', user.id)
        .single()

      if (profile) {
        setBoutique(profile.nom_boutique || 'Ma Boutique')
        const isActif = profile.plan && profile.plan !== 'aucun' && profile.plan_expires && new Date(profile.plan_expires) > new Date()
        setPlan(isActif ? profile.plan : null)
      }

      const { data: n } = await supabase
        .from('notifications_user')
        .select('*')
        .eq('user_id', user.id)
        .eq('lu', false)
        .order('created_at', { ascending: false })
        .limit(10)
      setNotifs(n || [])
      setLoading(false)
    }
    init()

    // Realtime notifications
    const ch = supabase
      .channel('notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications_user' }, payload => {
        setNotifs(prev => [payload.new as any, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Scroll actif vers le centre
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const active = el.querySelector('[data-active="true"]') as HTMLElement
    if (active) {
      const offset = active.offsetLeft - el.offsetWidth / 2 + active.offsetWidth / 2
      el.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [pathname])

  async function marquerLu(id: string) {
    await supabase.from('notifications_user').update({ lu: true }).eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const PLAN_COLOR: Record<string, string> = { starter: '#F59E0B', business: '#7F77DD', elite: '#1D9E75' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '3px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7FA', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        *{box-sizing:border-box;}
        body{margin:0;}

        /* Scrollbar cachée sur le menu */
        .nav-scroll::-webkit-scrollbar{display:none;}
        .nav-scroll{-ms-overflow-style:none;scrollbar-width:none;}

        /* Hover items nav */
        .nav-item{transition:all .15s;white-space:nowrap;text-decoration:none;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 14px;border-radius:12px;cursor:pointer;flex-shrink:0;}
        .nav-item:hover{background:rgba(127,119,221,.08);}

        /* Notif overlay click outside */
        .notif-panel{animation:slideDown .2s ease;}
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #F0F0F0', boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>

        {/* Ligne 1 : Logo + boutique + actions */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 52, gap: 12 }}>
          {/* Logo */}
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#0C0C1E', letterSpacing: -.4 }}>Dropzi</span>
          </Link>

          {/* Boutique + plan */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{boutique}</p>
            {plan ? (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: (PLAN_COLOR[plan] || '#888') + '18', color: PLAN_COLOR[plan] || '#888' }}>
                {plan.toUpperCase()}
              </span>
            ) : (
              <Link href="/dashboard/abonnement" style={{ fontSize: 10, fontWeight: 700, color: '#E24B4A', textDecoration: 'none', background: '#FEF2F2', padding: '1px 7px', borderRadius: 20 }}>
                ⚠️ Pas d'abonnement
              </Link>
            )}
          </div>

          {/* Notifs */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowNotifs(v => !v)}
              style={{ position: 'relative', background: showNotifs ? '#F0F0F8' : 'none', border: 'none', cursor: 'pointer', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              {notifs.length > 0 && (
                <div style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, background: '#E24B4A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>{notifs.length > 9 ? '9+' : notifs.length}</span>
                </div>
              )}
            </button>

            {showNotifs && (
              <>
                <div onClick={() => setShowNotifs(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div className="notif-panel" style={{ position: 'absolute', top: '110%', right: 0, width: 300, background: '#fff', border: '1px solid #EBEBEB', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,.12)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>Notifications</p>
                    {notifs.length > 0 && (
                      <button onClick={() => { notifs.forEach(n => marquerLu(n.id)) }}
                        style={{ fontSize: 11, color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                        <p style={{ fontSize: 24, marginBottom: 6 }}>🔔</p>
                        <p style={{ fontSize: 13, color: '#ABABAB' }}>Aucune notification</p>
                      </div>
                    ) : notifs.map(n => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0C0C1E', marginBottom: 3 }}>{n.titre}</p>
                          <p style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>{n.message}</p>
                          <p style={{ fontSize: 10, color: '#C0C0C0', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <button onClick={() => marquerLu(n.id)}
                          style={{ background: 'none', border: 'none', color: '#C0C0C0', cursor: 'pointer', fontSize: 16, flexShrink: 0, alignSelf: 'flex-start' }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Déconnexion */}
          <button onClick={logout}
            style={{ background: 'none', border: '1px solid #EBEBEB', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
            🚪
          </button>
        </div>

        {/* Ligne 2 : Menu horizontal scrollable */}
        <div ref={scrollRef} className="nav-scroll"
          style={{ display: 'flex', overflowX: 'auto', padding: '4px 8px 6px', gap: 2, borderTop: '1px solid #F5F5F5' }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} data-active={active} className="nav-item"
                style={{ color: active ? '#7F77DD' : '#888', background: active ? '#EEEDFE' : 'transparent', fontWeight: active ? 700 : 500 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 10, letterSpacing: -.1 }}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </header>

      {/* ── CONTENU ── */}
      <main style={{ padding: '16px 16px 80px', maxWidth: 800, margin: '0 auto' }}>
        <WizardOnboarding />
        <BackgroundSync />
        {children}
      </main>
    </div>
  )
}
