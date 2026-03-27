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
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('admins').select('*').eq('id', user.id).single()
      if (!data) { router.push('/dashboard'); return }
      setAdminEmail(user.email || '')
      setChecking(false)
    }
    check()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (checking) return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#080818]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#050510] border-r border-white/5 flex flex-col p-5 min-h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7F77DD,#534AB7)', boxShadow: '0 0 16px rgba(127,119,221,.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 5L12 3L21 5L19 15L12 20L5 15Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-lg" style={{ fontFamily: 'Georgia,serif', letterSpacing: -0.5 }}>Dropzi</div>
            <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(127,119,221,.2)', color: '#AFA9EC' }}>ADMIN</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {nav.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                pathname === item.href
                  ? 'text-white font-medium'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
              style={pathname === item.href ? { background: 'linear-gradient(135deg,rgba(127,119,221,.2),rgba(83,74,183,.1))', borderLeft: '2px solid #7F77DD' } : {}}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 pt-4 mt-4">
          <div className="px-3 mb-2">
            <div className="text-xs text-gray-500 truncate">{adminEmail}</div>
            <div className="text-xs font-medium text-[#7F77DD]">Super Admin</div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-all">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
