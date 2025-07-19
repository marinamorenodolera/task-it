import React, { useState, useRef, useEffect } from 'react'
import { 
  Plus, 
  Mic, 
  MicOff, 
  CheckCircle2,
  Circle,
  Zap,
  Activity,
  MessageSquare,
  Star,
  Calendar,
  Link,
  Euro,
  Clock,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings,
  Target
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { useRituals } from '@/hooks/useRituals'
import { useActivities } from '@/hooks/useActivities'
import { parseNaturalLanguage, formatDeadline } from '@/utils/dateHelpers'

import TaskSelector from '@/components/tasks/TaskSelector'
import RitualsConfig from '@/components/rituals/RitualsConfig'
import AuthScreen from '@/components/auth/AuthScreen'

const TaskItApp = () => {
  const { user, signOut } = useAuth()
  const { 
    tasks, 
    importantTasks, 
    routineTasks, 
    big3Count,
    addTask, 
    updateTask, 
    toggleComplete, 
    toggleBig3 
  } = useTasks()
  const { 
    rituals, 
    completedCount: completedRituals, 
    totalCount: totalRituals,
    toggleRitual, 
    toggleSubtask, 
    resetRituals 
  } = useRituals()
  const { 
    activities, 
    stats: activityStats, 
    addActivity 
  } = useActivities()

  // Local state
  const [quickCapture, setQuickCapture] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [organizingMode, setOrganizingMode] = useState(false)
  const [voiceCommand, setVoiceCommand] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showQuickOptions, setShowQuickOptions] = useState(false)
  const [lastAddedTask, setLastAddedTask] = useState(null)
  const [expandedRitual, setExpandedRitual] = useState(null)
  const [showTaskSelector, setShowTaskSelector] = useState(false)
  const [showRitualsConfig, setShowRitualsConfig] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [newActivity, setNewActivity] = useState({ type: '', notes: '', duration: '' })

  // Voice recognition setup
  const recognition = useRef(null)
  const [voiceSupported, setVoiceSupported] = useState(false)

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = false
      recognition.current.interimResults = false
      recognition.current.lang = 'es-ES'
      
      recognition.current.onresult = (event) => {
        const command = event.results[0][0].transcript
        setVoiceCommand(command)
        setQuickCapture(command)
        setIsListening(false)
        setOrganizingMode(false)
      }

      recognition.current.onerror = () => {
        setIsListening(false)
        setOrganizingMode(false)
      }

      recognition.current.onend = () => {
        setIsListening(false)
      }

      setVoiceSupported(true)
    }
  }, [])

  // Enhanced Quick Capture
  const addQuickTask = async () => {
    if (quickCapture.trim()) {
      const { deadline, amount } = parseNaturalLanguage(quickCapture)
      
      const newTaskData = {
        title: quickCapture,
        important: false,
        deadline,
        amount,
        link: null,
        notes: ''
      }
      
      const result = await addTask(newTaskData)
      
      if (result.data) {
        setLastAddedTask(result.data.id)
        setQuickCapture('')
        setShowQuickOptions(true)
        
        // Ocultar opciones después de 5 segundos
        setTimeout(() => {
          setShowQuickOptions(false)
          setLastAddedTask(null)
        }, 5000)
      }
    }
  }

  const startVoiceCapture = async () => {
    if (!voiceSupported) {
      alert('Tu navegador no soporta reconocimiento de voz')
      return
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      setIsListening(true)
      setOrganizingMode(true)
      setVoiceCommand('')
      
      recognition.current.start()
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('No se pudo acceder al micrófono. Verifica los permisos.')
      setIsListening(false)
      setOrganizingMode(false)
    }
  }

  const stopVoiceCapture = () => {
    if (recognition.current) {
      recognition.current.stop()
    }
    setIsListening(false)
    setOrganizingMode(false)
  }

  const toggleTaskComplete = async (id) => {
    await toggleComplete(id)
  }

  const toggleTaskImportant = async (id) => {
    const result = await toggleBig3(id)
    if (result?.error) {
      alert(result.error)
    }
  }

  const addQuickOption = async (taskId, type, value) => {
    await updateTask(taskId, { [type]: value })
    setShowQuickOptions(false)
    setLastAddedTask(null)
  }

  const handleAddActivity = async () => {
    if (newActivity.type.trim()) {
      await addActivity(newActivity)
      setNewActivity({ type: '', notes: '', duration: '' })
      setShowActivityForm(false)
    }
  }

  const completedToday = tasks.filter(task => task.completed).length

  // Show auth screen if not logged in
  if (!user) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Móvil */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Task-It</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRitualsConfig(true)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Configuración de rituales"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={signOut}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
        
        {/* Enhanced Quick Capture */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: Llamar cliente jueves 15:00 para proyecto..."
              value={quickCapture}
              onChange={(e) => setQuickCapture(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addQuickTask()}
              className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={addQuickTask}
              className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              title="Añadir tarea rápida"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Quick Options para última tarea */}
          {showQuickOptions && lastAddedTask && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-sm font-medium text-blue-900 mb-2">Añadir a tu última tarea:</div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const url = prompt('URL del enlace:')
                    if (url) addQuickOption(lastAddedTask, 'link', url)
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-white text-blue-700 rounded-lg text-sm hover:bg-blue-100"
                >
                  <Link size={14} /> Link
                </button>
                <button
                  onClick={() => {
                    const amount = prompt('Importe en €:')
                    if (amount) addQuickOption(lastAddedTask, 'amount', parseInt(amount))
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-white text-blue-700 rounded-lg text-sm hover:bg-blue-100"
                >
                  <Euro size={14} /> Importe
                </button>
                <button
                  onClick={() => setShowQuickOptions(false)}
                  className="p-1 text-blue-400 hover:text-blue-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Voice Capture */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowTaskSelector(true)}
            disabled={big3Count >= 3}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Target size={16} />
            <span className="text-sm font-medium">
              Seleccionar Big 3 ({big3Count}/3)
            </span>
          </button>
          
          <button
            onClick={isListening ? stopVoiceCapture : startVoiceCapture}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isListening 
                ? 'bg-red-100 text-red-700 animate-pulse' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            <span className="text-sm font-medium">
              {isListening ? 'Escuchando...' : 'Voz'}
            </span>
          </button>
        </div>

        {/* Voice Command Feedback */}
        {organizingMode && voiceCommand && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <MessageSquare size={16} />
              <span className="text-sm font-medium">Comando capturado:</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">"{voiceCommand}"</p>
          </div>
        )}
      </div>

      {/* Enhanced Stats */}
      <div className="p-4 bg-white mx-4 mt-4 rounded-xl border border-gray-200">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-blue-600">{big3Count}</div>
            <div className="text-xs text-gray-600">Big 3</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-600">{completedToday}</div>
            <div className="text-xs text-gray-600">Tareas</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-600">{completedRituals}/{totalRituals}</div>
            <div className="text-xs text-gray-600">Rituales</div>
          </div>
          <div>
            <div className="text-xl font-bold text-orange-600">{activityStats.totalTimeToday}min</div>
            <div className="text-xs text-gray-600">Actividad</div>
          </div>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="p-4 space-y-6">
        
        {/* Big 3 (Tareas Importantes) */}
        {importantTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="text-yellow-500" size={20} />
              Big 3 ({importantTasks.length}/3)
            </h2>
            <div className="space-y-2">
              {importantTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTaskComplete(task.id)
                    }}
                    className="text-gray-400 hover:text-green-500 transition-colors"
                  >
                    <Circle size={20} />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-medium text-gray-900">{task.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {task.deadline && (
                        <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">
                          {formatDeadline(task.deadline)}
                        </span>
                      )}
                      {task.amount && (
                        <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                          {task.amount}€
                        </span>
                      )}
                      {task.link && (
                        <ExternalLink size={12} className="text-blue-500" />
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTaskImportant(task.id)
                    }}
                    className="text-yellow-500 hover:text-gray-400 transition-colors"
                  >
                    <Star size={18} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Rituals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="text-purple-500" size={20} />
              Daily Rituals ({completedRituals}/{totalRituals})
              <span className="text-xs text-gray-500 font-normal">Reset: 6:00 AM</span>
            </h2>
          </div>
          
          <div className="space-y-2">
            {rituals.map((ritual) => (
              <div key={ritual.id}>
                <div
                  className={`flex items-center gap-3 p-3 bg-white rounded-lg border transition-all cursor-pointer ${
                    ritual.completed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                  onClick={() => setExpandedRitual(expandedRitual === ritual.id ? null : ritual.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleRitual(ritual.id)
                    }}
                    className={`transition-colors ${
                      ritual.completed 
                        ? 'text-green-500' 
                        : 'text-gray-400 hover:text-purple-500'
                    }`}
                  >
                    {ritual.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  
                  <span className="text-lg">{ritual.icon}</span>
                  
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${
                      ritual.completed 
                        ? 'text-green-700 line-through' 
                        : 'text-gray-900'
                    }`}>
                      {ritual.title}
                    </span>
                  </div>

                  {expandedRitual === ritual.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {/* Subtasks expandidas */}
                {expandedRitual === ritual.id && ritual.subtasks && (
                  <div className="ml-6 mt-2 space-y-1">
                    {ritual.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                      >
                        <button
                          onClick={() => toggleSubtask(ritual.id, subtask.id)}
                          className={`transition-colors ${
                            subtask.completed 
                              ? 'text-green-500' 
                              : 'text-gray-400 hover:text-green-500'
                          }`}
                        >
                          {subtask.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        </button>
                        <span className={`text-xs ${
                          subtask.completed 
                            ? 'text-green-700 line-through' 
                            : 'text-gray-700'
                        }`}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tareas Rutina */}
        {routineTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Rutina ({routineTasks.length})
            </h2>
            <div className="space-y-2">
              {routineTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTaskComplete(task.id)
                    }}
                    className="text-gray-400 hover:text-green-500 transition-colors"
                  >
                    <Circle size={18} />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700">{task.title}</span>
                    {(task.deadline || task.amount || task.link) && (
                      <div className="flex items-center gap-2 mt-1">
                        {task.deadline && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {formatDeadline(task.deadline)}
                          </span>
                        )}
                        {task.amount && (
                          <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                            {task.amount}€
                          </span>
                        )}
                        {task.link && <ExternalLink size={12} className="text-blue-500" />}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTaskImportant(task.id)
                    }}
                    className="text-gray-300 hover:text-yellow-500 transition-colors"
                  >
                    <Star size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Activity Tracker */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="text-green-500" size={20} />
              Actividades
              <span className="text-sm text-gray-500 font-normal">({activityStats.totalTimeToday} min hoy)</span>
            </h2>
            <button
              onClick={() => setShowActivityForm(!showActivityForm)}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
            >
              + Añadir
            </button>
          </div>

          {/* Enhanced Activity Form */}
          {showActivityForm && (
            <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Tipo de actividad..."
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  placeholder="Duración (min)"
                  value={newActivity.duration}
                  onChange={(e) => setNewActivity({...newActivity, duration: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <textarea
                placeholder="Notas (opcional)..."
                value={newActivity.notes}
                onChange={(e) => setNewActivity({...newActivity, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddActivity}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowActivityForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Activities List */}
          <div className="space-y-2">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{activity.type}</span>
                    {activity.duration > 0 && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                        <Clock size={10} />
                        {activity.duration}min
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{activity.date}</span>
                  </div>
                  {activity.notes && (
                    <p className="text-sm text-gray-600">{activity.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detalle de Tarea</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📌 Tarea:</h4>
                <p className="text-gray-700">{selectedTask.title}</p>
              </div>

              {selectedTask.deadline && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📅 Fecha límite:</h4>
                  <p className="text-gray-700">{formatDeadline(selectedTask.deadline)}</p>
                </div>
              )}

              {selectedTask.link && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🔗 Link:</h4>
                  <a 
                    href={selectedTask.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ExternalLink size={16} />
                    Abrir enlace
                  </a>
                </div>
              )}

              {selectedTask.amount && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">💶 Importe:</h4>
                  <p className="text-gray-700">{selectedTask.amount}€</p>
                </div>
              )}

              {selectedTask.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📝 Notas:</h4>
                  <p className="text-gray-700">{selectedTask.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    toggleTaskComplete(selectedTask.id)
                    setSelectedTask(null)
                  }}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Marcar como completada
                </button>
                <button
                  onClick={() => {
                    toggleTaskImportant(selectedTask.id)
                    setSelectedTask(null)
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Star size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Selector Modal */}
      {showTaskSelector && (
        <TaskSelector
          isOpen={showTaskSelector}
          onClose={() => setShowTaskSelector(false)}
          tasks={routineTasks}
          currentBig3={importantTasks}
        />
      )}

      {/* Rituals Config Modal */}
      {showRitualsConfig && (
        <RitualsConfig
          isOpen={showRitualsConfig}
          onClose={() => setShowRitualsConfig(false)}
        />
      )}
    </div>
  )
}

export default TaskItApp