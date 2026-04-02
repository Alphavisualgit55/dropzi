'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import WizardOnboarding from '@/components/WizardOnboarding'
import BackgroundSync from '@/components/BackgroundSync'

const NAV = [
  { href: '/dashboard',               label: 'Accueil',         icon: '🏠' },
  { href: '/dashboard/commandes',     label: 'Commandes',       icon: '📦' },
  { href: '/dashboard/produits',      label: 'Produits',        icon: '🛍️' },
  { href: '/dashboard/stock',         label: 'Stock',           icon: '🏪' },
  { href: '/dashboard/livraisons',    label: 'Livraisons',      icon: '🚚' },
  { href: '/dashboard/rapports',      label: 'Rapports',        icon: '📊' },
  { href: '/dashboard/factures',      label: 'Factures',        icon: '🧾' },
  { href: '/dashboard/import',        label: 'Sync Shopify',    icon: '⚡' },
  { href: '/dashboard/import-produits', label: 'Import Produits', icon: '📥' },
  { href: '/dashboard/flex',          label: 'Mes Stats',       icon: '📈' },
  { href: '/dashboard/affiliation',   label: 'Affiliation',     icon: '🤝' },
  { href: '/dashboard/abonnement',    label: 'Abonnement',      icon: '💳' },
  { href: '/dashboard/parametres',    label: 'Paramètres',      icon: '⚙️' },
]

