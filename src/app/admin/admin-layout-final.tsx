'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'alphadiagne902@gmail.com'

const nav = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Utilisateurs', icon: '👥' },
  { href: '/admin/subscriptions', label: 'Abonnements', icon: '💳' },
  { href: '/admin/stats', label: 'Statistiques', icon: '📈' },
  { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      if (user.email !== ADMIN_EMAIL) { router.push('/dashboard'); return }
      setReady(true)
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080818', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <aside style={{ width: 240, background: '#050510', borderRight: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', padding: 20, minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>Dropzi</div>
            <div style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: 'rgba(127,119,221,.2)', color: '#AFA9EC', display: 'inline-block' }}>ADMIN</div>
          </div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {nav.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', fontSize: 14,
              background: pathname === item.href ? 'rgba(127,119,221,.15)' : 'transparent',
              color: pathname === item.href ? '#fff' : 'rgba(255,255,255,.4)',
              fontWeight: pathname === item.href ? 600 : 400,
              borderLeft: pathname === item.href ? '2px solid #7F77DD' : '2px solid transparent',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 16, marginTop: 16 }}>
          <div style={{ padding: '0 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ADMIN_EMAIL}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7F77DD', marginTop: 2 }}>Super Admin</div>
          </div>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 28, overflowY: 'auto', color: '#fff' }}>{children}</main>
    </div>
  )
}
