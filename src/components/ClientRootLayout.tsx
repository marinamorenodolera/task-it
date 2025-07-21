'use client'

import { AuthProvider } from '@/hooks/useAuth'
import AuthGuard from '@/components/auth/AuthGuard'
import BottomNavigation from '@/components/ui/BottomNavigation'

interface ClientRootLayoutProps {
  children: React.ReactNode
}

export default function ClientRootLayout({ children }: ClientRootLayoutProps) {
  return (
    <AuthProvider>
      <AuthGuard>
        <div className="min-h-screen pb-20 md:pb-0">
          {children}
        </div>
        <BottomNavigation />
      </AuthGuard>
    </AuthProvider>
  )
}