'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function TrackingScript() {
  const pathname = usePathname()

  useEffect(() => {
    // Ne pas tracker le panneau admin
    if (pathname?.startsWith('/admin')) return
    // Ne pas tracker le dashboard (utilisateurs connectés)
    if (pathname?.startsWith('/dashboard')) return

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: pathname,
        referrer: document.referrer || null,
      })
    }).catch(() => {})
  }, [pathname])

  return null
}
