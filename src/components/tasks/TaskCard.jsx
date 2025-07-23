import React, { useState } from 'react'
import BaseCard from '../ui/BaseCard'
import { Circle, CircleCheck } from 'lucide-react'
import { useGestures } from '@/hooks/useGestures'

const TaskCard = ({ task, onClick, onComplete, onEdit, onToggleImportant, onReorder }) => {
  const [isBeingReordered, setIsBeingReordered] = useState(false)
  const [checkboxPressed, setCheckboxPressed] = useState(false)
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useGestures()
  const hasAdditionalContent = () => {
    return (task.attachments && task.attachments.length > 0) || 
           (task.notes && task.notes.trim()) || 
           (task.deadline)
  }

  const formatTaskDeadline = (deadlineISO) => {
    if (!deadlineISO) return null
    
    const deadlineDate = new Date(deadlineISO)
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    
    if (deadlineDate.toDateString() === today.toDateString()) return 'Hoy'
    if (deadlineDate.toDateString() === tomorrow.toDateString()) return 'Mañana'
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    return `${dayNames[deadlineDate.getDay()]} ${deadlineDate.getDate()} ${monthNames[deadlineDate.getMonth()]}`
  }

  const handleLongPress = () => {
    setIsBeingReordered(true)
    if (onReorder) {
      onReorder(task.id, 'start')
    }
  }

  const handleSwipeRight = () => {
    if (onClick) {
      onClick()
    }
  }

  const handleTap = () => {
    if (!isBeingReordered && onClick) {
      onClick()
    }
  }

  const handleCardClick = () => {
    if (!isBeingReordered && !checkboxPressed && onClick) {
      onClick()
    }
  }

  return (
    <BaseCard
      variant="interactive"
      onClick={handleCardClick}
      className={`p-3 transition-all duration-200 ease-out ${
        task.justCompleted 
          ? 'opacity-90' 
          : 'opacity-100'
      } ${
        task.completed 
          ? 'border-green-200 bg-green-50' 
          : 'hover:border-purple-200 bg-white'
      } ${isBeingReordered ? 'shadow-lg scale-105' : ''}`}
      onTouchStart={(e) => handleTouchStart(e, handleLongPress)}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => handleTouchEnd(e, handleSwipeRight, null, handleTap)}
    >
      <div className="flex items-center gap-3">
        <button 
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setCheckboxPressed(true)
            onComplete(task.id)
            setTimeout(() => setCheckboxPressed(false), 100)
          }}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            setCheckboxPressed(true)
            setTimeout(() => setCheckboxPressed(false), 100)
          }}
          className={`transition-colors ${
            task.completed ? 'text-green-500' : 'text-gray-400 hover:text-purple-500'
          }`}
        >
          {task.completed ? 
            <CircleCheck size={18} style={{ pointerEvents: 'none' }} /> : 
            <Circle size={18} style={{ pointerEvents: 'none' }} />
          }
        </button>
        
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={`text-sm font-medium transition-all duration-300 ${
            task.completed 
              ? 'text-green-700 line-through' 
              : 'text-gray-900'
          }`}>
            {task.title}
          </span>
          
          {/* Indicador de contenido adicional */}
          {hasAdditionalContent() && (
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" title="Tiene contenido adicional"></div>
          )}
          
          {/* Badge de deadline */}
          {task.deadline && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full flex-shrink-0">
              📅 {task.deadlineDisplay || formatTaskDeadline(task.deadline)}
            </span>
          )}
          
          {/* Contador de adjuntos */}
          {task.attachments && task.attachments.length > 0 && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full flex-shrink-0">
              📎 {task.attachments.length}
            </span>
          )}

          {/* Badge de amount */}
          {task.amount && (
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex-shrink-0">
              💰 {task.amount}€
            </span>
          )}

        </div>
        
        {/* Botón para marcar como Big 3 (solo en tareas no importantes) */}
        {!task.important && onToggleImportant && (
          <button
            onPointerDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onToggleImportant(task.id)
            }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
            }}
            className="text-gray-400 hover:text-yellow-500 transition-colors"
            title="Marcar como Big 3"
          >
            <span style={{ pointerEvents: 'none' }}>⭐</span>
          </button>
        )}
        
        {/* Botón de expandir si hay subtareas */}
        {task.subtasks && task.subtasks.length > 0 && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              // Toggle expand logic - handled by parent component
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span style={{ pointerEvents: 'none' }}>⌄</span>
          </button>
        )}
      </div>
    </BaseCard>
  )
}

export default TaskCard