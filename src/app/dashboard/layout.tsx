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
  { href: '/dashboard/rapport-whatsapp', label: 'Rapports', icon: '📊', badge: 'WA' },
  { href: '/dashboard/parametres', label: 'Boutique', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profil, setProfil] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfil(data))
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#F8F8FC]">
      <aside className="hidden md:flex flex-col w-56 bg-[#0C0C1E] min-h-screen p-4">
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          {profil?.logo_url
            ? <img src={profil.logo_url} alt="Logo" className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
            : <div className="w-8 h-8 rounded-xl bg-[#7F77DD] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 5L12 3L21 5L19 15L12 20L5 15L3 5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M3 5L21 5" stroke="white" strokeWidth="1.5"/>
                </svg>
              </div>
          }
          <span className="text-white font-serif text-lg tracking-tight truncate">{profil?.nom_boutique || 'Dropzi'}</span>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                pathname === item.href ? 'bg-[#7F77DD] text-white font-medium' : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}>
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && <span className="bg-[#25D366] text-white text-xs px-1.5 py-0.5 rounded-full">{item.badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4 mt-4">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-6 pb-24 md:pb-6">{children}</div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50">
        {nav.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors relative ${
              pathname === item.href ? 'text-[#7F77DD] font-medium' : 'text-gray-400'
            }`}>
            <span className="text-lg">{item.icon}</span>
            {item.badge && <span className="absolute top-1 right-0.5 w-2 h-2 bg-[#25D366] rounded-full"/>}
          </Link>
        ))}
      </nav>
    </div>
  )
}
