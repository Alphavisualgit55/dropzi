'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import WizardOnboarding from '@/components/WizardOnboarding'
import BackgroundSync from '@/components/BackgroundSync'

const NAV = [
  { href: '/dashboard', label: 'Accueil', icon: '🏠' },
  { href: '/dashboard/commandes', label: 'Commandes', icon: '📦' },
  { href: '/dashboard/produits', label: 'Produits', icon: '🛍️' },
  { href: '/dashboard/stock', label: 'Stock', icon: '🏪' },
  { href: '/dashboard/livraisons', label: 'Livraisons', icon: '🚚' },
  { href: '/dashboard/rapports', label: 'Rapports', icon: '📊' },
  { href: '/dashboard/factures', label: 'Factures', icon: '🧾' },
  { href: '/dashboard/import', label: 'Sync Shopify', icon: '⚡' },
  { href: '/dashboard/import-produits', label: 'Import Produits', icon: '📥' },
  { href: '/dashboard/flex', label: 'Mes Stats', icon: '📈' },
  { href: '/dashboard/affiliation', label: 'Affiliation', icon: '🤝' },
  { href: '/dashboard/abonnement', label: 'Abonnement', icon: '💳' },
  { href: '/dashboard/parametres', label: 'Paramètres', icon: '⚙️' },
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

  // 🔥 MENU MOBILE
  const [openMenu, setOpenMenu] = useState(false)

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
        const isActif =
          profile.plan &&
          profile.plan !== 'aucun' &&
          profile.plan_expires &&
          new Date(profile.plan_expires) > new Date()

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

    const ch = supabase
      .channel('notifs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications_user' },
        payload => {
          setNotifs(prev => [payload.new as any, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [])

  // scroll actif
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const active = el.querySelector('[data-active="true"]') as HTMLElement
    if (active) {
      const offset =
        active.offsetLeft - el.offsetWidth / 2 + active.offsetWidth / 2
      el.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [pathname])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const PLAN_COLOR: Record<string, string> = {
    starter: '#F59E0B',
    business: '#7F77DD',
    elite: '#1D9E75',
  }

  if (loading) return <div style={{ height: '100vh' }} />

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7FA' }}>
      <style>{`
        .nav-scroll::-webkit-scrollbar{display:none;}
        .nav-scroll{-ms-overflow-style:none;scrollbar-width:none;}

        .nav-item{transition:.15s;display:flex;flex-direction:column;align-items:center;padding:8px 12px;border-radius:10px;}

        @media (max-width:768px){
          .desktop-menu{display:none;}
        }

        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* HEADER */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        gap: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>

        {/* HAMBURGER */}
        <button onClick={() => setOpenMenu(true)} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>
          ☰
        </button>

        {/* LOGO */}
        <Link href="/dashboard" style={{ fontWeight: 800, textDecoration: 'none', color: '#000' }}>
          Dropzi
        </Link>

        {/* PLAN */}
        <div style={{ marginLeft: 10 }}>
          {plan ? (
            <span style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 20,
              background: '#eee'
            }}>
              {plan}
            </span>
          ) : (
            <Link href="/dashboard/abonnement" style={{ fontSize: 10, color: 'red' }}>
              ⚠️ Pas d'abonnement
            </Link>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={logout} style={{ background: 'none', border: 'none', fontSize: 18 }}>
            🚪
          </button>
        </div>
      </header>

      {/* DESKTOP MENU */}
      <div ref={scrollRef} className="nav-scroll desktop-menu"
        style={{ display: 'flex', overflowX: 'auto', padding: 10, gap: 6 }}>
        {NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="nav-item"
              data-active={active}
              style={{
                background: active ? '#EEEDFE' : 'transparent',
                color: active ? '#7F77DD' : '#555'
              }}>
              <span>{item.icon}</span>
              <span style={{ fontSize: 10 }}>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* MOBILE DRAWER */}
      {openMenu && (
        <>
          <div onClick={() => setOpenMenu(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 60
            }}
          />

          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 260,
            height: '100%',
            background: '#fff',
            zIndex: 70,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'slideIn .2s'
          }}>
            <button onClick={() => setOpenMenu(false)}>✕</button>

            {NAV.map(item => {
              const active = pathname.startsWith(item.href)
              return (
                <Link key={item.href}
                  href={item.href}
                  onClick={() => setOpenMenu(false)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: active ? '#EEEDFE' : 'transparent'
                  }}>
                  {item.icon} {item.label}
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* CONTENT */}
      <main style={{ padding: 16 }}>
        <WizardOnboarding />
        <BackgroundSync />
        {children}
      </main>
    </div>
  )
}
