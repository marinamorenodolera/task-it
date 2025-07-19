'use client'

import { useState } from 'react'
import { Filter, MapPin, Zap, Clock, Target, Eye, EyeOff } from 'lucide-react'

interface Context {
  id: string
  name: string
  icon: string
  color: string
  description: string
  is_location_based: boolean
  task_count: number
  location?: string
}

interface ContextFilterProps {
  contexts: Context[]
  selectedContext?: string
  energyLevel?: 'low' | 'medium' | 'high'
  timeAvailable?: number
  showWaitingFor?: boolean
  showSomedayMaybe?: boolean
  onContextChange: (contextId?: string) => void
  onEnergyLevelChange: (level?: 'low' | 'medium' | 'high') => void
  onTimeAvailableChange: (minutes?: number) => void
  onShowWaitingForChange: (show: boolean) => void
  onShowSomedayMaybeChange: (show: boolean) => void
  className?: string
}

export default function ContextFilter({
  contexts,
  selectedContext,
  energyLevel,
  timeAvailable,
  showWaitingFor = false,
  showSomedayMaybe = false,
  onContextChange,
  onEnergyLevelChange,
  onTimeAvailableChange,
  onShowWaitingForChange,
  onShowSomedayMaybeChange,
  className = ''
}: ContextFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<string>('office') // Mock location

  const energyLevels = [
    { id: 'low', label: 'Baja', icon: '🪫', color: 'gray' },
    { id: 'medium', label: 'Media', icon: '🔋', color: 'blue' },
    { id: 'high', label: 'Alta', icon: '⚡', color: 'green' }
  ]

  const timeOptions = [
    { value: 15, label: '15 min', icon: '⏱️' },
    { value: 30, label: '30 min', icon: '⏰' },
    { value: 60, label: '1 hora', icon: '🕐' },
    { value: 120, label: '2+ horas', icon: '🕑' }
  ]

  const getContextColor = (color: string) => {
    const colorMap = {
      'blue': 'bg-blue-100 text-blue-700 border-blue-300',
      'green': 'bg-green-100 text-green-700 border-green-300',
      'purple': 'bg-purple-100 text-purple-700 border-purple-300',
      'orange': 'bg-orange-100 text-orange-700 border-orange-300',
      'red': 'bg-red-100 text-red-700 border-red-300',
      'yellow': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'pink': 'bg-pink-100 text-pink-700 border-pink-300',
      'gray': 'bg-gray-100 text-gray-700 border-gray-300'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.gray
  }

  const getLocationRelevantContexts = () => {
    return contexts.filter(context => {
      if (!context.is_location_based) return true
      return context.location === currentLocation
    })
  }

  const totalTasks = contexts.reduce((sum, ctx) => sum + ctx.task_count, 0)
  const activeFilters = [
    selectedContext && 'contexto',
    energyLevel && 'energía',
    timeAvailable && 'tiempo',
    showWaitingFor && 'esperando',
    showSomedayMaybe && 'algún día'
  ].filter(Boolean)

  return (
    <div className={`bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="text-blue-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">
            Filtros por Contexto
          </h3>
          {activeFilters.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              {activeFilters.length} activos
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
          {isExpanded ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-sm font-bold text-blue-600">{totalTasks}</div>
          <div className="text-xs text-blue-700">Total tareas</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-sm font-bold text-green-600">{contexts.length}</div>
          <div className="text-xs text-green-700">Contextos</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-sm font-bold text-purple-600">
            {getLocationRelevantContexts().length}
          </div>
          <div className="text-xs text-purple-700">Disponibles</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-sm font-bold text-orange-600">
            {selectedContext ? contexts.find(c => c.id === selectedContext)?.task_count || 0 : totalTasks}
          </div>
          <div className="text-xs text-orange-700">Filtradas</div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          
          {/* Context Selection */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Target size={16} />
              Contextos
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => onContextChange(undefined)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  !selectedContext
                    ? 'bg-gray-100 text-gray-900 border-gray-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>🌟</span>
                <span>Todos</span>
                <span className="text-xs text-gray-500">({totalTasks})</span>
              </button>
              
              {contexts.map((context) => (
                <button
                  key={context.id}
                  onClick={() => onContextChange(context.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    selectedContext === context.id
                      ? getContextColor(context.color)
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  } ${
                    context.is_location_based && context.location !== currentLocation
                      ? 'opacity-50'
                      : ''
                  }`}
                >
                  <span>{context.icon}</span>
                  <span className="truncate">{context.name}</span>
                  <span className="text-xs text-gray-500">({context.task_count})</span>
                  {context.is_location_based && context.location !== currentLocation && (
                    <MapPin size={12} className="text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Zap size={16} />
              Nivel de Energía
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => onEnergyLevelChange(undefined)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !energyLevel
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Cualquiera
              </button>
              {energyLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => onEnergyLevelChange(level.id as 'low' | 'medium' | 'high')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    energyLevel === level.id
                      ? `bg-${level.color}-100 text-${level.color}-700`
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{level.icon}</span>
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Available */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Tiempo Disponible
            </h4>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onTimeAvailableChange(undefined)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !timeAvailable
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Cualquiera
              </button>
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onTimeAvailableChange(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeAvailable === option.value
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Special Lists */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Listas Especiales
            </h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={showWaitingFor}
                  onChange={(e) => onShowWaitingForChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-2 text-sm">
                  <span>⏳</span>
                  <span>Mostrar "Esperando por"</span>
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={showSomedayMaybe}
                  onChange={(e) => onShowSomedayMaybeChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-2 text-sm">
                  <span>🌟</span>
                  <span>Mostrar "Algún día / Tal vez"</span>
                </span>
              </label>
            </div>
          </div>

          {/* Current Location */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="text-blue-600" size={16} />
              <span className="text-sm font-medium text-blue-900">Ubicación actual</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentLocation('office')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  currentLocation === 'office'
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-white text-blue-600 hover:bg-blue-100'
                }`}
              >
                🏢 Oficina
              </button>
              <button
                onClick={() => setCurrentLocation('home')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  currentLocation === 'home'
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-white text-blue-600 hover:bg-blue-100'
                }`}
              >
                🏠 Casa
              </button>
              <button
                onClick={() => setCurrentLocation('out')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  currentLocation === 'out'
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-white text-blue-600 hover:bg-blue-100'
                }`}
              >
                🚗 Fuera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilters.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Filtros activos: {activeFilters.join(', ')}
              </span>
            </div>
            <button
              onClick={() => {
                onContextChange(undefined)
                onEnergyLevelChange(undefined)
                onTimeAvailableChange(undefined)
                onShowWaitingForChange(false)
                onShowSomedayMaybeChange(false)
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}