const PLAN_COLOR: Record<string, string> = {
  starter: '#F59E0B',
  business: '#7F77DD',
  elite: '#1D9E75',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [boutique, setBoutique] = useState('Ma Boutique')
  const [plan, setPlan] = useState<string | null>(null)
  const [notifs, setNotifs] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const currentPage = NAV.find(n => n.href === pathname || (n.href !== '/dashboard' && pathname.startsWith(n.href)))

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('nom_boutique, plan, plan_expires').eq('id', user.id).single()

      if (profile) {
        setBoutique(profile.nom_boutique || 'Ma Boutique')
        const actif = profile.plan && profile.plan !== 'aucun' && profile.plan_expires && new Date(profile.plan_expires) > new Date()
        setPlan(actif ? profile.plan : null)
      }

      const { data: n } = await supabase
        .from('notifications_user').select('*').eq('user_id', user.id)
        .eq('lu', false).order('created_at', { ascending: false }).limit(10)
      setNotifs(n || [])
      setLoading(false)
    }
    init()

    const ch = supabase.channel('notifs-dash')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications_user' }, p => {
        setNotifs(prev => [p.new as any, ...prev])
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Fermer menu mobile au changement de page
  useEffect(() => { setMenuOpen(false) }, [pathname])

  async function marquerLu(id: string) {
    await supabase.from('notifications_user').update({ lu: true }).eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  async function toutMarquerLu() {
    for (const n of notifs) await supabase.from('notifications_user').update({ lu: true }).eq('id', n.id)
    setNotifs([])
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        *{box-sizing:border-box;} body{margin:0;}
        .nav-link{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:11px;font-size:13px;font-weight:500;color:rgba(12,12,30,.5);text-decoration:none;transition:all .15s;cursor:pointer;}
        .nav-link:hover{background:rgba(127,119,221,.08);color:#0C0C1E;}
        .nav-link.active{background:#EEEDFE;color:#534AB7;font-weight:700;}
        .mobile-nav-item{display:flex;align-items:center;gap:12px;padding:13px 16px;font-size:14px;font-weight:500;color:#333;text-decoration:none;transition:background .1s;border-bottom:1px solid #F5F5F5;}
        .mobile-nav-item:hover{background:#F8F8FC;}
        .mobile-nav-item.active{background:#EEEDFE;color:#534AB7;font-weight:700;}
        .notif-panel{animation:slideDown .2s ease;}
        /* Desktop: show sidebar, hide mobile header */
        @media(min-width:768px){
          .mobile-header{display:none!important;}
          .desktop-sidebar{display:flex!important;}
          .main-with-sidebar{margin-left:220px!important;}
        }
        /* Mobile: hide sidebar, show mobile header */
        @media(max-width:767px){
          .desktop-sidebar{display:none!important;}
          .mobile-header{display:flex!important;}
          .main-with-sidebar{margin-left:0!important;}
        }
      `}</style>

      {/* ══ DESKTOP SIDEBAR ══ */}
      <aside className="desktop-sidebar" style={{
        display: 'none', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 220,
        background: '#fff', borderRight: '1px solid #F0F0F0',
        boxShadow: '2px 0 12px rgba(0,0,0,.04)', zIndex: 40, overflowY: 'auto',
        padding: '20px 12px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(127,119,221,.3)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#0C0C1E', letterSpacing: -.4 }}>Dropzi</div>
            {plan ? (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: (PLAN_COLOR[plan] || '#888') + '18', color: PLAN_COLOR[plan] || '#888' }}>
                {plan.toUpperCase()}
              </span>
            ) : (
              <Link href="/dashboard/abonnement" style={{ fontSize: 10, fontWeight: 700, color: '#E24B4A', background: '#FEF2F2', padding: '1px 7px', borderRadius: 20, textDecoration: 'none' }}>
                ⚠️ Sans plan
              </Link>
            )}
          </div>
        </div>

        {/* Boutique */}
        <div style={{ background: '#F8F8FC', borderRadius: 12, padding: '10px 12px', marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: '#ABABAB', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>Boutique</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0C0C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{boutique}</p>
        </div>

        {/* Section label */}
        <p style={{ fontSize: 10, fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '.1em', padding: '0 8px', marginBottom: 6 }}>Menu</p>

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} className={`nav-link${active ? ' active' : ''}`}>
                <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#7F77DD', flexShrink: 0 }} />}
              </Link>
            )
          })}
        </nav>

        {/* Notifs desktop */}
        <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 12, marginTop: 12 }}>
          <button onClick={() => setShowNotifs(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 11, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 16 }}>🔔</span>
            <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Notifications</span>
            {notifs.length > 0 && (
              <span style={{ marginLeft: 'auto', background: '#E24B4A', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {notifs.length > 9 ? '9+' : notifs.length}
              </span>
            )}
          </button>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 11, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#ABABAB', fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* ══ MOBILE HEADER ══ */}
      <header className="mobile-header" style={{
        display: 'none', position: 'sticky', top: 0, zIndex: 50,
        background: '#fff', borderBottom: '1px solid #F0F0F0',
        boxShadow: '0 1px 8px rgba(0,0,0,.06)',
        padding: '0 16px', height: 56, alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#0C0C1E', letterSpacing: -.3 }}>Dropzi</span>
        </Link>

        {/* Page actuelle */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>
            {currentPage ? `${currentPage.icon} ${currentPage.label}` : '🏠 Accueil'}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {/* Notif */}
          <button onClick={() => setShowNotifs(v => !v)}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
            <span style={{ fontSize: 18 }}>🔔</span>
            {notifs.length > 0 && (
              <div style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, background: '#E24B4A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: '#fff' }}>{notifs.length > 9 ? '9+' : notifs.length}</span>
              </div>
            )}
          </button>

          {/* Burger */}
          <button onClick={() => setMenuOpen(v => !v)}
            style={{ background: menuOpen ? '#EEEDFE' : 'none', border: '1px solid #EBEBEB', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* ══ MENU DÉROULANT MOBILE ══ */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(0,0,0,.3)' }} />
          <div style={{
            position: 'fixed', top: 56, left: 0, right: 0, zIndex: 49,
            background: '#fff', borderBottom: '1px solid #F0F0F0',
            boxShadow: '0 8px 32px rgba(0,0,0,.12)',
            maxHeight: 'calc(100vh - 56px)', overflowY: 'auto',
            animation: 'slideDown .2s ease',
          }}>
            {/* Boutique + plan */}
            <div style={{ padding: '14px 16px', background: '#F8F8FC', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>🏪</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{boutique}</p>
                {plan ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: (PLAN_COLOR[plan] || '#888') + '18', color: PLAN_COLOR[plan] || '#888' }}>
                    Plan {plan.toUpperCase()}
                  </span>
                ) : (
                  <Link href="/dashboard/abonnement" onClick={() => setMenuOpen(false)}
                    style={{ fontSize: 11, fontWeight: 700, color: '#E24B4A', background: '#FEF2F2', padding: '2px 8px', borderRadius: 20, textDecoration: 'none' }}>
                    ⚠️ Sans abonnement — Activer
                  </Link>
                )}
              </div>
            </div>

            {/* Items nav */}
            {NAV.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className={`mobile-nav-item${active ? ' active' : ''}`}>
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {active && <span style={{ marginLeft: 'auto', color: '#7F77DD', fontSize: 16 }}>●</span>}
                </Link>
              )
            })}

            {/* Déconnexion */}
            <div style={{ borderTop: '1px solid #F0F0F0', padding: '8px 0' }}>
              <button onClick={logout}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: '#ABABAB' }}>
                <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🚪</span>
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ PANEL NOTIFICATIONS ══ */}
      {showNotifs && (
        <>
          <div onClick={() => setShowNotifs(false)} style={{ position: 'fixed', inset: 0, zIndex: 44 }} />
          <div className="notif-panel" style={{
            position: 'fixed', top: 56, right: 16, width: 320, maxWidth: 'calc(100vw - 32px)',
            background: '#fff', border: '1px solid #EBEBEB', borderRadius: 18,
            boxShadow: '0 8px 32px rgba(0,0,0,.12)', zIndex: 45, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0C0C1E' }}>🔔 Notifications</p>
              {notifs.length > 0 && (
                <button onClick={toutMarquerLu}
                  style={{ fontSize: 11, color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  Tout lire
                </button>
              )}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifs.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 28, marginBottom: 6 }}>✅</p>
                  <p style={{ fontSize: 13, color: '#ABABAB' }}>Aucune notification</p>
                </div>
              ) : notifs.map(n => {
                const typeColor = n.type === 'success' ? '#16A34A' : n.type === 'warning' ? '#D97706' : '#7F77DD'
                return (
                  <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', gap: 10 }}>
                    <div style={{ width: 6, borderRadius: 3, background: typeColor, flexShrink: 0, alignSelf: 'stretch' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0C0C1E', marginBottom: 3 }}>{n.titre}</p>
                      <p style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>{n.message}</p>
                      <p style={{ fontSize: 10, color: '#C0C0C0', marginTop: 4 }}>
                        {new Date(n.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button onClick={() => marquerLu(n.id)}
                      style={{ background: 'none', border: 'none', color: '#C0C0C0', cursor: 'pointer', fontSize: 16, flexShrink: 0, alignSelf: 'flex-start' }}>✕</button>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ══ CONTENU PRINCIPAL ══ */}
      <main className="main-with-sidebar" style={{ marginLeft: 0, padding: '24px 20px 80px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <WizardOnboarding />
          <BackgroundSync />
          {children}
        </div>
      </main>
    </div>
  )
}
