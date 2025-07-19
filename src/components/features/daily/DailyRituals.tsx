'use client'

import { useState } from 'react'
import { CheckCircle, Clock, ChevronDown, ChevronUp, Plus } from 'lucide-react'

interface SubTask {
  id: string
  title: string
  completed: boolean
  estimated_minutes?: number
}

interface Ritual {
  id: string
  title: string
  description?: string
  completed: boolean
  subtasks: SubTask[]
  category: 'morning' | 'evening' | 'work' | 'personal'
  estimated_minutes?: number
}

interface DailyRitualsProps {
  rituals: Ritual[]
  onToggleRitual: (ritualId: string) => void
  onToggleSubtask: (ritualId: string, subtaskId: string) => void
  onAddRitual: () => void
  className?: string
}

export default function DailyRituals({
  rituals,
  onToggleRitual,
  onToggleSubtask,
  onAddRitual,
  className = ''
}: DailyRitualsProps) {
  const [expandedRituals, setExpandedRituals] = useState<Set<string>>(new Set())

  const toggleExpanded = (ritualId: string) => {
    const newExpanded = new Set(expandedRituals)
    if (newExpanded.has(ritualId)) {
      newExpanded.delete(ritualId)
    } else {
      newExpanded.add(ritualId)
    }
    setExpandedRituals(newExpanded)
  }

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'morning':
        return {
          icon: '🌅',
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          label: 'Mañana'
        }
      case 'evening':
        return {
          icon: '🌙',
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          label: 'Noche'
        }
      case 'work':
        return {
          icon: '💼',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Trabajo'
        }
      case 'personal':
        return {
          icon: '🏠',
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Personal'
        }
      default:
        return {
          icon: '📝',
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'General'
        }
    }
  }

  const getProgress = (ritual: Ritual) => {
    if (ritual.subtasks.length === 0) return ritual.completed ? 100 : 0
    const completedSubtasks = ritual.subtasks.filter(st => st.completed).length
    return Math.round((completedSubtasks / ritual.subtasks.length) * 100)
  }

  const groupedRituals = rituals.reduce((acc, ritual) => {
    const category = ritual.category
    if (!acc[category]) acc[category] = []
    acc[category].push(ritual)
    return acc
  }, {} as Record<string, Ritual[]>)

  const categoryOrder = ['morning', 'work', 'personal', 'evening']
  
  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🔄 Rituales Diarios
        </h3>
        <button
          onClick={onAddRitual}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors touch-target"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categoryOrder.map((category) => {
          const categoryRituals = groupedRituals[category] || []
          if (categoryRituals.length === 0) return null
          
          const categoryConfig = getCategoryConfig(category)
          
          return (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <span>{categoryConfig.icon}</span>
                <span>{categoryConfig.label}</span>
                <span className="text-gray-400">({categoryRituals.length})</span>
              </div>

              {/* Rituals in Category */}
              <div className="space-y-2">
                {categoryRituals.map((ritual) => {
                  const isExpanded = expandedRituals.has(ritual.id)
                  const progress = getProgress(ritual)
                  
                  return (
                    <div
                      key={ritual.id}
                      className={`${categoryConfig.bg} ${categoryConfig.border} rounded-xl border-2 transition-all duration-200 hover:border-opacity-80`}
                    >
                      {/* Main Ritual */}
                      <div className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Toggle Button */}
                          <button
                            onClick={() => onToggleRitual(ritual.id)}
                            className={`p-1 rounded-lg transition-colors touch-target ${
                              ritual.completed
                                ? 'text-green-600 hover:text-green-700'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <CheckCircle size={18} />
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm font-medium ${
                                ritual.completed ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                                {ritual.title}
                              </span>
                              
                              {ritual.estimated_minutes && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock size={10} />
                                  {ritual.estimated_minutes}m
                                </span>
                              )}
                            </div>
                            
                            {ritual.description && (
                              <div className="text-xs text-gray-600 mb-2">
                                {ritual.description}
                              </div>
                            )}
                            
                            {/* Progress Bar */}
                            {ritual.subtasks.length > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {ritual.subtasks.filter(st => st.completed).length}/{ritual.subtasks.length}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Expand Button */}
                          {ritual.subtasks.length > 0 && (
                            <button
                              onClick={() => toggleExpanded(ritual.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors touch-target"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subtasks */}
                      {isExpanded && ritual.subtasks.length > 0 && (
                        <div className="px-3 pb-3 border-t border-white/50">
                          <div className="pt-3 space-y-2">
                            {ritual.subtasks.map((subtask) => (
                              <div
                                key={subtask.id}
                                className="flex items-center gap-3 pl-6"
                              >
                                <button
                                  onClick={() => onToggleSubtask(ritual.id, subtask.id)}
                                  className={`p-1 rounded-lg transition-colors touch-target ${
                                    subtask.completed
                                      ? 'text-green-600 hover:text-green-700'
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`}
                                >
                                  <CheckCircle size={14} />
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                  <span className={`text-sm ${
                                    subtask.completed ? 'line-through text-gray-500' : 'text-gray-800'
                                  }`}>
                                    {subtask.title}
                                  </span>
                                  
                                  {subtask.estimated_minutes && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      {subtask.estimated_minutes}m
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        
        {Object.keys(groupedRituals).length === 0 && (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🔄</div>
            <div className="text-sm text-gray-600 mb-3">
              No hay rituales configurados
            </div>
            <button
              onClick={onAddRitual}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors touch-target"
            >
              Crear primer ritual
            </button>
          </div>
        )}
      </div>
    </div>
  )
}