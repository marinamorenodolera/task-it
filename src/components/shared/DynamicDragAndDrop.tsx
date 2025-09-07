'use client'

import dynamic from 'next/dynamic'
import { ComponentType, ReactNode } from 'react'

// Loading placeholder for drag and drop
const LoadingDragDrop = ({ children }: { children: ReactNode }) => (
  <div className="opacity-75">
    {children}
  </div>
)

// Dynamic DndContext wrapper
const DynamicDndContext = dynamic(
  () => import('@dnd-kit/core').then(mod => ({ default: mod.DndContext })),
  {
    loading: () => <LoadingDragDrop><div>Loading drag context...</div></LoadingDragDrop>,
    ssr: false,
  }
) as ComponentType<any>

// Dynamic SortableContext wrapper  
const DynamicSortableContext = dynamic(
  () => import('@dnd-kit/sortable').then(mod => ({ default: mod.SortableContext })),
  {
    loading: () => <LoadingDragDrop><div>Loading sortable context...</div></LoadingDragDrop>,
    ssr: false,
  }
) as ComponentType<any>

// Dynamic SortableTaskCard
const DynamicSortableTaskCard = dynamic(
  () => import('@/components/tasks/SortableTaskCard'),
  {
    loading: () => (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    ),
    ssr: false,
  }
) as ComponentType<any>

export { 
  DynamicDndContext,
  DynamicSortableContext, 
  DynamicSortableTaskCard 
}