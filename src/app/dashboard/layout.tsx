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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles').select('nom_boutique').eq('id', user.id).single()
        .then(({ data }) => { if (data?.nom_boutique) setBoutique(data.nom_boutique) })
    })
  }, [])

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
          <span className="text-gray-400 text-sm truncate max-w-32">{boutique}</span>
        </div>

        <div className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
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
