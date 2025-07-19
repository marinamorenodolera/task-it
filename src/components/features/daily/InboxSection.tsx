'use client'

import { useState } from 'react'
import { ArrowRight, Plus, MoreVertical } from 'lucide-react'

interface InboxItem {
  id: string
  title: string
  created_at: string
  priority: 'low' | 'medium' | 'high'
  suggested_context?: string
}

interface InboxSectionProps {
  items: InboxItem[]
  onProcessItem: (itemId: string) => void
  onAddItem: () => void
  className?: string
}

export default function InboxSection({
  items,
  onProcessItem,
  onAddItem,
  className = ''
}: InboxSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border-2 border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            📥 Inbox
          </h3>
          <button
            onClick={onAddItem}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors touch-target"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎉</div>
          <div className="text-sm text-gray-600">
            ¡Inbox vacío! Todo procesado
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📥 Inbox
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {items.length} sin procesar
          </span>
          <button
            onClick={onAddItem}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors touch-target"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-blue-200 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
                
                {item.suggested_context && (
                  <div className="text-xs text-gray-500 mb-2">
                    Sugerido: {item.suggested_context}
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors touch-target"
                >
                  <MoreVertical size={16} />
                </button>
                
                <button
                  onClick={() => onProcessItem(item.id)}
                  className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors touch-target"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {items.length > 3 && (
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={() => {/* Navigate to full inbox */}}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2 rounded-xl hover:bg-blue-50 transition-colors touch-target"
            >
              Ver todos ({items.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}