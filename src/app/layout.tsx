import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientRootLayout from '@/components/ClientRootLayout'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: false
})

export const metadata: Metadata = {
  title: 'Task-it - Free to Focus',
  description: 'Productividad inteligente con metodología GTD + Eisenhower Matrix',
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
        <ClientRootLayout>
          {children}
        </ClientRootLayout>
      </body>
    </html>
  )
}