'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data, error } = await supabase
        .from('admins')
        .select('id, email')
        .eq('id', user.id)
        .maybeSingle()

      if (error || !data) {
        router.push('/dashboard')
        return
      }

      setAdminEmail(user.email || '')
      setAllowed(true)
      setChecking(false)
    }
    check()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '2px solid #7F77DD', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>Vérification admin...</p>
      </div>
    </div>
  )

  if (!allowed) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080818', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <aside style={{ width: 240, background: '#050510', borderRight: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', padding: 20, minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#7F77DD,#534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(127,119,221,.4)', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/></svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>Dropzi</div>
            <div style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: 'rgba(127,119,221,.2)', color: '#AFA9EC', display: 'inline-block' }}>ADMIN</div>
          </div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {nav.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', fontSize: 14, transition: 'all .2s',
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
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminEmail}</div>
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
