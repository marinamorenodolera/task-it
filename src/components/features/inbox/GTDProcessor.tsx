'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, ArrowRight, User, Archive, Trash2, Edit3, Target, AlertCircle } from 'lucide-react'

interface GTDProcessorProps {
  tasks: Array<{
    id: string
    title: string
    description?: string
    created_at: string
    is_processed?: boolean
  }>
  onProcessTask: (taskId: string, decision: GTDDecision) => void
  className?: string
}

export interface GTDDecision {
  is_actionable: boolean
  action_type?: 'do_now' | 'schedule' | 'delegate' | 'reference' | 'someday_maybe' | 'trash'
  context?: string
  project_id?: string
  delegate_to?: string
  scheduled_date?: string
  notes?: string
}

export default function GTDProcessor({ tasks, onProcessTask, className = '' }: GTDProcessorProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [processingStep, setProcessingStep] = useState<'actionable' | 'action_type' | 'details'>('actionable')
  const [currentDecision, setCurrentDecision] = useState<Partial<GTDDecision>>({})
  const [showBulkMode, setShowBulkMode] = useState(false)
  
  const unprocessedTasks = tasks.filter(task => !task.is_processed)
  const currentTask = unprocessedTasks[currentTaskIndex]
  
  const contexts = [
    { id: '@calls', name: 'Llamadas', icon: '📞', color: 'blue' },
    { id: '@computer', name: 'Computadora', icon: '💻', color: 'purple' },
    { id: '@office', name: 'Oficina', icon: '🏢', color: 'green' },
    { id: '@home', name: 'Casa', icon: '🏠', color: 'orange' },
    { id: '@errands', name: 'Recados', icon: '🚗', color: 'red' },
    { id: '@waiting', name: 'Esperando', icon: '⏳', color: 'yellow' }
  ]

  const handleActionableDecision = (isActionable: boolean) => {
    setCurrentDecision({ is_actionable: isActionable })
    
    if (!isActionable) {
      // Not actionable - show reference/someday/trash options
      setProcessingStep('action_type')
    } else {
      // Actionable - check if it's a 2-minute task
      setProcessingStep('action_type')
    }
  }

  const handleActionTypeDecision = (actionType: GTDDecision['action_type']) => {
    setCurrentDecision(prev => ({ ...prev, action_type: actionType }))
    
    if (actionType === 'do_now' || actionType === 'reference' || actionType === 'trash') {
      // No additional details needed
      processCurrentTask({ 
        is_actionable: currentDecision.is_actionable ?? false,
        action_type: actionType,
        context: currentDecision.context,
        project_id: currentDecision.project_id,
        delegate_to: currentDecision.delegate_to,
        scheduled_date: currentDecision.scheduled_date,
        notes: currentDecision.notes
      })
    } else {
      // Need more details
      setProcessingStep('details')
    }
  }

  const processCurrentTask = (decision: GTDDecision) => {
    if (!currentTask) return
    
    onProcessTask(currentTask.id, decision)
    
    // Move to next task
    if (currentTaskIndex < unprocessedTasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1)
    } else {
      setCurrentTaskIndex(0)
    }
    
    // Reset state
    setCurrentDecision({})
    setProcessingStep('actionable')
  }

  const handleCompleteProcessing = () => {
    const fullDecision: GTDDecision = {
      is_actionable: currentDecision.is_actionable!,
      action_type: currentDecision.action_type!,
      context: currentDecision.context,
      project_id: currentDecision.project_id,
      delegate_to: currentDecision.delegate_to,
      scheduled_date: currentDecision.scheduled_date,
      notes: currentDecision.notes
    }
    
    processCurrentTask(fullDecision)
  }

  const skipTask = () => {
    if (currentTaskIndex < unprocessedTasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1)
    } else {
      setCurrentTaskIndex(0)
    }
    setCurrentDecision({})
    setProcessingStep('actionable')
  }

  if (unprocessedTasks.length === 0) {
    return (
      <div className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center ${className}`}>
        <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ¡Bandeja de entrada procesada!
        </h3>
        <p className="text-gray-600">
          Todas tus tareas han sido procesadas según la metodología GTD.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Progress Header */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            🧠 Procesamiento GTD
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {currentTaskIndex + 1} de {unprocessedTasks.length}
            </span>
            <button
              onClick={() => setShowBulkMode(!showBulkMode)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              {showBulkMode ? 'Modo individual' : 'Modo masivo'}
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentTaskIndex) / unprocessedTasks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Task */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentTask?.title}
            </h3>
            {currentTask?.description && (
              <p className="text-gray-600 mb-3">{currentTask.description}</p>
            )}
            <div className="text-sm text-gray-500">
              Capturado: {new Date(currentTask?.created_at || '').toLocaleDateString('es-ES')}
            </div>
          </div>
          <button
            onClick={skipTask}
            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
          >
            Omitir
          </button>
        </div>

        {/* GTD Processing Steps */}
        {processingStep === 'actionable' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Pregunta fundamental GTD:
              </h4>
              <p className="text-blue-800 text-lg font-semibold">
                ¿Es esto accionable?
              </p>
              <p className="text-sm text-blue-700 mt-1">
                ¿Requiere que hagas algo al respecto?
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleActionableDecision(true)}
                className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
              >
                <CheckCircle className="text-green-500" size={24} />
                <div className="text-left">
                  <div className="font-medium text-green-900">Sí, es accionable</div>
                  <div className="text-sm text-green-700">Requiere acción</div>
                </div>
              </button>
              
              <button
                onClick={() => handleActionableDecision(false)}
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <XCircle className="text-gray-500" size={24} />
                <div className="text-left">
                  <div className="font-medium text-gray-900">No es accionable</div>
                  <div className="text-sm text-gray-600">Solo información</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {processingStep === 'action_type' && (
          <div className="space-y-4">
            {currentDecision.is_actionable ? (
              <>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">
                    Es accionable. ¿Qué hacer?
                  </h4>
                  <p className="text-green-800">
                    ¿Toma menos de 2 minutos o requiere más tiempo?
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleActionTypeDecision('do_now')}
                    className="flex items-center gap-3 p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Clock className="text-red-500" size={24} />
                    <div className="text-left">
                      <div className="font-medium text-red-900">Hacer ahora (≤2 min)</div>
                      <div className="text-sm text-red-700">Hazlo inmediatamente</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleActionTypeDecision('schedule')}
                    className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <ArrowRight className="text-blue-500" size={24} />
                    <div className="text-left">
                      <div className="font-medium text-blue-900">Programar</div>
                      <div className="text-sm text-blue-700">Añadir a próximas acciones</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleActionTypeDecision('delegate')}
                    className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <User className="text-purple-500" size={24} />
                    <div className="text-left">
                      <div className="font-medium text-purple-900">Delegar</div>
                      <div className="text-sm text-purple-700">Asignar a otra persona</div>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    No es accionable. ¿Qué hacer con esto?
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleActionTypeDecision('reference')}
                    className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <Archive className="text-green-500" size={24} />
                    <div className="text-left">
                      <div className="font-medium text-green-900">Referencia</div>
                      <div className="text-sm text-green-700">Información útil para el futuro</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleActionTypeDecision('someday_maybe')}
                    className="flex items-center gap-3 p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors"
                  >
                    <Target className="text-yellow-500" size={24} />
                    <div className="text-left">
                      <div className="font-medium text-yellow-900">Algún día / Tal vez</div>
                      <div className="text-sm text-yellow-700">Podría ser interesante en el futuro</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleActionTypeDecision('trash')}
                    className="flex items-center gap-3 p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="text-red-500" size={24} />
                    <div className="text-left">
                      <div className="font-medium text-red-900">Eliminar</div>
                      <div className="text-sm text-red-700">No es relevante</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {processingStep === 'details' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Detalles adicionales
              </h4>
              <p className="text-blue-800">
                {currentDecision.action_type === 'schedule' && 'Configura cuándo y dónde harás esta tarea'}
                {currentDecision.action_type === 'delegate' && 'Especifica a quién delegar esta tarea'}
                {currentDecision.action_type === 'someday_maybe' && 'Añade notas para revisión futura'}
              </p>
            </div>
            
            <div className="space-y-4">
              {currentDecision.action_type === 'schedule' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contexto (¿dónde/cómo?)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {contexts.map((context) => (
                        <button
                          key={context.id}
                          onClick={() => setCurrentDecision(prev => ({ ...prev, context: context.id }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            currentDecision.context === context.id
                              ? `bg-${context.color}-100 text-${context.color}-700 border-${context.color}-300`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span>{context.icon}</span>
                          {context.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha programada (opcional)
                    </label>
                    <input
                      type="date"
                      value={currentDecision.scheduled_date || ''}
                      onChange={(e) => setCurrentDecision(prev => ({ ...prev, scheduled_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              
              {currentDecision.action_type === 'delegate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delegar a
                  </label>
                  <input
                    type="text"
                    value={currentDecision.delegate_to || ''}
                    onChange={(e) => setCurrentDecision(prev => ({ ...prev, delegate_to: e.target.value }))}
                    placeholder="Nombre de la persona"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={currentDecision.notes || ''}
                  onChange={(e) => setCurrentDecision(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Detalles adicionales, contexto o recordatorios..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCompleteProcessing}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Procesar tarea
                </button>
                <button
                  onClick={() => setProcessingStep('action_type')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Atrás
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GTD Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="text-blue-500" size={20} />
          <h3 className="font-semibold text-blue-900">Guía GTD</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-900 mb-2">✅ Es accionable si:</h4>
            <ul className="text-blue-800 space-y-1">
              <li>• Requiere que hagas algo</li>
              <li>• Hay un resultado específico</li>
              <li>• Tiene un próximo paso físico</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-2">❌ No es accionable si:</h4>
            <ul className="text-purple-800 space-y-1">
              <li>• Solo es información</li>
              <li>• Es una idea sin acción clara</li>
              <li>• Ya no es relevante</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}