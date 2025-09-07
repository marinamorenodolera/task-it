'use client'

import { useEffect } from 'react'
import { AuthProvider } from '@/hooks/useAuth'
import AuthGuard from '@/components/auth/AuthGuard'
import BottomNavigation from '@/components/ui/BottomNavigation'
import { NavigationProvider, useNavigation } from '@/hooks/useNavigation'

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

    // Unregister any existing service workers
    const unregisterServiceWorkers = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            console.log('Unregistering service worker:', registration.scope)
            await registration.unregister()
          }
          console.log('All service workers unregistered')
        } catch (error) {
          console.error('Error unregistering service workers:', error)
        }
      }
    }

    unregisterServiceWorkers()
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
        </AuthGuard>
      </NavigationProvider>
    </AuthProvider>
  )
}