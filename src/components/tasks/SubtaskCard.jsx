import React, { useState } from 'react'
import { Circle, CircleCheck, Trash2 } from 'lucide-react'

const SubtaskCard = ({ 
  subtask, 
  onToggleComplete, 
  onDelete,
  // ✅ DRAG PROPS EXACTOS COMO TaskCard
  dragAttributes = {},
  dragListeners = {},
  isDragging = false
}) => {
  const [checkboxPressed, setCheckboxPressed] = useState(false)

  const handleCardClick = (e) => {
    // Prevenir click durante drag
    if (isDragging || checkboxPressed) return
    
    // Solo procesar click si no es un drag
    if (onToggleComplete) {
      onToggleComplete(subtask.id)
    }
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all touch-manipulation select-none user-select-none ${
        subtask.completed 
          ? 'bg-green-50 border-green-200' 
          : 'bg-white border-gray-200 hover:border-purple-200'
      } ${
        isDragging 
          ? 'shadow-lg border-blue-300 cursor-grabbing' 
          : 'cursor-grab hover:shadow-md hover:scale-[1.005] hover:border-gray-300'
      }`}
      onClick={handleCardClick}
      {...dragAttributes}
      {...dragListeners}
    >
      {/* ✅ CHECKBOX EXACTO COMO TaskCard */}
      <button 
        onPointerDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setCheckboxPressed(true)
          try {
            onToggleComplete(subtask.id)
          } catch (error) {
            console.error('❌ Error in SubtaskCard Toggle Complete:', error)
          }
          setTimeout(() => setCheckboxPressed(false), 100)
        }}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        onTouchStart={(e) => {
          e.stopPropagation()
          setCheckboxPressed(true)
          setTimeout(() => setCheckboxPressed(false), 100)
        }}
        className={`transition-colors ${
          subtask.completed ? 'text-green-500' : 'text-gray-400 hover:text-purple-500'
        }`}
      >
        {subtask.completed ? 
          <CircleCheck size={18} style={{ pointerEvents: 'none' }} /> : 
          <Circle size={18} style={{ pointerEvents: 'none' }} />
        }
      </button>
      
      {/* ✅ TÍTULO DE SUBTAREA */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={`text-sm font-medium transition-all duration-300 ${
          subtask.completed 
            ? 'text-green-700 line-through' 
            : 'text-gray-900'
        }`}>
          {subtask.title}
        </span>
      </div>

      {/* ✅ BOTÓN ELIMINAR */}
      <button
        onClick={async (e) => {
          e.stopPropagation()
          e.preventDefault()
          
          try {
            await onDelete(subtask.id)
          } catch (error) {
            console.error('❌ Error al eliminar subtarea:', error)
            alert('Error al eliminar subtarea. Inténtalo de nuevo.')
          }
        }}
        className="text-red-400 hover:text-red-600 transition-colors p-1"
        title="Eliminar subtarea"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

export default SubtaskCard