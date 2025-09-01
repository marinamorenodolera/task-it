import React, { useState, useEffect, useRef } from 'react'
import BaseCard from '../ui/BaseCard'
import BaseButton from '../ui/BaseButton'
import AttachmentItem from '../attachments/AttachmentItem'
import SmartAttachmentsPanel from '../attachments/SmartAttachmentsPanel'
import SortableSubtask from './SortableSubtask'
import { useGestures } from '@/hooks/useGestures'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { triggerHapticFeedback } from '@/utils/haptics'
import { TASK_SECTIONS, getSectionColorClasses } from '../../config/taskSections'
import { SECTION_ICON_MAP } from '@/utils/sectionIcons'
import { ArrowLeft, Edit3, X, Plus, CheckCircle, Circle, CircleCheck, Star, StarOff, Calendar, Link, Euro, Clock, Inbox, MapPin, FileText, User, Trash2, Flame, Target, ChevronRight, CalendarDays, ShoppingCart, Image, StickyNote } from 'lucide-react'
// ✅ DRAG AND DROP IMPORTS EXACTOS COMO Daily
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

const TaskDetailScreen = ({ task, onBack, onEdit, onDelete, onToggleComplete, onUpdate, onToggleImportant, onToggleWaitingStatus, onToggleUrgent, onAddAttachment, onDeleteAttachment, onReloadAttachments, subtasksCount = 0, getSubtasks, loadSubtasks, onToggleTaskComplete, addSubtask, deleteSubtask, updateSubtaskOrder }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState(task)
  
  // ✅ OBTENER SECCIONES CUSTOM
  const { visibleSections } = useUserPreferences()

  // Función para renderizar iconos Lucide
  const renderSectionIcon = (iconName, size = 16) => {
    const icons = {
      Star: <Star size={size} />,
      FileText: <FileText size={size} />,
      Clock: <Clock size={size} />,
      Flame: <Flame size={size} />,
      Trash2: <Trash2 size={size} />
    }
    return icons[iconName] || <FileText size={size} />
  }

  // Función handler unificada para toggles de sección
  const handleSectionToggle = async (toggleFunction, taskId) => {
    try {
      if (toggleFunction === 'deleteTask') {
        if (window.confirm('¿Estás seguro de eliminar esta tarea?')) {
          await onDelete(taskId)
          onBack() // Cerrar modal después de eliminar
        }
      } else if (toggleFunction === 'toggleBig3') {
        await onToggleImportant(taskId)
      } else if (toggleFunction === 'toggleWaitingStatus') {
        await onToggleWaitingStatus(taskId)
      } else if (toggleFunction === 'moveToNormal') {
        // Mover a normal = quitar de Big 3 y quitar de waiting
        if (task.important) await onToggleImportant(taskId)
        if (task.status === 'pending') await onToggleWaitingStatus(taskId)
      } else if (toggleFunction === 'toggleUrgent') {
        await onToggleUrgent(taskId)
      }
    } catch (error) {
      console.error('❌ Error in section toggle:', error)
      alert('Error al cambiar la sección. Inténtalo de nuevo.')
    }
  }

  // Función para determinar qué sección está activa actualmente - USAR SISTEMA section/page
  const getCurrentSection = () => {
    const currentTask = editedTask.section ? editedTask : task
    
    // Usar el campo 'section' directamente de la BD
    if (currentTask.section === 'completadas') return 'completadas'
    if (currentTask.section === 'urgent') return 'urgent'
    if (currentTask.section === 'big_three') return 'big_three'
    if (currentTask.section === 'en_espera') return 'en_espera'
    if (currentTask.section === 'otras_tareas') return 'normal'
    if (currentTask.section === 'inbox_tasks') return 'normal'
    if (currentTask.section === 'monthly') return 'monthly'
    if (currentTask.section === 'shopping') return 'shopping'
    
    // Fallback por compatibilidad
    if (currentTask.completed) return 'completadas'
    if (currentTask.priority === 'urgent') return 'urgent'
    if (currentTask.is_big_3_today || currentTask.important) return 'big_three'
    if (currentTask.status === 'pending') return 'en_espera'
    
    return 'normal'
  }

  // Función para renderizar iconos de sección con configuración
  const renderTaskSectionIcon = (sectionId, size = 20) => {
    // Mapear IDs de UI a nombres de iconos
    const sectionIconMapping = {
      'big_three': 'star',
      'en_espera': 'clock',
      'normal': 'folder',
      'completadas': 'check-circle',
      'urgent': 'flame',
      'otras_tareas': 'folder'
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

  // ✅ SECCIONES DINÁMICAS: DEFAULT + CUSTOM
  const SECTION_OPTIONS = [
    {
      id: 'urgent',
      name: 'Urgente',
      icon: 'Flame',
      description: 'Requiere atención inmediata'
    },
    {
      id: 'big_three',
      name: 'Big 3',
      icon: 'Star',
      description: 'Tareas más importantes del día'
    },
    {
      id: 'normal',
      name: 'Otras Tareas',
      icon: 'FileText',
      description: 'Tareas regulares del día'
    },
    {
      id: 'en_espera',
      name: 'En Espera',
      icon: 'Clock',
      description: 'Esperando respuesta externa'
    },
    // ✅ AÑADIR SECCIONES CUSTOM
    ...visibleSections.filter(s => s.isCustom).map(section => ({
      id: section.id,
      name: section.name,
      icon: section.icon,
      description: 'Sección personalizada'
    })),
    {
      id: 'completadas',
      name: 'Completar',
      icon: 'CheckCircle',
      description: 'Marcar como terminada'
    }
  ]

  // Función handler para cambios de sección - LÓGICA COORDINADA
  const handleSectionChange = async (newSectionId) => {
    const currentSection = getCurrentSection()
    
    if (currentSection === newSectionId) {
      return
    }

    try {
      // STEP 1: No necesario limpiar - las funciones toggle manejan el cambio directo

      // STEP 2: Aplicar la nueva sección usando las funciones toggle
      switch(newSectionId) {
        case 'completadas':
          await onToggleComplete(task.id)
          onBack() // Cerrar modal después de completar
          break
          
        case 'big_three':
          await onToggleImportant(task.id)
          break
          
        case 'en_espera':
          await onToggleWaitingStatus(task.id)
          break
          
        case 'urgent':
          if (onToggleUrgent) {
            await onToggleUrgent(task.id)
          }
          break
          
        case 'normal':
          // Mover a otras_tareas usando updateTask directamente
          await onUpdate(task.id, { section: 'otras_tareas' })
          break
      }
      
      // Forzar re-render para mostrar cambio
      setEditedTask(prev => ({ ...prev, updated_at: new Date().toISOString() }))
      
    } catch (error) {
      console.error('Error changing section:', error)
      alert('Error al cambiar la sección: ' + error.message)
    }
  }

  // Funciones para mover entre páginas
  const moveToDaily = async (section = null) => {
    if (!section) {
      // Si no se especifica sección, mostrar el selector
      setShowDailySectionPicker(true)
      return
    }
    
    try {
      // SOLO pasar datos primitivos, NO objetos complejos
      const taskId = task.id
      const updates = {
        page: 'daily',
        section: section,
        scheduled_date: null
      }
      
      const result = await onUpdate(taskId, updates)
      
      if (result?.error) {
        alert(`Error al mover a Daily: ${result.error}`)
        return
      }
      
      const sectionNames = {
        'urgent': 'Urgente 🔥',
        'big_three': 'Big 3 ⭐',
        'en_espera': 'En Espera ⏰',
        'otras_tareas': 'Otras Tareas 📋'
      }
      alert(`✅ Tarea movida a Daily - ${sectionNames[section] || section}`)
      setShowDailySectionPicker(false)
      onBack()
    } catch (error) {
      console.error('Error moving to Daily:', error)
      alert('Error al mover a Daily')
    }
  }

  const moveToInbox = async () => {
    try {
      const taskId = task.id
      const updates = {
        page: 'inbox',
        section: 'otras_tareas',
        scheduled_date: null
      }
      
      const result = await onUpdate(taskId, updates)
      
      if (result?.error) {
        alert(`Error al mover a Inbox: ${result.error}`)
        return
      }
      
      alert('✅ Tarea movida a Inbox 📥')
      onBack()
    } catch (error) {
      console.error('Error moving to Inbox:', error)
      alert('Error al mover a Inbox')
    }
  }

  const moveToWeekly = async (dateString) => {
    try {
      const taskId = task.id
      const updates = {
        page: 'weekly',
        scheduled_date: dateString,
        section: 'otras_tareas'
      }
      
      const result = await onUpdate(taskId, updates)
      
      if (result?.error) {
        alert(`Error al programar en la semana: ${result.error}`)
        return
      }
      
      const date = new Date(dateString)
      const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
      const dayName = dayNames[date.getDay()]
      alert(`✅ Tarea programada para ${dayName} 📊`)
      setShowWeeklyPicker(false)
      onBack()
    } catch (error) {
      console.error('Error moving to Weekly:', error)
      alert('Error al programar en la semana')
    }
  }

  // Función para calcular los próximos 5 días laborales
  const getWorkDaysFromToday = () => {
    const today = new Date()
    const days = []
    let currentDate = new Date(today)
    
    // Si hoy es día laboral, empezar desde hoy
    const todayDay = today.getDay()
    const isWeekday = todayDay !== 0 && todayDay !== 6
    
    if (isWeekday) {
      // Si hoy es día laboral, empezar desde hoy
      currentDate = new Date(today)
    } else {
      // Si es fin de semana, empezar desde lunes
      if (todayDay === 0) currentDate.setDate(today.getDate() + 1) // Domingo → Lunes
      if (todayDay === 6) currentDate.setDate(today.getDate() + 2) // Sábado → Lunes
    }
    
    for (let i = 0; i < 5; i++) {
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

  // Función para obtener texto de ubicación actual
  const getCurrentLocationText = () => {
    const currentSection = getCurrentSection()
    const page = editedTask.page || task.page || 'daily'
    
    // Mapeo de páginas
    const pageNames = {
      'daily': 'Daily',
      'weekly': 'Semanal', 
      'inbox': 'Inbox'
    }
    
    // Mapeo de secciones
    const sectionNames = {
      'big_three': 'Big 3',
      'otras_tareas': 'Otras Tareas',
      'en_espera': 'En Espera', 
      'urgent': 'Urgente',
      'normal': 'Otras Tareas',
      'completadas': 'Completadas',
      'monthly': 'Monthly',
      'shopping': 'Shopping'
    }
    
    const pageName = pageNames[page] || 'Daily'
    const sectionName = sectionNames[currentSection] || 'Otras Tareas'
    
    // Si es semanal, añadir el día
    if (page === 'weekly' && task.scheduled_date) {
      const date = new Date(task.scheduled_date)
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const dayName = dayNames[date.getDay()]
      return `${pageName} - ${dayName}`
    }
    
    return `${pageName} - ${sectionName}`
  }

  // Función para obtener icono de ubicación actual
  const getCurrentLocationIcon = () => {
    const currentSection = getCurrentSection()
    const page = editedTask.page || task.page || 'daily'
    
    if (page === 'inbox') return <Inbox size={18} className="text-gray-500" />
    if (page === 'weekly') return <Calendar size={18} className="text-purple-500" />
    
    // Daily sections
    if (currentSection === 'big_three') return <Star size={18} className="text-yellow-500" />
    if (currentSection === 'urgent') return <Flame size={18} className="text-red-500" />
    if (currentSection === 'en_espera') return <Clock size={18} className="text-orange-500" />
    if (currentSection === 'monthly') return <CalendarDays size={18} className="text-purple-500" />
    if (currentSection === 'shopping') return <ShoppingCart size={18} className="text-green-500" />
    
    return <FileText size={18} className="text-blue-500" />
  }

  // Función para manejar movimiento de tarea con handleBulkOperation style
  const handleBulkOperation = async (operation, updates = {}) => {
    try {
      console.log('🔄 TaskDetailScreen handleBulkOperation - task:', task.id, 'from page:', task.page)
      const result = await operation(task.id)
      console.log('✅ TaskDetailScreen handleBulkOperation - SUCCESS')
      
      // Actualizar estado local para mostrar nueva ubicación inmediatamente
      setEditedTask(prev => ({
        ...prev,
        ...updates,
        updated_at: new Date().toISOString()
      }))
      
      // Colapsar después de mover
      setIsLocationSelectorExpanded(false)
      setSelectedPage('daily')
    } catch (error) {
      console.error('❌ TaskDetailScreen handleBulkOperation - ERROR:', error)
      console.error('❌ Full error object:', JSON.stringify(error, null, 2))
      alert('Error al mover la tarea: ' + error.message)
    }
  }

  // Renderizado de secciones compactas estilo TaskManagement
  const renderSectionSelector = () => {
    return (
      <div>
        {/* Selector directo */}
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target size={16} />
          Mover tarea a:
        </h4>
        
        {/* Selector de páginas horizontal - separados */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          <button
            onClick={() => setSelectedPage(selectedPage === 'daily' ? null : 'daily')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border min-h-[44px] ${
              selectedPage === 'daily'
                ? 'bg-blue-50 text-blue-600 border-blue-300 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-600'
            }`}
          >
            <Calendar size={16} className={selectedPage === 'daily' ? 'text-blue-600' : 'text-gray-400'} />
            Daily
          </button>
          
          <button
            onClick={() => setSelectedPage(selectedPage === 'weekly' ? null : 'weekly')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border min-h-[44px] ${
              selectedPage === 'weekly'
                ? 'bg-purple-50 text-purple-600 border-purple-300 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-100 hover:text-purple-600'
            }`}
          >
            <Calendar size={16} className={selectedPage === 'weekly' ? 'text-purple-600' : 'text-gray-400'} />
            Semanal
          </button>
          
          <button
            onClick={() => setSelectedPage(selectedPage === 'inbox' ? null : 'inbox')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border min-h-[44px] ${
              selectedPage === 'inbox'
                ? 'bg-blue-50 text-blue-600 border-blue-300 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-600'
            }`}
          >
            <Inbox size={16} className={selectedPage === 'inbox' ? 'text-blue-600' : 'text-gray-400'} />
            Inbox
          </button>
        </div>

        {/* Secciones dinámicas según página seleccionada */}
        {selectedPage === 'daily' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleBulkOperation(
                  (taskId) => onUpdate(taskId, { section: 'big_three', page: 'daily' }),
                  { section: 'big_three', page: 'daily' }
                )}
                className="flex items-center gap-2 p-3 text-left hover:bg-yellow-50 rounded-lg transition-colors border border-yellow-200 bg-yellow-50"
              >
                <Star size={16} className="text-yellow-500" />
                <div className="text-sm font-medium">Big 3</div>
              </button>
              
              <button
                onClick={() => handleBulkOperation(
                  (taskId) => onUpdate(taskId, { section: 'otras_tareas', page: 'daily' }),
                  { section: 'otras_tareas', page: 'daily' }
                )}
                className="flex items-center gap-2 p-3 text-left hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 bg-blue-50"
              >
                <FileText size={16} className="text-blue-500" />
                <div className="text-sm font-medium">Otras Tareas</div>
              </button>
              
              <button
                onClick={() => handleBulkOperation(
                  (taskId) => onUpdate(taskId, { section: 'en_espera', page: 'daily' }),
                  { section: 'en_espera', page: 'daily' }
                )}
                className="flex items-center gap-2 p-3 text-left hover:bg-orange-100 rounded-lg transition-colors border border-orange-200 bg-orange-50"
              >
                <Clock size={16} className="text-orange-500" />
                <div className="text-sm font-medium">En Espera</div>
              </button>
              
              <button
                onClick={() => handleBulkOperation(
                  (taskId) => onUpdate(taskId, { section: 'urgent', page: 'daily' }),
                  { section: 'urgent', page: 'daily' }
                )}
                className="flex items-center gap-2 p-3 text-left hover:bg-red-100 rounded-lg transition-colors border border-red-200 bg-red-50"
              >
                <Flame size={16} className="text-red-500" />
                <div className="text-sm font-medium">Urgente</div>
              </button>
            </div>
          </div>
        )}

        {selectedPage === 'weekly' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
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
                    onClick={() => handleBulkOperation((taskId) => onUpdate(taskId, { 
                      page: 'weekly', 
                      section: 'otras_tareas',
                      scheduled_date: dateString 
                    }))}
                    className="flex items-center justify-center gap-1 p-3 text-center hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 bg-blue-50"
                  >
                    <span className="text-sm font-medium capitalize">{dayName.slice(0,3)}</span>
                    <span className="text-sm font-medium text-gray-500">{targetDate.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedPage === 'inbox' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleBulkOperation(
                  (taskId) => onUpdate(taskId, { 
                    page: 'inbox', 
                    section: 'inbox_tasks',
                    status: 'inbox',
                    scheduled_date: null
                  }),
                  { page: 'inbox', section: 'inbox_tasks', status: 'inbox', scheduled_date: null }
                )}
                className="flex items-center gap-2 p-3 text-left hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 bg-blue-50"
              >
                <Inbox size={16} className="text-blue-500" />
                <div className="text-sm font-medium">Inbox</div>
              </button>
              
              <button
                onClick={() => handleBulkOperation(
                  (taskId) => onUpdate(taskId, { 
                    page: 'inbox', 
                    section: 'monthly',
                    status: 'inbox',
                    scheduled_date: null
                  }),
                  { page: 'inbox', section: 'monthly', status: 'inbox', scheduled_date: null }
                )}
                className="flex items-center gap-2 p-3 text-left hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 bg-purple-50"
              >
                <CalendarDays size={16} className="text-purple-500" />
                <div className="text-sm font-medium">Monthly</div>
              </button>
              
              <button
                onClick={() => handleBulkOperation(
                  (taskId) => onUpdate(taskId, { 
                    page: 'inbox', 
                    section: 'shopping',
                    status: 'inbox',
                    scheduled_date: null
                  }),
                  { page: 'inbox', section: 'shopping', status: 'inbox', scheduled_date: null }
                )}
                className="flex items-center gap-2 p-3 text-left hover:bg-green-100 rounded-lg transition-colors border border-green-200 bg-green-50"
              >
                <ShoppingCart size={16} className="text-green-500" />
                <div className="text-sm font-medium">Shopping</div>
              </button>
            </div>
          </div>
        )}

        {/* Ubicación actual destacada - al final */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2">
            {getCurrentLocationIcon()}
            <span className="text-sm font-medium text-gray-700">Ubicada en:</span>
            <span className="text-sm font-bold text-gray-900">{getCurrentLocationText()}</span>
          </div>
        </div>
      </div>
    )
  }
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false)
  const [selectedAttachmentType, setSelectedAttachmentType] = useState(null)
  const [attachmentData, setAttachmentData] = useState({})
  const [taskAttachments, setTaskAttachments] = useState(task.attachments || [])
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [subtasksLoaded, setSubtasksLoaded] = useState(false)
  const [showWeeklyPicker, setShowWeeklyPicker] = useState(false)
  const [showDailySectionPicker, setShowDailySectionPicker] = useState(false)
  const [isLocationSelectorExpanded, setIsLocationSelectorExpanded] = useState(true)
  const [selectedPage, setSelectedPage] = useState(null)
  const subtaskInputRef = useRef(null)
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useGestures()
  
  // ✅ DRAG AND DROP SENSORS EXACTOS COMO Daily
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
  
  // ✅ DRAG STATE PARA SUBTAREAS

  // ✅ DRAG HANDLERS BASADOS EN Daily
  const handleSubtaskDragStart = (event) => {
    triggerHapticFeedback('medium')  // Vibración al activar drag
    // Drag start logic if needed in the future
  }

  const handleSubtaskDragEnd = async (event) => {
    const { active, over } = event
    
    
    if (!over || active.id === over.id) {
      return
    }
    
    // Extraer IDs reales
    const activeSubtaskId = active.id.split('-').slice(1).join('-')
    const overSubtaskId = over.id.split('-').slice(1).join('-')
    
    const subtasks = getSubtasks(task.id)
    const oldIndex = subtasks.findIndex(subtask => subtask.id === activeSubtaskId)
    const newIndex = subtasks.findIndex(subtask => subtask.id === overSubtaskId)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    // ✅ REORDENAR USANDO arrayMove COMO Daily
    const reorderedSubtasks = arrayMove(subtasks, oldIndex, newIndex)
    
    // ✅ ACTUALIZAR EN BD Y CACHE
    try {
      await updateSubtaskOrder(task.id, reorderedSubtasks)
    } catch (error) {
      console.error('Error reordenando subtareas:', error)
    }
  }
  
  // Handle swipe right to go back
  const handleSwipeRight = () => {
    onBack()
  }
  
  // Mouse drag support for desktop
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [showSwipeHint, setShowSwipeHint] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }
  
  const handleMouseMove = (e) => {
    if (!isDragging || !dragStart) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    // Only track horizontal movement and prevent scroll
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
      setDragOffset(Math.max(0, deltaX)) // Only positive values (drag right)
      
      if (deltaX > 30) {
        setShowSwipeHint(true)
      }
    }
  }
  
  const handleMouseUp = (e) => {
    if (!isDragging || !dragStart) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    // Check for horizontal drag right with minimum distance
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > window.innerWidth * 0.35) {
      handleSwipeRight()
    }
    
    // Reset states
    setIsDragging(false)
    setDragStart(null)
    setDragOffset(0)
    setShowSwipeHint(false)
  }

  // Actualizar estados cuando cambie la tarea
  useEffect(() => {
    setEditedTask(task)
    setTaskAttachments(task.attachments || [])
  }, [task])

  // Mostrar/ocultar panel de attachments automáticamente cuando cambia modo edición
  useEffect(() => {
    if (isEditing) {
      setShowAttachmentPanel(true)
    } else {
      setShowAttachmentPanel(false)
      setSelectedAttachmentType(null)
    }
  }, [isEditing])

  // Recargar attachments cuando cambie la tarea
  useEffect(() => {
    if (task.id && onReloadAttachments) {
      onReloadAttachments(task.id)
    }
  }, [task.id])

  // Cargar subtareas cuando se monta el componente
  useEffect(() => {
    if (task?.id && task.id !== 'undefined' && typeof task.id === 'string' && loadSubtasks) {
      loadSubtasks(task.id).then(() => {
        setSubtasksLoaded(true)
      }).catch(err => {
        console.error('Error loading subtasks in TaskDetailScreen:', err)
        setSubtasksLoaded(true) // Still mark as loaded to avoid infinite loading
      })
    }
  }, [task?.id])

  // Scroll to top SOLO al entrar a task detail (no al volver)
  useEffect(() => {
    // Solo hacer scroll to top si venimos de otra vista (no restoration)
    if (typeof window !== 'undefined') {
      // Usar un delay para asegurar que el layout está completo
      requestAnimationFrame(() => {
        window.scrollTo(0, 0)
      })
    }
  }, [task.id]) // Solo cuando cambia la tarea específica

  const attachmentTypes = [
    { id: 'image', label: 'Imagen', icon: <Image size={16} />, color: 'pink' },
    { id: 'document', label: 'Documento', icon: <FileText size={16} />, color: 'orange' },
    { id: 'link', label: 'URL', icon: <Link size={16} />, color: 'blue' },
    { id: 'contact', label: 'Contacto', icon: <User size={16} />, color: 'indigo' },
    { id: 'note', label: 'Nota', icon: <StickyNote size={16} />, color: 'purple' },
    { id: 'amount', label: 'Importe', icon: <Euro size={16} />, color: 'green' },
    { id: 'location', label: 'Ubicación', icon: <MapPin size={16} />, color: 'red' }
  ]
  
  const formatTaskDeadline = (deadlineISO) => {
    if (!deadlineISO) return null
    
    const deadlineDate = new Date(deadlineISO)
    const now = new Date()
    const diffTime = deadlineDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `Venció hace ${Math.abs(diffDays)} días`
    } else if (diffDays === 0) {
      return 'Vence hoy'
    } else if (diffDays === 1) {
      return 'Vence mañana'
    } else {
      return `Vence en ${diffDays} días`
    }
  }

  const handleSave = async () => {
    try {
      if (onUpdate) {
        // Solo enviar los campos que realmente se editaron
        const updates = {
          title: editedTask.title || editedTask.text,
          description: editedTask.description || editedTask.notes
        }
        
        // Preservar campos importantes que no deben perderse
        if (task.scheduled_date) updates.scheduled_date = task.scheduled_date
        if (task.page) updates.page = task.page
        if (task.section) updates.section = task.section
        
        console.log('💾 Guardando cambios en TaskDetail:', {
          taskId: task.id,
          updates: updates,
          originalTask: task
        })
        const result = await onUpdate(task.id, updates)
        if (!result || !result.error) {
          setIsEditing(false)
        } else {
          console.error('Error updating task:', result.error)
        }
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !addSubtask) return
    
    const result = await addSubtask(task.id, {
      title: newSubtaskTitle.trim()
    })
    
    if (!result.error) {
      // ✅ FLUJO CONTINUO - resetear input pero mantener formulario abierto
      setNewSubtaskTitle('') // Limpiar input
      // NO setear setShowAddSubtask(false) - mantener abierto para próxima subtarea
      
      // Recargar subtareas para mostrar la nueva
      if (loadSubtasks && task?.id && task.id !== 'undefined' && typeof task.id === 'string') {
        await loadSubtasks(task.id)
      }
      
      // ✅ MANTENER FOCUS después de añadir
      setTimeout(() => subtaskInputRef.current?.focus(), 100)
    } else {
      console.error('Error al crear subtarea:', result.error)
    }
  }

  const handleAddAttachment = async (attachmentData) => {
    try {
      const result = await onAddAttachment(task.id, attachmentData)
      
      if (result && !result.error) {
        setTaskAttachments(prev => [...prev, result.data])
        
        if (onReloadAttachments) {
          await onReloadAttachments(task.id)
        }
        
        setShowAttachmentPanel(false)
        setSelectedAttachmentType(null)
        setAttachmentData({})
      }
    } catch (error) {
      console.error('Error añadiendo attachment:', error)
    }
  }

  const renderAttachmentForm = (type) => {
    switch (type) {
      case 'deadline':
        return (
          <div className="space-y-3 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-700 font-medium">
              <Calendar size={18} />
              <span>Añadir Fecha Límite</span>
            </div>
            <input
              type="date"
              value={attachmentData.deadline || ''}
              onChange={(e) => setAttachmentData({...attachmentData, deadline: e.target.value})}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={async () => {
                  
                  try {
                    const updatedTask = {
                      ...editedTask,
                      deadline: new Date(attachmentData.deadline), // Para UI
                      due_date: attachmentData.deadline // Para DB (legacy)
                    }
                    
                    const result = await onUpdate(task.id, updatedTask)
                    
                    if (!result || !result.error) {
                      // Actualizar estado local para UI inmediata
                      setEditedTask(prev => ({
                        ...prev,
                        deadline: new Date(attachmentData.deadline)
                      }))
                      setSelectedAttachmentType(null)
                      setAttachmentData({})
                    } else {
                      console.error('❌ Error al añadir fecha límite:', result.error)
                      alert('Error al añadir fecha límite: ' + result.error)
                    }
                  } catch (error) {
                    console.error('❌ Error inesperado:', error)
                    alert('Error inesperado al añadir fecha límite')
                  }
                }}
                disabled={!attachmentData.deadline}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                Añadir Fecha Límite
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-3 bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-pink-700 font-medium">
              <Image size={18} />
              <span>Añadir Imagen</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setAttachmentData({
                    ...attachmentData,
                    file: file,
                    fileName: file.name,
                    fileSize: file.size
                  })
                }
              }}
              className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            {attachmentData.file && (
              <div className="p-3 bg-pink-100 rounded-lg border border-pink-200">
                <p className="text-sm font-medium text-pink-800">{attachmentData.fileName}</p>
                <p className="text-xs text-pink-600">{(attachmentData.fileSize / 1024).toFixed(1)} KB</p>
              </div>
            )}
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({ file: attachmentData.file })}
                disabled={!attachmentData.file}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              >
                Añadir Imagen
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'document':
        return (
          <div className="space-y-3 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-700 font-medium">
              <FileText size={18} />
              <span>Añadir Documento</span>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setAttachmentData({
                    ...attachmentData,
                    document: file,
                    fileName: file.name,
                    fileSize: file.size,
                    file: file
                  })
                }
              }}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {attachmentData.document && (
              <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
                <p className="text-sm font-medium">{attachmentData.fileName}</p>
                <p className="text-xs text-gray-600">{(attachmentData.fileSize / 1024).toFixed(1)} KB</p>
              </div>
            )}
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({ file: attachmentData.file })}
                disabled={!attachmentData.document}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                Añadir Documento
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'link':
        return (
          <div className="space-y-3 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <Link size={18} />
              <span>Añadir URL</span>
            </div>
            <input
              type="url"
              placeholder="https://ejemplo.com"
              value={attachmentData.link || ''}
              onChange={(e) => setAttachmentData({...attachmentData, link: e.target.value})}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Título del enlace (opcional)"
              value={attachmentData.linkTitle || ''}
              onChange={(e) => setAttachmentData({...attachmentData, linkTitle: e.target.value})}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({
                  type: 'link', 
                  content: attachmentData.link, 
                  title: attachmentData.linkTitle || attachmentData.link
                })}
                disabled={!attachmentData.link}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Añadir URL
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-3 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-indigo-700 font-medium">
              <User size={18} />
              <span>Añadir Contacto</span>
            </div>
            <input
              type="text"
              placeholder="Nombre del contacto"
              value={attachmentData.contactName || ''}
              onChange={(e) => setAttachmentData({...attachmentData, contactName: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={attachmentData.phone || ''}
              onChange={(e) => setAttachmentData({...attachmentData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              placeholder="Email (opcional)"
              value={attachmentData.email || ''}
              onChange={(e) => setAttachmentData({...attachmentData, email: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({
                  type: 'contact',
                  title: attachmentData.contactName,
                  content: `${attachmentData.contactName}${attachmentData.phone ? '\n📞 ' + attachmentData.phone : ''}${attachmentData.email ? '\n📧 ' + attachmentData.email : ''}`,
                  metadata: {
                    name: attachmentData.contactName,
                    phone: attachmentData.phone,
                    email: attachmentData.email
                  }
                })}
                disabled={!attachmentData.contactName}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Añadir Contacto
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'note':
        return (
          <div className="space-y-3 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-700 font-medium">
              <StickyNote size={18} />
              <span>Añadir Nota</span>
            </div>
            <textarea
              placeholder="Escribe tu nota aquí..."
              value={attachmentData.note || ''}
              onChange={(e) => setAttachmentData({...attachmentData, note: e.target.value})}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({
                  type: 'note',
                  content: attachmentData.note,
                  title: attachmentData.note.length > 30 ? attachmentData.note.substring(0, 30) + '...' : attachmentData.note
                })}
                disabled={!attachmentData.note}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Añadir Nota
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'amount':
        return (
          <div className="space-y-3 bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <Euro size={18} />
              <span>Añadir Importe</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={attachmentData.amount || ''}
                onChange={(e) => setAttachmentData({...attachmentData, amount: e.target.value})}
                className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <select
                value={attachmentData.currency || 'EUR'}
                onChange={(e) => setAttachmentData({...attachmentData, currency: e.target.value})}
                className="px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="EUR">€</option>
                <option value="USD">$</option>
                <option value="GBP">£</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={attachmentData.description || ''}
              onChange={(e) => setAttachmentData({...attachmentData, description: e.target.value})}
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  const currency = attachmentData.currency || 'EUR'
                  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'
                  handleAddAttachment({
                    type: 'amount',
                    title: `${attachmentData.amount}${symbol}${attachmentData.description ? ' - ' + attachmentData.description : ''}`,
                    content: attachmentData.description || `Importe: ${attachmentData.amount} ${currency}`,
                    metadata: {
                      amount: parseFloat(attachmentData.amount),
                      currency: currency,
                      description: attachmentData.description
                    }
                  })
                }}
                disabled={!attachmentData.amount}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Añadir Importe
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-3 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 font-medium">
              <MapPin size={18} />
              <span>Añadir Ubicación</span>
            </div>
            <input
              type="text"
              placeholder="Nombre del lugar"
              value={attachmentData.locationName || ''}
              onChange={(e) => setAttachmentData({...attachmentData, locationName: e.target.value})}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="text"
              placeholder="Dirección (opcional)"
              value={attachmentData.address || ''}
              onChange={(e) => setAttachmentData({...attachmentData, address: e.target.value})}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({
                  type: 'location',
                  title: attachmentData.locationName,
                  content: `📍 ${attachmentData.locationName}${attachmentData.address ? '\n' + attachmentData.address : ''}`,
                  metadata: {
                    name: attachmentData.locationName,
                    address: attachmentData.address
                  }
                })}
                disabled={!attachmentData.locationName}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Añadir Ubicación
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )
        
      case 'deadline':
        return (
          <div className="space-y-3 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-700 font-medium">
              <Calendar size={18} />
              <span>Añadir Fecha límite</span>
            </div>
            <input
              type="date"
              value={attachmentData.deadline || ''}
              onChange={(e) => setAttachmentData({...attachmentData, deadline: e.target.value})}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={attachmentData.deadlineDescription || ''}
              onChange={(e) => setAttachmentData({...attachmentData, deadlineDescription: e.target.value})}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  const date = new Date(attachmentData.deadline)
                  const formattedDate = date.toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })
                  handleAddAttachment({
                    type: 'deadline',
                    title: `📅 ${formattedDate}${attachmentData.deadlineDescription ? ' - ' + attachmentData.deadlineDescription : ''}`,
                    content: formattedDate,
                    metadata: {
                      date: attachmentData.deadline,
                      description: attachmentData.deadlineDescription
                    }
                  })
                }}
                disabled={!attachmentData.deadline}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                Añadir Fecha
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const deadline = formatTaskDeadline(editedTask.deadline)

  return (
    <div 
      className="min-h-screen bg-gray-50 relative overflow-hidden"
      onTouchStart={(e) => handleTouchStart(e)}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => handleTouchEnd(e, handleSwipeRight)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false)
        setDragStart(null)
        setDragOffset(0)
        setShowSwipeHint(false)
      }}
      style={{ 
        transform: `translateX(${Math.min(dragOffset * 0.8, window.innerWidth * 0.4)}px)`,
        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      {/* Background parallax effect - SOLO AÑADIR ESTO */}
      {dragOffset > 10 && (
        <div 
          className="fixed inset-0 bg-black/20 pointer-events-none z-0"
          style={{
            opacity: Math.min(dragOffset / (window.innerWidth * 0.35), 0.3),
            transform: `translateX(${-window.innerWidth + (dragOffset * 0.3)}px)`
          }}
        />
      )}
      {/* Swipe hint indicator */}
      {(showSwipeHint || dragOffset > 30) && (
        <div 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none"
          style={{ 
            opacity: Math.min(dragOffset / 80, 1),
            transform: `translateY(-50%) translateX(${Math.min(dragOffset * 0.5, 40)}px)`
          }}
        >
          <div className="bg-white/90 backdrop-blur rounded-full p-3 shadow-lg border">
            <div className="flex items-center gap-2 text-blue-600">
              <span className="text-sm font-medium">← Volver</span>
            </div>
          </div>
        </div>
      )}
      {/* Header Modernizado */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2.5 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowLeft size={22} />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Detalles de tarea</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Edit3 size={20} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedTask(task)
                  }}
                  className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Modernizado */}
      <div className="p-4 max-w-2xl mx-auto">
        {/* Título Limpio de la Tarea */}
        <div className="mb-6">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editedTask.text || editedTask.title || ''}
                onChange={(e) => setEditedTask({...editedTask, text: e.target.value, title: e.target.value})}
                className="w-full text-2xl font-semibold bg-transparent border-b-2 border-blue-200 focus:border-blue-500 outline-none pb-2 text-gray-900"
                placeholder="Título de la tarea..."
              />
              <textarea
                value={editedTask.description || editedTask.notes || ''}
                onChange={(e) => setEditedTask({...editedTask, description: e.target.value, notes: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y text-base"
                placeholder="Añade una descripción..."
              />
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                {task.title || task.text || 'Sin título'}
              </h1>
              {(task.description || task.notes) && (task.description || task.notes).trim() !== '' && (
                <p className="text-gray-600 text-base leading-relaxed mb-2 whitespace-pre-wrap break-words">
                  {task.description || task.notes}
                </p>
              )}
            </div>
          )}
          
        </div>

        {/* Section Selector - Versión Compacta */}
        <div className="mb-6">
          {renderSectionSelector()}
        </div>
        

        {/* Metadata Grid - Con fecha límite sin recuadro */}
        {(deadline || task.amount || task.link) && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {deadline && (
              <div className="col-span-2 text-center">
                <div className="flex items-center justify-center gap-2 text-orange-700">
                  <Calendar size={18} />
                  <div>
                    <p className="text-xs font-medium text-orange-600">Fecha límite</p>
                    <p className="text-sm font-semibold">{deadline}</p>
                  </div>
                </div>
              </div>
            )}
            
            {task.amount && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Euro size={18} />
                  <div>
                    <p className="text-xs font-medium text-green-600">Importe</p>
                    <p className="text-sm font-semibold">{task.amount}€</p>
                  </div>
                </div>
              </div>
            )}
            
            {task.link && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 col-span-2">
                <div className="flex items-center gap-2 text-blue-700">
                  <Link size={18} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-600">Enlace</p>
                    <a 
                      href={task.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-semibold hover:underline truncate block"
                    >
                      {task.link}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attachments Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
          <div className="p-6">
            {/* Solo mostrar header y botón si NO está editando */}
            {!isEditing && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Link size={18} className="text-gray-600" />
                  Adjuntos ({taskAttachments.length})
                </h3>
                <button
                  onClick={() => setShowAttachmentPanel(!showAttachmentPanel)}
                  className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  <span>Añadir</span>
                </button>
              </div>
            )}

            {/* Attachment Panel que se despliega */}
            {showAttachmentPanel && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm mt-3 p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-900 text-sm sm:text-base">Añadir a tu tarea:</span>
                  </div>
                  {/* Solo mostrar botón cerrar si NO está editando */}
                  {!isEditing && (
                    <button 
                      onClick={() => setSelectedAttachmentType(null)}
                      className="p-1 text-blue-400 hover:text-blue-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <SmartAttachmentsPanel
                  isOpen={true}
                  onClose={() => {}} 
                  onAttach={async (attachment) => {
                    try {
                      // Verificar que attachment tenga la estructura correcta
                      if (attachment && typeof attachment === 'object') {
                        await onAddAttachment(attachment)
                        await onReloadAttachments()
                      } else {
                        console.error('Attachment data is invalid:', attachment)
                      }
                    } catch (error) {
                      console.error('Error añadiendo adjunto:', error)
                      alert('Error al añadir adjunto: ' + error.message)
                    }
                  }}
                  onDeadlineSet={async (deadline) => {
                    try {
                      const result = await onUpdate(task.id, { 
                        deadline: deadline,
                        due_date: deadline.toISOString().split('T')[0]
                      })
                      if (!result || !result.error) {
                        setEditedTask(prev => ({ ...prev, deadline }))
                      }
                    } catch (error) {
                      console.error('Error añadiendo fecha límite:', error)
                    }
                  }}
                  taskText={task.title}
                  existingAttachments={taskAttachments}
                />
              </div>
            )}

            {/* Lista de attachments existentes */}
            {taskAttachments.length > 0 && (
              <div className="space-y-2">
                {taskAttachments.map((attachment) => {
                  // Procesar attachment para correcta visualización
                  const processedAttachment = {
                    ...attachment,
                    // Asegurar que tenga display title
                    displayTitle: attachment.title || attachment.file_name || 'Sin título',
                    // Determinar tipo correcto
                    displayType: attachment.type || (attachment.file_type?.startsWith('image/') ? 'image' : 'document'),
                    // Asegurar contenido para mostrar
                    displayContent: attachment.content || null,
                    // Para links, hacer clickeable
                    isClickable: attachment.type === 'link' && attachment.content
                  }
                  
                  return (
                    <AttachmentItem
                      key={attachment.id}
                      attachment={processedAttachment}
                      onDelete={async () => {
                        const result = await onDeleteAttachment(task.id, attachment.id)
                        
                        if (!result?.error) {
                          setTaskAttachments(prev => prev.filter(att => att.id !== attachment.id))
                        } else {
                          console.error('Error eliminando attachment:', result.error)
                        }
                      }}
                    />
                  )
                })}
              </div>
            )}

            {taskAttachments.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No hay archivos adjuntos
              </p>
            )}
          </div>
        </div>

        {/* 🆕 SECCIÓN SUBTAREAS - SIEMPRE VISIBLE */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle size={18} className="text-gray-600" />
                Subtareas ({getSubtasks(task.id).length})
              </h3>
              <button 
                onClick={() => setShowAddSubtask(!showAddSubtask)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {showAddSubtask ? 'Cancelar' : '+ Añadir'}
              </button>
            </div>

            {/* ✅ DRAG AND DROP DE SUBTAREAS - PATRÓN EXACTO DE Daily */}
            {getSubtasks(task.id).length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleSubtaskDragStart}
                onDragEnd={handleSubtaskDragEnd}
                modifiers={[restrictToVerticalAxis]}
                accessibility={{
                  screenReaderInstructions: {
                    draggable: 'Para reordenar subtareas, mantén presionado y arrastra'
                  }
                }}
              >
                {/* ✅ SORTABLECONTEXT CON IDs COMO Daily */}
                <SortableContext 
                  items={getSubtasks(task.id).map(subtask => `subtask-${subtask.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 mb-4">
                    {getSubtasks(task.id).map(subtask => (
                      <SortableSubtask
                        key={subtask.id}
                        subtask={subtask}
                        onToggleComplete={onToggleTaskComplete}
                        onDelete={deleteSubtask}
                      />
                    ))}
                  </div>
                </SortableContext>
                
              </DndContext>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm mb-4">
                No hay subtareas creadas
              </div>
            )}

            {/* Formulario para añadir subtarea */}
            {showAddSubtask && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  ref={subtaskInputRef}
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Título de la subtarea..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSubtask()
                      // ✅ MANTENER FOCUS después de añadir - ya se maneja en handleAddSubtask
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Añadir
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSubtask(false)
                      setNewSubtaskTitle('')
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción cuando está editando */}
        {isEditing && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-4 p-4">
            <button
              onClick={handleSave}
              className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
            >
              Guardar cambios
            </button>
          </div>
        )}

        {/* Botón de eliminar tarea */}
        <div className="mt-8">
          <button
            onClick={() => {
              const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.')
              if (confirmDelete) {
                onDelete(task.id)
              }
            }}
            className="w-full py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium min-h-[44px] border border-red-200"
          >
            Eliminar tarea
          </button>
        </div>

        {/* Creation Date - Movida después del botón eliminar */}
        <div className="text-center pt-4 border-t border-gray-100 mt-6">
          <p className="text-sm text-gray-500">
            Creada el {new Date(task.created_at || Date.now()).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailScreen