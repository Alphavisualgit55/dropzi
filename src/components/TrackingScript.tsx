'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function TrackingScript() {
  const pathname = usePathname()
  const sessionId = useRef<string>('')

  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = sessionStorage.getItem('_dsid') || genId()
      sessionStorage.setItem('_dsid', sessionId.current)
    }
  }, [])

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return
    if (pathname?.startsWith('/dashboard')) return

    // Enregistrer la visite
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathname, referrer: document.referrer || null })
    }).catch(() => {})

    // Heartbeat toutes les 25 secondes
    const ping = () => {
      fetch('/api/track/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId.current, page: pathname })
      }).catch(() => {})
    }

    ping()
    const iv = setInterval(ping, 25000)
    return () => clearInterval(iv)
  }, [pathname])

  return null
}
