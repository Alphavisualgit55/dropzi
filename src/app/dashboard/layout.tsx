'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import WizardOnboarding from '@/components/WizardOnboarding'
import BackgroundSync from '@/components/BackgroundSync'

const NAV = [
  { href: '/dashboard',                 label: 'Accueil',         emoji: '🏠', color: '#7F77DD' },
  { href: '/dashboard/commandes',       label: 'Commandes',       emoji: '📦', color: '#F59E0B' },
  { href: '/dashboard/produits',        label: 'Produits',        emoji: '🛍️', color: '#EC4899' },
  { href: '/dashboard/stock',           label: 'Stock',           emoji: '🏪', color: '#8B5CF6' },
  { href: '/dashboard/livraisons',      label: 'Livraisons',      emoji: '🚚', color: '#3B82F6' },
  { href: '/dashboard/rapports',        label: 'Rapports',        emoji: '📊', color: '#10B981' },
  { href: '/dashboard/factures',        label: 'Factures',        emoji: '🧾', color: '#6366F1' },
  { href: '/dashboard/import',          label: 'Sync Shopify',    emoji: '⚡', color: '#F59E0B' },
  { href: '/dashboard/import-produits', label: 'Import Produits', emoji: '📥', color: '#06B6D4' },
  { href: '/dashboard/flex',            label: 'Mes Stats',       emoji: '📈', color: '#10B981' },
  { href: '/dashboard/affiliation',     label: 'Affiliation',     emoji: '🤝', color: '#8B5CF6' },
  { href: '/dashboard/abonnement',      label: 'Abonnement',      emoji: '💳', color: '#EC4899' },
  { href: '/dashboard/parametres',      label: 'Paramètres',      emoji: '⚙️', color: '#6B7280' },
]

