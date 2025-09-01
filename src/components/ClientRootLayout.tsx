'use client'

import { useEffect } from 'react'
import { AuthProvider } from '@/hooks/useAuth'
import AuthGuard from '@/components/auth/AuthGuard'
import BottomNavigation from '@/components/ui/BottomNavigation'
import { NavigationProvider, useNavigation } from '@/hooks/useNavigation'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt'

interface ClientRootLayoutProps {
  children: React.ReactNode
}

function BottomNavigationWrapper() {
  const { navigateToDaily } = useNavigation()
  return <BottomNavigation />
}

export default function ClientRootLayout({ children }: ClientRootLayoutProps) {
  useEffect(() => {
    // Global error handlers
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      event.preventDefault()
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <AuthProvider>
      <NavigationProvider>
        <AuthGuard>
          <div className="min-h-screen pb-24">
            {children}
          </div>
          <BottomNavigationWrapper />
          <PWAUpdatePrompt />
        </AuthGuard>
      </NavigationProvider>
    </AuthProvider>
  )
}