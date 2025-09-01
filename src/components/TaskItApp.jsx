import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { 
  Plus, 
 
  CheckCircle2,
  Circle,
  Target,
  Zap,
  Activity,
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
  Heart, Shield, Trophy, Users as UsersIcon, Settings as SettingsIcon,
  Image as ImageIcon, FileText, StickyNote, User, MapPin, CalendarDays, ShoppingCart, Inbox
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { useRituals } from '@/hooks/useRituals'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useActivities } from '@/hooks/useActivities'
import { useNavigation } from '@/hooks/useNavigation'
import { parseNaturalLanguage, formatDeadline } from '@/utils/dateHelpers'
import { triggerHapticFeedback } from '@/utils/haptics'

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
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import SortableTaskCard from '@/components/tasks/SortableTaskCard'
import ActivityModal from '@/components/activities/ActivityModal'

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
    updateSubtaskOrder,
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

  // ✅ MEMOIZADO - FUNCIÓN PARA OBTENER TAREAS DE CADA SECCIÓN
  const getSectionTasks = useCallback((sectionId) => {
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
  }, [importantTasks, urgentTasks, waitingTasks, routineTasks, completedTasks])

  // ✅ ESTADO PARA DRAG CROSS-SECTION (inspirado en Weekly)
  const [dragOverSection, setDragOverSection] = useState(null)

  // ✅ COMPONENTE DROPPABLE PARA SECCIONES VACÍAS
  const DroppableSection = ({ sectionId, children }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: sectionId
    })
    
    return (
      <div 
        ref={setNodeRef}
        data-section={sectionId}
        className={`transition-all duration-200 rounded-lg p-4 min-h-[60px] ${
          isOver || dragOverSection === sectionId
            ? 'bg-blue-50 ring-2 ring-blue-300 ring-opacity-50' 
            : ''
        }`}
      >
        {children}
      </div>
    )
  }

  // ✅ FUNCIÓN PARA RENDERIZAR TASK SECTION CON DROP ZONE
  const renderTaskSection = (section) => {
    if (!section.visible) return null

    const sectionTasks = getSectionTasks(section.id)
    
    // Renderizado colapsado para secciones vacías
    if (sectionTasks.length === 0) {
      return (
        <DroppableSection key={section.id} sectionId={section.id}>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            {renderSectionIconLocal(section.id)}
            {section.name} (0)
            {section.id === 'big_three' && '/3'}
            {dragOverSection === section.id && draggedTask && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium animate-pulse">
                SOLTAR AQUÍ
              </span>
            )}
          </h2>
          
          {/* Section divider after header */}
          <div className="border-b border-gray-200/30 mx-0 my-3"></div>
          
          {/* Empty state con mensaje para drag */}
          {dragOverSection === section.id && draggedTask && (
            <div className="text-center py-4 text-blue-600">
              <p className="text-sm font-medium">Suelta aquí para mover a {section.name}</p>
            </div>
          )}
        </DroppableSection>
      )
    }
    
    // Renderizado completo para secciones con tareas
    return (
      <div 
        key={section.id}
        data-section={section.id}
        className={`transition-all duration-200 rounded-lg p-2 ${
          dragOverSection === section.id 
            ? 'bg-blue-50 ring-2 ring-blue-300 ring-opacity-50' 
            : ''
        }`}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          {renderSectionIconLocal(section.id)}
          {section.name} ({sectionTasks.length})
          {section.id === 'big_three' && '/3'}
          {dragOverSection === section.id && draggedTask && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium animate-pulse">
              SOLTAR AQUÍ
            </span>
          )}
        </h2>
        
        
        
        
        {/* Section divider after header/description, before tasks */}
        <div className="border-b border-gray-200/30 mx-0 my-3"></div>
        
        <div className="space-y-2">
          {sectionTasks.map((task) => (
            <SortableTaskCard
              key={`${section.id}-${task.id}`}
              task={task}
              sectionId={section.id}
              onClick={selectionMode ? () => {
                setSelectedTasks(prev => 
                  prev.includes(task.id) 
                    ? prev.filter(id => id !== task.id)
                    : [...prev, task.id]
                )
              } : () => handleTaskClick(task)}
              onComplete={toggleTaskComplete}
              onMoveBetweenSections={moveTaskBetweenSections}
              getSubtasks={getSubtasks}
              expandedTasks={expandedTasks}
              onToggleExpanded={onToggleExpanded}
              onToggleTaskComplete={toggleComplete}
              selectionMode={selectionMode}
              isSelected={selectedTasks.includes(task.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  // FUNCIÓN PARA RENDERIZAR UNA SECCIÓN (incluye rituales y actividades)
  const renderSection = (section) => {
    if (!section.visible) return null

    // Para secciones de tareas normales, usar renderTaskSection
    if (['big_three', 'urgent', 'en_espera', 'otras_tareas'].includes(section.id)) {
      return renderTaskSection(section)
    }

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
          
          {/* Section divider after header */}
          <div className="border-b border-gray-200/30 mx-0 my-3"></div>
          
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
            {allCompletedItems.length > 0 && (
              <span 
                onClick={handleDeleteAllCompleted}
                className="text-sm text-red-500 cursor-pointer hover:text-red-700 underline py-1 px-2 touch-manipulation"
                title="Eliminar todas las tareas completadas"
              >
                eliminar todas
              </span>
            )}
          </div>
          
          {/* Section divider */}
          <div className="border-b border-gray-200/30 mx-0 my-3"></div>
          
          {showCompletedTasks && (
            <div className="space-y-2">
              {allCompletedItems.map((item, index) => (
                <div key={`completed-${item.id}-${index}`} className="flex items-center gap-2 p-2 bg-transparent border-0 opacity-60 rounded-lg hover:bg-gray-50/30 transition-all cursor-pointer"
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
        
        
        
      </div>
    )
  }
  
  // Local state
  const [quickCapture, setQuickCapture] = useState('')
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [showQuickOptions, setShowQuickOptions] = useState(false)
  const [lastAddedTask, setLastAddedTask] = useState(null)
  const [expandedRitual, setExpandedRitual] = useState(null)
  const [showTaskSelector, setShowTaskSelector] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState([])
  const [showMoveModal, setShowMoveModal] = useState(false)
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
  const [selectedSection, setSelectedSection] = useState('otras_tareas')
  const [currentView, setCurrentView] = useState('main')
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false)
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [showAllCompleted, setShowAllCompleted] = useState(false)
  const [showTaskCreatedModal, setShowTaskCreatedModal] = useState(false)
  const [createdTaskInfo, setCreatedTaskInfo] = useState(null)
  const [scrollPosition, setScrollPosition] = useState(null)
  // ✅ ELIMINADO - estados de navegación innecesarios para complejidad visual
  const [expandedTasks, setExpandedTasks] = useState([])
  
  // ✅ DRAG AND DROP STATE
  const [activeId, setActiveId] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)

  
  // ✅ DRAG AND DROP SENSORS
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,      // Desktop más rápido que mobile
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 750,      // 750ms = long press claro
        tolerance: 8,    // Más tolerancia para mobile
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
    // ✅ SIMPLE - Solo guardar posición y navegar
    setScrollPosition(window.scrollY)
    setSelectedTask(task)
    setCurrentView('task-detail')
  }

  const handleBackToMain = () => {
    // ✅ SIMPLE - Sin timeouts anidados ni requestAnimationFrame
    setCurrentView('main')
    setSelectedTask(null)
    setShouldAutoFocus(false)
    
    // Restaurar scroll position si existe
    if (scrollPosition !== null) {
      window.scrollTo(0, scrollPosition)
      setScrollPosition(null)
    }
    
    // Blur active input if any
    const activeElement = document.activeElement
    if (activeElement && activeElement.tagName === 'INPUT') {
      activeElement.blur()
    }
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
    const completedTasksToDelete = allCompletedItems.filter(item => !item.subtasks)
    const completedRitualsCount = allCompletedItems.filter(item => item.subtasks).length
    
    let confirmMessage = `¿Eliminar todas las tareas completadas?`
    if (completedTasksToDelete.length > 0) {
      confirmMessage += `\n\n${completedTasksToDelete.length} tareas serán eliminadas permanentemente (incluidos sus adjuntos).`
    }
    if (completedRitualsCount > 0) {
      confirmMessage += `\n\n${completedRitualsCount} rituales completados se mantendrán (se resetean automáticamente a las 6:00 AM).`
    }
    
    const confirmDelete = window.confirm(confirmMessage)
    
    if (confirmDelete) {
      // Cambiar texto del botón a "eliminando..."
      const deleteButton = document.querySelector('[title="Eliminar todas las tareas completadas"]')
      const originalText = deleteButton?.textContent
      if (deleteButton) {
        deleteButton.textContent = 'eliminando...'
        deleteButton.style.pointerEvents = 'none'
        deleteButton.style.opacity = '0.6'
      }
      
      try {
        let deletedCount = 0
        
        // Eliminar tareas completadas una por una
        for (const task of completedTasksToDelete) {
          try {
            // deleteTask ya maneja la eliminación de adjuntos via attachmentService.deleteTaskAttachments
            const result = await deleteTask(task.id)
            if (!result.error) {
              deletedCount++
            } else {
              console.error(`Error eliminando tarea ${task.id}:`, result.error)
            }
          } catch (error) {
            console.error(`Error eliminando tarea ${task.id}:`, error)
          }
        }
        
        // Los rituales completados no se tocan - se resetean automáticamente
        
        // Mostrar resultado
        if (deletedCount > 0) {
          alert(`${deletedCount} tarea${deletedCount > 1 ? 's' : ''} eliminada${deletedCount > 1 ? 's' : ''} correctamente.`)
        } else if (completedTasksToDelete.length > 0) {
          alert('No se pudieron eliminar las tareas. Inténtalo de nuevo.')
        }
        
      } catch (error) {
        console.error('Error al eliminar tareas completadas:', error)
        alert('Hubo un error al eliminar las tareas. Inténtalo de nuevo.')
      } finally {
        // Restaurar botón
        if (deleteButton && originalText) {
          deleteButton.textContent = originalText
          deleteButton.style.pointerEvents = 'auto'
          deleteButton.style.opacity = '1'
        }
      }
    }
  }

  // Helper function to blur input and hide keyboard
  const blurQuickCaptureInput = () => {
    const quickCaptureInput = document.querySelector('input[placeholder*="Llamar cliente"]')
    if (quickCaptureInput) {
      quickCaptureInput.blur()
    }
  }

  const addQuickTask = async () => {
    if (quickCapture.trim()) {
      const { deadline, amount } = parseNaturalLanguage(quickCapture)
      
      const newTaskData = {
        title: quickCapture,
        important: selectedSection === 'big_three',
        deadline,
        amount,
        link: null,
        notes: '',
        section: selectedSection
      }
      
      const result = await addTask(newTaskData)
      // ✅ OPTIMISTIC UPDATE - NO necesita reload, useTasks ya actualiza el estado
      
      if (result.data) {
        // Procesar TODOS los attachments
        if (attachments.length > 0) {
          for (const attachment of attachments) {
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
        setSelectedSection('otras_tareas') // Reset to default
        setShouldAutoFocus(false) // Resetear autoFocus después de crear tarea
        
        // ✅ HIDE KEYBOARD after task creation (mobile UX)
        blurQuickCaptureInput()
        
        // Ocultar modal después de 1.5 segundos
        setTimeout(() => {
          setShowTaskCreatedModal(false)
          setCreatedTaskInfo(null)
          setLastAddedTask(null)
        }, 1500)
      }
    }
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

  // ✅ DRAG HANDLERS - INSPIRADOS EN WEEKLY SYSTEM
  const handleDragStart = (event) => {
    triggerHapticFeedback('medium')  // Vibración al activar drag
    const { active } = event
    setActiveId(active.id)
    
    // Extraer el taskId real del ID compuesto (section-taskId)
    const taskId = active.id.split('-').slice(1).join('-') // En caso de que el taskId tenga guiones
    
    // Encontrar la tarea que se está arrastrando
    const task = [...importantTasks, ...waitingTasks, ...routineTasks, ...urgentTasks].find(t => t.id === taskId)
    setDraggedTask(task)
  }

  // ✅ DRAG OVER HANDLER - PARA HIGHLIGHT DE SECCIONES (inspirado en Weekly)
  const handleDragOver = (event) => {
    const { over } = event
    
    if (!over || !draggedTask) {
      setDragOverSection(null)
      return
    }

    const overId = over.id
    const draggedSectionId = activeId?.split('-')[0]

    // Detectar si estamos sobre una sección diferente
    if (overId.includes('-')) {
      // Es una tarea - extraer sección
      const overSectionId = overId.split('-')[0]
      
      if (overSectionId !== draggedSectionId) {
        setDragOverSection(overSectionId)
      } else {
        setDragOverSection(null)
      }
    } else {
      // Es una sección droppable directamente (sección vacía)
      const validSections = ['big_three', 'urgent', 'en_espera', 'otras_tareas']
      if (validSections.includes(overId) && overId !== draggedSectionId) {
        setDragOverSection(overId)
      } else {
        setDragOverSection(null)
      }
    }
  }

  // ✅ DRAG LEAVE HANDLER
  const handleDragLeave = () => {
    // No limpiar inmediatamente para evitar flickering
    // setDragOverSection(null)
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
    setDragOverSection(null)  // ✅ Limpiar highlight de secciones

    if (!over || active.id === over.id) {
      return
    }

    // Extraer sectionId y taskId de los IDs
    const [activeSectionId, ...activeTaskIdParts] = active.id.split('-')
    const activeTaskId = activeTaskIdParts.join('-')

    // ✅ MANEJAR DROP EN SECCIÓN VACÍA (droppable zone directa)
    if (!over.id.includes('-')) {
      // Drop directo en una sección vacía
      const targetSectionId = over.id
      const sourceSection = getSectionDbValue(activeSectionId)
      const targetSection = getSectionDbValue(targetSectionId)
      
      console.log('🎯 DROP EN SECCIÓN VACÍA - CROSS SECTION DRAG:', {
        taskId: activeTaskId,
        from: activeSectionId,
        to: targetSectionId,
        sourceSection,
        targetSection
      })
      
      moveTaskBetweenSections(activeTaskId, sourceSection, targetSection, null)
      return
    }

    // ✅ MANEJAR DROP EN TAREA (cross-section o reordering)
    const [overSectionId, ...overTaskIdParts] = over.id.split('-') 
    const overTaskId = overTaskIdParts.join('-')

    // ✅ DETECTAR MOVIMIENTO ENTRE SECCIONES
    if (activeSectionId !== overSectionId) {
      // Mapear sectionIds a valores de base de datos
      const sourceSection = getSectionDbValue(activeSectionId)
      const targetSection = getSectionDbValue(overSectionId)
      
      console.log('🔄 DROP EN OTRA TAREA - CROSS SECTION DRAG:', {
        taskId: activeTaskId,
        from: activeSectionId,
        to: overSectionId,
        targetTaskId: overTaskId,
        sourceSection,
        targetSection
      })
      
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
        await loadTasks() // Solo recargar si hay errores reales
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

  // ✅ MEMOIZADO - Calcular stats incluyendo todas las secciones (rituales + tareas)
  const { activeTasks, completedTasksOnly, totalTasks, completedTasksCount } = useMemo(() => {
    const activeTasks = tasks.filter(task => !task.completed) // Tareas pendientes
    const completedTasksOnly = tasks.filter(task => task.completed) // Tareas completadas
    const totalTasks = activeTasks.length + totalRituals // Total de tareas pendientes + rituales
    const completedTasksCount = completedTasksOnly.length + completedRituals // Completadas + rituales completados
    
    return { activeTasks, completedTasksOnly, totalTasks, completedTasksCount }
  }, [tasks, totalRituals, completedRituals])
  
  // ✅ MEMOIZADO - Para la nueva sección "Tareas Completadas" al final
  const allCompletedItems = useMemo(() => [
    ...rituals.filter(ritual => ritual.completed),
    ...completedTasksOnly
  ], [rituals, completedTasksOnly])

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
          // ✅ UNIFICADO - Solo useTasks maneja el estado, se sincroniza automáticamente
          await toggleTaskComplete(taskId)
          // selectedTask se actualiza via useEffect cuando tasks cambia
        }}
        onToggleImportant={async (taskId) => {
          // ✅ UNIFICADO - Solo useTasks maneja el estado
          const result = await toggleBig3(taskId)
          if (result?.error) {
            alert(result.error)
          }
          // selectedTask se actualiza automáticamente via useEffect
        }}
        onUpdate={async (taskId, updatedTask) => {
          // ✅ UNIFICADO - Solo useTasks maneja el estado
          const result = await updateTask(taskId, updatedTask)
          // selectedTask se actualiza automáticamente via useEffect
          return result
        }}
        onToggleWaitingStatus={async (taskId) => {
          // ✅ UNIFICADO - Solo useTasks maneja el estado
          await toggleWaitingStatus(taskId)
          // selectedTask se actualiza automáticamente via useEffect
        }}
        onToggleUrgent={async (taskId) => {
          // ✅ UNIFICADO - Solo useTasks maneja el estado
          await toggleUrgent(taskId)
          // selectedTask se actualiza automáticamente via useEffect
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
        updateSubtaskOrder={updateSubtaskOrder}
      />
    )
  }

  return (
    <div 
      className="min-h-screen bg-white"
      onClick={(e) => {
        // Hide keyboard when clicking outside the quick capture input
        if (!e.target.closest('input[placeholder*="Llamar cliente"]') && 
            !e.target.closest('.quick-capture-form') &&
            !e.target.closest('button[type="submit"]')) {
          blurQuickCaptureInput()
        }
      }}
    >
      {/* ✅ ELIMINADO - clases CSS de navegación innecesarias */}
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
            className="flex gap-2 quick-capture-form"
          >
            <input
              type="text"
              placeholder="Ej: Llamar cliente jueves 15:00 para proyecto..."
              value={quickCapture}
              onChange={(e) => {
                setQuickCapture(e.target.value)
                // ✅ NO auto-show attachments - menos molesto para el usuario
              }}
              onFocus={() => {
                setShouldAutoFocus(true) // Usuario quiere crear tarea
                // ✅ NO auto-show attachments en focus - solo cuando usuario lo pida
              }}
              onClick={() => {
                setShouldAutoFocus(true) // Usuario hace click para crear tarea
              }}
              onKeyDown={(e) => {
                // Hide keyboard on Escape key
                if (e.key === 'Escape') {
                  blurQuickCaptureInput()
                  setQuickCapture('')
                  setShouldAutoFocus(false)
                }
              }}
              onBlur={() => {
                // Clear shouldAutoFocus when input loses focus
                setShouldAutoFocus(false)
              }}
              className="flex-1 min-h-[60px] touch-manipulation px-4 py-4 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Enhanced Quick Actions - Modern Card Design */}
          {quickCapture.trim() && (
            <div className="space-y-3">
              {/* Section Selector - Compact Modern Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                <button
                  onClick={() => setSelectedSection(
                    selectedSection === 'big_three' ? 'otras_tareas' : 'big_three'
                  )}
                  className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                    selectedSection === 'big_three'
                      ? 'border-yellow-300 ring-2 ring-yellow-200 bg-yellow-50'
                      : 'border-gray-200 hover:border-yellow-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Star 
                      className={`${
                        selectedSection === 'big_three' ? 'text-yellow-600' : 'text-yellow-500'
                      }`}
                      size={16}
                      fill={selectedSection === 'big_three' ? 'currentColor' : 'none'}
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Big 3</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setSelectedSection(
                    selectedSection === 'urgent' ? 'otras_tareas' : 'urgent'
                  )}
                  className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                    selectedSection === 'urgent'
                      ? 'border-red-300 ring-2 ring-red-200 bg-red-50'
                      : 'border-gray-200 hover:border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Flame 
                      className={`${
                        selectedSection === 'urgent' ? 'text-red-600' : 'text-red-500'
                      }`}
                      size={16}
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Urgente</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setSelectedSection(
                    selectedSection === 'en_espera' ? 'otras_tareas' : 'en_espera'
                  )}
                  className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                    selectedSection === 'en_espera'
                      ? 'border-orange-300 ring-2 ring-orange-200 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock 
                      className={`${
                        selectedSection === 'en_espera' ? 'text-orange-600' : 'text-orange-500'
                      }`}
                      size={16}
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">En Espera</span>
                  </div>
                </button>
                
                {/* Attachments Card */}
                {!showAttachments && (
                  <button
                    onClick={() => setShowAttachments(true)}
                    className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                      attachments.length > 0 || taskDeadline
                        ? 'border-blue-300 ring-2 ring-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Link 
                        className={`${
                          attachments.length > 0 || taskDeadline ? 'text-blue-600' : 'text-blue-500'
                        }`}
                        size={16}
                      />
                      <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Adjuntos</span>
                    </div>
                  </button>
                )}
                
                {/* Otras Tareas (Default) Button */}
                <button
                  onClick={() => setSelectedSection('otras_tareas')}
                  className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                    selectedSection === 'otras_tareas'
                      ? 'border-blue-300 ring-2 ring-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Folder 
                      className={`${
                        selectedSection === 'otras_tareas' ? 'text-blue-600' : 'text-blue-500'
                      }`}
                      size={16}
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Otras</span>
                  </div>
                </button>
              </div>
              
              {/* Attachments Preview */}
              {(attachments.length > 0 || taskDeadline) && (
                <div className="flex flex-wrap gap-1">
                  {taskDeadline && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                      <Calendar size={12} />
                      {new Date(taskDeadline).toLocaleDateString('es-ES')}
                    </div>
                  )}
                  {attachments.map((att, index) => {
                    // Determinar color y contenido según tipo
                    let bgColor, textColor, icon, label
                    
                    if (att.file && att.file.type?.startsWith('image/')) {
                      bgColor = 'bg-pink-100'
                      textColor = 'text-pink-700'
                      icon = <ImageIcon size={12} />
                      label = 'Imagen'
                    } else if (att.file && !att.file.type?.startsWith('image/')) {
                      bgColor = 'bg-blue-100'
                      textColor = 'text-blue-700'
                      icon = <FileText size={12} />
                      label = 'Documento'
                    } else if (att.type === 'note') {
                      bgColor = 'bg-purple-100'
                      textColor = 'text-purple-700'
                      icon = <StickyNote size={12} />
                      label = 'Nota'
                    } else if (att.type === 'amount') {
                      bgColor = 'bg-green-100'
                      textColor = 'text-green-700'
                      icon = <Euro size={12} />
                      label = 'Importe'
                    } else if (att.type === 'contact') {
                      bgColor = 'bg-indigo-100'
                      textColor = 'text-indigo-700'
                      icon = <User size={12} />
                      label = 'Contacto'
                    } else if (att.type === 'location') {
                      bgColor = 'bg-red-100'
                      textColor = 'text-red-700'
                      icon = <MapPin size={12} />
                      label = 'Ubicación'
                    } else {
                      bgColor = 'bg-blue-100'
                      textColor = 'text-blue-700'
                      icon = <Link size={12} />
                      label = att.type || 'Adjunto'
                    }
                    
                    return (
                      <div key={index} className={`flex items-center gap-1 px-2 py-1 ${bgColor} ${textColor} rounded text-xs`}>
                        {icon}
                        {label}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          
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

        {/* Activity & Task Management */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              if (selectionMode) {
                setSelectionMode(false)
                setSelectedTasks([])
              } else {
                setSelectionMode(true)
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 min-h-[44px] rounded-lg transition-colors touch-manipulation ${
              selectionMode 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            <Target size={16} className={selectionMode ? "text-red-700" : "text-green-700"} />
            <span className="text-xs sm:text-sm font-medium">
              {selectionMode ? 'Cancelar' : <><span className="hidden sm:inline">Gestionar </span>Tareas</>}
            </span>
          </button>
          
          <button
            onClick={() => setShowActivityModal(true)}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 min-h-[44px] rounded-lg transition-all touch-manipulation ${
              activityStats.totalTimeToday > 0 
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 ring-2 ring-purple-300' 
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            {activityStats.totalTimeToday > 0 ? (
              <Trophy size={16} className="text-purple-700" />
            ) : (
              <Activity size={16} />
            )}
            <span className="text-xs sm:text-sm font-medium">
              {activityStats.totalTimeToday > 0 ? (
                <><span className="hidden sm:inline">Actividad </span><span className="font-bold text-purple-700">{activityStats.totalTimeToday}min<span className="hidden sm:inline"> conseguidos</span>!</span></>
              ) : (
                'Actividad'
              )}
            </span>
          </button>
        </div>
      </div>


      {/* Lista de Tareas */}
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        
        {/* ✅ DNDCONTEXT UNIFICADO - INSPIRADO EN WEEKLY SYSTEM */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          modifiers={[restrictToVerticalAxis]}
          accessibility={{
            screenReaderInstructions: {
              draggable: 'Para mover entre secciones, mantén presionado y arrastra'
            }
          }}
        >
          {/* ✅ SORTABLECONTEXT UNIFICADO CON TODAS LAS TAREAS */}
          <SortableContext 
            items={[
              ...importantTasks.map(task => `big_three-${task.id}`),
              ...urgentTasks.map(task => `urgent-${task.id}`),
              ...waitingTasks.map(task => `en_espera-${task.id}`),
              ...routineTasks.map(task => `otras_tareas-${task.id}`)
            ]}
            strategy={verticalListSortingStrategy}
          >
            {/* RENDERIZADO DINÁMICO DE SECCIONES RESPETANDO CONFIGURACIÓN DEL USUARIO */}
            {visibleSections.map((section) => renderSection(section))}
          </SortableContext>
        </DndContext>
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

      {/* Activity Modal */}
      <ActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        predefinedActivities={predefinedActivities}
        todayActivities={todayActivities}
        stats={activityStats}
        onAddActivity={addActivity}
      />

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

      {/* Floating Action Button */}
      {selectionMode && selectedTasks.length > 0 && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={() => setShowMoveModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all min-h-[44px] touch-manipulation"
          >
            <Target size={16} />
            <span className="font-medium">
              Mover {selectedTasks.length} tarea{selectedTasks.length > 1 ? 's' : ''}
            </span>
          </button>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowMoveModal(false)}
        >
          <div 
            className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-semibold">Mover {selectedTasks.length} tarea{selectedTasks.length > 1 ? 's' : ''}</h3>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Daily Sections */}
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Calendar size={18} className="text-blue-600" />
                  Daily
                </h4>
                <div className="grid grid-cols-2 gap-1 ml-6">
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { section: 'big_three', page: 'daily' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-yellow-50 rounded transition-colors border border-yellow-200 bg-yellow-50"
                  >
                    <Star size={14} className="text-yellow-500" />
                    <div className="text-sm font-medium">Big 3</div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { section: 'otras_tareas', page: 'daily' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-blue-100 rounded transition-colors border border-blue-200 bg-blue-50"
                  >
                    <Folder size={14} className="text-blue-500" />
                    <div className="text-sm font-medium">Otras Tareas</div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { section: 'en_espera', page: 'daily' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-orange-100 rounded transition-colors border border-orange-200 bg-orange-50"
                  >
                    <Clock size={14} className="text-orange-500" />
                    <div className="text-sm font-medium">En Espera</div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { section: 'urgent', page: 'daily' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-red-100 rounded transition-colors border border-red-200 bg-red-50"
                  >
                    <Flame size={14} className="text-red-500" />
                    <div className="text-sm font-medium">Urgente</div>
                  </button>
                </div>
              </div>

              {/* Inbox Sections */}
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Inbox size={18} className="text-blue-600" />
                  Inbox Sections
                </h4>
                <div className="grid grid-cols-2 gap-1 ml-6">
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { 
                          page: 'inbox', 
                          section: 'otras_tareas',
                          status: 'inbox',
                          scheduled_date: null
                        })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-blue-100 rounded transition-colors border border-blue-200 bg-blue-50 min-h-[44px] touch-manipulation"
                  >
                    <Inbox size={14} className="text-blue-500" />
                    <div className="text-sm font-medium">Inbox</div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { section: 'monthly', page: 'inbox' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-purple-100 rounded transition-colors border border-purple-200 bg-purple-50 min-h-[44px] touch-manipulation"
                  >
                    <CalendarDays size={14} className="text-purple-500" />
                    <div className="text-sm font-medium">Monthly</div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { section: 'shopping', page: 'inbox' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-green-100 rounded transition-colors border border-green-200 bg-green-50 min-h-[44px] touch-manipulation"
                  >
                    <ShoppingCart size={14} className="text-green-500" />
                    <div className="text-sm font-medium">Shopping</div>
                  </button>
                </div>
              </div>

              {/* Weekly Days */}
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Calendar size={18} className="text-purple-600" />
                  Semanal
                </h4>
                <div className="grid grid-cols-3 gap-1 ml-6">
                  {['lunes', 'martes', 'miércoles', 'jueves', 'viernes'].map((dayName, index) => {
                    const today = new Date()
                    const startOfWeek = new Date(today)
                    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Lunes
                    const targetDate = new Date(startOfWeek)
                    targetDate.setDate(startOfWeek.getDate() + index)
                    const dateString = targetDate.toISOString().split('T')[0]
                    
                    return (
                      <button
                        key={dayName}
                        onClick={async () => {
                          for (const taskId of selectedTasks) {
                            await updateTask(taskId, { 
                              page: 'weekly', 
                              section: 'otras_tareas',
                              scheduled_date: dateString 
                            })
                          }
                          setShowMoveModal(false)
                          setSelectionMode(false)
                          setSelectedTasks([])
                        }}
                        className="flex items-center justify-center gap-1 p-2 text-center hover:bg-blue-100 rounded transition-colors border border-blue-200 bg-blue-50"
                      >
                        <span className="text-sm font-medium capitalize">{dayName.slice(0,3)}</span>
                        <span className="text-sm font-medium text-gray-500">{targetDate.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              </div>


            </div>
            
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={async () => {
                  const confirmDelete = window.confirm(`¿Eliminar ${selectedTasks.length} tarea${selectedTasks.length > 1 ? 's' : ''} permanentemente?`)
                  if (confirmDelete) {
                    for (const taskId of selectedTasks) {
                      await deleteTask(taskId)
                    }
                    setShowMoveModal(false)
                    setSelectionMode(false)
                    setSelectedTasks([])
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-red-600 hover:text-white hover:bg-red-600 transition-colors border border-red-300 rounded bg-red-50"
              >
                <Trash2 size={12} />
                Eliminar
              </button>
              <button
                onClick={() => setShowMoveModal(false)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-black font-bold hover:text-gray-800 transition-colors border border-gray-300 rounded bg-gray-50 hover:bg-gray-100"
              >
                <X size={12} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TaskItApp