'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import WizardOnboarding from '@/components/WizardOnboarding'
import BackgroundSync from '@/components/BackgroundSync'

const NAV = [
  { href: '/dashboard',                 label: 'Accueil',         icon: '⊞',  color: '#818CF8', grad: 'linear-gradient(135deg,#818CF8,#6366F1)' },
  { href: '/dashboard/commandes',       label: 'Commandes',       icon: '◈',  color: '#F59E0B', grad: 'linear-gradient(135deg,#F59E0B,#D97706)' },
  { href: '/dashboard/produits',        label: 'Produits',        icon: '◉',  color: '#EC4899', grad: 'linear-gradient(135deg,#EC4899,#DB2777)' },
  { href: '/dashboard/stock',           label: 'Stock',           icon: '⬡',  color: '#A78BFA', grad: 'linear-gradient(135deg,#A78BFA,#8B5CF6)' },
  { href: '/dashboard/livraisons',      label: 'Livraisons',      icon: '▷',  color: '#38BDF8', grad: 'linear-gradient(135deg,#38BDF8,#0EA5E9)' },
  { href: '/dashboard/rapports',        label: 'Rapports',        icon: '▦',  color: '#34D399', grad: 'linear-gradient(135deg,#34D399,#10B981)' },
  { href: '/dashboard/factures',        label: 'Factures',        icon: '▤',  color: '#6EE7B7', grad: 'linear-gradient(135deg,#6EE7B7,#34D399)' },
  { href: '/dashboard/import',          label: 'Sync Shopify',    icon: '⚡', color: '#FCD34D', grad: 'linear-gradient(135deg,#FCD34D,#F59E0B)' },
  { href: '/dashboard/import-produits', label: 'Import Produits', icon: '↓',  color: '#67E8F9', grad: 'linear-gradient(135deg,#67E8F9,#22D3EE)' },
  { href: '/dashboard/flex',            label: 'Mes Stats',       icon: '◎',  color: '#86EFAC', grad: 'linear-gradient(135deg,#86EFAC,#4ADE80)' },
  { href: '/dashboard/affiliation',     label: 'Affiliation',     icon: '⬡',  color: '#C4B5FD', grad: 'linear-gradient(135deg,#C4B5FD,#A78BFA)' },
  { href: '/dashboard/abonnement',      label: 'Abonnement',      icon: '◈',  color: '#F9A8D4', grad: 'linear-gradient(135deg,#F9A8D4,#F472B6)' },
  { href: '/dashboard/parametres',      label: 'Paramètres',      icon: '◌',  color: '#94A3B8', grad: 'linear-gradient(135deg,#94A3B8,#64748B)' },
]

