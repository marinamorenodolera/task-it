'use client'

import { useState } from 'react'
import InboxCapture from '@/components/features/inbox/InboxCapture'
import InboxList from '@/components/features/inbox/InboxList'
import InboxStats from '@/components/features/inbox/InboxStats'
import GTDProcessor from '@/components/features/inbox/GTDProcessor'
import type { GTDDecision } from '@/components/features/inbox/GTDProcessor'

type Urgency = 'low' | 'medium' | 'high'
type Priority = 'low' | 'medium' | 'high'

type InboxItem = {
  id: string
  title: string
  description: string
  created_at: string
  is_processed: boolean
  suggested_context: string
  suggested_urgency: Urgency
  is_actionable: boolean
  priority: Priority
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([
    // Mock data for testing
    {
      id: '1',
      title: 'Llamar a cliente sobre propuesta',
      description: 'Revisar detalles del proyecto y discutir timeline',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      is_processed: false,
      suggested_context: '@calls',
      suggested_urgency: 'high' as const,
      is_actionable: true,
      priority: 'high' as const
    },
    {
      id: '2',
      title: 'Comprar leche y pan',
      description: '',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      is_processed: false,
      suggested_context: '@errands',
      suggested_urgency: 'low' as const,
      is_actionable: true,
      priority: 'low' as const
    },
    {
      id: '3',
      title: 'Artículo interesante sobre IA',
      description: 'Link a artículo sobre nuevas tendencias en machine learning',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      is_processed: false,
      suggested_context: '@computer',
      suggested_urgency: 'low' as const,
      is_actionable: false,
      priority: 'low' as const
    },
    {
      id: '4',
      title: 'Enviar reporte mensual',
      description: 'Preparar y enviar reporte de progreso a jefe',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      is_processed: true,
      suggested_context: '@computer',
      suggested_urgency: 'medium' as const,
      is_actionable: true,
      priority: 'medium' as const
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [showGTDProcessor, setShowGTDProcessor] = useState(false)
  const [processingItemId, setProcessingItemId] = useState<string | null>(null)

  const handleAddItem = async (title: string, metadata?: { urgency?: 'low' | 'medium' | 'high', context?: string }) => {
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newItem = {
        id: Date.now().toString(),
        title,
        description: '',
        created_at: new Date().toISOString(),
        is_processed: false,
        suggested_context: metadata?.context || '@computer',
        suggested_urgency: metadata?.urgency || 'medium',
        is_actionable: true, // Smart detection would determine this
        priority: metadata?.urgency || 'medium'
      }
      
      setItems(prev => [newItem, ...prev])
      console.log('✅ Item captured:', title, metadata)
    } catch (error) {
      console.error('❌ Error capturing item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessItem = async (itemId: string, action: string, autoDecision?: any) => {
    setIsLoading(true)
    
    try {
      console.log('🔄 Processing item:', itemId, action, autoDecision)
      
      if (action === 'gtd_process') {
        // Open GTD processor modal
        setProcessingItemId(itemId)
        setShowGTDProcessor(true)
        setIsLoading(false)
        return
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (action === 'auto_process' && autoDecision) {
        // Auto-process with provided decision
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, is_processed: true }
            : item
        ))
        console.log('✅ Auto-processed:', itemId, autoDecision)
      } else if (action === 'mark_done') {
        // Mark as completed
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, is_processed: true }
            : item
        ))
        console.log('✅ Marked as done:', itemId)
      } else if (action === 'archive') {
        // Archive item
        setItems(prev => prev.filter(item => item.id !== itemId))
        console.log('🗄️ Archived:', itemId)
      } else if (action === 'delete') {
        // Delete item
        setItems(prev => prev.filter(item => item.id !== itemId))
        console.log('🗑️ Deleted:', itemId)
      }
    } catch (error) {
      console.error('❌ Error processing item:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleGTDProcessComplete = (taskId: string, decision: GTDDecision) => {
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(async () => {
      try {
        // Update item based on GTD decision
        setItems(prev => prev.map(item => 
          item.id === taskId 
            ? { ...item, is_processed: true }
            : item
        ))
        
        console.log('✅ GTD Processing completed:', taskId, decision)
        
        // Close processor
        setShowGTDProcessor(false)
        setProcessingItemId(null)
      } catch (error) {
        console.error('❌ Error completing GTD processing:', error)
      } finally {
        setIsLoading(false)
      }
    }, 500)
  }
  
  const unprocessedItems = items.filter(item => !item.is_processed)
  const processedCount = items.filter(item => item.is_processed).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-4xl">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            📥 Inbox
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Captura y procesa todas tus ideas con metodología GTD
          </p>
        </header>

        {/* Quick Stats */}
        <InboxStats 
          totalItems={items.length}
          processedToday={processedCount}
          className="mb-6 sm:mb-8"
        />

        {/* Capture Section */}
        <InboxCapture 
          onAddItem={handleAddItem}
          isLoading={isLoading}
          className="mb-6 sm:mb-8"
        />

        {/* Items List */}
        <InboxList 
          items={items}
          onProcessItem={handleProcessItem}
          isLoading={isLoading}
        />
        
        {/* GTD Processor Modal */}
        {showGTDProcessor && (
          <GTDProcessor 
            tasks={unprocessedItems.filter(item => item.id === processingItemId)}
            onProcessTask={handleGTDProcessComplete}
            className="fixed inset-0 z-50"
          />
        )}
      </div>
    </div>
  )
}