'use client'

import { useAuth } from '@/hooks/useAuth'
import AuthScreen from '@/components/auth/AuthScreen'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()

  console.log('🛡️ AuthGuard - Estado:', { user: !!user, loading })

  // Show loading while authentication is being checked
  if (loading) {
    console.log('⏳ AuthGuard - Mostrando loading state')
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
    console.log('❌ AuthGuard - Sin usuario, mostrando AuthScreen')
    return <AuthScreen />
  }

  console.log('✅ AuthGuard - Usuario autenticado, mostrando app protegida')
  // User is authenticated, show the protected content
  return <>{children}</>
}