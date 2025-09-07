'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Loading component for attachments panel
const LoadingAttachments = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
      <div className="text-center">
        <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600">Cargando adjuntos...</p>
      </div>
    </div>
  </div>
)

// Dynamic import for SmartAttachmentsPanel
const DynamicSmartAttachmentsPanel = dynamic(
  () => import('@/components/attachments/SmartAttachmentsPanel'),
  {
    loading: LoadingAttachments,
    ssr: false,
  }
) as ComponentType<any>

export default DynamicSmartAttachmentsPanel