import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dropzi — Gérez. Livrez. Encaissez.',
  description: 'Le SaaS e-commerce pensé pour l\'Afrique',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
