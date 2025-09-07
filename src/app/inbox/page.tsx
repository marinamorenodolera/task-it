'use client'

import { useState } from 'react'
// Reduce lucide-react imports to minimum essentials
import { Plus, Clock, Trash2, X, ChevronRight, CheckCircle2, ChevronUp, ChevronDown, Settings, Inbox, Star, Calendar, CalendarDays, ShoppingCart, RotateCcw, Flame, Target, Heart } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/hooks/useAuth'
import { parseNaturalLanguage } from '@/utils/dateHelpers'
import { triggerHapticFeedback } from '@/utils/haptics'

// Direct imports for stability
import TaskDetailScreen from '@/components/tasks/TaskDetailScreen'
import SmartAttachmentsPanel from '@/components/attachments/SmartAttachmentsPanel'
import SortableTaskCard from '@/components/tasks/SortableTaskCard'

import BaseButton from '@/components/ui/BaseButton'
import { SECTION_ICON_MAP } from '@/utils/sectionIcons'

// Standard drag and drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

// ✅ DROPPABLE COMPONENT PARA SECCIONES VACÍAS EN INBOX
const DroppableSection = ({ sectionId, children }: { 
  sectionId: string; 
  children: React.ReactNode 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: sectionId
  })
  
  return (
    <div 
      ref={setNodeRef}
      data-section={sectionId}
      className={`transition-all duration-200 rounded-lg p-2 min-h-[44px] ${
        isOver
          ? 'bg-blue-50 ring-2 ring-blue-300 ring-opacity-50' 
          : ''
      }`}
    >
      {children}
    </div>
  )
}

// Función helper para renderizar iconos de sección con colores correctos (copiada de TaskItApp)
const renderSectionIconLocal = (sectionId: string, size: number = 20) => {
  const sectionIconMapping: Record<string, string> = {
    'big_three': 'star',
    'en_espera': 'clock',
    'otras_tareas': 'folder',
    'completadas': 'check-circle',
    'urgent': 'flame',
    'inbox': 'folder',
    'quick': 'clock'
  }
  
  const iconName = sectionIconMapping[sectionId] || 'folder'
  const iconData = SECTION_ICON_MAP[iconName as keyof typeof SECTION_ICON_MAP]
  
  if (!iconData) {
    const fallbackIcon = SECTION_ICON_MAP['folder' as keyof typeof SECTION_ICON_MAP]
    const IconComponent = fallbackIcon.icon
    return <IconComponent size={size} className={fallbackIcon.color} />
  }
  
  const IconComponent = iconData.icon
  return <IconComponent size={size} className={iconData.color} />
}

