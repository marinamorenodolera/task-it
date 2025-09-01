'use client'

import React, { useState, useEffect } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Calendar, Clock, Trash2, Target, CheckCircle2, Circle, Star, Flame, Folder, Settings, ListTodo, Mic, ChevronUp, ChevronDown } from 'lucide-react'
import TaskCard from '@/components/tasks/TaskCard'
import TaskDetailScreen from '@/components/tasks/TaskDetailScreen'
import SmartAttachmentsPanel from '@/components/attachments/SmartAttachmentsPanel'
import { formatDeadline, parseNaturalLanguage } from '@/utils/dateHelpers'

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
  const [expandedTasks, setExpandedTasks] = useState<string[]>([])
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [showAttachments, setShowAttachments] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [taskDeadline, setTaskDeadline] = useState('')
  
  // Estado para drag & drop
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 })
  const [isDraggingTouch, setIsDraggingTouch] = useState(false)

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

  // Filtrar tareas para un día específico
  const getTasksForDay = (dateString: string) => {
    const filtered = (tasks as Array<{page?: string, scheduled_date?: string, completed?: boolean, [key: string]: any}>).filter(task => {
      const matchPage = task?.page === 'weekly'
      const matchDate = task?.scheduled_date === dateString
      const notCompleted = !task?.completed
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Filtrando tarea:', {
          taskId: task.id,
          taskTitle: task.title,
          taskPage: task.page,
          taskScheduledDate: task.scheduled_date,
          filterDate: dateString,
          matchPage,
          matchDate,
          notCompleted,
          passesFilter: matchPage && matchDate && notCompleted
        })
      }
      
      return matchPage && matchDate && notCompleted
    })
    
    console.log(`📅 Tareas para ${dateString}:`, filtered.length, filtered)
    return filtered
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

  // Funciones drag & drop
  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
    
    // Agregar clase visual al elemento arrastrado
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '1'
    setDraggedTask(null)
    setDragOverDay(null)
  }

  const handleDragOver = (e: React.DragEvent, dayDateString: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Solo marcar como hover si no es el día actual de la tarea
    if (draggedTask && draggedTask.scheduled_date !== dayDateString) {
      setDragOverDay(dayDateString)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    // Solo limpiar hover si realmente salió del área
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverDay(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, dayDateString: string) => {
    e.preventDefault()
    setDragOverDay(null)
    
    if (!draggedTask) return
    
    // No hacer nada si es el mismo día
    if (draggedTask.scheduled_date === dayDateString) return
    
    console.log('📦 Moviendo tarea:', {
      taskId: draggedTask.id,
      fromDay: draggedTask.scheduled_date,
      toDay: dayDateString
    })
    
    try {
      const result = await updateTask(draggedTask.id, {
        scheduled_date: dayDateString
      })
      
      if (result && !result.error) {
        console.log('✅ Tarea movida exitosamente')
      } else {
        console.error('❌ Error moviendo tarea:', result?.error)
        alert('Error al mover la tarea')
      }
    } catch (error) {
      console.error('❌ Error en drag & drop:', error)
      alert('Error al mover la tarea')
    }
    
    setDraggedTask(null)
  }

  // Touch events para móvil
  const handleTouchStart = (e: React.TouchEvent, task: any) => {
    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
    setDraggedTask(task)
    setIsDraggingTouch(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedTask) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.y)
    
    // Activar drag si se movió lo suficiente
    if (deltaX > 10 || deltaY > 10) {
      setIsDraggingTouch(true)
      e.preventDefault()
      
      // Encontrar elemento debajo del dedo
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      const daySection = elementBelow?.closest('[data-day]')
      
      if (daySection) {
        const dayDateString = daySection.getAttribute('data-day')
        if (dayDateString && draggedTask.scheduled_date !== dayDateString) {
          setDragOverDay(dayDateString)
        }
      } else {
        setDragOverDay(null)
      }
    }
  }

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!isDraggingTouch || !draggedTask || !dragOverDay) {
      setDraggedTask(null)
      setDragOverDay(null)
      setIsDraggingTouch(false)
      return
    }
    
    // Mover la tarea
    console.log('📱 Touch drop:', {
      taskId: draggedTask.id,
      fromDay: draggedTask.scheduled_date,
      toDay: dragOverDay
    })
    
    try {
      const result = await updateTask(draggedTask.id, {
        scheduled_date: dragOverDay
      })
      
      if (result && !result.error) {
        console.log('✅ Tarea movida exitosamente (touch)')
      } else {
        console.error('❌ Error moviendo tarea (touch):', result?.error)
        alert('Error al mover la tarea')
      }
    } catch (error) {
      console.error('❌ Error en touch drag & drop:', error)
      alert('Error al mover la tarea')
    }
    
    setDraggedTask(null)
    setDragOverDay(null)
    setIsDraggingTouch(false)
  }

  // Cerrar detalle
  const handleCloseTaskDetail = () => {
    console.log('🔙 Cerrando TaskDetail, estado actual:')
    console.log('  - Total tasks:', tasks.length)
    console.log('  - Tasks with page=weekly:', (tasks as Array<{page?: string, [key: string]: any}>).filter(t => t?.page === 'weekly').length)
    console.log('  - Tasks for selected day:', getTasksForDay(selectedDay).length)
    
    setShowTaskDetail(false)
    setSelectedTask(null)
    // Recargar tareas para reflejar cambios
    if (loadTasks) {
      console.log('🔄 Recargando tareas...')
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
    <div className="min-h-screen bg-gray-50">
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
          
          {/* Selector de días con estilo de botones Daily */}
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
        </div>
      </div>

      {/* Lista de Secciones por día - Diseño idéntico a Daily */}
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {workDays.map(day => {
          const dayTasks = getTasksForDay(day.dateString)
          const DayIcon = getDayIcon(day.dayName)
          
          // Solo mostrar secciones con tareas o el día seleccionado
          if (dayTasks.length === 0 && selectedDay !== day.dateString) {
            return (
              <div 
                key={day.dateString}
                data-day={day.dateString}
                onDragOver={(e) => handleDragOver(e, day.dateString)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day.dateString)}
                className={`transition-all duration-200 rounded-lg p-2 min-h-[60px] ${
                  dragOverDay === day.dateString 
                    ? 'bg-blue-50 ring-2 ring-blue-300 ring-opacity-50' 
                    : ''
                }`}
              >
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
              </div>
            )
          }
          
          return (
            <div 
              key={day.dateString} 
              data-day={day.dateString}
              onDragOver={(e) => handleDragOver(e, day.dateString)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.dateString)}
              className={`transition-all duration-200 rounded-lg p-2 ${
                dragOverDay === day.dateString 
                  ? 'bg-blue-50 ring-2 ring-blue-300 ring-opacity-50' 
                  : ''
              }`}
            >
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
                  dayTasks.map(task => (
                    <div
                      key={task.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleTouchStart(e, task)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`flex items-center gap-3 p-3 bg-white rounded-lg border transition-all touch-manipulation select-none cursor-move hover:shadow-md ${
                        draggedTask?.id === task.id 
                          ? 'opacity-50 border-blue-300 shadow-lg' 
                          : 'border-gray-200 hover:border-purple-200 hover:scale-[1.005]'
                      } ${isDraggingTouch && draggedTask?.id === task.id ? 'z-50' : ''}`}
                      onClick={() => !isDraggingTouch && handleTaskClick(task)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleComplete(task.id)
                        }}
                        className="transition-colors text-gray-400 hover:text-green-500"
                      >
                        <Circle size={18} />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {task.title}
                        </p>
                        {task.deadline && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDeadline(task.deadline)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Indicadores de estado */}
                      {task.important && (
                        <Star size={16} className="text-yellow-500" fill="currentColor" />
                      )}
                      
                      {task.section === 'urgent' && (
                        <Flame size={16} className="text-red-500" />
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('¿Eliminar esta tarea?')) {
                            deleteTask(task.id)
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}

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
              
              {showCompletedTasks && (
                <div className="space-y-2">
                  {allCompletedItemsWeekly.map((item, index) => (
                    <div key={`completed-${item.id}-${index}`} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-200 transition-all cursor-pointer"
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

      {/* Bottom padding para el nav */}
      <div className="h-20" />
    </div>
  )
}