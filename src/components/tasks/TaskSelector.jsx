import React, { useState } from 'react'
import { X, Star, Target, CheckCircle, FileText, Clock, Flame, Trash2 } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { formatDeadline } from '@/utils/dateHelpers'
import { TASK_SECTIONS, getSectionColorClasses } from '../../config/taskSections'

const TaskSelector = ({ isOpen, onClose, tasks = [], currentBig3 = [] }) => {
  const { setBig3Tasks, bulkUpdateStatus, bulkToggleImportant, bulkDelete, toggleUrgent } = useTasks()
  const [selectedTasks, setSelectedTasks] = useState(currentBig3.map(t => t.id))
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('big3')

  if (!isOpen) return null

  // Función para renderizar iconos Lucide con colores según sección
  const renderSectionIcon = (iconName, size = 18, sectionColor) => {
    const getIconColor = (color) => {
      switch(color) {
        case 'yellow': return 'text-yellow-500'
        case 'blue': return 'text-blue-500'
        case 'gray': return 'text-orange-500'
        case 'red': return 'text-red-500'
        default: return 'text-gray-500'
      }
    }
    
    const iconColor = sectionColor ? getIconColor(sectionColor) : 'text-gray-500'
    
    const icons = {
      Star: <Star size={size} className={iconColor} />,
      FileText: <FileText size={size} className={iconColor} />,
      Clock: <Clock size={size} className={iconColor} />,
      Flame: <Flame size={size} className={iconColor} />,
      Trash2: <Trash2 size={size} className={iconColor} />
    }
    return icons[iconName] || <FileText size={size} className={iconColor} />
  }

  // Función para obtener clases simples para cada sección
  const getSelectorButtonClasses = (section, isActive) => {
    const baseClasses = "p-4 rounded-xl border-2 transition-all duration-200 text-left min-h-[60px] hover:shadow-md"
    
    return `${baseClasses} ${isActive 
      ? 'bg-blue-50 border-blue-500 text-blue-700'
      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
    }`
  }

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId)
      } else {
        // Solo Big 3 tiene límite de 3 tareas
        if (activeSection === 'big3' && prev.length >= 3) {
          return prev
        }
        return [...prev, taskId]
      }
    })
  }

  const handleSave = async () => {
    setLoading(true)
    
    try {
      const result = await setBig3Tasks(selectedTasks)
      
      if (result.error) {
        alert('Error al guardar: ' + result.error)
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error saving Big 3:', error)
      alert('Error al guardar las tareas')
    } finally {
      setLoading(false)
    }
  }

  const handleMoveToWaiting = async () => {
    if (selectedTasks.length === 0) return
    setLoading(true)
    
    try {
      const result = await bulkUpdateStatus(selectedTasks, 'pending')
      
      if (result.error) {
        alert('Error al mover a En Espera: ' + result.error)
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error moving to waiting:', error)
      alert('Error al mover las tareas')
    } finally {
      setLoading(false)
    }
  }

  const handleMoveToNormal = async () => {
    if (selectedTasks.length === 0) return
    setLoading(true)
    
    try {
      // Move to normal: important=false, status='inbox'
      const statusResult = await bulkUpdateStatus(selectedTasks, 'inbox')
      if (statusResult.error) throw new Error(statusResult.error)
      
      const importantResult = await bulkToggleImportant(selectedTasks, false)
      if (importantResult.error) throw new Error(importantResult.error)
      
      onClose()
    } catch (error) {
      console.error('Error moving to normal:', error)
      alert('Error al mover las tareas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUrgent = async () => {
    if (selectedTasks.length === 0) return
    setLoading(true)
    
    try {
      // Toggle urgent for each selected task
      for (const taskId of selectedTasks) {
        const result = await toggleUrgent(taskId)
        if (result.error) {
          console.error('Error toggling urgent for task', taskId, ':', result.error)
        }
      }
      onClose()
    } catch (error) {
      console.error('Error toggling urgent:', error)
      alert('Error al cambiar urgencia: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedTasks.length === 0) return
    
    const confirmDelete = confirm(
      `¿Estás seguro de eliminar ${selectedTasks.length} tarea${selectedTasks.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`
    )
    
    if (!confirmDelete) return
    
    setLoading(true)
    
    try {
      const result = await bulkDelete(selectedTasks)
      
      if (result.error) {
        alert('Error al eliminar: ' + result.error)
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error deleting tasks:', error)
      alert('Error al eliminar las tareas')
    } finally {
      setLoading(false)
    }
  }

  // Función unificada para manejar acciones según sección activa
  const handleAction = async () => {
    if (selectedTasks.length === 0) return

    switch (activeSection) {
      case 'big3':
        return await handleSave()
      case 'waiting':
        return await handleMoveToWaiting()
      case 'normal':
        return await handleMoveToNormal()
      case 'urgent':
        return await handleToggleUrgent()
      case 'delete':
        return await handleDeleteSelected()
      default:
        return
    }
  }

  // Configuración de botones dinámica
  const getActionButtonConfig = () => {
    const configs = {
      big3: { 
        text: `Guardar Big 3 (${selectedTasks.length}/3)`, 
        color: 'bg-blue-600 hover:bg-blue-700', 
        disabled: selectedTasks.length === 0 || selectedTasks.length > 3 
      },
      waiting: { 
        text: `Mover a En Espera (${selectedTasks.length})`, 
        color: 'bg-amber-600 hover:bg-amber-700', 
        disabled: selectedTasks.length === 0 
      },
      normal: { 
        text: `Mover a Normal (${selectedTasks.length})`, 
        color: 'bg-gray-600 hover:bg-gray-700', 
        disabled: selectedTasks.length === 0 
      },
      urgent: { 
        text: `Marcar Urgente (${selectedTasks.length})`, 
        color: 'bg-red-500 hover:bg-red-600', 
        disabled: selectedTasks.length === 0 
      },
      delete: { 
        text: `Eliminar Tareas (${selectedTasks.length})`, 
        color: 'bg-red-600 hover:bg-red-700', 
        disabled: selectedTasks.length === 0 
      }
    }
    return configs[activeSection]
  }

  // Combine routine tasks and current Big 3 for selection
  const availableTasks = [
    ...tasks,
    ...currentBig3.map(task => ({ ...task, isBig3: true }))
  ].filter((task, index, self) => 
    // Remove duplicates
    index === self.findIndex(t => t.id === task.id)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Gestionar Tareas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section Selector */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Elige sección y selecciona tareas para mover:</h4>
          <div className="grid grid-cols-2 gap-3">
            {TASK_SECTIONS
              .filter(section => section.showInSelector)
              .sort((a, b) => a.priority - b.priority)
              .map(section => {
                const sectionTasks = tasks.filter(task => {
                  if (section.filterFunction) {
                    return section.filterFunction([task]).length > 0
                  }
                  return false
                })
                const taskCount = sectionTasks.length
                
                return (
                  <button 
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id)
                      // Si es Big 3 y hay más de 3 tareas seleccionadas, limpiar selección
                      if (section.id === 'big3' && selectedTasks.length > 3) {
                        setSelectedTasks([])
                      }
                    }}
                    className={getSelectorButtonClasses(section, activeSection === section.id)}
                  >
                    <div className="flex items-center gap-3">
                      {renderSectionIcon(section.icon, 20, section.color)}
                      <span className="font-medium">{section.name}</span>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
        
        {/* Tasks List */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {availableTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No hay tareas disponibles</h4>
              <p className="text-gray-600">
                Agrega algunas tareas primero para poder seleccionar tu Big 3
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableTasks.map((task) => {
                const isSelected = selectedTasks.includes(task.id)
                const isCurrentBig3 = task.isBig3 || task.important
                
                return (
                  <div
                    key={task.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleTaskSelection(task.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{task.title}</span>
                          {isCurrentBig3 && (
                            <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {task.deadline && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {formatDeadline(task.deadline)}
                            </span>
                          )}
                          {task.amount && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                              {task.amount}€
                            </span>
                          )}
                        </div>
                        
                        {task.notes && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAction}
              disabled={loading || availableTasks.length === 0 || getActionButtonConfig().disabled}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${getActionButtonConfig().color}`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </div>
              ) : (
                getActionButtonConfig().text
              )}
            </button>
          </div>
          
          {/* Tips */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-1">💡 Gestión de tareas:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Big 3:</strong> Máximo 3 tareas importantes del día</li>
              <li>• <strong>En Espera:</strong> Tareas esperando respuesta externa</li>
              <li>• <strong>Otras:</strong> Tareas normales sin prioridad especial</li>
              <li>• Selecciona varias tareas para moverlas en lote</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskSelector