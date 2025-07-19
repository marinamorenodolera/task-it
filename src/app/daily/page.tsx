'use client'

import { AuthProvider } from '@/hooks/useAuth'
import TaskItApp from '@/components/TaskItApp'

export default function DailyPage() {
  return (
    <AuthProvider>
      <TaskItApp />
    </AuthProvider>
  )
}