import React, { useState, useEffect } from 'react'
import BaseCard from '../ui/BaseCard'
import BaseButton from '../ui/BaseButton'
import AttachmentItem from '../attachments/AttachmentItem'
import { useGestures } from '@/hooks/useGestures'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { TASK_SECTIONS, getSectionColorClasses } from '../../config/taskSections'
import { ArrowLeft, Edit3, X, Plus, CheckCircle, Circle, CircleCheck, Star, StarOff, Calendar, Link, Euro, Clock, Inbox, MapPin, FileText, User, Trash2, Flame, Target } from 'lucide-react'

const TaskDetailScreen = ({ task, onBack, onEdit, onDelete, onToggleComplete, onUpdate, onToggleImportant, onToggleWaitingStatus, onToggleUrgent, onAddAttachment, onDeleteAttachment, onReloadAttachments, subtasksCount = 0, getSubtasks, loadSubtasks, onToggleTaskComplete, addSubtask, deleteSubtask }) => {
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
    console.log('🔄 Section toggle:', toggleFunction, 'for task:', taskId)
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
      console.log('✅ Section toggle executed successfully')
    } catch (error) {
      console.error('❌ Error in section toggle:', error)
      alert('Error al cambiar la sección. Inténtalo de nuevo.')
    }
  }

  // Función para determinar qué sección está activa actualmente - PRECEDENCIA MEJORADA
  const getCurrentSection = () => {
    // Si está completada (máxima precedencia)
    if (task.completed) return 'completed'
    
    // ✅ CUSTOM SECTIONS - VERIFICAR section_id PRIMERO
    if (task.section_id && task.section_id.startsWith('custom_')) {
      return task.section_id
    }
    
    // PRECEDENCIA DEFAULT: Urgente > Big 3 > En Espera > Normal
    if (task.priority === 'urgent') {
      // Buscar sección urgente custom
      const urgentSection = visibleSections.find(s => s.name === 'Urgente' && s.isCustom)
      return urgentSection ? urgentSection.id : 'urgent'
    }
    
    if (task.is_big_3_today || task.important) return 'big3'
    if (task.status === 'pending') return 'waiting'
    
    return 'normal'
  }

  // Función para renderizar iconos con colores
  const renderTaskSectionIcon = (iconName, sectionId, size = 20) => {
    const getIconColor = (id) => {
      switch(id) {
        case 'big3': return 'text-yellow-500'
        case 'normal': return 'text-blue-500'
        case 'waiting': return 'text-orange-500'
        case 'urgent': return 'text-red-500'
        case 'completed': return 'text-green-500'
        default: return 'text-gray-500'
      }
    }
    
    const iconColor = getIconColor(sectionId)
    
    const icons = {
      Star: <Star size={size} className={iconColor} />,
      FileText: <FileText size={size} className={iconColor} />,
      Clock: <Clock size={size} className={iconColor} />,
      Flame: <Flame size={size} className={iconColor} />,
      CheckCircle: <CheckCircle size={size} className={iconColor} />
    }
    return icons[iconName] || <FileText size={size} className={iconColor} />
  }

  // ✅ SECCIONES DINÁMICAS: DEFAULT + CUSTOM
  const SECTION_OPTIONS = [
    {
      id: 'big3',
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
      id: 'waiting',
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
      id: 'completed',
      name: 'Completar',
      icon: 'CheckCircle',
      description: 'Marcar como terminada'
    }
  ]

  // Función handler para cambios de sección - LÓGICA COORDINADA
  const handleSectionChange = async (newSectionId) => {
    const currentSection = getCurrentSection()
    
    if (currentSection === newSectionId) {
      console.log('Ya está en esta sección')
      return
    }

    try {
      // STEP 1: Limpiar TODOS los flags de sección actual
      if (currentSection.startsWith('custom_')) {
        // ✅ LIMPIAR CUSTOM SECTION
        await onUpdate(task.id, { section_id: null })
      } else {
        switch(currentSection) {
          case 'big3':
            if (task.important || task.is_big_3_today) {
              await onToggleImportant(task.id)
            }
            break
          case 'waiting':
            if (task.status === 'pending') {
              await onToggleWaitingStatus(task.id)
            }
            break
          case 'urgent':
            if (task.priority === 'urgent' && onToggleUrgent) {
              await onToggleUrgent(task.id)
            }
            break
        }
      }

      // STEP 2: Aplicar la nueva sección
      if (newSectionId.startsWith('custom_')) {
        // ✅ ASIGNAR A CUSTOM SECTION
        await onUpdate(task.id, { section_id: newSectionId })
      } else {
        switch(newSectionId) {
          case 'completed':
            await onToggleComplete(task.id)
            onBack() // Cerrar modal después de completar
            break
            
          case 'big3':
            if (!task.important && !task.is_big_3_today) {
              await onToggleImportant(task.id)
            }
            break
            
          case 'waiting':
            if (task.status !== 'pending') {
              await onToggleWaitingStatus(task.id)
            }
            break
            
          case 'urgent':
            if (task.priority !== 'urgent' && onToggleUrgent) {
              await onToggleUrgent(task.id)
            }
            break
            
          case 'normal':
            // Ya limpiado en STEP 1, no hacer nada más
            break
        }
      }
      
      // Forzar re-render para mostrar cambio
      setEditedTask(prev => ({ ...prev, updated_at: new Date().toISOString() }))
      
    } catch (error) {
      console.error('Error changing section:', error)
      alert('Error al cambiar la sección: ' + error.message)
    }
  }

  // Renderizado de secciones estilo Gestionar Tareas
  const renderSectionSelector = () => {
    const currentSection = getCurrentSection()
    
    return (
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={16} />
            Mover tarea a:
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {SECTION_OPTIONS.map(section => {
              const isActive = currentSection === section.id
              
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 text-center min-h-[60px] hover:shadow-md ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {renderTaskSectionIcon(section.icon, section.id)}
                    <span className="text-xs font-medium">{section.name}</span>
                  </div>
                </button>
              )
            })}
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
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useGestures()
  
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
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 80) {
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
  }, [task.id, onReloadAttachments])

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
  }, [task?.id, loadSubtasks])

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
    { id: 'image', label: 'Imagen', icon: '🖼️', color: 'pink' },
    { id: 'document', label: 'Documento', icon: '📄', color: 'orange' },
    { id: 'link', label: 'URL', icon: '🔗', color: 'blue' },
    { id: 'contact', label: 'Contacto', icon: '👤', color: 'indigo' },
    { id: 'note', label: 'Nota', icon: '📝', color: 'purple' },
    { id: 'amount', label: 'Importe', icon: '💰', color: 'green' },
    { id: 'location', label: 'Ubicación', icon: '📍', color: 'red' }
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
        const result = await onUpdate(task.id, editedTask)
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
      setNewSubtaskTitle('')
      setShowAddSubtask(false)
      // Recargar subtareas para mostrar la nueva
      if (loadSubtasks && task?.id && task.id !== 'undefined' && typeof task.id === 'string') {
        await loadSubtasks(task.id)
      }
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
              <span className="text-lg">📅</span>
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
                  const updatedTask = {
                    ...editedTask,
                    due_date: attachmentData.deadline
                  }
                  setEditedTask(updatedTask)
                  await onUpdate(updatedTask)
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
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
              <span className="text-lg">🖼️</span>
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
              <span className="text-lg">📄</span>
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
              <span className="text-lg">🔗</span>
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
              <span className="text-lg">👤</span>
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
              <span className="text-lg">📝</span>
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
              <span className="text-lg">💰</span>
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
              <span className="text-lg">📍</span>
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
              <span className="text-lg">📅</span>
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
        transform: `translateX(${Math.min(dragOffset * 0.3, 30)}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
      }}
    >
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
          
          {/* Información adicional compacta */}
          {!isEditing && (
            <div className="flex flex-wrap gap-3">
              {task.deadline && (
                <div className="flex items-center gap-1 text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                  <Calendar size={14} />
                  <span>{formatTaskDeadline(task.deadline)}</span>
                </div>
              )}
              {task.amount && (
                <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  <Euro size={14} />
                  <span>{task.amount}€</span>
                </div>
              )}
              {task.link && (
                <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                  <Link size={14} />
                  <span className="truncate max-w-[120px]">Enlace</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section Selector - Estilo Gestionar Tareas */}
        <div className="mb-6">
          {renderSectionSelector()}
        </div>
        

        {/* Metadata Cards */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              {deadline && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-orange-700">
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

            {/* Creation Date */}
            <div className="text-center pt-4 border-t border-gray-100">
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

        {/* Attachments Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
          <div className="p-6">
            {/* Solo mostrar header y botón si NO está editando */}
            {!isEditing && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  📎 Adjuntos ({taskAttachments.length})
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
                    <span className="text-blue-600">📎</span>
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

                {!selectedAttachmentType ? (
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedAttachmentType('deadline')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-orange-700 hover:bg-orange-50 border border-orange-200"
                    >
                      <span className="text-base sm:text-sm">📅</span>
                      <span className="hidden xs:inline sm:inline">Fecha límite</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Fecha límite</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('link')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
                    >
                      <span className="text-base sm:text-sm">🔗</span>
                      <span className="hidden xs:inline sm:inline">Link</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Link</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('amount')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-green-700 hover:bg-green-50 border border-green-200"
                    >
                      <span className="text-base sm:text-sm">💰</span>
                      <span className="hidden xs:inline sm:inline">Importe</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Importe</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('note')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-purple-700 hover:bg-purple-50 border border-purple-200"
                    >
                      <span className="text-base sm:text-sm">📝</span>
                      <span className="hidden xs:inline sm:inline">Nota</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Nota</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('image')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-pink-700 hover:bg-pink-50 border border-pink-200"
                    >
                      <span className="text-base sm:text-sm">🖼️</span>
                      <span className="hidden xs:inline sm:inline">Imagen</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Imagen</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('document')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-orange-700 hover:bg-orange-50 border border-orange-200"
                    >
                      <span className="text-base sm:text-sm">📄</span>
                      <span className="hidden xs:inline sm:inline">Documento</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Documento</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('location')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-red-700 hover:bg-red-50 border border-red-200"
                    >
                      <span className="text-base sm:text-sm">📍</span>
                      <span className="hidden xs:inline sm:inline">Ubicación</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Ubicación</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('contact')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200"
                    >
                      <span className="text-base sm:text-sm">👤</span>
                      <span className="hidden xs:inline sm:inline">Contacto</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Contacto</span>
                    </button>
                  </div>
                ) : (
                  renderAttachmentForm(selectedAttachmentType)
                )}
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
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Subtareas ({getSubtasks(task.id).length})
              </h3>
              <button 
                onClick={() => setShowAddSubtask(!showAddSubtask)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {showAddSubtask ? 'Cancelar' : '+ Añadir'}
              </button>
            </div>

            {/* Lista de subtareas - solo si hay alguna */}
            {getSubtasks(task.id).length > 0 ? (
              <div className="space-y-2 mb-4">
                {getSubtasks(task.id).map(subtask => (
                  <div 
                    key={subtask.id} 
                    onClick={() => onToggleTaskComplete(subtask.id)}
                    className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer p-3 transition-all duration-200 ease-out opacity-100 ${
                      subtask.completed 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="transition-colors text-green-500">
                        {subtask.completed ? (
                          <CircleCheck size={18} />
                        ) : (
                          <Circle size={18} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium transition-all duration-300 ${
                          subtask.completed 
                            ? 'text-green-700 line-through' 
                            : 'text-gray-900'
                        }`}>
                          {subtask.title}
                        </span>
                      </div>

                      {/* Botón eliminar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSubtask(subtask.id)
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Eliminar subtarea"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm mb-4">
                No hay subtareas creadas
              </div>
            )}

            {/* Formulario para añadir subtarea */}
            {showAddSubtask && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Título de la subtarea..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSubtask()
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
      </div>
    </div>
  )
}

export default TaskDetailScreen