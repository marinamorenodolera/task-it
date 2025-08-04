import React, { useState, useRef, useEffect } from 'react'
import { 
  Plus, 
  Mic, 
  MicOff, 
  CheckCircle2,
  Circle,
  Target,
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
  LayoutGrid,
  Trash2,
  // ICONOS PARA SECCIONES:
  Folder, Flame, Lightbulb, Home,
  Rocket, BarChart, Briefcase, Palette,
  Heart, Shield, Trophy, Users as UsersIcon, Settings as SettingsIcon
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { useRituals } from '@/hooks/useRituals'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useActivities } from '@/hooks/useActivities'
import { useNavigation } from '@/hooks/useNavigation'
import { parseNaturalLanguage, formatDeadline } from '@/utils/dateHelpers'

import TaskSelector from '@/components/tasks/TaskSelector'
import RitualsConfig from '@/components/rituals/RitualsConfig'
import SmartAttachmentsPanel from '@/components/attachments/SmartAttachmentsPanel'
import TaskDetailScreen from '@/components/tasks/TaskDetailScreen'
import TaskCard from '@/components/tasks/TaskCard'
import BaseButton from '@/components/ui/BaseButton'
import ActivitySettings from '@/components/activities/ActivitySettings'
import PreferencesSection from '@/components/features/settings/PreferencesSection'
import { SECTION_ICON_MAP, ICON_OPTIONS } from '@/utils/sectionIcons'

// ✅ DRAG AND DROP IMPORTS
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import SortableTaskCard from '@/components/tasks/SortableTaskCard'

