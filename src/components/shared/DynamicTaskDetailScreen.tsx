'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Loading component while TaskDetailScreen is being loaded
const LoadingTaskDetail = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando detalles...</p>
    </div>
  </div>
)

// Dynamic import with loading state
const DynamicTaskDetailScreen = dynamic(
  () => import('@/components/tasks/TaskDetailScreen'),
  {
    loading: LoadingTaskDetail,
    ssr: false, // Disable SSR for better performance
  }
) as ComponentType<any>

export default DynamicTaskDetailScreen