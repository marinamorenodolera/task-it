'use client'

import dynamic from 'next/dynamic'

// Simple loading fallback
const SimpleLoading = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
)

// Task detail with very simple loading
export const DynamicTaskDetailScreen = dynamic(
  () => import('@/components/tasks/TaskDetailScreen'),
  {
    loading: () => (
      <div className="min-h-screen bg-white p-4">
        <SimpleLoading />
      </div>
    ),
    ssr: false,
  }
)

// Smart attachments with simple loading  
export const DynamicSmartAttachmentsPanel = dynamic(
  () => import('@/components/attachments/SmartAttachmentsPanel'),
  {
    loading: () => null, // Very minimal loading to avoid issues
    ssr: false,
  }
)

// Sortable task card with simple loading
export const DynamicSortableTaskCard = dynamic(
  () => import('@/components/tasks/SortableTaskCard'),
  {
    loading: () => <SimpleLoading />,
    ssr: false,
  }
)