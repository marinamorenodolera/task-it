'use client'

import { Task, PRIORITY_CONFIG } from '@/types/task.types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MoreVertical, Circle, CheckCircle2, Link, Clock } from 'lucide-react'

interface TaskCardProps {
  task: Task
  priorityIcon?: string
  showPriority?: boolean
  onComplete?: (taskId: string) => void
  onEdit?: (taskId: string) => void
  onSwipeLeft?: (taskId: string) => void
  onSwipeRight?: (taskId: string) => void
  className?: string
}

const TaskCard = ({ 
  task, 
  priorityIcon, 
  showPriority = false,
  onComplete,
  onEdit,
  onSwipeLeft,
  onSwipeRight,
  className = ''
}: TaskCardProps) => {
  
  const isCompleted = task.status === 'completed'
  const priority = task.daily_priority ? PRIORITY_CONFIG[task.daily_priority] : null
  
  const formatDeadline = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffInDays === 0) return 'Hoy'
      if (diffInDays === 1) return 'Mañana'
      if (diffInDays === -1) return 'Ayer'
      if (diffInDays < 0) return `Hace ${Math.abs(diffInDays)} días`
      if (diffInDays <= 7) return `En ${diffInDays} días`
      
      return format(date, 'MMM d', { locale: es })
    } catch {
      return dateString
    }
  }

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onComplete?.(task.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(task.id)
  }

  return (
    <div 
      className={`
        bg-transparent border-0 rounded-lg shadow-sm p-2 sm:p-3 min-h-[44px] cursor-pointer
        transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.005]
        ${isCompleted ? 'opacity-60' : ''}
        ${className}
      `}
      onClick={() => onEdit?.(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit?.(task.id)
        }
      }}
      aria-label={`Tarea: ${task.title}`}
    >
      <div className="flex items-center gap-2">
        {/* Complete Button */}
        <button 
          onClick={handleComplete}
          className={`
            transition-colors min-h-[44px] min-w-[44px] -ml-2
            flex items-center justify-center rounded-full
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${isCompleted 
              ? 'text-green-500 hover:text-green-600' 
              : 'text-gray-400 hover:text-green-500'
            }
          `}
          aria-label={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
        >
          {isCompleted ? (
            <CheckCircle2 size={20} className="fill-current" />
          ) : (
            <Circle size={20} />
          )}
        </button>
        
        {/* Priority Icon */}
        {showPriority && (priorityIcon || priority) && (
          <span 
            className={`text-lg flex-shrink-0 ${priority?.color || ''}`}
            role="img"
            aria-label={`Prioridad: ${priority?.label || 'Personalizada'}`}
          >
            {priorityIcon || priority?.icon}
          </span>
        )}
        
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`
            font-normal truncate text-sm sm:text-base
            ${isCompleted 
              ? 'line-through text-gray-500' 
              : 'text-gray-900'
            }
          `}>
            {task.title}
          </h3>
          
          {task.description && task.show_notes_preview && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">
              {task.description}
            </p>
          )}
          
          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Deadline */}
            {task.show_deadline && task.due_date && (
              <span className={`
                text-xs px-2 py-1 rounded 
                ${new Date(task.due_date) < new Date() 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-600 bg-gray-100'
                }
              `}>
                📅 {formatDeadline(task.due_date)}
              </span>
            )}
            
            {/* Project */}
            {task.show_project && task.project_id && (
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                📁 Proyecto
              </span>
            )}
            
            {/* Estimated Duration */}
            {task.show_duration && task.estimated_duration && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded flex items-center gap-1">
                <Clock size={10} />
                {task.estimated_duration}m
              </span>
            )}
            
            {/* Energy Level */}
            {task.show_energy && task.energy_level && (
              <span className={`
                text-xs px-2 py-1 rounded
                ${task.energy_level === 'high' ? 'bg-orange-50 text-orange-600' :
                  task.energy_level === 'medium' ? 'bg-cyan-50 text-cyan-600' :
                  'bg-gray-100 text-gray-600'
                }
              `}>
                ⚡ {task.energy_level === 'high' ? 'Alta' : 
                     task.energy_level === 'medium' ? 'Media' : 'Baja'}
              </span>
            )}
            
            {/* Link Indicator */}
            {task.links && task.links.length > 0 && (
              <span className="text-xs text-cyan-600" aria-label={`${task.links.length} enlaces`}>
                <Link size={12} />
              </span>
            )}
          </div>
        </div>
        
        {/* Actions Menu */}
        <button 
          onClick={handleEdit}
          className={`
            p-2 text-gray-400 hover:text-gray-700 
            transition-colors min-h-[44px] min-w-[44px] -mr-2
            flex items-center justify-center rounded
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          aria-label="Opciones de tarea"
        >
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  )
}

export default TaskCard