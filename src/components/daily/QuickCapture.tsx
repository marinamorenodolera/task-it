'use client'

import { useState } from 'react'
import { TaskPriority, PRIORITY_CONFIG } from '@/types/task.types'
import { Plus } from 'lucide-react'

interface QuickCaptureProps {
  onAddTask: (title: string, priority: TaskPriority) => void
  className?: string
}

const QuickCapture = ({ onAddTask, className = '' }: QuickCaptureProps) => {
  const [input, setInput] = useState('')
  const [showPriorities, setShowPriorities] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const priorities = [
    PRIORITY_CONFIG.big3,
    PRIORITY_CONFIG.urgent,
    PRIORITY_CONFIG.important,
    PRIORITY_CONFIG.nice,
    PRIORITY_CONFIG.sport,
  ]

  const handleAddTask = async (priority: TaskPriority) => {
    if (!input.trim()) return
    
    setIsLoading(true)
    try {
      await onAddTask(input.trim(), priority)
      setInput('')
      setShowPriorities(false)
    } catch (error) {
      console.error('Error adding task:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) {
        handleAddTask('nice') // Default priority
      }
    }
  }

  const handleInputFocus = () => {
    setShowPriorities(true)
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Only hide if not clicking on a priority button
    if (!e.relatedTarget?.closest('[data-priority-button]')) {
      setTimeout(() => setShowPriorities(false), 150)
    }
  }

  return (
    <section className={`mb-6 sm:mb-8 ${className}`}>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
        📝 Quick Capture
      </h2>
      
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        {/* Input Field */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="¿Qué necesitas hacer hoy?"
            className={`
              flex-1 px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              placeholder:text-gray-500
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            disabled={isLoading}
            aria-label="Nueva tarea"
          />
          <button
            onClick={() => input.trim() && handleAddTask('nice')}
            disabled={!input.trim() || isLoading}
            className={`
              px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
              min-h-[44px] min-w-[44px] flex items-center justify-center
              transition-colors duration-150
              ${(!input.trim() || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label="Agregar tarea"
          >
            <Plus size={20} />
          </button>
        </div>
        
        {/* Priority Buttons */}
        {showPriorities && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
            {priorities.map((priority) => (
              <button
                key={priority.id}
                data-priority-button
                className={`
                  flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200
                  hover:border-blue-500 transition-colors min-h-[44px]
                  active:scale-95 duration-150
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => handleAddTask(priority.id as TaskPriority)}
                disabled={!input.trim() || isLoading}
                aria-label={`Agregar como ${priority.label}`}
              >
                <span className="text-lg" role="img" aria-hidden="true">
                  {priority.icon}
                </span>
                <span className="text-xs sm:text-sm font-medium truncate">
                  {priority.label}
                </span>
              </button>
            ))}
          </div>
        )}
        
        {/* Help Text */}
        {showPriorities && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> Presiona Enter para agregar como &quot;Nice to Have&quot; 
              o selecciona una prioridad específica.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default QuickCapture