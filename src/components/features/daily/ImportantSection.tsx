'use client'

import { useState } from 'react'
import { CheckCircle, Clock, AlertCircle, Flag, MoreVertical } from 'lucide-react'

interface ImportantTask {
  id: string
  title: string
  description?: string
  priority: 'urgent' | 'important' | 'big3'
  status: 'pending' | 'in_progress' | 'completed'
  due_date?: string
  context?: string
  estimated_minutes?: number
}

interface ImportantSectionProps {
  tasks: ImportantTask[]
  onToggleTask: (taskId: string) => void
  onUpdateTask: (taskId: string, updates: Partial<ImportantTask>) => void
  className?: string
}

export default function ImportantSection({
  tasks,
  onToggleTask,
  onUpdateTask,
  className = ''
}: ImportantSectionProps) {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'important' | 'big3'>('all')

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.priority === filter
  })

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: '🔥 Urgente'
        }
      case 'important':
        return {
          icon: Flag,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          label: '⚡ Importante'
        }
      case 'big3':
        return {
          icon: Flag,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: '⭐ Big 3'
        }
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: '📝 Normal'
        }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'in_progress': return Clock
      default: return Clock
    }
  }

  const filters = [
    { id: 'all', label: 'Todas', count: tasks.length },
    { id: 'urgent', label: 'Urgentes', count: tasks.filter(t => t.priority === 'urgent').length },
    { id: 'important', label: 'Importantes', count: tasks.filter(t => t.priority === 'important').length },
    { id: 'big3', label: 'Big 3', count: tasks.filter(t => t.priority === 'big3').length }
  ]

  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🎯 Importantes
        </h3>
        <div className="text-sm text-gray-500">
          {filteredTasks.length} tareas
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map((filterOption) => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id as any)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors touch-target ${
              filter === filterOption.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterOption.label}
            {filterOption.count > 0 && (
              <span className="ml-1 opacity-80">({filterOption.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">✨</div>
            <div className="text-sm text-gray-600">
              No hay tareas importantes para hoy
            </div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const priorityConfig = getPriorityConfig(task.priority)
            const StatusIcon = getStatusIcon(task.status)
            const PriorityIcon = priorityConfig.icon
            
            return (
              <div
                key={task.id}
                className={`${priorityConfig.bg} ${priorityConfig.border} rounded-xl p-3 border-2 hover:border-opacity-80 transition-all duration-200`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Toggle */}
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 p-1 rounded-lg transition-colors touch-target ${
                      task.status === 'completed'
                        ? 'text-green-600 hover:text-green-700'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <StatusIcon size={18} />
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${
                        task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </span>
                      <PriorityIcon size={14} className={priorityConfig.color} />
                    </div>
                    
                    {task.description && (
                      <div className="text-xs text-gray-600 mb-2">
                        {task.description}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {task.context && (
                        <span className="px-2 py-0.5 bg-white rounded-lg">
                          {task.context}
                        </span>
                      )}
                      {task.estimated_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {task.estimated_minutes}m
                        </span>
                      )}
                      {task.due_date && (
                        <span>
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {/* Open task details */}}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors touch-target"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}