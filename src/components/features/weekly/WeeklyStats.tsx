'use client'

import { Calendar, Target, TrendingUp, CheckCircle2, BarChart3, Clock, MapPin, Zap } from 'lucide-react'

interface WeeklyStatsProps {
  hasCompletedReview: boolean
  onStartReview: () => void
  selectedContext?: string
  energyLevel?: 'low' | 'medium' | 'high'
  timeAvailable?: number
  className?: string
}

export default function WeeklyStats({ 
  hasCompletedReview, 
  onStartReview, 
  selectedContext,
  energyLevel,
  timeAvailable,
  className = '' 
}: WeeklyStatsProps) {
  // TODO: Obtener datos reales desde el store
  const stats = {
    tasksCompleted: 23,
    tasksTotal: 31,
    big3Completed: 18,
    big3Total: 21,
    focusHours: 32.5,
    productivity: 74,
    streak: 5
  }

  // Context-specific stats
  const contextStats = {
    '@calls': { completed: 5, total: 7, avgTime: 15 },
    '@computer': { completed: 12, total: 15, avgTime: 60 },
    '@office': { completed: 8, total: 10, avgTime: 45 },
    '@home': { completed: 3, total: 5, avgTime: 30 },
    '@errands': { completed: 2, total: 3, avgTime: 25 },
    '@waiting': { completed: 1, total: 2, avgTime: 0 }
  }
  
  // Energy level distribution
  const energyStats = {
    low: { completed: 8, total: 12, percentage: 67 },
    medium: { completed: 10, total: 13, percentage: 77 },
    high: { completed: 5, total: 6, percentage: 83 }
  }
  
  // Time block efficiency
  const timeStats = {
    '15': { completed: 6, total: 8, efficiency: 75 },
    '30': { completed: 8, total: 10, efficiency: 80 },
    '60': { completed: 7, total: 9, efficiency: 78 },
    '120': { completed: 2, total: 4, efficiency: 50 }
  }

  // Get filtered stats based on current filters
  const getFilteredStats = () => {
    if (selectedContext && contextStats[selectedContext as keyof typeof contextStats]) {
      const contextData = contextStats[selectedContext as keyof typeof contextStats]
      return {
        ...stats,
        tasksCompleted: contextData.completed,
        tasksTotal: contextData.total,
        completionRate: Math.round((contextData.completed / contextData.total) * 100),
        averageTime: contextData.avgTime
      }
    }
    return { ...stats, completionRate: Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) }
  }
  
  const filteredStats = getFilteredStats()
  const completionRate = Math.round((stats.tasksCompleted / stats.tasksTotal) * 100)
  const big3Rate = Math.round((stats.big3Completed / stats.big3Total) * 100)

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Review Status */}
      <div className={`bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm ${
        hasCompletedReview ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              hasCompletedReview ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {hasCompletedReview ? <CheckCircle2 size={24} /> : <Calendar size={24} />}
            </div>
            <div>
              <h3 className={`font-semibold ${
                hasCompletedReview ? 'text-green-900' : 'text-orange-900'
              }`}>
                {hasCompletedReview ? 'Revisión Completada' : 'Revisión Pendiente'}
              </h3>
              <p className={`text-sm ${
                hasCompletedReview ? 'text-green-700' : 'text-orange-700'
              }`}>
                {hasCompletedReview 
                  ? 'Has completado tu revisión semanal' 
                  : 'Es hora de hacer tu revisión semanal'}
              </p>
            </div>
          </div>
          {!hasCompletedReview && (
            <button
              onClick={onStartReview}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              Empezar Revisión
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="text-blue-500" size={20} />
          📊 Resumen de la Semana
          {selectedContext && (
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {selectedContext}
            </span>
          )}
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Tasks Completed */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-blue-500 mb-1">
              {filteredStats.tasksCompleted}
            </div>
            <div className="text-xs sm:text-sm text-blue-700 mb-2">
              Completadas
            </div>
            <div className="text-xs text-blue-600">
              de {filteredStats.tasksTotal} ({filteredStats.completionRate}%)
            </div>
          </div>

          {/* Big 3 Performance */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-purple-500 mb-1">
              {stats.big3Completed}
            </div>
            <div className="text-xs sm:text-sm text-purple-700 mb-2">
              Big 3 completadas
            </div>
            <div className="text-xs text-purple-600">
              de {stats.big3Total} ({big3Rate}%)
            </div>
          </div>

          {/* Focus Hours */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-green-500 mb-1">
              {'averageTime' in filteredStats ? filteredStats.averageTime : stats.focusHours}
              {selectedContext ? 'm' : 'h'}
            </div>
            <div className="text-xs sm:text-sm text-green-700 mb-2">
              {selectedContext ? 'Tiempo promedio' : 'Horas enfocadas'}
            </div>
            <div className="text-xs text-green-600">
              {selectedContext ? 'por tarea' : 'Esta semana'}
            </div>
          </div>

          {/* Productivity Score */}
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-orange-500 mb-1">
              {stats.productivity}%
            </div>
            <div className="text-xs sm:text-sm text-orange-700 mb-2">
              Productividad
            </div>
            <div className="text-xs text-orange-600">
              Score general
            </div>
          </div>

        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso semanal{selectedContext ? ` (${selectedContext})` : ''}</span>
            <span>{filteredStats.tasksCompleted} de {filteredStats.tasksTotal}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${filteredStats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Context-Specific Insights */}
      {selectedContext && (
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="text-blue-500" size={20} />
            Insights de {selectedContext}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {contextStats[selectedContext as keyof typeof contextStats]?.completed || 0}
              </div>
              <div className="text-sm text-blue-700">Completadas</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {contextStats[selectedContext as keyof typeof contextStats]?.avgTime || 0}m
              </div>
              <div className="text-sm text-green-700">Tiempo promedio</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {Math.round(((contextStats[selectedContext as keyof typeof contextStats]?.completed || 0) / 
                (contextStats[selectedContext as keyof typeof contextStats]?.total || 1)) * 100)}%
              </div>
              <div className="text-sm text-purple-700">Eficiencia</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Energy Level Insights */}
      {energyLevel && (
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="text-yellow-500" size={20} />
            Rendimiento por Energía {energyLevel === 'high' ? 'Alta' : energyLevel === 'medium' ? 'Media' : 'Baja'}
          </h3>
          
          <div className="space-y-3">
            {Object.entries(energyStats).map(([level, data]) => (
              <div key={level} className={`flex items-center justify-between p-3 rounded-lg ${
                level === energyLevel ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    level === 'high' ? 'bg-green-500' : level === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {level === 'high' ? '⚡ Alta' : level === 'medium' ? '🔋 Media' : '🪫 Baja'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{data.completed}/{data.total}</div>
                  <div className="text-xs text-gray-600">{data.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Logros de la Semana
        </h3>
        
        <div className="space-y-3">
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <div className="text-2xl">🎯</div>
            <div>
              <div className="font-medium text-green-900">
                Racha de {stats.streak} días
              </div>
              <div className="text-sm text-green-700">
                Completando al menos 1 Big 3 diario
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl">⚡</div>
            <div>
              <div className="font-medium text-blue-900">
                Semana productiva
              </div>
              <div className="text-sm text-blue-700">
                Completaste más del 70% de tus tareas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl">🧠</div>
            <div>
              <div className="font-medium text-purple-900">
                Enfoque profundo
              </div>
              <div className="text-sm text-purple-700">
                Más de 30 horas de trabajo enfocado
              </div>
            </div>
          </div>

          {selectedContext && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl">🎖️</div>
              <div>
                <div className="font-medium text-yellow-900">
                  Maestro de {selectedContext}
                </div>
                <div className="text-sm text-yellow-700">
                  Excelente rendimiento en este contexto
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Weekly Trends */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Tendencias y Insights
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-700 mb-1">Mejor contexto</div>
            <div className="font-semibold text-green-900">@computer</div>
            <div className="text-xs text-green-600">80% de éxito</div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700 mb-1">Hora más productiva</div>
            <div className="font-semibold text-blue-900">9:00 - 11:00</div>
            <div className="text-xs text-blue-600">Mejor rendimiento</div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-700 mb-1">Duración óptima</div>
            <div className="font-semibold text-purple-900">30-60 min</div>
            <div className="text-xs text-purple-600">Mayor eficiencia</div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-sm text-orange-700 mb-1">Energía ideal</div>
            <div className="font-semibold text-orange-900">Media-Alta</div>
            <div className="text-xs text-orange-600">83% de éxito</div>
          </div>

        </div>
      </div>

    </div>
  )
}