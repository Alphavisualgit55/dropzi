'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Utilisateurs', icon: '👥' },
  { href: '/admin/subscriptions', label: 'Abonnements', icon: '💳' },
  { href: '/admin/stats', label: 'Statistiques', icon: '📈' },
  { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    if (pathname === '/admin/login') { setReady(true); return }
    const isAdmin = localStorage.getItem('dropzi_admin')
    const email = localStorage.getItem('dropzi_admin_email')
    if (!isAdmin || isAdmin !== 'true') { router.push('/admin/login'); return }
    setAdminEmail(email || '')
    setReady(true)
  }, [pathname])

  function logout() {
    localStorage.removeItem('dropzi_admin')
    localStorage.removeItem('dropzi_admin_email')
    router.push('/admin/login')
  }

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: '#07070F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  if (pathname === '/admin/login') return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07070F', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color: '#fff' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}body{margin:0}*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}a{text-decoration:none}`}</style>
      <aside style={{ width: 230, background: '#0A0A16', borderRight: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', padding: '24px 12px', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(127,119,221,.3)', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: -.5 }}>Dropzi</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: .12, padding: '1px 7px', borderRadius: 20, background: 'rgba(127,119,221,.18)', color: '#9B96E8', display: 'inline-block', marginTop: 1 }}>ADMIN PANEL</div>
          </div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.2)', letterSpacing: '.14em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 8 }}>Menu</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,.38)', background: active ? 'rgba(127,119,221,.14)' : 'transparent', borderLeft: active ? '2px solid #7F77DD' : '2px solid transparent', transition: 'all .15s' }}>
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
                {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#7F77DD' }} />}
              </Link>
            )
          })}
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 14, marginTop: 14 }}>
          <div style={{ padding: '0 10px', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminEmail}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7F77DD', marginTop: 2 }}>Super Admin</div>
          </div>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(255,255,255,.25)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 14 }}>🚪</span> Déconnexion
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minHeight: '100vh' }}>{children}</main>
    </div>
  )
}
