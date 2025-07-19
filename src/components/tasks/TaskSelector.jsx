import React, { useState } from 'react'
import { X, Star, Target, CheckCircle } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { formatDeadline } from '@/utils/dateHelpers'

const TaskSelector = ({ isOpen, onClose, tasks = [], currentBig3 = [] }) => {
  const { setBig3Tasks } = useTasks()
  const [selectedTasks, setSelectedTasks] = useState(currentBig3.map(t => t.id))
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId)
      } else if (prev.length < 3) {
        return [...prev, taskId]
      }
      return prev
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

  // Combine routine tasks and current Big 3 for selection
  const availableTasks = [
    ...tasks,
    ...currentBig3.map(task => ({ ...task, isBig3: true }))
  ].filter((task, index, self) => 
    // Remove duplicates
    index === self.findIndex(t => t.id === task.id)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Seleccionar Big 3</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Counter */}
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              Selecciona tus 3 tareas más importantes para hoy
            </span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              selectedTasks.length <= 3 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {selectedTasks.length}/3
            </span>
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
              onClick={handleSave}
              disabled={loading || availableTasks.length === 0}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </div>
              ) : (
                'Guardar Big 3'
              )}
            </button>
          </div>
          
          {/* Tips */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-1">💡 Consejos para Big 3:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Elige tareas que marquen la diferencia en tu día</li>
              <li>• Prioriza lo importante sobre lo urgente</li>
              <li>• Máximo 3 tareas para mantener el foco</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskSelector