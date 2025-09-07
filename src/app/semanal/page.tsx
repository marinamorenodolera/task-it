'use client'

import React, { useState, useEffect } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/hooks/useAuth'
// Reduced lucide-react imports
import { Plus, Calendar, Clock, Trash2, Target, CheckCircle2, Star, Flame, Folder, Settings, ListTodo, ChevronUp, ChevronDown, X, Inbox, CalendarDays, ShoppingCart, RotateCcw, Heart } from 'lucide-react'

// Direct imports for stability  
import TaskDetailScreen from '@/components/tasks/TaskDetailScreen'
import SmartAttachmentsPanel from '@/components/attachments/SmartAttachmentsPanel'
import SortableTaskCard from '@/components/tasks/SortableTaskCard'

import { parseNaturalLanguage } from '@/utils/dateHelpers'
import { triggerHapticFeedback } from '@/utils/haptics'

// Drag and drop imports
import { DndContext, useSensor, useSensors, KeyboardSensor, PointerSensor, TouchSensor, useDroppable, closestCenter } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

export default function SemanalPage() {
  const { signOut } = useAuth()
  const {
    tasks,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
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
    moveTaskBetweenSections,
    loadTasks
  } = useTasks()
  
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<string[]>([])
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [showAttachments, setShowAttachments] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [taskDeadline, setTaskDeadline] = useState('')
  
  // ✅ DND-KIT STATE - IDENTICAL TO DAILY
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)
  
  // ✅ DND-KIT SENSORS - IDENTICAL TO DAILY
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

  // Función para calcular los próximos 5 días laborales desde hoy
  const getWorkDaysFromToday = () => {
    const today = new Date()
    const days = []
    let currentDate = new Date(today)
    
    // Si hoy es día laboral, empezar desde hoy
    const todayDay = today.getDay()
    const isWeekday = todayDay !== 0 && todayDay !== 6
    
    if (isWeekday) {
      currentDate = new Date(today)
    } else {
      // Si es fin de semana, empezar desde lunes
      if (todayDay === 0) currentDate.setDate(today.getDate() + 1) // Domingo → Lunes
      if (todayDay === 6) currentDate.setDate(today.getDate() + 2) // Sábado → Lunes
    }
    
    for (let i = 0; i < 5; i++) {
      // Saltar fines de semana
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
      const shortNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      
      days.push({
        date: new Date(currentDate),
        dateString: currentDate.toISOString().split('T')[0],
        dayName: dayNames[currentDate.getDay()],
        dayNameCapitalized: dayNames[currentDate.getDay()].charAt(0).toUpperCase() + dayNames[currentDate.getDay()].slice(1),
        shortName: shortNames[currentDate.getDay()],
        monthName: monthNames[currentDate.getMonth()],
        isToday: currentDate.toDateString() === today.toDateString(),
        isTomorrow: currentDate.toDateString() === new Date(today.getTime() + 24*60*60*1000).toDateString(),
        dayNumber: currentDate.getDate()
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return days
  }

  const [workDays] = useState(() => getWorkDaysFromToday())

  // Establecer el primer día (HOY si es laboral) como día por defecto
  useEffect(() => {
    if (workDays.length > 0) {
      // Si HOY es un día laboral, seleccionarlo, si no, seleccionar el primero
      const todayDay = workDays.find(day => day.isToday)
      const dayToSelect = todayDay ? todayDay.dateString : workDays[0].dateString
      setSelectedDay(dayToSelect)
    }
  }, [workDays])

  // Mover tareas vencidas al día de hoy cuando se cargan las tareas
  useEffect(() => {
    const handleOverdueTasks = async () => {
      if (tasks && tasks.length > 0) {
        await moveOverdueTasksToToday()
      }
    }
    
    handleOverdueTasks()
  }, [tasks])

  // Función para obtener el color del día (estilo Daily)
  const getDayColor = (dayName: string) => {
    const colors: {[key: string]: string} = {
      'lunes': 'text-blue-500',
      'martes': 'text-green-500',
      'miércoles': 'text-yellow-500',
      'jueves': 'text-orange-500',
      'viernes': 'text-purple-500'
    }
    return colors[dayName.toLowerCase()] || 'text-gray-500'
  }

  // Función para obtener el ícono del día
  const getDayIcon = (dayName: string) => {
    // Usar Calendar para todos los días con diferentes colores
    return Calendar
  }

  // Función para mover automáticamente tareas pasadas al día de hoy
  const moveOverdueTasksToToday = async () => {
    // Use the first workday (Monday) as "today" instead of system date
    const today = workDays.length > 0 ? workDays[0].dateString : new Date().toISOString().split('T')[0]
    
    const overdueTasks = (tasks as Array<{page?: string, scheduled_date?: string, completed?: boolean, id: string, [key: string]: any}>).filter(task => {
      const isWeeklyTask = task?.page === 'weekly'
      const isNotCompleted = !task?.completed
      const isPastTask = task?.scheduled_date && task.scheduled_date < today
      
      return isWeeklyTask && isNotCompleted && isPastTask
    })

    if (overdueTasks.length > 0) {
      try {
        // Move all tasks in parallel for better performance
        const updatePromises = overdueTasks.map(task => {
          return updateTask(task.id, {
            scheduled_date: today
          })
        })
        
        // Wait for all updates to complete
        await Promise.all(updatePromises)
        
        // Recargar tareas después de la actualización para asegurar sincronización
        if (loadTasks) {
          await loadTasks()
        }
      } catch (error) {
        console.error(`❌ Error moviendo tareas vencidas:`, error)
      }
    }
  }

  // Filtrar tareas para un día específico
  const getTasksForDay = (dateString: string) => {
    // Use the first workday (Monday) as "today" instead of system date
    const today = workDays.length > 0 ? workDays[0].dateString : new Date().toISOString().split('T')[0]
    const isToday = dateString === today
    
    const filtered = (tasks as Array<{page?: string, scheduled_date?: string, completed?: boolean, [key: string]: any}>).filter(task => {
      const matchPage = task?.page === 'weekly'
      const notCompleted = !task?.completed
      
      if (!matchPage || !notCompleted) return false
      
      const taskDate = task?.scheduled_date
      
      // Si es HOY, incluir tareas de HOY + tareas pasadas no completadas
      if (isToday) {
        const isPastTask = taskDate && taskDate < today
        const isTodayTask = taskDate === dateString
        
        // Include past tasks on today view
        
        return isTodayTask || isPastTask
      }
      
      // Para otros días, comportamiento normal (solo tareas de ese día específico)
      const matchDate = taskDate === dateString
      
      // Filter tasks for specific date
      
      return matchDate
    })
    
    return filtered
  }

  // Get all past tasks for debugging purposes
  const showAllPastTasks = () => {
    // Use the first workday (Monday) as "today" instead of system date
    const today = workDays.length > 0 ? workDays[0].dateString : new Date().toISOString().split('T')[0]
    return (tasks as Array<{page?: string, scheduled_date?: string, completed?: boolean, [key: string]: any}>).filter(task => {
      return task?.page === 'weekly' && 
             !task?.completed && 
             task?.scheduled_date && 
             task.scheduled_date < today
    })
  }

  // Obtener tareas completadas de esta semana 
  const getCompletedTasksWeek = () => {
    return (tasks as Array<{page?: string, completed?: boolean, [key: string]: any}>).filter(task => {
      return task?.page === 'weekly' && task?.completed
    })
  }

  // Función para manejar eliminación de todas las tareas completadas de la semana
  const handleDeleteAllCompleted = async () => {
    const completedTasksToDelete = getCompletedTasksWeek()
    
    if (completedTasksToDelete.length === 0) {
      alert('No hay tareas completadas para eliminar.')
      return
    }
    
    let confirmMessage = `¿Eliminar todas las tareas completadas de esta semana?`
    confirmMessage += `\n\n${completedTasksToDelete.length} tareas serán eliminadas permanentemente (incluidos sus adjuntos).`
    
    const confirmDelete = window.confirm(confirmMessage)
    
    if (confirmDelete) {
      // Cambiar texto del botón a "eliminando..."
      const deleteButton = document.querySelector('[title="Eliminar todas las tareas completadas de la semana"]') as HTMLElement
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
            // deleteTask ya maneja la eliminación de adjuntos
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
        } else {
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

  // Agregar nueva tarea al día seleccionado
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !selectedDay) {
      alert('Por favor ingresa un título y selecciona un día')
      return
    }
    
    const { deadline, amount } = parseNaturalLanguage(newTaskTitle)
    
    const newTaskData = {
      title: newTaskTitle.trim(),
      page: 'weekly',
      scheduled_date: selectedDay,
      section: 'otras_tareas',
      deadline: taskDeadline ? new Date(taskDeadline) : deadline,
      amount,
      notes: ''
    }
    
    try {
      const result = await addTask(newTaskData)
      
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
      } else {
        alert('Error al agregar tarea: ' + (result?.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error agregando tarea:', error)
      alert('Error al agregar tarea')
    }
  }

  // Abrir detalle de tarea
  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setShowTaskDetail(true)
  }

  // ✅ DND-KIT HANDLERS - ENHANCED FOR SECTION DRAG
  const handleDragStart = (event: any) => {
    triggerHapticFeedback('medium')  // Vibración al activar drag
    const { active } = event
    setActiveId(active.id)
    
    // ✅ ENHANCED: Extract taskId from different composite ID formats
    let taskId
    const parts = active.id.split('-')
    
    if (parts.length >= 3) {
      // Format: day-section-taskId (section-to-section drag)
      taskId = parts.slice(2).join('-')
    } else {
      // Format: day-taskId (day-to-day drag)
      taskId = parts.slice(1).join('-')
    }
    
    // Find the task being dragged
    const task = tasks.find((t: any) => t.id === taskId)
    setDraggedTask(task)
  }

  const handleDragOver = (event: any) => {
    const { over } = event
    
    if (!over || !draggedTask) {
      setDragOverDay(null)
      return
    }

    const overId = over.id
    const draggedDay = draggedTask.scheduled_date

    // Detect if we're over a different day
    if (overId !== draggedDay) {
      setDragOverDay(overId)
    } else {
      setDragOverDay(null)
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    
    setActiveId(null)
    setDraggedTask(null)
    setDragOverDay(null)

    if (!over || !draggedTask) return

    const targetDay = over.id
    const sourceDay = draggedTask.scheduled_date

    // Don't do anything if it's the same day
    if (sourceDay === targetDay) return

    try {
      const result = await updateTask(draggedTask.id, {
        scheduled_date: targetDay
      })
      
      if (result && result.error) {
        console.error('Error moving task:', result.error)
        alert('Error al mover la tarea')
      }
    } catch (error) {
      console.error('Error in drag & drop:', error)
      alert('Error al mover la tarea')
    }
  }


  // ✅ DROPPABLE COMPONENT FOR EACH DAY - IDENTICAL TO DAILY  
  const DroppableDay = ({ dayDateString, children }: { dayDateString: string; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: dayDateString
    })
    
    return (
      <div 
        ref={setNodeRef}
        data-day={dayDateString}
        className={`transition-all duration-200 rounded-lg p-2 min-h-[60px] ${
          isOver || dragOverDay === dayDateString
            ? 'bg-blue-50 ring-2 ring-blue-300 ring-opacity-50' 
            : ''
        }`}
      >
        {children}
      </div>
    )
  }

  // Cerrar detalle
  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false)
    setSelectedTask(null)
    // Recargar tareas para reflejar cambios
    if (loadTasks) {
      loadTasks()
    }
  }

  // Vista de detalle de tarea
  if (showTaskDetail && selectedTask) {
    return (
      <TaskDetailScreen
        task={selectedTask}
        onBack={handleCloseTaskDetail}
        onEdit={(updates: any) => updateTask(selectedTask.id, updates)}
        onDelete={async (taskId: any) => {
          await deleteTask(taskId)
          handleCloseTaskDetail()
        }}
        onToggleComplete={() => toggleComplete(selectedTask.id)}
        onToggleImportant={() => toggleBig3(selectedTask.id)}
        onToggleWaitingStatus={() => toggleWaitingStatus(selectedTask.id)}
        onToggleUrgent={() => toggleUrgent(selectedTask.id)}
        onUpdate={async (taskId: any, updates: any) => {
          // Si se reciben dos parámetros (desde TaskDetailScreen)
          if (typeof taskId === 'object' && !updates) {
            // El primer parámetro son los updates, no el taskId
            return await updateTask(selectedTask.id, taskId)
          }
          // Si se reciben dos parámetros normales
          return await updateTask(taskId, updates)
        }}
        onAddAttachment={(attachment: any) => addAttachment(selectedTask.id, attachment)}
        onDeleteAttachment={(attachmentId: any) => deleteAttachment(selectedTask.id, attachmentId)}
        onReloadAttachments={() => reloadTaskAttachments(selectedTask.id)}
        getSubtasks={getSubtasks}
        loadSubtasks={loadSubtasks}
        onToggleTaskComplete={toggleComplete}
        addSubtask={addSubtask}
        deleteSubtask={deleteSubtask}
        updateSubtaskOrder={updateSubtaskOrder}
        subtasksCount={getSubtasks(selectedTask.id).length}
      />
    )
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
          draggable: 'Para mover entre días, mantén presionado y arrastra'
        }
      }}
    >
      <div className="min-h-screen bg-white">
      {/* Header Móvil - Consistente con Daily */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Vista Semanal</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Configuración semanal (próximamente)"
              disabled
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
        
        {/* Input principal estilo Daily */}
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
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Agregar tarea semanal rápida... (ej: 'Revisar emails lunes', 'Llamar cliente miércoles')"
              className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px] touch-manipulation"
            />
            <button
              type="submit"
              title="Añadir tarea rápida"
              disabled={!newTaskTitle.trim() || !selectedDay}
              onClick={(e) => {
                // Fallback para móvil si el submit no funciona
                if (e.type === 'click') {
                  e.preventDefault();
                  handleAddTask();
                }
              }}
              className="min-h-[44px] touch-manipulation transition-colors flex items-center justify-center font-medium rounded-xl focus:outline-none focus:ring-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white focus:ring-blue-500 px-4 py-3 text-base min-w-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
            </button>
          </form>

          {/* Attachments Button */}
          {newTaskTitle.trim() && !showAttachments && (
            <button
              onClick={() => setShowAttachments(true)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors min-h-[36px] w-full justify-center ${
                attachments.length > 0 || taskDeadline
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar size={14} />
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
          
          {/* Selector de días con estilo de botones Daily - solo cuando escribes */}
          {newTaskTitle.trim() && (
            <div className="flex gap-2">
              {workDays.map(day => (
                <button
                key={day.dateString}
                onClick={() => setSelectedDay(day.dateString)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 min-h-[36px] rounded-lg transition-colors touch-manipulation ${
                  selectedDay === day.dateString 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${day.isToday ? 'ring-2 ring-green-300' : ''} ${day.isTomorrow ? 'ring-2 ring-blue-300' : ''}`}
                title={`${day.dayNameCapitalized} ${day.dayNumber}${day.isToday ? ' - HOY' : ''}${day.isTomorrow ? ' - MAÑANA' : ''}`}
              >
                <Calendar size={14} className={selectedDay === day.dateString ? 'text-blue-700' : 'text-gray-600'} />
                <span className="text-xs font-medium">{day.shortName}</span>
                {day.isToday && <span className="text-[10px] bg-green-200 px-1 rounded">HOY</span>}
                </button>
              ))}
            </div>
          )}
          
          {/* Gestionar tareas button - copied from daily */}
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

      {/* Lista de Secciones por día - Diseño idéntico a Daily */}
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        <SortableContext 
          items={tasks
            .filter((t: any) => t?.page === 'weekly' && !t?.completed)
            .map((task: any) => `${task.scheduled_date}-${task.id}`)
          }
          strategy={verticalListSortingStrategy}
        >
          {workDays.map(day => {
          const dayTasks = getTasksForDay(day.dateString)
          const DayIcon = getDayIcon(day.dayName)
          
          // Solo mostrar secciones con tareas o el día seleccionado
          if (dayTasks.length === 0 && selectedDay !== day.dateString) {
            return (
              <DroppableDay key={day.dateString} dayDateString={day.dateString}>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DayIcon size={20} className={getDayColor(day.dayName)} />
                  {day.dayNameCapitalized} {day.dayNumber}
                  {day.isToday && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">HOY</span>}
                  {day.isTomorrow && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">MAÑANA</span>}
                  <span className="text-sm text-gray-500">(0)</span>
                  {dragOverDay === day.dateString && draggedTask && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium animate-pulse">
                      SOLTAR AQUÍ
                    </span>
                  )}
                </h2>
                
                {/* Section divider for empty day */}
                <div className="border-b border-gray-200/30 mx-0 my-3"></div>
              </DroppableDay>
            )
          }
          
          return (
            <DroppableDay key={day.dateString} dayDateString={day.dateString}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DayIcon size={20} className={getDayColor(day.dayName)} />
                {day.dayNameCapitalized} {day.dayNumber}
                {day.isToday && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">HOY</span>}
                {day.isTomorrow && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">MAÑANA</span>}
                <span className="text-sm text-gray-500">({dayTasks.length})</span>
                {dragOverDay === day.dateString && draggedTask && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium animate-pulse">
                    SOLTAR AQUÍ
                  </span>
                )}
              </h2>
              
              {/* Section divider for day with tasks */}
              <div className="border-b border-gray-200/30 mx-0 my-3"></div>
              
              {/* Descripción opcional para días especiales */}
              {day.isToday && dayTasks.length === 0 && (
                <p className="text-sm text-gray-600 mb-3">
                  No hay tareas programadas para hoy. ¡Añade algunas!
                </p>
              )}
              
              {/* Lista de tareas con el mismo estilo que Daily */}
              <div className="space-y-2">
                {dayTasks.length === 0 ? (
                  selectedDay === day.dateString && (
                    <div className={`text-center py-8 text-gray-400 rounded-lg border-2 border-dashed transition-all ${
                      dragOverDay === day.dateString 
                        ? 'bg-blue-100 border-blue-300 text-blue-600' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {dragOverDay === day.dateString && draggedTask 
                          ? 'Suelta la tarea aquí' 
                          : 'No hay tareas para este día'
                        }
                      </p>
                      {dragOverDay !== day.dateString && (
                        <p className="text-xs mt-1">Usa el formulario arriba para añadir una</p>
                      )}
                    </div>
                  )
                ) : (
                  <SortableContext 
                    items={dayTasks.map(task => `${day.dateString}-${task.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {dayTasks.map(task => (
                      <SortableTaskCard
                        key={`${day.dateString}-${task.id}`}
                        task={task}
                        sectionId={day.dateString}
                        onClick={selectionMode ? () => {
                          setSelectedTasks(prev => 
                            prev.includes(task.id) 
                              ? prev.filter(id => id !== task.id)
                              : [...prev, task.id]
                          )
                        } : () => handleTaskClick(task)}
                        onComplete={() => toggleComplete(task.id)}
                        onMoveBetweenSections={() => {}} // Not needed for weekly view
                        getSubtasks={getSubtasks}
                        expandedTasks={expandedTasks}
                        onToggleExpanded={(taskId: string) => {
                          const isCurrentlyExpanded = expandedTasks.includes(taskId)
                          if (isCurrentlyExpanded) {
                            setExpandedTasks(prev => prev.filter(id => id !== taskId))
                          } else {
                            setExpandedTasks(prev => [...prev, taskId])
                          }
                        }}
                        onToggleTaskComplete={toggleComplete}
                        selectionMode={selectionMode}
                        isSelected={selectedTasks.includes(task.id)}
                      />
                    ))}
                  </SortableContext>
                )}
              </div>
            </DroppableDay>
          )
          })}
        </SortableContext>

        {/* Sección de Tareas Completadas de la Semana */}
        {(() => {
          const allCompletedItemsWeekly = getCompletedTasksWeek()
          
          if (allCompletedItemsWeekly.length === 0) return null
          
          return (
            <div>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                  className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                >
                  <CheckCircle2 size={20} className="text-green-500" />
                  Tareas Completadas ({allCompletedItemsWeekly.length})
                  {showCompletedTasks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {allCompletedItemsWeekly.length > 0 && (
                  <span 
                    onClick={handleDeleteAllCompleted}
                    className="text-sm text-red-500 cursor-pointer hover:text-red-700 underline py-1 px-2 touch-manipulation"
                    title="Eliminar todas las tareas completadas de la semana"
                  >
                    eliminar todas
                  </span>
                )}
              </div>
              
              {/* Section divider */}
              <div className="border-b border-gray-200/30 mx-0 my-3"></div>
              
              {showCompletedTasks && (
                <div className="space-y-2">
                  {allCompletedItemsWeekly.map((item, index) => (
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
                          {item.title}
                        </span>
                        {item.scheduled_date && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {(() => {
                              const taskDate = new Date(item.scheduled_date + 'T00:00:00')
                              const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][taskDate.getDay()]
                              return `${dayName} ${taskDate.getDate()}`
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Floating Move Button - copied from daily */}
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

      {/* Move Modal - copied from daily */}
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
                <div className="grid grid-cols-2 gap-2 ml-6">
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { section: 'big_three', page: 'daily' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-3 text-left hover:bg-yellow-50 rounded-lg transition-colors border border-yellow-200 bg-yellow-50"
                  >
                    <Star size={16} className="text-yellow-500" />
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
                    className="flex items-center gap-2 p-3 text-left hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 bg-blue-50"
                  >
                    <Folder size={16} className="text-blue-500" />
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
                    className="flex items-center gap-2 p-3 text-left hover:bg-orange-100 rounded-lg transition-colors border border-orange-200 bg-orange-50"
                  >
                    <Clock size={16} className="text-orange-500" />
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
                    className="flex items-center gap-2 p-3 text-left hover:bg-red-100 rounded-lg transition-colors border border-red-200 bg-red-50"
                  >
                    <Flame size={16} className="text-red-500" />
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
                    className="flex items-center gap-2 p-2 text-left hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 bg-blue-50 min-h-[44px] touch-manipulation"
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
                    className="flex items-center gap-2 p-2 text-left hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 bg-purple-50 min-h-[44px] touch-manipulation"
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
                    className="flex items-center gap-2 p-2 text-left hover:bg-green-100 rounded-lg transition-colors border border-green-200 bg-green-50 min-h-[44px] touch-manipulation"
                  >
                    <ShoppingCart size={14} className="text-green-500" />
                    <div className="text-sm font-medium">Shopping</div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { section: 'devoluciones', page: 'inbox' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-orange-100 rounded-lg transition-colors border border-orange-200 bg-orange-50 min-h-[44px] touch-manipulation"
                  >
                    <RotateCcw size={14} className="text-orange-500" />
                    <div className="text-sm font-medium">Devoluciones</div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { section: 'beauty_care', page: 'inbox' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-pink-100 rounded-lg transition-colors border border-pink-200 bg-pink-50 min-h-[44px] touch-manipulation"
                  >
                    <Heart size={14} className="text-pink-500" />
                    <div className="text-sm font-medium">Beauty & Care</div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      for (const taskId of selectedTasks) {
                        await updateTask(taskId, { section: 'someday', page: 'inbox' })
                      }
                      setShowMoveModal(false)
                      setSelectionMode(false)
                      setSelectedTasks([])
                    }}
                    className="flex items-center gap-2 p-2 text-left hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 bg-indigo-50 min-h-[44px] touch-manipulation"
                  >
                    <Clock size={14} className="text-indigo-500" />
                    <div className="text-sm font-medium">Someday</div>
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

    </DndContext>
  )
}