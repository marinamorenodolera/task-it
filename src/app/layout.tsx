import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNavigation from '@/components/ui/BottomNavigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Task-it - Free to Focus',
  description: 'Productividad inteligente con metodología GTD + Eisenhower Matrix',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  icons: {
    apple: '/icon-192x192.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <div className="min-h-screen pb-20 md:pb-0">
          {children}
        </div>
        <BottomNavigation />
      </body>
    </html>
  )
}