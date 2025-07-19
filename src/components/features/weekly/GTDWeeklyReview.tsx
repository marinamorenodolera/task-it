'use client'

import { useState } from 'react'
import { CheckCircle, Circle, ArrowLeft, ArrowRight, Calendar, ClipboardList, FolderOpen, Target, Lightbulb, Star } from 'lucide-react'

interface GTDWeeklyReviewProps {
  onComplete: (reviewData: any) => void
  onClose: () => void
  className?: string
}

const REVIEW_STEPS = [
  {
    id: 'collect',
    title: 'Recopilar',
    icon: ClipboardList,
    description: 'Reúne todo el material suelto'
  },
  {
    id: 'process',
    title: 'Procesar',
    icon: Calendar,
    description: 'Procesa todas las bandejas de entrada'
  },
  {
    id: 'organize',
    title: 'Organizar',
    icon: FolderOpen,
    description: 'Revisa y organiza tus listas'
  },
  {
    id: 'review',
    title: 'Revisar',
    icon: Target,
    description: 'Revisa proyectos y compromisos'
  },
  {
    id: 'engage',
    title: 'Actuar',
    icon: Star,
    description: 'Decide las próximas acciones'
  }
]

export default function GTDWeeklyReview({ onComplete, onClose, className = '' }: GTDWeeklyReviewProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [reviewData, setReviewData] = useState({
    collect: {
      physical_items: false,
      digital_items: false,
      notes_processed: false,
      emails_processed: false
    },
    process: {
      inbox_empty: false,
      capture_items_processed: false,
      meeting_notes_processed: false,
      action_items_identified: false
    },
    organize: {
      next_actions_reviewed: false,
      waiting_for_reviewed: false,
      someday_maybe_reviewed: false,
      contexts_updated: false
    },
    review: {
      projects_reviewed: false,
      goals_assessed: false,
      calendar_reviewed: false,
      commitments_noted: false
    },
    engage: {
      priorities_set: false,
      big3_selected: false,
      energy_planned: false,
      schedule_blocked: false
    },
    reflection: {
      what_worked: '',
      what_improve: '',
      lessons_learned: '',
      next_week_focus: ''
    }
  })

  const handleStepComplete = (stepId: string, itemKey: string, value: boolean) => {
    setReviewData(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId as keyof typeof prev],
        [itemKey]: value
      }
    }))
  }

  const handleReflectionChange = (key: string, value: string) => {
    setReviewData(prev => ({
      ...prev,
      reflection: {
        ...prev.reflection,
        [key]: value
      }
    }))
  }

  const isStepComplete = (stepIndex: number) => {
    const stepId = REVIEW_STEPS[stepIndex].id
    const stepData = reviewData[stepId as keyof typeof reviewData]
    
    if (typeof stepData === 'object' && stepData !== null) {
      return Object.values(stepData).every(value => value === true)
    }
    return false
  }

  const canProceed = () => {
    return isStepComplete(currentStep)
  }

  const handleNext = () => {
    if (canProceed()) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
      
      if (currentStep < REVIEW_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        // Complete the review
        onComplete(reviewData)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const getStepProgress = () => {
    const completed = completedSteps.length + (canProceed() ? 1 : 0)
    return Math.round((completed / REVIEW_STEPS.length) * 100)
  }

  const currentStepData = REVIEW_STEPS[currentStep]
  const StepIcon = currentStepData.icon

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">GTD Weekly Review</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso</span>
              <span>{getStepProgress()}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${getStepProgress()}%` }}
              />
            </div>
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between">
            {REVIEW_STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  completedSteps.includes(index) ? 'bg-green-500' :
                  index === currentStep ? 'bg-white text-blue-500' :
                  'bg-white/20'
                }`}>
                  {completedSteps.includes(index) ? '✓' : index + 1}
                </div>
                <span className="text-xs mt-1 text-center">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <StepIcon className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600">{currentStepData.description}</p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            {/* Collect Step */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📥 Recopilar todo el material suelto</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Busca y reúne todo lo que está "suelto" en tu mundo físico y digital
                  </p>
                </div>
                
                {Object.entries(reviewData.collect).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleStepComplete('collect', key, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1 text-sm">
                      {key === 'physical_items' && '📋 Recopilar papeles sueltos, notas y tarjetas'}
                      {key === 'digital_items' && '💻 Revisar desktop, descargas y documentos'}
                      {key === 'notes_processed' && '📝 Procesar notas de reuniones y apuntes'}
                      {key === 'emails_processed' && '📧 Revisar y procesar emails pendientes'}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Process Step */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">🔄 Procesar bandejas de entrada</h4>
                  <p className="text-sm text-purple-700 mb-3">
                    Aplica el método GTD: ¿Es accionable? ¿Menos de 2 minutos?
                  </p>
                </div>
                
                {Object.entries(reviewData.process).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleStepComplete('process', key, e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="flex-1 text-sm">
                      {key === 'inbox_empty' && '📥 Inbox completamente vacío (Inbox Zero)'}
                      {key === 'capture_items_processed' && '🧠 Elementos capturados procesados'}
                      {key === 'meeting_notes_processed' && '📋 Notas de reuniones convertidas en acciones'}
                      {key === 'action_items_identified' && '⚡ Próximas acciones identificadas'}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Organize Step */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">🗂️ Organizar y revisar listas</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Mantén tus listas actualizadas y organizadas por contextos
                  </p>
                </div>
                
                {Object.entries(reviewData.organize).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleStepComplete('organize', key, e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="flex-1 text-sm">
                      {key === 'next_actions_reviewed' && '⚡ Lista "Próximas Acciones" revisada'}
                      {key === 'waiting_for_reviewed' && '⏳ Lista "Esperando" actualizada'}
                      {key === 'someday_maybe_reviewed' && '🌟 Lista "Algún día/Tal vez" revisada'}
                      {key === 'contexts_updated' && '📋 Contextos actualizados (@calls, @computer, etc.)'}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Review Step */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 mb-2">🎯 Revisar proyectos y compromisos</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    Evalúa el estado de tus proyectos y compromisos futuros
                  </p>
                </div>
                
                {Object.entries(reviewData.review).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleStepComplete('review', key, e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="flex-1 text-sm">
                      {key === 'projects_reviewed' && '📂 Todos los proyectos revisados'}
                      {key === 'goals_assessed' && '🎯 Objetivos semanales evaluados'}
                      {key === 'calendar_reviewed' && '📅 Calendario próximas 2 semanas revisado'}
                      {key === 'commitments_noted' && '📋 Compromisos y citas anotados'}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Engage Step */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">⭐ Decidir próximas acciones</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Define tus prioridades y planifica la próxima semana
                  </p>
                </div>
                
                {Object.entries(reviewData.engage).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleStepComplete('engage', key, e.target.checked)}
                      className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="flex-1 text-sm">
                      {key === 'priorities_set' && '🎯 Prioridades de la semana establecidas'}
                      {key === 'big3_selected' && '⭐ Big 3 semanales seleccionadas'}
                      {key === 'energy_planned' && '⚡ Tareas asignadas por nivel de energía'}
                      {key === 'schedule_blocked' && '📅 Tiempo bloqueado para trabajo enfocado'}
                    </span>
                  </label>
                ))}

                {/* Reflection Section */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">🤔 Reflexión Semanal</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ¿Qué funcionó bien esta semana?
                      </label>
                      <textarea
                        value={reviewData.reflection.what_worked}
                        onChange={(e) => handleReflectionChange('what_worked', e.target.value)}
                        placeholder="Logros, hábitos exitosos, estrategias efectivas..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ¿Qué mejorar para la próxima semana?
                      </label>
                      <textarea
                        value={reviewData.reflection.what_improve}
                        onChange={(e) => handleReflectionChange('what_improve', e.target.value)}
                        placeholder="Áreas de mejora, obstáculos encontrados..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ¿Qué aprendizajes clave obtuviste?
                      </label>
                      <textarea
                        value={reviewData.reflection.lessons_learned}
                        onChange={(e) => handleReflectionChange('lessons_learned', e.target.value)}
                        placeholder="Insights, patrones identificados, lecciones..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ¿Cuál será tu enfoque principal la próxima semana?
                      </label>
                      <textarea
                        value={reviewData.reflection.next_week_focus}
                        onChange={(e) => handleReflectionChange('next_week_focus', e.target.value)}
                        placeholder="Prioridades, objetivos principales..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Paso {currentStep + 1} de {REVIEW_STEPS.length}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft size={16} />
              Anterior
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentStep === REVIEW_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}