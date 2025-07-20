import React, { useState } from 'react'
import BaseCard from '../ui/BaseCard'
import BaseButton from '../ui/BaseButton'
import AttachmentItem from '../attachments/AttachmentItem'
import SmartAttachmentsPanel from '../attachments/SmartAttachmentsPanel'
import { useGestures } from '@/hooks/useGestures'
import { ArrowLeft, Edit3, Save, X, Plus, Trash2 } from 'lucide-react'

const TaskDetailScreen = ({ task, onBack, onEdit, onDelete, onToggleComplete, onUpdate, onToggleImportant }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState(task)
  const [showAttachments, setShowAttachments] = useState(false)
  const [taskAttachments, setTaskAttachments] = useState(task.attachments || [])
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useGestures()

  // Actualizar estados cuando cambie la tarea
  React.useEffect(() => {
    setEditedTask(task)
    setTaskAttachments(task.attachments || [])
  }, [task])
  
  const formatTaskDeadline = (deadlineISO) => {
    if (!deadlineISO) return null
    
    const deadlineDate = new Date(deadlineISO)
    return deadlineDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  const handleAddAttachment = (attachment) => {
    setTaskAttachments(prev => [...prev, attachment])
    setEditedTask(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), attachment]
    }))
  }

  const handleRemoveAttachment = (index) => {
    setTaskAttachments(prev => prev.filter((_, i) => i !== index))
    setEditedTask(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }))
  }

  const handleDeadlineSet = (deadline) => {
    setEditedTask(prev => ({
      ...prev,
      deadline: deadline
    }))
  }

  const handleSwipeRight = () => {
    onBack()
  }

  return (
    <div 
      className="min-h-screen bg-gray-50"
      onTouchStart={(e) => handleTouchStart(e)}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => handleTouchEnd(e, handleSwipeRight)}
    >
      {/* Header - Daily Branding */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Editar Tarea' : task.title}
            </h1>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setIsEditing(false)
                  setEditedTask(task)
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (onUpdate) onUpdate(editedTask)
                  setIsEditing(false)
                }}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Guardar
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Content - Daily Style */}
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Título de la tarea */}
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Ej: Llamar cliente jueves 15:00 para proyecto..."
              value={editedTask.title}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
              className="w-full min-h-[44px] touch-manipulation px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              value={editedTask.description || editedTask.notes || ''}
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value, notes: e.target.value})}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción o notas adicionales..."
              rows={3}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {task.important && <span className="text-yellow-500">⭐ Big 3</span>}
              {task.completed && <span className="text-green-500">✅ Completada</span>}
              {task.deadline && <span className="text-orange-500">📅 {formatTaskDeadline(task.deadline)}</span>}
              {task.amount && <span className="text-green-500">💰 {task.amount}€</span>}
            </div>
            {task.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{task.description}</p>
            )}
          </div>
        )}

        {/* Smart Attachments Panel - Daily Style */}
        {isEditing && (
          <div className="space-y-3">
            {/* Mostrar attachments existentes */}
            {taskAttachments.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Adjuntos actuales</h5>
                {taskAttachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <AttachmentItem attachment={attachment} />
                    <button
                      onClick={() => handleRemoveAttachment(index)}
                      className="p-1 text-red-500 hover:text-red-600 transition-colors ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* SmartAttachmentsPanel SIEMPRE VISIBLE */}
            <SmartAttachmentsPanel
              isOpen={true}
              onClose={() => {}} // No se puede cerrar
              onAttach={handleAddAttachment}
              onDeadlineSet={handleDeadlineSet}
              taskText={editedTask.title || ''}
              existingAttachments={taskAttachments}
              currentDeadline={editedTask.deadline || ''}
            />
          </div>
        )}

        {/* Adjuntos en modo vista - Daily Style */}
        {!isEditing && task.attachments && task.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Adjuntos</h4>
            {task.attachments.map((attachment, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                <AttachmentItem attachment={attachment} />
              </div>
            ))}
          </div>
        )}

        {/* Link */}
        {!isEditing && task.link && (
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">🔗 Enlace</h4>
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 text-sm underline break-all"
            >
              {task.link}
            </a>
          </div>
        )}

        {/* Información de creación */}
        {!isEditing && task.created_at && (
          <div className="text-xs text-gray-500 text-center">
            Creada el {new Date(task.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}

        {/* Acciones - Estilo Daily */}
        <div className="flex gap-2 pb-6">
          <button 
            onClick={() => onToggleComplete(task.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-lg transition-all touch-manipulation ${
              task.completed
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            <span className="text-sm">
              {task.completed ? '↻' : '✓'}
            </span>
            <span className="text-xs sm:text-sm font-medium">
              {task.completed ? 'Pendiente' : 'Completar'}
            </span>
          </button>
          
          <button 
            onClick={() => {
              if (onToggleImportant) onToggleImportant(task.id)
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all touch-manipulation"
          >
            <span className="text-sm">⭐</span>
            <span className="text-xs sm:text-sm font-medium">
              {task.important ? 'Quitar Big 3' : 'Big 3'}
            </span>
          </button>

          {onDelete && (
            <button 
              onClick={() => onDelete(task.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all touch-manipulation"
            >
              <span className="text-sm">🗑️</span>
              <span className="text-xs sm:text-sm font-medium">
                Eliminar
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskDetailScreen