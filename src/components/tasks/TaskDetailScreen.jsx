import React from 'react'
import BaseCard from '../ui/BaseCard'
import BaseButton from '../ui/BaseButton'
import AttachmentItem from '../attachments/AttachmentItem'

const TaskDetailScreen = ({ task, onBack, onEdit, onDelete, onToggleComplete }) => {
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ← 
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Detalle de Tarea</h1>
          </div>
          <button 
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ✏️
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Tarea principal */}
        <BaseCard className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{task.icon || '📋'}</span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h2>
              
              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mb-3">
                {task.deadline && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500">📅</span>
                    <span className="text-sm text-orange-600 font-medium">
                      {task.deadlineDisplay || formatTaskDeadline(task.deadline)}
                    </span>
                  </div>
                )}
                
                {task.amount && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">💰</span>
                    <span className="text-sm text-green-600 font-medium">
                      {task.amount}€
                    </span>
                  </div>
                )}

                {task.important && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm text-yellow-600 font-medium">
                      Big 3
                    </span>
                  </div>
                )}

                {task.completed && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span className="text-sm text-green-600 font-medium">
                      Completada
                    </span>
                  </div>
                )}
              </div>
              
              {task.description && (
                <p className="text-gray-600 text-sm leading-relaxed">{task.description}</p>
              )}
            </div>
          </div>
        </BaseCard>

        {/* Adjuntos */}
        {task.attachments && task.attachments.length > 0 && (
          <BaseCard className="p-6 space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              📎 Adjuntos ({task.attachments.length})
            </h4>
            <div className="space-y-2">
              {task.attachments.map((attachment, index) => (
                <AttachmentItem key={index} attachment={attachment} />
              ))}
            </div>
          </BaseCard>
        )}

        {/* Notas */}
        {task.notes && task.notes.trim() && (
          <BaseCard className="p-6 space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              📝 Notas
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {task.notes}
            </p>
          </BaseCard>
        )}

        {/* Link */}
        {task.link && (
          <BaseCard className="p-6 space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              🔗 Enlace
            </h4>
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 text-sm underline break-all"
            >
              {task.link}
            </a>
          </BaseCard>
        )}

        {/* Subtareas */}
        {task.subtasks && task.subtasks.length > 0 && (
          <BaseCard className="p-6 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">
              Subtareas ({task.subtasks.length})
            </h4>
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors min-h-[44px]">
                  <button 
                    onClick={() => {
                      // Handle subtask toggle - passed from parent
                    }}
                    className={`transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      subtask.completed ? 'text-green-500' : 'text-gray-400 hover:text-blue-500'
                    }`}
                  >
                    {subtask.completed ? '✅' : '⭕'}
                  </button>
                  <span className={`text-sm flex-1 ${
                    subtask.completed 
                      ? 'text-green-700 line-through' 
                      : 'text-gray-700'
                  }`}>
                    {subtask.text || subtask.title}
                  </span>
                </div>
              ))}
            </div>
          </BaseCard>
        )}

        {/* Información de creación */}
        {task.created_at && (
          <BaseCard className="p-4">
            <div className="text-xs text-gray-500">
              Creada el {new Date(task.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </BaseCard>
        )}

        {/* Acciones */}
        <div className="space-y-3 pb-6">
          <BaseButton 
            onClick={() => onToggleComplete(task.id)}
            className={`w-full ${
              task.completed
                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            size="lg"
          >
            {task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
          </BaseButton>
          
          <BaseButton 
            variant="secondary"
            className="w-full border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 flex items-center justify-center gap-2"
            size="lg"
            onClick={() => {
              // Handle toggle important
            }}
          >
            ⭐ {task.important ? 'Quitar de Big 3' : 'Marcar como importante'}
          </BaseButton>

          {onDelete && (
            <BaseButton 
              variant="secondary"
              className="w-full border-2 border-red-500 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
              size="lg"
              onClick={() => onDelete(task.id)}
            >
              🗑️ Eliminar tarea
            </BaseButton>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskDetailScreen