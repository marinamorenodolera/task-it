import React, { useState } from 'react'
import { 
  Target, 
  Calendar, 
  Folder, 
  Star, 
  Clock, 
  Flame, 
  Trash2, 
  X,
  Check,
  Inbox,
  CalendarDays,
  ShoppingCart
} from 'lucide-react'

const TaskManagement = ({ 
  tasks = [],
  updateTask,
  deleteTask,
  children
}) => {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState([])
  const [showMoveModal, setShowMoveModal] = useState(false)

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false)
      setSelectedTasks([])
    } else {
      setSelectionMode(true)
    }
  }

  const handleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleBulkOperation = async (operation) => {
    for (const taskId of selectedTasks) {
      await operation(taskId)
    }
    setShowMoveModal(false)
    setSelectionMode(false)
    setSelectedTasks([])
  }

  return (
    <>
      {/* Management Button */}
      <button
        onClick={toggleSelectionMode}
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

      {/* Render children with selection props */}
      {children({ 
        selectionMode, 
        selectedTasks, 
        handleTaskSelection 
      })}

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
                    onClick={() => handleBulkOperation((taskId) => updateTask(taskId, { section: 'big_three', page: 'daily' }))}
                    className="flex items-center gap-2 p-2 text-left hover:bg-yellow-50 rounded transition-colors border border-yellow-200 bg-yellow-50"
                  >
                    <Star size={14} className="text-yellow-500" />
                    <div className="text-sm font-medium">Big 3</div>
                  </button>
                  
                  <button
                    onClick={() => handleBulkOperation((taskId) => updateTask(taskId, { section: 'otras_tareas', page: 'daily' }))}
                    className="flex items-center gap-2 p-2 text-left hover:bg-blue-100 rounded transition-colors border border-blue-200 bg-blue-50"
                  >
                    <Folder size={14} className="text-blue-500" />
                    <div className="text-sm font-medium">Otras Tareas</div>
                  </button>
                  
                  <button
                    onClick={() => handleBulkOperation((taskId) => updateTask(taskId, { section: 'en_espera', page: 'daily' }))}
                    className="flex items-center gap-2 p-2 text-left hover:bg-orange-100 rounded transition-colors border border-orange-200 bg-orange-50"
                  >
                    <Clock size={14} className="text-orange-500" />
                    <div className="text-sm font-medium">En Espera</div>
                  </button>
                  
                  <button
                    onClick={() => handleBulkOperation((taskId) => updateTask(taskId, { section: 'urgent', page: 'daily' }))}
                    className="flex items-center gap-2 p-2 text-left hover:bg-red-100 rounded transition-colors border border-red-200 bg-red-50"
                  >
                    <Flame size={14} className="text-red-500" />
                    <div className="text-sm font-medium">Urgente</div>
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
                        onClick={() => handleBulkOperation((taskId) => updateTask(taskId, { 
                          page: 'weekly', 
                          section: 'otras_tareas',
                          scheduled_date: dateString 
                        }))}
                        className="flex items-center justify-center gap-1 p-2 text-center hover:bg-blue-100 rounded transition-colors border border-blue-200 bg-blue-50"
                      >
                        <span className="text-sm font-medium capitalize">{dayName.slice(0,3)}</span>
                        <span className="text-sm font-medium text-gray-500">{targetDate.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Inbox Section */}
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Inbox size={18} className="text-blue-600" />
                  Inbox
                </h4>
                <div className="grid grid-cols-2 gap-1 ml-6">
                  <button
                    onClick={() => handleBulkOperation((taskId) => updateTask(taskId, { 
                      page: 'inbox', 
                      section: 'otras_tareas',
                      status: 'inbox',
                      scheduled_date: null
                    }))}
                    className="flex items-center gap-2 p-2 text-left hover:bg-blue-100 rounded transition-colors border border-blue-200 bg-blue-50 min-h-[44px] touch-manipulation"
                  >
                    <Inbox size={14} className="text-blue-500" />
                    <div className="text-sm font-medium">Inbox</div>
                  </button>
                  
                  {/* Botón vacío para mantener grid */}
                  <div></div>
                </div>
              </div>

            </div>
            
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => handleBulkOperation((taskId) => deleteTask(taskId))}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-red-600 hover:text-white hover:bg-red-600 transition-colors border border-red-300 rounded bg-red-50"
              >
                <Trash2 size={12} />
                Eliminar
              </button>
              <button
                onClick={() => setShowMoveModal(false)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-black font-bold hover:text-gray-800 transition-colors border border-gray-300 rounded bg-gray-50 hover:bg-gray-100"
              >
                <X size={12} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TaskManagement