export default function InboxPage() {
  const { signOut } = useAuth()
  const { 
    tasks,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
    loadTasks,
    toggleBig3,
    toggleWaitingStatus,
    toggleUrgent,
    addAttachment,
    deleteAttachment,
    reloadTaskAttachments,
    getSubtasks,
    loadSubtasks,
    addSubtask,
    deleteSubtask,
    updateSubtaskOrder,
    moveTaskBetweenSections
  } = useTasks()
  
  // Estados para attachments
  const [showAttachments, setShowAttachments] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [taskDeadline, setTaskDeadline] = useState('')
  
  // Filtrar tareas que están en inbox
  const inboxTasks = tasks && Array.isArray(tasks) 
    ? (tasks as Array<{page?: string, completed?: boolean, [key: string]: any}>).filter(task => 
        task?.page === 'inbox' && !task?.completed
      ) 
    : []
  
  // Filtrar tareas completadas del inbox
  const completedInboxTasks = tasks && Array.isArray(tasks) 
    ? (tasks as Array<{page?: string, completed?: boolean, [key: string]: any}>).filter(task => 
        task?.page === 'inbox' && task?.completed
      ) 
    : []
  
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para gestionar tareas (copiado de Daily)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [showMoveModal, setShowMoveModal] = useState(false)
  
  // 💅 ESTADO PARA SELECCIÓN RÁPIDA DE SECCIÓN
  const [selectedSection, setSelectedSection] = useState('inbox_tasks')
  
  // ✅ DRAG AND DROP STATE - ENHANCED FOR SECTION DRAG
  const [activeId, setActiveId] = useState(null)
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)
  
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
  
  const weekDays = [
    { id: 'monday', label: 'Lunes', short: 'Lun' },
    { id: 'tuesday', label: 'Martes', short: 'Mar' },
    { id: 'wednesday', label: 'Miércoles', short: 'Mié' },
    { id: 'thursday', label: 'Jueves', short: 'Jue' },
    { id: 'friday', label: 'Viernes', short: 'Vie' },
    { id: 'saturday', label: 'Sábado', short: 'Sáb' },
    { id: 'sunday', label: 'Domingo', short: 'Dom' }
  ]
  
  // Handlers para selección (copiado de Daily)
  const handleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode)
    setSelectedTasks([])
  }
  
  // Abrir detalle de tarea (click en la tarea)
  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setShowTaskDetail(true)
  }
  
  // Cerrar detalle de tarea
  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false)
    setSelectedTask(null)
    // Recargar tareas para reflejar cambios
    if (loadTasks) {
      loadTasks()
    }
  }
  
  // ADD TO TODAY - Mover a Daily
  const addToToday = async () => {
    if (selectedTasks.length === 0) {
      alert('Selecciona al menos una tarea')
      return
    }
    
    try {
      for (const taskId of selectedTasks) {
        const result = await updateTask(taskId, {
          page: 'daily',
          section: 'otras_tareas'
        })
        
        if (result?.error) {
          console.error(`Error moviendo tarea ${taskId}:`, result.error)
          alert(`Error al mover tarea: ${result.error}`)
          return
        }
      }
      
      const movedCount = selectedTasks.length
      setSelectedTasks([])
      
      if (loadTasks) {
        await loadTasks()
      }
      
      alert(`${movedCount} tarea(s) movidas a Daily`)
      
    } catch (error) {
      console.error('Error moving tasks to daily:', error)
      alert('Error al mover las tareas. Por favor intenta de nuevo.')
    }
  }
  
  // SCHEDULE THIS WEEK - Mover a Weekly con día específico
  const scheduleToDay = async (dayId: string) => {
    if (selectedTasks.length === 0) return
    
    // Calcular fecha para el día seleccionado
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const targetDay = weekDays.findIndex(day => day.id === dayId) + 1 // Convert to 1-7 scale
    
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0) daysToAdd += 7 // Next week if already passed
    
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysToAdd)
    const dateString = targetDate.toISOString().split('T')[0]
    
    try {
      for (const taskId of selectedTasks) {
        const result = await updateTask(taskId, {
          page: 'weekly',
          section: 'otras_tareas',
          scheduled_date: dateString  // ✅ FIXED: Campo correcto
        })
        
        if (result?.error) {
          console.error(`Error programando tarea ${taskId}:`, result.error)
          alert(`Error al programar tarea: ${result.error}`)
          return
        }
      }
      
      const movedCount = selectedTasks.length
      setSelectedTasks([])
      setShowDayPicker(false)
      
      if (loadTasks) {
        await loadTasks()
      }
      
      const dayName = weekDays.find(day => day.id === dayId)?.label
      alert(`${movedCount} tarea(s) programadas para ${dayName}`)
    } catch (error) {
      console.error('Error scheduling tasks:', error)
      alert('Error al programar las tareas. Por favor intenta de nuevo.')
    }
  }
  
  // Attachment handlers
  const handleAddAttachment = async (attachment: any) => {
    setAttachments(prev => [...prev, attachment])
  }

  const handleSetDeadline = (deadline: Date) => {
    setTaskDeadline(deadline.toISOString().split('T')[0])
    setTimeout(() => {
      setShowAttachments(false)
    }, 1000)
  }

  // Agregar nueva tarea al inbox
  const handleAddTask = async () => {
    // Prevenir múltiples submissions  
    if (isSubmitting) return
    setIsSubmitting(true)
    
    if (!newTaskTitle.trim()) {
      setIsSubmitting(false)
      return
    }
    
    try {
      const { deadline, amount } = parseNaturalLanguage(newTaskTitle)
      
      const result = await addTask({
        title: newTaskTitle,
        page: 'inbox',
        section: selectedSection,
        status: 'inbox',
        deadline: taskDeadline ? new Date(taskDeadline) : deadline,
        amount,
        notes: ''
      })
      
      if (result && !result.error) {
        // Procesar attachments si existen
        if (attachments.length > 0) {
          for (const attachment of attachments) {
            try {
              await addAttachment(result.data?.id, attachment)
            } catch (error) {
              console.error('Error subiendo attachment:', error)
            }
          }
        }
        
        setNewTaskTitle('')
        setAttachments([])
        setTaskDeadline('')
        setShowAttachments(false)
        setSelectedSection('inbox_tasks') // Reset a default
      }
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Error creando tarea: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // ✅ DRAG HANDLERS - ENHANCED FOR SECTION DRAG
  const handleDragStart = (event: any) => {
    triggerHapticFeedback('medium')  // Vibración al activar drag
    const { active } = event
    setActiveId(active.id)
    
    const taskId = active.id.split('-').slice(1).join('-')
    const task = inboxTasks.find(t => t.id === taskId)
    setDraggedTask(task)
  }

  // ✅ DRAG OVER HANDLER - PARA HIGHLIGHT DE SECCIONES
  const handleDragOver = (event: any) => {
    const { over } = event
    
    if (!over || !draggedTask) {
      setDragOverSection(null)
      return
    }

    const overId = over.id
    const draggedSection = draggedTask.section || 'inbox_tasks'
    
    // Detectar si estamos sobre una sección diferente
    if (overId.includes('-')) {
      // Es una tarea - extraer sección
      const overSection = overId.split('-')[0]
      
      if (overSection !== draggedSection) {
        setDragOverSection(overSection)
      } else {
        setDragOverSection(null)
      }
    } else {
      // Es una sección droppable directamente
      const validSections = ['inbox_tasks', 'urgent', 'quick', 'monthly', 'shopping', 'devoluciones']
      if (validSections.includes(overId) && overId !== draggedSection) {
        setDragOverSection(overId)
      } else {
        setDragOverSection(null)
      }
    }
  }

  // ✅ DRAG END HANDLER - ENHANCED FOR SECTION-TO-SECTION DRAG
  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    
    setActiveId(null)
    setDraggedTask(null)
    setDragOverSection(null)

    if (!over || active.id === over.id) {
      return
    }

    // Extraer taskId y sectionId de los IDs compuestos
    const activeParts = active.id.split('-')
    const activeSection = activeParts[0]
    const activeTaskId = activeParts.slice(1).join('-')
    
    // ✅ DETECTAR TIPO DE DROP
    if (!over.id.includes('-')) {
      // DROP EN SECCIÓN VACIA (droppable zone directa)
      const targetSection = over.id
      
      console.log('🎯 INBOX CROSS-SECTION DRAG to empty section:', {
        taskId: activeTaskId,
        from: activeSection,
        to: targetSection
      })
      
      try {
        const result = await moveTaskBetweenSections(
          activeTaskId, 
          activeSection === 'inbox' ? 'inbox_tasks' : activeSection, 
          targetSection, 
          null
        )
        
        if (result?.error) {
          console.error('❌ Error moving between sections:', result.error)
          alert('Error al mover la tarea entre secciones')
        }
      } catch (error) {
        console.error('❌ Error in cross-section drag:', error)
        alert('Error al mover la tarea')
      }
      return
    }
    
    // DROP EN TAREA (cross-section o reordering)
    const overParts = over.id.split('-')
    const overSection = overParts[0]
    const overTaskId = overParts.slice(1).join('-')

    // ✅ DETECTAR MOVIMIENTO ENTRE SECCIONES
    if (activeSection !== overSection) {
      console.log('🔄 INBOX CROSS-SECTION DRAG to task:', {
        taskId: activeTaskId,
        from: activeSection,
        to: overSection,
        targetTaskId: overTaskId
      })
      
      try {
        const result = await moveTaskBetweenSections(
          activeTaskId, 
          activeSection === 'inbox' ? 'inbox_tasks' : activeSection,
          overSection === 'inbox' ? 'inbox_tasks' : overSection, 
          overTaskId
        )
        
        if (result?.error) {
          console.error('❌ Error moving between sections:', result.error)
          alert('Error al mover la tarea entre secciones')
        }
      } catch (error) {
        console.error('❌ Error in cross-section drag:', error)
        alert('Error al mover la tarea')
      }
      return
    }

    // ✅ REORDENAMIENTO DENTRO DE LA MISMA SECCIÓN
    console.log('🔄 INBOX REORDERING within section:', {
      activeTaskId,
      overTaskId,
      section: activeSection
    })

    // Obtener tareas de la sección actual
    const sectionTasks = inboxTasks.filter(task => {
      const taskSection = task.section || 'inbox_tasks'
      const normalizedActiveSection = activeSection === 'inbox' ? 'inbox_tasks' : activeSection
      return taskSection === normalizedActiveSection
    })
    
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

    // 2. PERSISTIR EN BD EN BACKGROUND
    try {
      for (let i = 0; i < reorderedTasks.length; i++) {
        const reorderedTask = reorderedTasks[i]
        const originalIndex = sectionTasks.findIndex(t => t.id === reorderedTask.id)
        const newOrder = i + 1
        const oldOrder = originalIndex + 1
        
        // ✅ ACTUALIZAR SIEMPRE si la posición cambió
        if (oldOrder !== newOrder) {
          await updateTask(reorderedTask.id, {
            section_order: newOrder
          })
        }
      }
      
      // Recargar tareas para mostrar el nuevo orden
      await loadTasks()
    } catch (error) {
      console.error('Error reordering inbox tasks:', error)
      // Recargar en caso de error para restaurar orden original
      await loadTasks()
    }
  }

  // Handle delete all completed - Idéntico a Daily
  const handleDeleteAllCompleted = async () => {
    const completedTasksToDelete = completedInboxTasks
    
    if (completedTasksToDelete.length === 0) {
      alert('No hay tareas completadas para eliminar.')
      return
    }
    
    let confirmMessage = `¿Eliminar todas las tareas completadas del Inbox?`
    confirmMessage += `\n\n${completedTasksToDelete.length} tareas serán eliminadas permanentemente (incluidos sus adjuntos).`
    
    const confirmDelete = window.confirm(confirmMessage)
    
    if (confirmDelete) {
      // Cambiar texto del botón a "eliminando..."
      const deleteButton = document.querySelector('[title="Eliminar todas las tareas completadas del inbox"]') as HTMLElement
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
          deleteButton!.textContent = originalText
          deleteButton!.style.pointerEvents = 'auto'
          deleteButton!.style.opacity = '1'
        }
      }
    }
  }
  
  
  // Si hay una tarea seleccionada para ver detalles
  if (showTaskDetail && selectedTask) {
    return (
      <TaskDetailScreen
        task={selectedTask}
        onBack={handleCloseTaskDetail}
        onEdit={(updates: any) => updateTask(selectedTask.id, updates)}
        onDelete={() => {
          deleteTask(selectedTask.id)
          handleCloseTaskDetail()
        }}
        onToggleComplete={() => toggleComplete(selectedTask.id)}
        onUpdate={async (taskId: any, updates: any) => {
          // Si se reciben dos parámetros (desde TaskDetailScreen)
          if (typeof taskId === 'object' && !updates) {
            // El primer parámetro son los updates, no el taskId
            return await updateTask(selectedTask.id, taskId)
          }
          // Si se reciben dos parámetros normales
          return await updateTask(taskId, updates)
        }}
        onToggleImportant={() => toggleBig3(selectedTask.id)}
        onToggleWaitingStatus={() => toggleWaitingStatus(selectedTask.id)}
        onToggleUrgent={() => toggleUrgent(selectedTask.id)}
        onAddAttachment={(attachment: any) => addAttachment(selectedTask.id, attachment)}
        onDeleteAttachment={(attachmentId: any) => deleteAttachment(selectedTask.id, attachmentId)}
        onReloadAttachments={() => reloadTaskAttachments(selectedTask.id)}
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
    <div className="min-h-screen bg-white">
      {/* Header Móvil - Idéntico a Daily */}
      <div className="bg-white border-b border-gray-200 p-3 sm:p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Tareas Inbox</h1>
          <div className="flex items-center gap-2">
            <button
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
        
        {/* Enhanced Quick Capture - Idéntico a Daily */}
        <div className="space-y-3">
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              e.stopPropagation();
              handleAddTask(); 
            }} 
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ej: Llamar cliente jueves 15:00 para proyecto..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 min-h-[60px] touch-manipulation px-4 py-4 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <BaseButton
              type="submit"
              title="Añadir tarea rápida"
              disabled={isSubmitting || !newTaskTitle.trim()}
              onClick={(e: any) => {
                if (e.type === 'click') {
                  e.preventDefault();
                  handleAddTask();
                }
              }}
            >
              <Plus size={20} />
            </BaseButton>
          </form>

          {/* Attachments Button */}
          {newTaskTitle.trim() && !showAttachments && (
            <button
              onClick={() => setShowAttachments(true)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors min-h-[36px] w-full justify-center ${
                attachments.length > 0 || taskDeadline
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Inbox size={14} />
              <span>
                Adjuntos
                {(attachments.length > 0 || taskDeadline) && (
                  <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {attachments.length + (taskDeadline ? 1 : 0)}
                  </span>
                )}
              </span>
            </button>
          )}

          <SmartAttachmentsPanel
            isOpen={showAttachments && newTaskTitle.trim()}
            onClose={() => setShowAttachments(false)}
            onAttach={handleAddAttachment}
            onDeadlineSet={handleSetDeadline}
            taskText={newTaskTitle}
            existingAttachments={[]}
          />

          {/* 💅 SELECCIÓN RÁPIDA DE SECCIÓN - COPIADO DE DAILY */}
          {newTaskTitle.trim() && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                onClick={() => setSelectedSection(
                  selectedSection === 'monthly' ? 'inbox_tasks' : 'monthly'
                )}
                className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                  selectedSection === 'monthly'
                    ? 'border-purple-300 ring-2 ring-purple-200 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <CalendarDays 
                    className={`${
                      selectedSection === 'monthly' ? 'text-purple-600' : 'text-purple-500'
                    }`}
                    size={16}
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Monthly</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedSection(
                  selectedSection === 'shopping' ? 'inbox_tasks' : 'shopping'
                )}
                className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                  selectedSection === 'shopping'
                    ? 'border-green-300 ring-2 ring-green-200 bg-green-50'
                    : 'border-gray-200 hover:border-green-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <ShoppingCart 
                    className={`${
                      selectedSection === 'shopping' ? 'text-green-600' : 'text-green-500'
                    }`}
                    size={16}
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Shopping</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedSection(
                  selectedSection === 'devoluciones' ? 'inbox_tasks' : 'devoluciones'
                )}
                className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                  selectedSection === 'devoluciones'
                    ? 'border-orange-300 ring-2 ring-orange-200 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <RotateCcw 
                    className={`${
                      selectedSection === 'devoluciones' ? 'text-orange-600' : 'text-orange-500'
                    }`}
                    size={16}
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Devoluciones</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedSection(
                  selectedSection === 'beauty_care' ? 'inbox_tasks' : 'beauty_care'
                )}
                className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                  selectedSection === 'beauty_care'
                    ? 'border-pink-300 ring-2 ring-pink-200 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Heart 
                    className={`${
                      selectedSection === 'beauty_care' ? 'text-pink-600' : 'text-pink-500'
                    }`}
                    size={16}
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Beauty</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedSection(
                  selectedSection === 'someday' ? 'inbox_tasks' : 'someday'
                )}
                className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                  selectedSection === 'someday'
                    ? 'border-indigo-300 ring-2 ring-indigo-200 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Clock 
                    className={`${
                      selectedSection === 'someday' ? 'text-indigo-600' : 'text-indigo-500'
                    }`}
                    size={16}
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Someday</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedSection('inbox_tasks')}
                className={`bg-white border rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-200 min-h-[36px] touch-manipulation ${
                  selectedSection === 'inbox_tasks'
                    ? 'border-blue-300 ring-2 ring-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Inbox 
                    className={`${
                      selectedSection === 'inbox_tasks' ? 'text-blue-600' : 'text-blue-500'
                    }`}
                    size={16}
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Inbox</span>
                </div>
              </button>
            </div>
          )}

          {/* ✅ GESTIONAR TAREAS - INTEGRADO COMO DAILY */}
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
          </div>
        </div>
      </div>

      {/* Lista de Tareas - Contenedor principal como Daily */}
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Filtros para organizar tareas en secciones */}
        {(() => {
          const urgentTasks = inboxTasks.filter(task => 
            task.priority === 'urgent' || task.important === true || task.section === 'urgent'
          )
          
          const quickTasks = inboxTasks.filter(task => 
            task.estimated_duration && task.estimated_duration <= 30
          )
          
          // 🛡️ PRESERVAR SECCIONES EXISTENTES - NO MODIFICAR
          const monthlyTasks = inboxTasks.filter(task => task.section === 'monthly')
          const shoppingTasks = inboxTasks.filter(task => task.section === 'shopping')
          const devolucionesTasks = inboxTasks.filter(task => task.section === 'devoluciones')
          const beautyCareTask = inboxTasks.filter(task => task.section === 'beauty_care')
          const somedayTasks = inboxTasks.filter(task => task.section === 'someday')
          // COMPATIBILITY: Support old 'otras_tareas' and new 'inbox_tasks'
          const inboxTasksOnly = inboxTasks.filter(task => 
            task.section === 'inbox_tasks' || 
            (task.section === 'otras_tareas' && !task.priority)
          )
          
          
          // DEBUG: Moved outside render to prevent infinite loops
          if (process.env.NODE_ENV === 'development') {
            // Only log when tasks actually change, not on every render
            const currentTaskIds = inboxTasks.map(t => t.id).join(',')
            if ((window as any).lastTaskIds !== currentTaskIds) {
              (window as any).lastTaskIds = currentTaskIds
              console.log('🔍 INBOX SECTIONS DEBUG (tasks changed):')
              console.log('Total inboxTasks:', inboxTasks.length)
              console.log('Monthly:', monthlyTasks.length, 'Shopping:', shoppingTasks.length, 'Devoluciones:', devolucionesTasks.length, 'Inbox Only:', inboxTasksOnly.length)
            }
          }

          return (
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
              <SortableContext 
                items={[
                  ...inboxTasksOnly.map(task => `inbox-${task.id}`),
                  ...urgentTasks.map(task => `urgent-${task.id}`),
                  ...quickTasks.map(task => `quick-${task.id}`),
                  ...monthlyTasks.map(task => `monthly-${task.id}`),
                  ...shoppingTasks.map(task => `shopping-${task.id}`),
                  ...devolucionesTasks.map(task => `devoluciones-${task.id}`),
                  ...beautyCareTask.map(task => `beauty_care-${task.id}`),
                  ...somedayTasks.map(task => `someday-${task.id}`)
                ]}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-6">
                  {inboxTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <Inbox className="mx-auto text-gray-300 mb-4" size={48} />
                      <p className="text-gray-500">No hay tareas en el inbox</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Usa el formulario de arriba para añadir tareas
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* 📥 INBOX TASKS */}
                      {inboxTasksOnly.length > 0 && (
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Inbox size={20} className="text-blue-600" />
                            Inbox Tasks ({inboxTasksOnly.length})
                          </h2>
                          
                          {/* Section divider */}
                          <div className="border-b border-gray-200/30 mx-0 my-3"></div>
                          
                          <div className="space-y-2">
                            {inboxTasksOnly.map((task) => (
                              <SortableTaskCard
                                key={`inbox-${task.id}`}
                                task={task}
                                sectionId="inbox"
                                onClick={selectionMode ? () => handleTaskSelection(task.id) : () => handleTaskClick(task)}
                                onComplete={toggleComplete}
                                expandedTasks={[]}
                                onToggleExpanded={() => {}}
                                onToggleTaskComplete={toggleComplete}
                                getSubtasks={() => []}
                                selectionMode={selectionMode}
                                isSelected={selectedTasks.includes(task.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 🔥 URGENT */}
                      {urgentTasks.length > 0 && (
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Flame size={20} className="text-red-500" />
                            Urgente ({urgentTasks.length})
                          </h2>
                          
                          {/* Section divider */}
                          <div className="border-b border-gray-200/30 mx-0 my-3"></div>
                          
                          <div className="space-y-2">
                            {urgentTasks.map((task) => (
                              <SortableTaskCard
                                key={`urgent-${task.id}`}
                                task={task}
                                sectionId="urgent"
                                onClick={selectionMode ? () => handleTaskSelection(task.id) : () => handleTaskClick(task)}
                                onComplete={toggleComplete}
                                expandedTasks={[]}
                                onToggleExpanded={() => {}}
                                onToggleTaskComplete={toggleComplete}
                                getSubtasks={() => []}
                                selectionMode={selectionMode}
                                isSelected={selectedTasks.includes(task.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ⚡ QUICK BATCH */}
                      {quickTasks.length > 0 && (
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Clock size={20} className="text-blue-500" />
                            Quick Batch ({quickTasks.length})
                          </h2>
                          
                          {/* Section divider */}
                          <div className="border-b border-gray-200/30 mx-0 my-3"></div>
                          
                          <div className="space-y-2">
                            {quickTasks.map((task) => (
                              <SortableTaskCard
                                key={`quick-${task.id}`}
                                task={task}
                                sectionId="quick"
                                onClick={selectionMode ? () => handleTaskSelection(task.id) : () => handleTaskClick(task)}
                                onComplete={toggleComplete}
                                expandedTasks={[]}
                                onToggleExpanded={() => {}}
                                onToggleTaskComplete={toggleComplete}
                                getSubtasks={() => []}
                                selectionMode={selectionMode}
                                isSelected={selectedTasks.includes(task.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 📅 MONTHLY - SIEMPRE VISIBLE CON DROPPABLE */}
                      <DroppableSection sectionId="monthly">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CalendarDays size={20} className="text-purple-500" />
                          Monthly ({monthlyTasks.length})
                          {dragOverSection === 'monthly' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium animate-pulse">
                              SOLTAR AQUÍ
                            </span>
                          )}
                        </h2>
                        
                        {/* Section divider */}
                        <div className="border-b border-gray-200/30 mx-0 my-3"></div>
                        
                        {monthlyTasks.length === 0 ? (
                          <div className={`text-center py-8 text-gray-400 rounded-lg border-2 border-dashed transition-all ${
                            dragOverSection === 'monthly' 
                              ? 'bg-purple-100 border-purple-300 text-purple-600' 
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <CalendarDays size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              {dragOverSection === 'monthly' && draggedTask 
                                ? 'Suelta la tarea aquí' 
                                : 'No hay tareas mensuales'
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {monthlyTasks.map((task) => (
                              <SortableTaskCard
                                key={`monthly-${task.id}`}
                                task={task}
                                sectionId="monthly"
                                onClick={selectionMode ? () => handleTaskSelection(task.id) : () => handleTaskClick(task)}
                                onComplete={toggleComplete}
                                expandedTasks={[]}
                                onToggleExpanded={() => {}}
                                onToggleTaskComplete={toggleComplete}
                                getSubtasks={() => []}
                                selectionMode={selectionMode}
                                isSelected={selectedTasks.includes(task.id)}
                              />
                            ))}
                          </div>
                        )}
                      </DroppableSection>

                      {/* 🛒 SHOPPING - SIEMPRE VISIBLE CON DROPPABLE */}
                      <DroppableSection sectionId="shopping">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <ShoppingCart size={20} className="text-green-500" />
                          Shopping ({shoppingTasks.length})
                          {dragOverSection === 'shopping' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium animate-pulse">
                              SOLTAR AQUÍ
                            </span>
                          )}
                        </h2>
                        
                        {/* Section divider */}
                        <div className="border-b border-gray-200/30 mx-0 my-3"></div>
                        
                        {shoppingTasks.length === 0 ? (
                          <div className={`text-center py-8 text-gray-400 rounded-lg border-2 border-dashed transition-all ${
                            dragOverSection === 'shopping' 
                              ? 'bg-green-100 border-green-300 text-green-600' 
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              {dragOverSection === 'shopping' && draggedTask 
                                ? 'Suelta la tarea aquí' 
                                : 'No hay tareas de compras'
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {shoppingTasks.map((task) => (
                              <SortableTaskCard
                                key={`shopping-${task.id}`}
                                task={task}
                                sectionId="shopping"
                                onClick={selectionMode ? () => handleTaskSelection(task.id) : () => handleTaskClick(task)}
                                onComplete={toggleComplete}
                                expandedTasks={[]}
                                onToggleExpanded={() => {}}
                                onToggleTaskComplete={toggleComplete}
                                getSubtasks={() => []}
                                selectionMode={selectionMode}
                                isSelected={selectedTasks.includes(task.id)}
                              />
                            ))}
                          </div>
                        )}
                      </DroppableSection>

                      {/* 🔄 DEVOLUCIONES - SIEMPRE VISIBLE CON DROPPABLE */}
                      <DroppableSection sectionId="devoluciones">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <RotateCcw size={20} className="text-orange-500" />
                          Devoluciones ({devolucionesTasks.length})
                          {dragOverSection === 'devoluciones' && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium animate-pulse">
                              SOLTAR AQUÍ
                            </span>
                          )}
                        </h2>
                        
                        {/* Section divider */}
                        <div className="border-b border-gray-200/30 mx-0 my-3"></div>
                        
                        {devolucionesTasks.length === 0 ? (
                          <div className={`text-center py-8 text-gray-400 rounded-lg border-2 border-dashed transition-all ${
                            dragOverSection === 'devoluciones' 
                              ? 'bg-orange-100 border-orange-300 text-orange-600' 
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <RotateCcw size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              {dragOverSection === 'devoluciones' && draggedTask 
                                ? 'Suelta la tarea aquí' 
                                : 'No hay devoluciones'
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {devolucionesTasks.map((task) => (
                              <SortableTaskCard
                                key={`devoluciones-${task.id}`}
                                task={task}
                                sectionId="devoluciones"
                                onClick={selectionMode ? () => handleTaskSelection(task.id) : () => handleTaskClick(task)}
                                onComplete={toggleComplete}
                                expandedTasks={[]}
                                onToggleExpanded={() => {}}
                                onToggleTaskComplete={toggleComplete}
                                getSubtasks={() => []}
                                selectionMode={selectionMode}
                                isSelected={selectedTasks.includes(task.id)}
                              />
                            ))}
                          </div>
                        )}
                      </DroppableSection>

                      {/* 💅 BEAUTY & CARE - SIEMPRE VISIBLE CON DROPPABLE */}
                      <DroppableSection sectionId="beauty_care">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Heart size={20} className="text-pink-500" />
                          Beauty & Care ({beautyCareTask.length})
                          {dragOverSection === 'beauty_care' && (
                            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium animate-pulse">
                              SOLTAR AQUÍ
                            </span>
                          )}
                        </h2>
                        
                        {/* Section divider */}
                        <div className="border-b border-gray-200/30 mx-0 my-3"></div>
                        
                        {beautyCareTask.length === 0 ? (
                          <div className={`text-center py-8 text-gray-400 rounded-lg border-2 border-dashed transition-all ${
                            dragOverSection === 'beauty_care' 
                              ? 'bg-pink-100 border-pink-300 text-pink-600' 
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <Heart size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              {dragOverSection === 'beauty_care' && draggedTask 
                                ? 'Suelta la tarea aquí' 
                                : 'No hay tareas de belleza'
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {beautyCareTask.map((task) => (
                              <SortableTaskCard
                                key={`beauty_care-${task.id}`}
                                task={task}
                                sectionId="beauty_care"
                                onClick={selectionMode ? () => handleTaskSelection(task.id) : () => handleTaskClick(task)}
                                onComplete={toggleComplete}
                                expandedTasks={[]}
                                onToggleExpanded={() => {}}
                                onToggleTaskComplete={toggleComplete}
                                getSubtasks={() => []}
                                selectionMode={selectionMode}
                                isSelected={selectedTasks.includes(task.id)}
                              />
                            ))}
                          </div>
                        )}
                      </DroppableSection>

                      {/* ⏰ SOMEDAY - SIEMPRE VISIBLE CON DROPPABLE */}
                      <DroppableSection sectionId="someday">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Clock size={20} className="text-indigo-500" />
                          Someday ({somedayTasks.length})
                          {dragOverSection === 'someday' && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium animate-pulse">
                              SOLTAR AQUÍ
                            </span>
                          )}
                        </h2>
                        
                        {/* Section divider */}
                        <div className="border-b border-gray-200/30 mx-0 my-3"></div>
                        
                        {somedayTasks.length === 0 ? (
                          <div className={`text-center py-8 text-gray-400 rounded-lg border-2 border-dashed transition-all ${
                            dragOverSection === 'someday' 
                              ? 'bg-indigo-100 border-indigo-300 text-indigo-600' 
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <Clock size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              {dragOverSection === 'someday' && draggedTask 
                                ? 'Suelta la tarea aquí' 
                                : 'No hay tareas para después'
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {somedayTasks.map((task) => (
                              <SortableTaskCard
                                key={`someday-${task.id}`}
                                task={task}
                                sectionId="someday"
                                onClick={selectionMode ? () => handleTaskSelection(task.id) : () => handleTaskClick(task)}
                                onComplete={toggleComplete}
                                expandedTasks={[]}
                                onToggleExpanded={() => {}}
                                onToggleTaskComplete={toggleComplete}
                                getSubtasks={() => []}
                                selectionMode={selectionMode}
                                isSelected={selectedTasks.includes(task.id)}
                              />
                            ))}
                          </div>
                        )}
                      </DroppableSection>
                    </>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )
        })()}
      </div>

      {/* Sección de Tareas Completadas - Idéntico a Daily */}
      <div className="p-3 sm:p-4">
        {completedInboxTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                <CheckCircle2 size={20} className="text-green-500" />
                Tareas Completadas ({completedInboxTasks.length})
                {showCompletedTasks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {completedInboxTasks.length > 0 && (
                <span 
                  onClick={handleDeleteAllCompleted}
                  className="text-sm text-red-500 cursor-pointer hover:text-red-700 underline py-1 px-2 touch-manipulation"
                  title="Eliminar todas las tareas completadas del inbox"
                >
                  eliminar todas
                </span>
              )}
            </div>
            
            {/* Section divider */}
            <div className="border-b border-gray-200/30 mx-0 my-3"></div>
            
            {showCompletedTasks && (
              <div className="space-y-2">
                {completedInboxTasks.map((item, index) => (
                  <div key={`completed-${item.id}-${index}`} className="flex items-center gap-2 p-2 bg-transparent border-0 opacity-60 rounded-lg hover:bg-gray-50/30 transition-all cursor-pointer"
                    onClick={() => {
                      toggleComplete(item.id)
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
        )}
      </div>
      
      {/* Modal para elegir día de la semana */}
      {showDayPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Selecciona el día de la semana
              </h3>
              <button
                onClick={() => setShowDayPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {weekDays.map(day => (
                <button
                  key={day.id}
                  onClick={() => scheduleToDay(day.id)}
                  className="w-full px-4 py-3 text-left bg-white hover:bg-purple-50 hover:border-purple-200 border border-transparent rounded-lg transition-all flex items-center justify-between group"
                >
                  <span className="font-medium text-gray-700 group-hover:text-purple-700">
                    {day.label}
                  </span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-500" />
                </button>
              ))}
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
                    className="flex items-center gap-2 p-2 text-left hover:bg-yellow-50 rounded transition-colors border border-yellow-200 bg-yellow-50 min-h-[44px] touch-manipulation"
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
                    className="flex items-center gap-2 p-2 text-left hover:bg-blue-100 rounded transition-colors border border-blue-200 bg-blue-50 min-h-[44px] touch-manipulation"
                  >
                    <Inbox size={14} className="text-blue-500" />
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
                    className="flex items-center gap-2 p-2 text-left hover:bg-orange-100 rounded transition-colors border border-orange-200 bg-orange-50 min-h-[44px] touch-manipulation"
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
                    className="flex items-center gap-2 p-2 text-left hover:bg-red-100 rounded transition-colors border border-red-200 bg-red-50 min-h-[44px] touch-manipulation"
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
                          section: 'inbox_tasks',
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
                        console.log('🔄 Moving to Monthly:', taskId, { section: 'monthly', page: 'inbox' })
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
                        console.log('🔄 Moving to Shopping:', taskId, { section: 'shopping', page: 'inbox' })
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
                  
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        console.log('🔄 Moving to Devoluciones:', taskId, { section: 'devoluciones', page: 'inbox' })
                        await updateTask(taskId, { section: 'devoluciones', page: 'inbox' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-orange-100 rounded transition-colors border border-orange-200 bg-orange-50 min-h-[44px] touch-manipulation"
                  >
                    <RotateCcw size={14} className="text-orange-500" />
                    <div className="text-sm font-medium">Devoluciones</div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        console.log('🔄 Moving to Beauty & Care:', taskId, { section: 'beauty_care', page: 'inbox' })
                        await updateTask(taskId, { section: 'beauty_care', page: 'inbox' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-pink-100 rounded transition-colors border border-pink-200 bg-pink-50 min-h-[44px] touch-manipulation"
                  >
                    <Heart size={14} className="text-pink-500" />
                    <div className="text-sm font-medium">Beauty & Care</div>
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
                    startOfWeek.setDate(today.getDate() - today.getDay() + 1)
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
                        className="flex items-center justify-center gap-1 p-2 text-center hover:bg-blue-100 rounded transition-colors border border-blue-200 bg-blue-50 min-h-[44px] touch-manipulation"
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
                className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-black font-bold hover:text-gray-800 transition-colors border border-gray-300 rounded bg-white hover:bg-gray-100"
              >
                <X size={12} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Bottom padding para el nav */}
      <div className="h-20" />
    </div>
  )
}