import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientRootLayout from '@/components/ClientRootLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Task-it - Free to Focus',
  description: 'Productividad inteligente con metodología GTD + Eisenhower Matrix',
  manifest: '/manifest.json',
  icons: {
    apple: '/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Task-it',
  },
  other: {
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-navbutton-color': '#ffffff',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <ClientRootLayout>
          {children}
        </ClientRootLayout>
      </body>
    </html>
  )
}