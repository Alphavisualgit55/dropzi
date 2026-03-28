import type { Metadata } from 'next'
import './globals.css'
import TrackingScript from '@/components/TrackingScript'

export const metadata: Metadata = {
  title: 'Dropzi — Gérez. Livrez. Encaissez.',
  description: "L'outil e-commerce pensé pour l'Afrique",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <TrackingScript />
      </body>
    </html>
  )
}
