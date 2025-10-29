import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Etheryte',
  description: 'Etheryte emerges as a standout in the realm of web3 marketplaces, securing its status as the primary and most extensive platform for NFTs and crypto collectibles. Engage with Etheryte to browse, design, acquire, exchange, and auction NFTs effortlessly.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="__className_ee270e">
      <body className={`${inter.className} relative min-h-[100dvh] text-charcoal`}>
        <AuthProvider>
          <div data-overlay-container="true">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}