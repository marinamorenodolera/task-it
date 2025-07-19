'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

interface WeeklyReviewWizardProps {
  onComplete: () => void
  className?: string
}

export default function WeeklyReviewWizard({ onComplete, className = '' }: WeeklyReviewWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})

  const steps = [
    {
      id: 'reflect',
      title: 'Reflexionar',
      emoji: '🤔',
      description: 'Evalúa cómo fue tu semana',
      questions: [
        {
          id: 'wins',
          question: '¿Cuáles fueron tus 3 principales logros esta semana?',
          placeholder: 'Ejemplo: Terminé el proyecto X, hice ejercicio 4 días...'
        },
        {
          id: 'challenges',
          question: '¿Qué desafíos enfrentaste y cómo los manejaste?',
          placeholder: 'Ejemplo: Tuve problemas con el tiempo, pero reorganicé mis prioridades...'
        }
      ]
    },
    {
      id: 'review',
      title: 'Revisar',
      emoji: '📋',
      description: 'Examina tus proyectos y compromisos',
      questions: [
        {
          id: 'projects',
          question: '¿Hay proyectos que necesitan atención la próxima semana?',
          placeholder: 'Ejemplo: Proyecto Y necesita más tiempo, debo coordinar con el equipo...'
        },
        {
          id: 'commitments',
          question: '¿Cumpliste con tus compromisos? ¿Hay alguno pendiente?',
          placeholder: 'Ejemplo: Cumplí con las reuniones, pero falta entregar el reporte...'
        }
      ]
    },
    {
      id: 'plan',
      title: 'Planificar',
      emoji: '🎯',
      description: 'Define tus objetivos para la próxima semana',
      questions: [
        {
          id: 'big3',
          question: '¿Cuáles son tus 3 grandes objetivos para la próxima semana?',
          placeholder: 'Ejemplo: 1) Terminar presentación, 2) Hacer ejercicio 5 días, 3) Llamar a cliente...'
        },
        {
          id: 'focus',
          question: '¿En qué área necesitas enfocar más energía?',
          placeholder: 'Ejemplo: Trabajo, salud, familia, desarrollo personal...'
        }
      ]
    },
    {
      id: 'commit',
      title: 'Comprometerse',
      emoji: '💪',
      description: 'Confirma tu compromiso con tus objetivos',
      questions: [
        {
          id: 'commitment',
          question: '¿Cómo vas a asegurar que cumplas con tus objetivos?',
          placeholder: 'Ejemplo: Bloquear tiempo en el calendario, pedir ayuda, eliminar distracciones...'
        },
        {
          id: 'accountability',
          question: '¿Hay alguien que pueda ayudarte a mantenerte responsable?',
          placeholder: 'Ejemplo: Mi compañero de trabajo, mi coach, mi pareja...'
        }
      ]
    }
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      // TODO: Guardar respuestas en la base de datos
      console.log('Weekly review completed:', responses)
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const isStepComplete = () => {
    return currentStepData.questions.every(q => responses[q.id]?.trim())
  }

  return (
    <div className={`${className}`}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        
        {/* Progress Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Revisión Semanal GTD
            </h2>
            <div className="text-sm text-gray-500">
              {currentStep + 1} de {steps.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 sm:p-6">
          
          {/* Step Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{currentStepData.emoji}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {currentStepData.questions.map((question, index) => (
              <div key={question.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {question.question}
                </label>
                <textarea
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            ))}
          </div>

          {/* GTD Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              💡 Tip GTD
            </h4>
            <p className="text-sm text-blue-700">
              {currentStepData.id === 'reflect' && 'Sé honesto contigo mismo. La reflexión es clave para el crecimiento.'}
              {currentStepData.id === 'review' && 'Revisa todos tus proyectos activos. ¿Hay algún "siguiente paso" que definir?'}
              {currentStepData.id === 'plan' && 'Menos es más. Enfócate en máximo 3 objetivos grandes por semana.'}
              {currentStepData.id === 'commit' && 'El compromiso sin acción es solo un deseo. Define acciones específicas.'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 sm:p-6 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={20} />
              Anterior
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepComplete()}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                isStepComplete()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 size={20} />
                  Completar Revisión
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}