const TaskItApp = () => {
  const { user, loading, signOut } = useAuth()
  const { registerNavigationCallback, unregisterNavigationCallback } = useNavigation()
  const { 
    tasks, 
    setTasks, // ✅ PARA ACTUALIZACIONES OPTIMISTAS
    importantTasks, 
    routineTasks, 
    waitingTasks,
    urgentTasks,
    completedTasks,
    big3Count,
    addTask, 
    updateTask, 
    toggleComplete, 
    toggleBig3,
    toggleWaitingStatus,
    toggleUrgent,
    deleteTask,
    addAttachment,
    deleteAttachment,
    reloadTaskAttachments,
    getSubtasks,
    loadSubtasks,
    addSubtask,
    deleteSubtask,
    updateTaskOrder,
    moveTaskBetweenSections,
    loadTasks
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
    todayActivities,
    stats: activityStats, 
    predefinedActivities,
    addActivity,
    deleteActivity,
    addPredefinedActivity,
    updatePredefinedActivity,
    deletePredefinedActivity,
    loadHistoryFromSupabase,
    getActivityStats,
    checkDailyReset
  } = useActivities()
  
  // USER PREFERENCES HOOK
  const { 
    sectionOrder: userSectionOrder, 
    visibleSections
  } = useUserPreferences()
  

  // Función helper para renderizar iconos de sección con colores correctos
  const renderSectionIconLocal = (sectionId, size = 20) => {
    // Mapeo de IDs de sección a nombres de iconos
    const sectionIconMapping = {
      'big_three': 'star',        // ⭐ Star amarillo
      'en_espera': 'clock',       // ⏰ Clock naranja  
      'otras_tareas': 'folder',   // 📁 Folder azul
      'completadas': 'check-circle', // ✅ CircleCheck verde
      'urgent': 'flame',          // 🔥 Flame rojo
      'rituals': 'zap',          // ⚡ Zap púrpura
      'activities': 'activity'    // 📊 Activity verde
    }
    
    const iconName = sectionIconMapping[sectionId] || 'folder'
    const iconData = SECTION_ICON_MAP[iconName]
    
    if (!iconData) {
      const fallbackIcon = SECTION_ICON_MAP['folder']
      const IconComponent = fallbackIcon.icon
      return <IconComponent size={size} className={fallbackIcon.color} />
    }
    
    const IconComponent = iconData.icon
    return <IconComponent size={size} className={iconData.color} />
  }

  // FUNCIÓN PARA OBTENER TAREAS DE CADA SECCIÓN
  const getSectionTasks = (sectionId) => {
    
    switch(sectionId) {
      case 'big_three':
        return importantTasks || []
      case 'urgent':
        return urgentTasks || []
      case 'en_espera':  
        return waitingTasks || []
      case 'otras_tareas':
        return routineTasks || []
      case 'completadas':
        return completedTasks || []
      case 'rituals':
        return [] // TODO: Implementar rituals tasks filter
      case 'activities':
        return [] // TODO: Implementar activities tasks filter
      default:
        // ✅ MANEJAR SECCIONES CUSTOM (DESHABILITADO - section_id no existe en tabla)
        if (sectionId.startsWith('custom_')) {
          return [] // Por ahora retornamos array vacío hasta que se implemente section_id
        }
        return []
    }
  }

  // FUNCIÓN PARA RENDERIZAR UNA SECCIÓN
  const renderSection = (section) => {
    if (!section.visible) return null

    // Caso especial para rituales
    if (section.id === 'rituals') {
      return (
        <div key={section.id}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {renderSectionIconLocal('rituals')}
              {section.name} ({completedRituals}/{totalRituals})
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

                {/* Subtasks expandidas - ESTRUCTURA ORIGINAL */}
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
                          {subtask.text || subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Caso especial para actividades
    if (section.id === 'activities') {
      return (
        <div key={section.id}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {renderSectionIconLocal('activities')}
              {section.name} ({todayActivities?.length || 0})
            </h2>
            <button
              onClick={() => setShowActivityForm(true)}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              + Añadir
            </button>
          </div>
          
          <div className="space-y-2">
            {todayActivities && todayActivities.length > 0 ? (
              todayActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-200 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.type}
                      </span>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        {activity.duration} min
                      </span>
                      <span className="text-xs text-gray-500">
                        {activity.time}
                      </span>
                    </div>
                    {activity.notes && (
                      <p className="text-xs text-gray-600 mt-1">{activity.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteActivity(activity.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay actividades registradas hoy
              </p>
            )}
          </div>

          {/* Quick activity buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {predefinedActivities?.slice(0, 4).map((activity) => (
              <button
                key={activity.id}
                onClick={() => {
                  addActivity({
                    type: activity.type,
                    duration: activity.duration,
                    notes: activity.notes || '',
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  })
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {activity.type} {activity.duration}min
              </button>
            ))}
          </div>
        </div>
      )
    }

    // Caso especial para tareas completadas
    if (section.id === 'completadas') {
      const allCompletedItems = [
        ...rituals.filter(ritual => ritual.completed),
        ...(completedTasks || [])
      ]
      
      if (allCompletedItems.length === 0) return null
      
      return (
        <div key={section.id}>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            >
              {renderSectionIconLocal('completadas')}
              {section.name} ({allCompletedItems.length})
              {showCompletedTasks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          
          {showCompletedTasks && (
            <div className="space-y-2">
              {allCompletedItems.map((item, index) => (
                <div key={`completed-${item.id}-${index}`} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-200 transition-all cursor-pointer"
                  onClick={() => {
                    if (item.type === 'task' || !item.type) {
                      toggleTaskComplete(item.id)
                    }
                  }}
                >
                  <button className="transition-colors text-green-500">
                    <CheckCircle2 size={18} style={{ pointerEvents: 'none' }} />
                  </button>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-sm font-medium text-green-700 line-through">
                      {item.title || item.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // Secciones normales (big3, waiting, routine, custom)
    const sectionTasks = getSectionTasks(section.id)
    
    // Renderizado colapsado para secciones vacías
    if (sectionTasks.length === 0) {
      return (
        <div key={section.id}>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            {renderSectionIconLocal(section.id)}
            {section.name} (0)
            {section.id === 'big_three' && '/3'}
          </h2>
        </div>
      )
    }
    
    // Renderizado completo para secciones con tareas
    return (
      <div key={section.id}>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          {renderSectionIconLocal(section.id)}
          {section.name} ({sectionTasks.length})
          {section.id === 'big_three' && '/3'}
        </h2>
        
        {section.id === 'urgent' && (
          <p className="text-sm text-gray-600 mb-3">
            Tareas que requieren atención inmediata y máxima prioridad.
          </p>
        )}
        
        {section.id === 'en_espera' && (
          <p className="text-sm text-gray-600 mb-3">
            Tareas iniciadas esperando respuesta o feedback externo.
          </p>
        )}
        
        {section.id === 'otras_tareas' && (
          <p className="text-sm text-gray-600 mb-3">
            Tareas creadas rápidas. Selecciona las más importantes para Big 3.
          </p>
        )}
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
          accessibility={{
            screenReaderInstructions: {
              draggable: 'Para reordenar, mantén presionado y arrastra'
            }
          }}
        >
          <SortableContext 
            items={sectionTasks.map(task => `${section.id}-${task.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sectionTasks.map((task) => (
                <SortableTaskCard
                  key={`${section.id}-${task.id}`}
                  task={task}
                  sectionId={section.id}
                  onClick={() => handleTaskClick(task)}
                  onComplete={toggleTaskComplete}
                  onMoveBetweenSections={moveTaskBetweenSections}
                  getSubtasks={getSubtasks}
                  expandedTasks={expandedTasks}
                  onToggleExpanded={onToggleExpanded}
                  onToggleTaskComplete={toggleComplete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    )
  }
  
  // Local state
  const [quickCapture, setQuickCapture] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [organizingMode, setOrganizingMode] = useState(false)
  const [voiceCommand, setVoiceCommand] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [showQuickOptions, setShowQuickOptions] = useState(false)
  const [lastAddedTask, setLastAddedTask] = useState(null)
  const [expandedRitual, setExpandedRitual] = useState(null)
  const [showTaskSelector, setShowTaskSelector] = useState(false)
  const [showRitualsConfig, setShowRitualsConfig] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showSectionSettings, setShowSectionSettings] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [newActivity, setNewActivity] = useState({ 
    type: '', 
    notes: '', 
    duration: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  })
  
  // Smart Attachments state
  const [showAttachments, setShowAttachments] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [taskDeadline, setTaskDeadline] = useState('')
  const [currentView, setCurrentView] = useState('main')
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false)
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [showAllCompleted, setShowAllCompleted] = useState(false)
  const [showTaskCreatedModal, setShowTaskCreatedModal] = useState(false)
  const [createdTaskInfo, setCreatedTaskInfo] = useState(null)
  const [scrollPosition, setScrollPosition] = useState(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [navigationDirection, setNavigationDirection] = useState(null)
  const [expandedTasks, setExpandedTasks] = useState([])
  
  // ✅ DRAG AND DROP STATE
  const [activeId, setActiveId] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)

  // Voice recognition setup
  const recognition = useRef(null)
  const [voiceSupported, setVoiceSupported] = useState(false)
  
  // ✅ DRAG AND DROP SENSORS
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Más tolerancia para mobile
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Sincronizar selectedTask cuando tasks cambia
  useEffect(() => {
    if (selectedTask && tasks.length > 0) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id)
      if (updatedTask && JSON.stringify(updatedTask) !== JSON.stringify(selectedTask)) {
        setSelectedTask(updatedTask)
      }
    }
  }, [tasks])

  useEffect(() => {
    // Check for daily reset when app loads
    if (checkDailyReset) {
      checkDailyReset()
    }
    
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
  // Attachment handlers
  const handleAddAttachment = async (attachment) => {
    // Durante la creación de tarea, solo guardar en estado local
    // Los archivos se procesarán cuando se cree la tarea en addQuickTask
    setAttachments(prev => [...prev, attachment])
  }

  const handleSetDeadline = (deadline) => {
    setTaskDeadline(deadline)
    // Auto close the attachments panel after setting deadline
    setTimeout(() => {
      const activeElement = document.activeElement
      if (activeElement && activeElement.tagName !== 'INPUT') {
        setShowAttachments(false)
      }
    }, 1000)
  }

  const handleTaskClick = (task) => {
    // Cross-browser scroll position - ARREGLA MOBILE ISSUES
    const currentScrollY = window.pageYOffset || 
                           document.documentElement.scrollTop || 
                           window.scrollY || 0
    
    // Visual feedback - AÑADE UX PREMIUM
    setIsNavigating(true)
    setNavigationDirection('forward')
    
    // Guardar posición de forma segura
    setScrollPosition(currentScrollY)
    
    // Micro-delay para feedback visual
    setTimeout(() => {
      setSelectedTask(task)
      setCurrentView('task-detail')
      
      // Reset visual feedback después de transición
      setTimeout(() => {
        setIsNavigating(false)
        setNavigationDirection(null)
      }, 150)
    }, 50)
  }

  const handleBackToMain = () => {
    setIsNavigating(true)
    setNavigationDirection('back')
    setCurrentView('main')
    setSelectedTask(null)
    setShouldAutoFocus(false)
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (scrollPosition !== null) {
          // ✅ SCROLL INSTANTÁNEO Y PRECISO - NO SMOOTH
          window.scrollTo(0, scrollPosition)
          
          setTimeout(() => {
            setScrollPosition(null)
            setIsNavigating(false)
            setNavigationDirection(null)
          }, 100)
        } else {
          setIsNavigating(false)
          setNavigationDirection(null)
        }
        
        const activeElement = document.activeElement
        if (activeElement && activeElement.tagName === 'INPUT') {
          activeElement.blur()
        }
      }, 50) // Timing más rápido
    })
  }

  // Register navigation callback for intelligent Daily navigation
  useEffect(() => {
    const handleDailyNavigation = () => {
      if (currentView === 'task-detail' || currentView === 'activity-settings') {
        // Navigate back to main Daily view
        setCurrentView('main')
        setSelectedTask(null)
      }
      // If already on main view, do nothing
    }

    registerNavigationCallback('daily', handleDailyNavigation)

    return () => {
      unregisterNavigationCallback('daily')
    }
  }, [currentView, registerNavigationCallback, unregisterNavigationCallback])

  const handleDeleteAllCompleted = async () => {
    const confirmDelete = window.confirm('¿Estás seguro de que quieres borrar todas las tareas completadas? Esta acción no se puede deshacer.')
    
    if (confirmDelete) {
      try {
        // Separar rituales y tareas
        const completedRituals = allCompletedItems.filter(item => item.subtasks)
        const completedTasksToDelete = allCompletedItems.filter(item => !item.subtasks)
        
        // Eliminar tareas completadas usando deleteTask
        for (const task of completedTasksToDelete) {
          await deleteTask(task.id)
        }
        
        // Para rituales, solo los quitamos de la vista (se resetean diariamente automáticamente)
        // No hacemos nada con los rituales completados, se resetean solos a las 6 AM
        
      } catch (error) {
        console.error('Error al eliminar tareas completadas:', error)
        alert('Hubo un error al eliminar las tareas. Inténtalo de nuevo.')
      }
    }
  }

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
        // Procesar attachments con archivos si existen
        const fileAttachments = attachments.filter(att => att.file)
        if (fileAttachments.length > 0) {
          for (const attachment of fileAttachments) {
            try {
              await addAttachment(result.data.id, attachment)
            } catch (error) {
              console.error('Error subiendo attachment:', error)
            }
          }
        }

        // Mostrar modal de éxito
        setCreatedTaskInfo({
          title: result.data.title,
          id: result.data.id
        })
        setShowTaskCreatedModal(true)
        
        setLastAddedTask(result.data.id)
        setQuickCapture('')
        setShowAttachments(false)
        setAttachments([])
        setTaskDeadline('')
        setShouldAutoFocus(false) // Resetear autoFocus después de crear tarea
        
        // Ocultar modal después de 1.5 segundos
        setTimeout(() => {
          setShowTaskCreatedModal(false)
          setCreatedTaskInfo(null)
          setLastAddedTask(null)
        }, 1500)
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
    try {
      const result = await toggleComplete(id)
      if (result?.error) {
        alert('Error al actualizar tarea: ' + result.error)
      }
    } catch (error) {
      alert('Error inesperado: ' + error.message)
    }
  }

  const toggleTaskImportant = async (id) => {
    const result = await toggleBig3(id)
    if (result?.error) {
      alert(result.error)
    }
  }

  // ✅ DRAG HANDLERS - OPTIMISTAS
  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    
    // Extraer el taskId real del ID compuesto (section-taskId)
    const taskId = active.id.split('-').slice(1).join('-') // En caso de que el taskId tenga guiones
    
    // Encontrar la tarea que se está arrastrando
    const task = [...importantTasks, ...waitingTasks, ...routineTasks, ...urgentTasks].find(t => t.id === taskId)
    setDraggedTask(task)
  }

  // Helper function to map section IDs to database values
  const getSectionDbValue = (sectionId) => {
    const sectionMapping = {
      'big_three': 'big_three',
      'urgent': 'urgent', 
      'en_espera': 'en_espera',
      'otras_tareas': 'otras_tareas',
      'completadas': 'completadas'
    }
    return sectionMapping[sectionId] || sectionId
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    
    setActiveId(null)
    setDraggedTask(null)

    if (!over || active.id === over.id) {
      return
    }

    // Extraer sectionId y taskId de los IDs compuestos (formato: "sectionId-taskId")
    const [activeSectionId, ...activeTaskIdParts] = active.id.split('-')
    const [overSectionId, ...overTaskIdParts] = over.id.split('-') 
    const activeTaskId = activeTaskIdParts.join('-')
    const overTaskId = overTaskIdParts.join('-')

    // ✅ DETECTAR MOVIMIENTO ENTRE SECCIONES
    if (activeSectionId !== overSectionId) {
      // Mapear sectionIds a valores de base de datos
      const sourceSection = getSectionDbValue(activeSectionId)
      const targetSection = getSectionDbValue(overSectionId)
      
      // Llamar función de movimiento entre secciones
      moveTaskBetweenSections(activeTaskId, sourceSection, targetSection, overTaskId)
      return
    }

    // ✅ MOVIMIENTO DENTRO DE LA MISMA SECCIÓN (lógica original)

    // Determinar qué sección contiene la tarea
    let sectionTasks = []
    let sectionName = ''
    
    if (importantTasks.find(t => t.id === activeTaskId)) {
      sectionTasks = importantTasks
      sectionName = 'important'
    } else if (waitingTasks.find(t => t.id === activeTaskId)) {
      sectionTasks = waitingTasks  
      sectionName = 'waiting'
    } else if (routineTasks.find(t => t.id === activeTaskId)) {
      sectionTasks = routineTasks
      sectionName = 'routine'
    } else if (urgentTasks.find(t => t.id === activeTaskId)) {
      sectionTasks = urgentTasks
      sectionName = 'urgent'
    }
    
    const oldIndex = sectionTasks.findIndex(task => task.id === activeTaskId)
    const newIndex = sectionTasks.findIndex(task => task.id === overTaskId)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // 1. REORDENAMIENTO OPTIMISTA INMEDIATO
    const reorderedTasks = arrayMove(sectionTasks, oldIndex, newIndex)
    
    // ✅ ACTUALIZACIÓN OPTIMISTA INMEDIATA DE UI
    const updatedReorderedTasks = reorderedTasks.map((task, index) => ({
      ...task,
      section_order: index + 1
    }))

    // Actualizar estado inmediatamente sin recargar desde BD
    // Filtrar tareas de otras secciones y mantenerlas
    const otherTasks = tasks.filter(task => {
      // Excluir tareas de la sección actual que estamos reordenando
      if (sectionName === 'routine' && task.section === 'otras_tareas') return false
      if (sectionName === 'important' && task.section === 'big_three') return false  
      if (sectionName === 'waiting' && task.section === 'en_espera') return false
      if (sectionName === 'urgent' && task.section === 'urgent') return false
      return true
    })
    
    // ✅ ACTUALIZACIÓN OPTIMISTA INMEDIATA - Combinar tareas de otras secciones con las reordenadas
    const newTasksArray = [...otherTasks, ...updatedReorderedTasks]
    setTasks(newTasksArray)
    
    // 2. PERSISTIR EN BD EN BACKGROUND SIN RECARGAR UI
    setTimeout(async () => {
      let hasErrors = false
      
      // ✅ COMPARAR CON EL ORDEN ORIGINAL, NO CON section_order
      for (let i = 0; i < reorderedTasks.length; i++) {
        const reorderedTask = reorderedTasks[i]
        const originalIndex = sectionTasks.findIndex(t => t.id === reorderedTask.id)
        const newOrder = i + 1
        const oldOrder = originalIndex + 1
        
        // ✅ ACTUALIZAR SIEMPRE si la posición cambió
        if (oldOrder !== newOrder) {
          try {
            await updateTaskOrder(reorderedTask.id, newOrder)
          } catch (error) {
            console.error('Error updating task order:', error)
            hasErrors = true
          }
        }
      }
      
      // ✅ SI HAY ERRORES, RECARGAR PARA RESTAURAR ORDEN ORIGINAL
      if (hasErrors) {
        await loadTasks()
      }
    }, 100) // Pequeño delay para que el usuario vea el cambio inmediato
  }

  const addQuickOption = async (taskId, type, value) => {
    await updateTask(taskId, { [type]: value })
    setShowQuickOptions(false)
    setLastAddedTask(null)
  }

  const handleAddActivity = async () => {
    if (newActivity.type.trim() && newActivity.duration) {
      await addActivity(newActivity)
      setNewActivity({ 
        type: '', 
        notes: '', 
        duration: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      })
      setShowActivityForm(false)
    }
  }

  // Toggle task expansion
  const onToggleExpanded = async (taskId) => {
    const isCurrentlyExpanded = expandedTasks.includes(taskId)
    
    if (isCurrentlyExpanded) {
      // Contraer
      setExpandedTasks(prev => prev.filter(id => id !== taskId))
    } else {
      // Expandir - cargar subtareas primero
      await loadSubtasks(taskId)
      setExpandedTasks(prev => [...prev, taskId])
    }
  }

  // Calcular stats incluyendo todas las secciones (rituales + tareas)
  // Solo contamos tareas activas (no eliminadas, ya que tasks viene del hook filtrado)
  const activeTasks = tasks.filter(task => !task.completed) // Tareas pendientes
  const completedTasksOnly = tasks.filter(task => task.completed) // Tareas completadas
  const totalTasks = activeTasks.length + totalRituals // Total de tareas pendientes + rituales
  const completedTasksCount = completedTasksOnly.length + completedRituals // Completadas + rituales completados
  
  // Para la nueva sección "Tareas Completadas" al final
  const allCompletedItems = [
    ...rituals.filter(ritual => ritual.completed),
    ...completedTasksOnly
  ]

  // Auth is now handled globally by AuthGuard - TaskItApp only renders when authenticated

  // Conditional rendering for different views
  if (currentView === 'activity-settings') {
    return (
      <ActivitySettings
        predefinedActivities={predefinedActivities}
        onBack={() => setCurrentView('main')}
        onAddPredefined={addPredefinedActivity}
        onUpdatePredefined={updatePredefinedActivity}
        onDeletePredefined={deletePredefinedActivity}
        getActivityStats={getActivityStats}
        loadHistoryFromSupabase={loadHistoryFromSupabase}
      />
    )
  }

  if (currentView === 'task-detail' && selectedTask) {
    // Calcular subtareas para el task seleccionado usando el cache
    const subtasksCount = selectedTask ? getSubtasks(selectedTask.id).length : 0
      
    return (
      <TaskDetailScreen 
        task={selectedTask}
        onBack={handleBackToMain}
        onDelete={async (taskId) => {
          const result = await deleteTask(taskId)
          if (!result.error) {
            handleBackToMain()
          }
        }}
        onToggleComplete={async (taskId) => {
          // ✅ Actualizar selectedTask inmediatamente para feedback visual
          if (selectedTask?.id === taskId) {
            setSelectedTask(prev => ({...prev, completed: !prev.completed}))
          }
          await toggleTaskComplete(taskId)
        }}
        onToggleImportant={async (taskId) => {
          // ✅ Actualizar selectedTask inmediatamente para feedback visual
          if (selectedTask?.id === taskId) {
            const newImportantState = !selectedTask.important
            setSelectedTask({...selectedTask, important: newImportantState})
            
            // Ejecutar toggleBig3 y verificar resultado
            const result = await toggleBig3(taskId)
            
            // Si falló, revertir el cambio
            if (result?.error) {
              setSelectedTask({...selectedTask, important: !newImportantState})
              alert(result.error)
            } else {
              // Actualizar con la tarea fresca del estado global
              const updatedTask = tasks.find(t => t.id === taskId)
              if (updatedTask) {
                setSelectedTask(updatedTask)
              }
            }
          } else {
            await toggleBig3(taskId)
          }
        }}
        onUpdate={async (taskId, updatedTask) => {
          const result = await updateTask(taskId, updatedTask)
          if (!result.error) {
            setSelectedTask({...selectedTask, ...updatedTask})
          }
          return result
        }}
        onToggleWaitingStatus={async (taskId) => {
          // ✅ Actualizar selectedTask inmediatamente para feedback visual
          if (selectedTask?.id === taskId) {
            const newSection = selectedTask.section === 'en_espera' ? 'otras_tareas' : 'en_espera'
            setSelectedTask({...selectedTask, section: newSection})
          }
          await toggleWaitingStatus(taskId)
        }}
        onToggleUrgent={async (taskId) => {
          // ✅ Actualizar selectedTask inmediatamente para feedback visual
          if (selectedTask?.id === taskId) {
            const newSection = selectedTask.section === 'urgent' ? 'otras_tareas' : 'urgent'
            setSelectedTask({...selectedTask, section: newSection})
          }
          await toggleUrgent(taskId)
        }}
        onAddAttachment={addAttachment}
        onDeleteAttachment={deleteAttachment}
        onReloadAttachments={reloadTaskAttachments}
        subtasksCount={subtasksCount}
        getSubtasks={getSubtasks}
        loadSubtasks={loadSubtasks}
        onToggleTaskComplete={toggleComplete}
        addSubtask={addSubtask}
        deleteSubtask={deleteSubtask}
      />
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 navigation-transition ${
      isNavigating ? 'navigating' : ''
    } ${
      navigationDirection === 'forward' ? 'navigation-forward' : 
      navigationDirection === 'back' ? 'navigation-back' : ''
    }`}>
      {/* Header Móvil */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Task-It</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Configuración"
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
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              e.stopPropagation();
              addQuickTask(); 
            }} 
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ej: Llamar cliente jueves 15:00 para proyecto..."
              value={quickCapture}
              onChange={(e) => {
                setQuickCapture(e.target.value)
                if (e.target.value.trim() && !showAttachments) {
                  setShowAttachments(true)
                }
              }}
              onFocus={() => {
                setShouldAutoFocus(true) // Usuario quiere crear tarea
                if (quickCapture.trim()) {
                  setShowAttachments(true)
                }
              }}
              onClick={() => {
                setShouldAutoFocus(true) // Usuario hace click para crear tarea
              }}
              className="flex-1 min-h-[44px] touch-manipulation px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus={shouldAutoFocus}
            />
            <BaseButton
              type="submit"
              title="Añadir tarea rápida"
              disabled={!quickCapture.trim()}
              onClick={(e) => {
                // Fallback para móvil si el submit no funciona
                if (e.type === 'click') {
                  e.preventDefault();
                  addQuickTask();
                }
              }}
            >
              <Plus size={20} />
            </BaseButton>
          </form>

          <SmartAttachmentsPanel
            isOpen={showAttachments && quickCapture.trim()}
            onClose={() => setShowAttachments(false)}
            onAttach={handleAddAttachment}
            onDeadlineSet={handleSetDeadline}
            currentDeadline={taskDeadline}
            taskText={quickCapture}
            existingAttachments={attachments}
          />

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
            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 min-h-[44px] bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors touch-manipulation"
          >
            <Target size={16} className="text-green-700" />
            <span className="text-xs sm:text-sm font-medium">
              <span className="hidden sm:inline">Gestionar </span>Tareas
            </span>
          </button>
          
          <button
            onClick={isListening ? stopVoiceCapture : startVoiceCapture}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 min-h-[44px] rounded-lg transition-all touch-manipulation ${
              isListening 
                ? 'bg-red-100 text-red-700 animate-pulse' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            <span className="text-xs sm:text-sm font-medium">
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
      <div className="p-3 sm:p-4 bg-white mx-3 sm:mx-4 mt-4 rounded-xl border border-gray-200">
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
          <div>
            <div className="text-lg sm:text-xl font-bold text-blue-600">{totalTasks}</div>
            <div className="text-xs text-gray-600">Total Tareas</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-green-600">{completedTasksCount}</div>
            <div className="text-xs text-gray-600">Tareas Hechas</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-purple-600">{completedRituals}/{totalRituals}</div>
            <div className="text-xs text-gray-600">Rituales</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-orange-600">{activityStats.totalTimeToday}min</div>
            <div className="text-xs text-gray-600">Actividad</div>
          </div>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        
        {/* RENDERIZADO DINÁMICO DE SECCIONES RESPETANDO CONFIGURACIÓN DEL USUARIO */}
        {visibleSections.map((section) => renderSection(section))}
      </div>


      {/* Task Selector Modal */}
      {showTaskSelector && (
        <TaskSelector
          isOpen={showTaskSelector}
          onClose={() => setShowTaskSelector(false)}
          tasks={routineTasks}
          currentBig3={importantTasks}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">⚙️ Configuración</h3>
              <button onClick={() => setShowSettingsModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <button 
                onClick={() => {
                  setShowSettingsModal(false)
                  setShowRitualsConfig(true)
                }}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
              >
                <span className="text-lg">⚡</span>
                <div>
                  <div className="font-medium">Daily Rituals</div>
                  <div className="text-sm text-gray-500">Configurar rutinas diarias</div>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  setShowSettingsModal(false)
                  setShowSectionSettings(true)
                }}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg"
              >
                <span className="text-lg">📂</span>
                <div>
                  <div className="font-medium">Organización de Secciones</div>
                  <div className="text-sm text-gray-500">Personalizar orden de secciones</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Settings Modal */}
      {showSectionSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">📂 Organización de Secciones</h3>
              <button onClick={() => setShowSectionSettings(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <PreferencesSection />
            </div>
          </div>
        </div>
      )}

      {/* Rituals Config Modal */}
      {showRitualsConfig && (
        <RitualsConfig
          isOpen={showRitualsConfig}
          onClose={() => setShowRitualsConfig(false)}
        />
      )}

      {/* Activity Form Modal */}
      {showActivityForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowActivityForm(false)}
        >
          <div 
            className="bg-white rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Añadir Actividad</h2>
              <button
                onClick={() => setShowActivityForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Predefined activity buttons */}
              <div className="grid grid-cols-2 gap-2">
                {predefinedActivities?.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => {
                      setNewActivity({
                        type: activity.type,
                        duration: activity.duration.toString(),
                        notes: activity.notes || '',
                        date: new Date().toISOString().split('T')[0],
                        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      })
                    }}
                    className="p-3 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                  >
                    <div className="font-medium">{activity.type}</div>
                    <div className="text-xs opacity-75">{activity.duration} min</div>
                  </button>
                ))}
              </div>

              <div className="border-t pt-4">
                <input
                  type="text"
                  placeholder="Tipo de actividad"
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex gap-2 mt-3">
                  <input
                    type="number"
                    placeholder="Duración (min)"
                    value={newActivity.duration}
                    onChange={(e) => setNewActivity({...newActivity, duration: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="time"
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({...newActivity, time: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <textarea
                  placeholder="Notas (opcional)"
                  value={newActivity.notes}
                  onChange={(e) => setNewActivity({...newActivity, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mt-3"
                  rows="2"
                />

                <button
                  onClick={() => {
                    if (newActivity.type && newActivity.duration) {
                      addActivity(newActivity)
                      setNewActivity({
                        type: '',
                        notes: '',
                        duration: '',
                        date: new Date().toISOString().split('T')[0],
                        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      })
                      setShowActivityForm(false)
                    }
                  }}
                  disabled={!newActivity.type || !newActivity.duration}
                  className="w-full mt-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Añadir Actividad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Detalles de tarea</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Task Title */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Título</label>
                <p className="mt-1 text-base text-gray-900">{selectedTask.title}</p>
              </div>

              {/* Task Metadata */}
              <div className="grid grid-cols-2 gap-4">
                {selectedTask.deadline && (
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Calendar size={12} />
                      Fecha límite
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{formatDeadline(selectedTask.deadline)}</p>
                  </div>
                )}

                {selectedTask.amount && (
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Euro size={12} />
                      Importe
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTask.amount}€</p>
                  </div>
                )}

                {selectedTask.link && (
                  <div className="col-span-2">
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Link size={12} />
                      Enlace
                    </label>
                    <a
                      href={selectedTask.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      {selectedTask.link}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedTask.notes && (
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <MessageSquare size={12} />
                    Notas
                  </label>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{selectedTask.notes}</p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${selectedTask.completed ? 'text-green-600' : 'text-gray-600'}`}>
                    {selectedTask.completed ? 'Completada' : 'Pendiente'}
                  </span>
                  {selectedTask.important && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
                      <Star size={12} fill="currentColor" />
                      Big 3
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      try {
                        toggleTaskComplete(selectedTask.id)
                        setSelectedTask({...selectedTask, completed: !selectedTask.completed})
                      } catch (error) {
                        console.error('Error in Modal Toggle Complete:', error)
                        alert('Error al cambiar el estado de la tarea. Inténtalo de nuevo.')
                      }
                    }}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      selectedTask.completed
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {selectedTask.completed ? 'Marcar pendiente' : 'Completar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificación sutil de Tarea Creada */}
      {showTaskCreatedModal && createdTaskInfo && (
        <div className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50 animate-slide-in-right">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm mx-auto sm:mx-0">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">✅</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Tarea creada</p>
                <p className="text-xs text-gray-600 truncate">
                  "{createdTaskInfo.title}" → Otras Tareas
                </p>
              </div>
              <button
                onClick={() => {
                  toggleBig3(createdTaskInfo.id)
                  setShowTaskCreatedModal(false)
                  setCreatedTaskInfo(null)
                }}
                className="text-yellow-500 hover:text-yellow-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                title="Marcar como Big 3"
              >
                ⭐
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detalle de Actividad</h3>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🏃‍♂️ Actividad:</h4>
                <p className="text-gray-700">{selectedActivity.type}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">⏱️ Duración:</h4>
                <p className="text-gray-700">{selectedActivity.duration || 0} minutos</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">📅 Fecha y hora:</h4>
                <p className="text-gray-700">
                  {new Date(selectedActivity.created_at).toLocaleDateString('es-ES')} - {' '}
                  {selectedActivity.time ? selectedActivity.time.slice(0, 5) : new Date(selectedActivity.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {selectedActivity.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📝 Notas:</h4>
                  <p className="text-gray-700">{selectedActivity.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setSelectedActivity(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg transition-colors min-h-[44px] touch-manipulation"
              >
                Cerrar
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteActivity(selectedActivity.id);
                    setSelectedActivity(null);
                  } catch (error) {
                    console.error('Error eliminando actividad:', error);
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-colors min-h-[44px] touch-manipulation"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TaskItApp