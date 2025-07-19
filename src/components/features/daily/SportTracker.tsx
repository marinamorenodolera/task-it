'use client'

import { useState } from 'react'
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Timer, 
  Target,
  TrendingUp,
  Trophy,
  Clock
} from 'lucide-react'

interface WorkoutSession {
  id: string
  exercise: string
  duration: number // in minutes
  intensity: 'low' | 'medium' | 'high'
  calories?: number
  notes?: string
  completed_at: string
}

interface SportTrackerProps {
  todaysSessions: WorkoutSession[]
  isActiveSession: boolean
  currentSessionTime: number // in seconds
  onStartSession: (exercise: string, intensity: 'low' | 'medium' | 'high') => void
  onPauseSession: () => void
  onStopSession: () => void
  onAddQuickSession: (exercise: string, duration: number, intensity: 'low' | 'medium' | 'high') => void
  className?: string
}

export default function SportTracker({
  todaysSessions,
  isActiveSession,
  currentSessionTime,
  onStartSession,
  onPauseSession,
  onStopSession,
  onAddQuickSession,
  className = ''
}: SportTrackerProps) {
  const [selectedExercise, setSelectedExercise] = useState('Caminata')
  const [selectedIntensity, setSelectedIntensity] = useState<'low' | 'medium' | 'high'>('medium')
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const quickExercises = [
    { name: 'Caminata', icon: '🚶', defaultIntensity: 'low' as const },
    { name: 'Correr', icon: '🏃', defaultIntensity: 'high' as const },
    { name: 'Yoga', icon: '🧘', defaultIntensity: 'low' as const },
    { name: 'Pesas', icon: '🏋️', defaultIntensity: 'high' as const },
    { name: 'Bicicleta', icon: '🚴', defaultIntensity: 'medium' as const },
    { name: 'Natación', icon: '🏊', defaultIntensity: 'high' as const }
  ]

  const intensityConfig = {
    low: { color: 'text-green-600', bg: 'bg-green-100', label: 'Suave' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Moderado' },
    high: { color: 'text-red-600', bg: 'bg-red-100', label: 'Intenso' }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalDuration = () => {
    return todaysSessions.reduce((total, session) => total + session.duration, 0)
  }

  const getWeeklyGoalProgress = () => {
    // Mock weekly goal of 150 minutes
    const weeklyGoal = 150
    const weeklyTotal = getTotalDuration() * 7 // Simulate week total
    return Math.min(Math.round((weeklyTotal / weeklyGoal) * 100), 100)
  }

  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          💪 Deporte & Ejercicio
        </h3>
        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors touch-target"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-green-600">
            {getTotalDuration()}
          </div>
          <div className="text-xs text-green-700">
            min hoy
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-blue-600">
            {todaysSessions.length}
          </div>
          <div className="text-xs text-blue-700">
            sesiones
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-purple-600">
            {getWeeklyGoalProgress()}%
          </div>
          <div className="text-xs text-purple-700">
            meta semanal
          </div>
        </div>
      </div>

      {/* Active Session */}
      {isActiveSession && (
        <div className="bg-green-50 rounded-xl p-4 mb-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-green-800">
                Sesión activa: {selectedExercise}
              </div>
              <div className="text-xs text-green-600">
                Intensidad: {intensityConfig[selectedIntensity].label}
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatTime(currentSessionTime)}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onPauseSession}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors touch-target"
            >
              <Pause size={16} />
              Pausar
            </button>
            
            <button
              onClick={onStopSession}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors touch-target"
            >
              <Square size={16} />
              Finalizar
            </button>
          </div>
        </div>
      )}

      {/* Quick Start */}
      {!isActiveSession && (
        <div className="bg-blue-50 rounded-xl p-4 mb-4 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {quickExercises.map((exercise) => (
                  <option key={exercise.name} value={exercise.name}>
                    {exercise.icon} {exercise.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as const).map((intensity) => (
                <button
                  key={intensity}
                  onClick={() => setSelectedIntensity(intensity)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors touch-target ${
                    selectedIntensity === intensity
                      ? `${intensityConfig[intensity].bg} ${intensityConfig[intensity].color}`
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {intensityConfig[intensity].label}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => onStartSession(selectedExercise, selectedIntensity)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors touch-target"
          >
            <Play size={16} />
            Iniciar sesión
          </button>
        </div>
      )}

      {/* Quick Add Manual Session */}
      {showQuickAdd && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border-2 border-gray-200">
          <div className="text-sm font-medium text-gray-800 mb-3">
            Agregar sesión completada
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {quickExercises.map((exercise) => (
              <button
                key={exercise.name}
                onClick={() => {
                  onAddQuickSession(exercise.name, 30, exercise.defaultIntensity)
                  setShowQuickAdd(false)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl hover:bg-gray-100 transition-colors touch-target border border-gray-200"
              >
                <span>{exercise.icon}</span>
                <span className="text-sm">{exercise.name}</span>
                <span className="text-xs text-gray-500 ml-auto">30m</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's Sessions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Trophy size={16} />
          Sesiones de hoy
        </div>
        
        {todaysSessions.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm text-gray-600">
              ¡Comienza tu primera sesión!
            </div>
          </div>
        ) : (
          todaysSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="text-lg">
                {quickExercises.find(e => e.name === session.exercise)?.icon || '💪'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {session.exercise}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={10} />
                  {session.duration}m
                  <span className={`px-2 py-0.5 rounded-full ${intensityConfig[session.intensity].bg} ${intensityConfig[session.intensity].color}`}>
                    {intensityConfig[session.intensity].label}
                  </span>
                </div>
              </div>
              
              {session.calories && (
                <div className="text-xs text-gray-500">
                  {session.calories} cal
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}