const PLAN_CFG: Record<string, any> = {
  starter:  { label: 'Starter',  color: '#F59E0B', bg: 'rgba(245,158,11,.15)',  glow: '0 0 12px rgba(245,158,11,.3)' },
  business: { label: 'Business', color: '#818CF8', bg: 'rgba(129,140,248,.15)', glow: '0 0 12px rgba(129,140,248,.3)' },
  elite:    { label: 'Elite',    color: '#34D399', bg: 'rgba(52,211,153,.15)',   glow: '0 0 12px rgba(52,211,153,.3)' },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [boutique, setBoutique] = useState('Ma Boutique')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<string | null>(null)
  const [notifs, setNotifs] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
      const { data: p } = await supabase.from('profiles').select('nom_boutique,plan,plan_expires').eq('id', user.id).single()
      if (p) {
        setBoutique(p.nom_boutique || 'Ma Boutique')
        const actif = p.plan && p.plan !== 'aucun' && p.plan_expires && new Date(p.plan_expires) > new Date()
        setPlan(actif ? p.plan : null)
      }
      const { data: n } = await supabase.from('notifications_user').select('*').eq('user_id', user.id).eq('lu', false).order('created_at', { ascending: false }).limit(10)
      setNotifs(n || [])
      setLoading(false)
      supabase.channel('notifs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications_user' }, p => setNotifs(prev => [p.new as any, ...prev])).subscribe()
    }
    init()
  }, [])

  async function marquerLu(id: string) {
    await supabase.from('notifications_user').update({ lu: true }).eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }
  async function logout() { await supabase.auth.signOut(); router.push('/login') }

  const currentPage = NAV.find(n => n.href === pathname || (n.href !== '/dashboard' && pathname.startsWith(n.href)))
  const planCfg = plan ? PLAN_CFG[plan] : null
  const initials = boutique.slice(0, 2).toUpperCase()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, border: '3px solid #818CF8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F8', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', display: 'flex' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#F0F2F8;}
        a{text-decoration:none;}
        .nav-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;cursor:pointer;text-decoration:none;transition:all .18s;position:relative;overflow:hidden;}
        .nav-item .label{font-size:13px;font-weight:500;color:#64748B;transition:color .18s;}
        .nav-item:hover .label{color:#1E293B;}
        .nav-item.active .label{color:#fff;font-weight:700;}
        .mob-item{display:flex;align-items:center;gap:14px;padding:14px 20px;font-size:15px;font-weight:500;color:#374151;text-decoration:none;border-bottom:1px solid #F1F5F9;transition:background .1s;}
        .mob-item:hover{background:#F8F7FF;}
        .mob-item.active{background:linear-gradient(135deg,#818CF815,#6366F108);color:#4F46E5;font-weight:700;}
        @media(min-width:768px){.mob-header{display:none!important;}.sidebar{display:flex!important;}.main-area{margin-left:220px!important;}}
        @media(max-width:767px){.sidebar{display:none!important;}.mob-header{display:flex!important;}.main-area{margin-left:0!important;padding-top:56px!important;}}
      `}</style>

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="sidebar" style={{
        width: 220,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        background: '#0F0F1A',
        display: 'none', flexDirection: 'column',
        padding: '20px 12px 16px',
        overflowY: 'auto',
      }}>
        {/* Déco fond */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle,rgba(129,140,248,.12),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 40, left: -40, width: 150, height: 150, background: 'radial-gradient(circle,rgba(52,211,153,.06),transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', marginBottom: 20, position: 'relative' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#818CF8,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(129,140,248,.4)', flexShrink: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 19, color: '#fff', letterSpacing: -.5 }}>Dropzi</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', letterSpacing: '.06em' }}>DASHBOARD</div>
          </div>
        </div>

        {/* Profil card */}
        <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '12px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: planCfg ? planCfg.color : 'linear-gradient(90deg,#818CF8,#34D399)', opacity: .8 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: planCfg ? planCfg.bg : 'rgba(255,255,255,.08)', border: `1px solid ${planCfg ? planCfg.color + '40' : 'rgba(255,255,255,.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: planCfg ? planCfg.color : '#818CF8', flexShrink: 0, boxShadow: planCfg ? planCfg.glow : 'none' }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{boutique}</p>
              {planCfg ? (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: planCfg.bg, color: planCfg.color, boxShadow: planCfg.glow }}>
                  ✦ {planCfg.label}
                </span>
              ) : (
                <Link href="/dashboard/abonnement" style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: 'rgba(239,68,68,.15)', color: '#FCA5A5' }}>
                  ⚠ Activer
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Section label */}
        <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.2)', textTransform: 'uppercase', letterSpacing: '.12em', padding: '0 8px', marginBottom: 8 }}>Menu principal</p>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const isHov = hovered === item.href
            return (
              <Link key={item.href} href={item.href} className={`nav-item${active ? ' active' : ''}`}
                onMouseEnter={() => setHovered(item.href)}
                onMouseLeave={() => setHovered(null)}
                style={{ background: active ? item.grad : isHov ? 'rgba(255,255,255,.06)' : 'transparent', boxShadow: active ? `0 4px 16px ${item.color}30` : 'none' }}>
                {/* Shimmer on active */}
                {active && <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent)', animation: 'shimmer 2s infinite' }} />}
                <div style={{ width: 28, height: 28, borderRadius: 8, background: active ? 'rgba(255,255,255,.2)' : isHov ? item.color + '15' : 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: active ? '#fff' : item.color, flexShrink: 0, transition: 'all .18s' }}>
                  {item.icon}
                </div>
                <span className="label">{item.label}</span>
                {active && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,.8)', flexShrink: 0 }} />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onClick={() => setShowNotifs(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 12, border: 'none', background: showNotifs ? 'rgba(255,255,255,.08)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: notifs.length > 0 ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, position: 'relative', flexShrink: 0 }}>
              🔔
              {notifs.length > 0 && <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#EF4444', borderRadius: '50%', border: '2px solid #0F0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}><span style={{ fontSize: 8, color: '#fff', fontWeight: 800 }}>{notifs.length}</span></div>}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>Notifications</span>
            {notifs.length > 0 && <span style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 7px' }}>{notifs.length}</span>}
          </button>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🚪</div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', fontWeight: 500 }}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ══════════ MOBILE HEADER ══════════ */}
      <header className="mob-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 56, padding: '0 14px',
        background: '#0F0F1A',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,.2)',
        alignItems: 'center', justifyContent: 'space-between', gap: 10, display: 'none',
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#818CF8,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(129,140,248,.4)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, color: '#fff', letterSpacing: -.3 }}>Dropzi</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: currentPage ? currentPage.grad : 'rgba(255,255,255,.08)', padding: '5px 12px', borderRadius: 20, flex: 1, maxWidth: 160, justifyContent: 'center' }}>
          <span style={{ fontSize: 13 }}>{currentPage?.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentPage?.label || 'Accueil'}</span>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => setShowNotifs(v => !v)} style={{ position: 'relative', background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>
            🔔
            {notifs.length > 0 && <div style={{ position: 'absolute', top: 3, right: 3, width: 14, height: 14, background: '#EF4444', borderRadius: '50%', border: '2px solid #0F0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}><span style={{ fontSize: 7, color: '#fff', fontWeight: 800 }}>{notifs.length}</span></div>}
          </button>
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: menuOpen ? 'rgba(129,140,248,.2)' : 'rgba(255,255,255,.08)', border: `1px solid ${menuOpen ? 'rgba(129,140,248,.4)' : 'rgba(255,255,255,.1)'}`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#fff' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* ══════════ MENU MOBILE ══════════ */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 49, background: '#0F0F1A', maxHeight: 'calc(100vh - 56px)', overflowY: 'auto', animation: 'slideDown .2s ease', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            {/* Profil */}
            <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: planCfg ? planCfg.bg : 'rgba(129,140,248,.15)', border: `1px solid ${planCfg ? planCfg.color + '40' : 'rgba(129,140,248,.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: planCfg ? planCfg.color : '#818CF8', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{boutique}</p>
                {planCfg ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: planCfg.bg, color: planCfg.color }}>✦ {planCfg.label}</span>
                ) : (
                  <Link href="/dashboard/abonnement" onClick={() => setMenuOpen(false)} style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: 'rgba(239,68,68,.15)', color: '#FCA5A5' }}>⚠ Activer un plan</Link>
                )}
              </div>
            </div>

            {/* Items */}
            {NAV.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`mob-item${active ? ' active' : ''}`}
                  style={{ background: active ? item.grad : 'transparent', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? 'rgba(255,255,255,.2)' : item.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: active ? '#fff' : item.color, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <span style={{ flex: 1, color: active ? '#fff' : 'rgba(255,255,255,.6)', fontWeight: active ? 700 : 400 }}>{item.label}</span>
                  {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,.8)' }} />}
                </Link>
              )
            })}

            <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '8px 0' }}>
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'rgba(255,255,255,.35)', fontSize: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚪</div>
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════ NOTIFICATIONS ══════════ */}
      {showNotifs && (
        <>
          <div onClick={() => setShowNotifs(false)} style={{ position: 'fixed', inset: 0, zIndex: 44 }} />
          <div style={{ position: 'fixed', top: 64, right: 16, width: 340, maxWidth: 'calc(100vw - 32px)', background: '#161625', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,.4)', zIndex: 45, overflow: 'hidden', animation: 'slideDown .2s ease' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>🔔 Notifications</p>
              {notifs.length > 0 && <button onClick={() => notifs.forEach(n => marquerLu(n.id))} style={{ fontSize: 12, color: '#818CF8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Tout lire</button>}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifs.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>✅</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>Aucune notification</p>
                </div>
              ) : notifs.map(n => {
                const c = n.type === 'success' ? '#34D399' : n.type === 'warning' ? '#F59E0B' : '#818CF8'
                return (
                  <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', gap: 10 }}>
                    <div style={{ width: 3, borderRadius: 4, background: c, flexShrink: 0, minHeight: 36 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{n.titre}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.5 }}>{n.message}</p>
                    </div>
                    <button onClick={() => marquerLu(n.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.2)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ══════════ CONTENU PRINCIPAL ══════════ */}
      <main className="main-area" style={{ flex: 1, marginLeft: 0, minHeight: '100vh' }}>
        <div style={{ padding: '28px 24px 80px', maxWidth: 820, margin: '0 auto' }}>
          <WizardOnboarding />
          <BackgroundSync />
          {children}
        </div>
      </main>
    </div>
  )
}