const PLAN_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  starter:  { color: '#F59E0B', bg: '#FEF3C7', label: 'Starter' },
  business: { color: '#7F77DD', bg: '#EEF2FF', label: 'Business' },
  elite:    { color: '#10B981', bg: '#ECFDF5', label: 'Elite' },
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

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('nom_boutique,plan,plan_expires').eq('id', user.id).single()
      if (p) {
        setBoutique(p.nom_boutique || 'Ma Boutique')
        const actif = p.plan && p.plan !== 'aucun' && p.plan_expires && new Date(p.plan_expires) > new Date()
        setPlan(actif ? p.plan : null)
      }
      const { data: n } = await supabase.from('notifications_user').select('*').eq('user_id', user.id).eq('lu', false).order('created_at', { ascending: false }).limit(10)
      setNotifs(n || [])
      setLoading(false)

      supabase.channel('notifs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications_user' }, p => {
        setNotifs(prev => [p.new as any, ...prev])
      }).subscribe()
    }
    init()
  }, [])

  async function marquerLu(id: string) {
    await supabase.from('notifications_user').update({ lu: true }).eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const planStyle = plan ? PLAN_STYLE[plan] : null
  const currentPage = NAV.find(n => n.href === pathname || (n.href !== '/dashboard' && pathname.startsWith(n.href)))

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F4F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: '3px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F4F5F9', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', display: 'flex' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        *{box-sizing:border-box;} body{margin:0;}
        a{text-decoration:none;}

        /* Sidebar item */
        .sitem{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:12px;font-size:13px;font-weight:500;color:#64748B;transition:all .15s;cursor:pointer;text-decoration:none;}
        .sitem:hover{background:#F1F0FC;color:#7F77DD;}
        .sitem.active{background:linear-gradient(135deg,#7F77DD15,#7F77DD08);color:#534AB7;font-weight:700;box-shadow:inset 3px 0 0 #7F77DD;}

        /* Mobile nav item */
        .mitem{display:flex;align-items:center;gap:12px;padding:13px 18px;font-size:14px;font-weight:500;color:#374151;text-decoration:none;border-bottom:1px solid #F3F4F6;transition:background .1s;}
        .mitem:hover{background:#F8F7FF;}
        .mitem.active{background:#EEF2FF;color:#534AB7;font-weight:700;}

        @media(min-width:768px){
          .mobile-header{display:none!important;}
          .sidebar{display:flex!important;}
          .main{margin-left:240px!important;}
        }
        @media(max-width:767px){
          .sidebar{display:none!important;}
          .mobile-header{display:flex!important;}
          .main{margin-left:0!important;}
        }
      `}</style>

      {/* ══ SIDEBAR DESKTOP ══ */}
      <aside className="sidebar" style={{
        width: 240, background: '#fff', borderRight: '1px solid #E8EAF0',
        flexDirection: 'column', padding: '20px 12px',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        overflowY: 'auto', display: 'none',
        boxShadow: '4px 0 20px rgba(0,0,0,.04)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', marginBottom: 24 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(127,119,221,.35)', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#0F172A', letterSpacing: -.5 }}>Dropzi</div>
            {planStyle ? (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: planStyle.bg, color: planStyle.color, letterSpacing: '.04em' }}>{planStyle.label}</span>
            ) : (
              <Link href="/dashboard/abonnement" style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#FEF2F2', color: '#EF4444' }}>Sans abonnement</Link>
            )}
          </div>
        </div>

        {/* Boutique */}
        <div style={{ background: 'linear-gradient(135deg,#F8F7FF,#F0EFFF)', border: '1px solid #E8E6FF', borderRadius: 12, padding: '10px 12px', marginBottom: 20 }}>
          <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Boutique</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{boutique}</p>
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '.1em', padding: '0 8px', marginBottom: 6 }}>Navigation</p>

        {/* Nav items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} className={`sitem${active ? ' active' : ''}`}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: active ? item.color + '18' : '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, transition: 'background .15s' }}>
                  {item.emoji}
                </div>
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />}
              </Link>
            )
          })}
        </nav>

        {/* Footer sidebar */}
        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 12 }}>
          <button onClick={() => setShowNotifs(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 12, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#64748B', fontSize: 13 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, position: 'relative' }}>
              🔔
              {notifs.length > 0 && <div style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, background: '#EF4444', borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 8, color: '#fff', fontWeight: 800 }}>{notifs.length}</span></div>}
            </div>
            <span>Notifications</span>
            {notifs.length > 0 && <span style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '1px 7px' }}>{notifs.length}</span>}
          </button>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 12, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#94A3B8', fontSize: 13 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🚪</div>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ══ MOBILE HEADER ══ */}
      <header className="mobile-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: '#fff', borderBottom: '1px solid #E8EAF0',
        boxShadow: '0 2px 12px rgba(0,0,0,.06)',
        height: 56, padding: '0 16px',
        alignItems: 'center', justifyContent: 'space-between', gap: 10,
        display: 'none',
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>Dropzi</span>
        </Link>

        <span style={{ fontSize: 13, fontWeight: 700, color: '#534AB7', flex: 1, textAlign: 'center' }}>
          {currentPage ? `${currentPage.emoji} ${currentPage.label}` : '🏠 Accueil'}
        </span>

        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowNotifs(v => !v)} style={{ position: 'relative', background: '#F8F7FF', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>
            🔔
            {notifs.length > 0 && <div style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, background: '#EF4444', borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 7, color: '#fff', fontWeight: 800 }}>{notifs.length}</span></div>}
          </button>
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: menuOpen ? '#EEF2FF' : '#F8F7FF', border: '1px solid #E8E6FF', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#534AB7' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* ══ MENU MOBILE ══ */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(0,0,0,.25)', backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 49, background: '#fff', maxHeight: 'calc(100vh - 56px)', overflowY: 'auto', animation: 'slideDown .2s ease', boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
            {/* Boutique + plan */}
            <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#F8F7FF,#EEF2FF)', borderBottom: '1px solid #E8E6FF', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(127,119,221,.3)' }}>
                <span style={{ fontSize: 20 }}>🏪</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{boutique}</p>
                {planStyle ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: planStyle.bg, color: planStyle.color }}>Plan {planStyle.label}</span>
                ) : (
                  <Link href="/dashboard/abonnement" onClick={() => setMenuOpen(false)} style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: '#FEF2F2', color: '#EF4444' }}>⚠️ Activer un plan</Link>
                )}
              </div>
            </div>

            {/* Items */}
            {NAV.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`mitem${active ? ' active' : ''}`}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: active ? item.color + '18' : '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {item.emoji}
                  </div>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />}
                </Link>
              )
            })}

            <div style={{ borderTop: '1px solid #F1F5F9', padding: '8px 0' }}>
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 18px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: '#94A3B8' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚪</div>
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
          <div style={{ position: 'fixed', top: 60, right: 16, width: 320, maxWidth: 'calc(100vw - 32px)', background: '#fff', border: '1px solid #E8EAF0', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,.12)', zIndex: 45, overflow: 'hidden', animation: 'slideDown .2s ease' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFBFF' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>🔔 Notifications</p>
              {notifs.length > 0 && <button onClick={() => notifs.forEach(n => marquerLu(n.id))} style={{ fontSize: 12, color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Tout lire</button>}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifs.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>✅</p>
                  <p style={{ fontSize: 13, color: '#94A3B8' }}>Aucune notification</p>
                </div>
              ) : notifs.map(n => {
                const typeColor = n.type === 'success' ? '#10B981' : n.type === 'warning' ? '#F59E0B' : '#7F77DD'
                return (
                  <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F8F9FA', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 4, borderRadius: 4, background: typeColor, flexShrink: 0, alignSelf: 'stretch', minHeight: 40 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 3 }}>{n.titre}</p>
                      <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>{n.message}</p>
                      <p style={{ fontSize: 10, color: '#CBD5E1', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button onClick={() => marquerLu(n.id)} style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ══ CONTENU ══ */}
      <main className="main" style={{ flex: 1, marginLeft: 0, paddingTop: 0 }}>
        <div className="mobile-header" style={{ height: 56, display: 'none' }} />
        <div style={{ padding: '24px 24px 80px', maxWidth: 820, margin: '0 auto' }}>
          <WizardOnboarding />
          <BackgroundSync />
          {children}
        </div>
      </main>
    </div>
  )
}
