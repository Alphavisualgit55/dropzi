'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function BackgroundSync() {
  const supabase = createClient()

  useEffect(() => {
    let sw: ServiceWorker | null = null

    async function init() {
      // Récupérer user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer config sync
      const { data: config } = await supabase
        .from('sync_config')
        .select('*')
        .eq('user_id', user.id)
        .eq('actif', true)
        .single()

      if (!config) return

      // Envoyer config au service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        sw = navigator.serviceWorker.controller
        sw.postMessage({
          type: 'START_SYNC',
          config: {
            user_id: user.id,
            sheet_url: config.sheet_url,
            zone_id: config.zone_id,
            actif: true,
          }
        })
      }

      // Écouter les messages du service worker
      navigator.serviceWorker.addEventListener('message', handleMessage)

      // Répondre aux demandes de config du SW
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'GET_SYNC_CONFIG') {
          navigator.serviceWorker.controller?.postMessage({
            type: 'SYNC_CONFIG',
            config: {
              user_id: user.id,
              sheet_url: config.sheet_url,
              zone_id: config.zone_id,
              actif: true,
            }
          })
        }
      })
    }

    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'NEW_ORDERS') {
        // Déclencher un refresh des commandes via un custom event
        window.dispatchEvent(new CustomEvent('dropzi:new_orders', { detail: { count: e.data.count } }))
        // Toast notification
        window.dispatchEvent(new CustomEvent('dropzi:toast', {
          detail: {
            titre: `📦 ${e.data.count} nouvelle${e.data.count > 1 ? 's' : ''} commande${e.data.count > 1 ? 's' : ''} !`,
            message: 'Importées automatiquement depuis Easy Sell.',
            type: 'success'
          }
        }))
      }
    }

    init()

    return () => {
      // Stopper la sync si on quitte (optionnel — le SW continue en arrière-plan)
      navigator.serviceWorker?.controller?.postMessage({ type: 'KEEP_SYNC' })
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [])

  return null
}
