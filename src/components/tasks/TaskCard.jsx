import React, { useState } from 'react'
import BaseCard from '../ui/BaseCard'
import { Circle, CircleCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { useGestures } from '@/hooks/useGestures'

const TaskCard = ({ task, onClick, onComplete, onEdit, onToggleImportant, onReorder, getSubtasks, onToggleTaskComplete, expandedTasks = [], onToggleExpanded }) => {
  const [isBeingReordered, setIsBeingReordered] = useState(false)
  const [checkboxPressed, setCheckboxPressed] = useState(false)
  
  // Calcular subtareas usando getSubtasks si está disponible
  const subtasks = getSubtasks ? getSubtasks(task.id) : []
  const hasSubtasks = subtasks.length > 0
  const isExpanded = expandedTasks.includes(task.id)
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
    <div>
      <div
        className={`flex items-center gap-3 p-3 bg-white rounded-lg border transition-all cursor-pointer ${
          task.justCompleted 
            ? 'opacity-90' 
            : 'opacity-100'
        } ${
          task.completed 
            ? 'border-green-200 bg-green-50' 
            : 'border-gray-200 hover:border-purple-200'
        } ${isBeingReordered ? 'shadow-lg scale-105' : ''}`}
        onClick={handleCardClick}
        onTouchStart={(e) => handleTouchStart(e, handleLongPress)}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => handleTouchEnd(e, handleSwipeRight, null, handleTap)}
      >
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
        {hasSubtasks && onToggleExpanded && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleExpanded(task.id)
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? 'Contraer subtareas' : 'Expandir subtareas'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      
      
      {/* Subtareas expandidas */}
      {isExpanded && hasSubtasks && (
        <div className="ml-6 mt-2 space-y-1">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onToggleTaskComplete) {
                    onToggleTaskComplete(subtask.id)
                  }
                }}
                className={`transition-colors ${
                  subtask.completed ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
                }`}
              >
                {subtask.completed ? <CircleCheck size={14} /> : <Circle size={14} />}
              </button>
              
              <span className={`text-xs flex-1 min-w-0 transition-all duration-300 ${
                subtask.completed 
                  ? 'text-green-700 line-through' 
                  : 'text-gray-700'
              }`}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TaskCard