'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AuthScreen from '@/components/auth/AuthScreen'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, authLoading } = useAuth()

  // Development logging moved to useEffect to avoid re-render logs
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ AuthGuard - Estado:', { user: !!user, authLoading })
      if (authLoading) {
        console.log('⏳ AuthGuard - Mostrando loading state')
      } else if (!user) {
        console.log('❌ AuthGuard - Sin usuario, mostrando AuthScreen')
      } else {
        console.log('✅ AuthGuard - Usuario autenticado, mostrando app protegida')
      }
    }
  }, [user, authLoading])

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!user) {
    return <AuthScreen />
  }
  // User is authenticated, show the protected content
  return <>{children}</>
}