'use client'

import { useState } from 'react'
import WeeklyStats from '@/components/features/weekly/WeeklyStats'
import WeeklyReviewWizard from '@/components/features/weekly/WeeklyReviewWizard'
import WeeklyGoals from '@/components/features/weekly/WeeklyGoals'
import ContextFilter from '@/components/features/weekly/ContextFilter'
import GTDWeeklyReview from '@/components/features/weekly/GTDWeeklyReview'

export default function WeeklyPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'review' | 'goals'>('overview')
  const [hasCompletedReview, setHasCompletedReview] = useState(false)
  const [selectedContext, setSelectedContext] = useState<string>('')
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [timeAvailable, setTimeAvailable] = useState<number>(60)
  const [showGTDReview, setShowGTDReview] = useState(false)
  
  // Mock contexts data
  const availableContexts = [
    { id: '@calls', name: 'Llamadas', icon: '📞', color: 'blue', description: 'Llamadas telefónicas y videoconferencias', is_location_based: false, task_count: 3 },
    { id: '@computer', name: 'Computadora', icon: '💻', color: 'green', description: 'Trabajo en la computadora', is_location_based: false, task_count: 8 },
    { id: '@office', name: 'Oficina', icon: '🏢', color: 'purple', description: 'Trabajo en la oficina', is_location_based: true, task_count: 5, location: 'Oficina' },
    { id: '@home', name: 'Casa', icon: '🏠', color: 'yellow', description: 'Tareas del hogar', is_location_based: true, task_count: 2, location: 'Casa' },
    { id: '@errands', name: 'Mandados', icon: '🚗', color: 'red', description: 'Mandados fuera de casa', is_location_based: true, task_count: 1, location: 'Fuera' },
    { id: '@waiting', name: 'Esperando', icon: '⏳', color: 'gray', description: 'Esperando respuesta de otros', is_location_based: false, task_count: 2 }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-4xl">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            📊 Weekly Review
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Reflexiona y planifica tu semana
          </p>
        </header>

        {/* Context Filter */}
        <div className="mb-6 sm:mb-8">
          <ContextFilter
            contexts={availableContexts}
            selectedContext={selectedContext}
            onContextChange={(contextId) => setSelectedContext(contextId || '')}
            energyLevel={energyLevel}
            onEnergyLevelChange={(level) => setEnergyLevel(level || 'medium')}
            timeAvailable={timeAvailable}
            onTimeAvailableChange={(time) => setTimeAvailable(time || 60)}
            showWaitingFor={false}
            onShowWaitingForChange={() => {}}
            showSomedayMaybe={false}
            onShowSomedayMaybeChange={() => {}}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📈 Resumen
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'review' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔍 Revisión
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'goals' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🎯 Objetivos
              </button>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <WeeklyStats 
            hasCompletedReview={hasCompletedReview}
            onStartReview={() => setActiveTab('review')}
            selectedContext={selectedContext}
            energyLevel={energyLevel}
            timeAvailable={timeAvailable}
          />
        )}

        {activeTab === 'review' && (
          <WeeklyReviewWizard 
            onComplete={() => {
              setHasCompletedReview(true)
              setActiveTab('overview')
            }}
          />
        )}

        {activeTab === 'goals' && (
          <WeeklyGoals />
        )}
        
        {/* GTD Weekly Review Modal */}
        {showGTDReview && (
          <GTDWeeklyReview
            onClose={() => setShowGTDReview(false)}
            onComplete={() => {
              setHasCompletedReview(true)
              setShowGTDReview(false)
              setActiveTab('overview')
            }}
            className="fixed inset-0 z-50"
          />
        )}
      </div>
    </div>
  )
}