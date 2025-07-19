import React, { useState } from 'react'
import { X, Plus, Edit3, Trash2, Settings, Save, RotateCcw, RefreshCw } from 'lucide-react'
import { useRituals } from '@/hooks/useRituals'

const RitualsConfig = ({ isOpen, onClose }) => {
  const { rituals, addRitual, updateRitual, deleteRitual, resetRituals, restoreDefaultRituals } = useRituals()
  const [editingRitual, setEditingRitual] = useState(null)
  const [newRitual, setNewRitual] = useState({ title: '', icon: '📝', subtasks: [] })
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleAddRitual = async () => {
    if (!newRitual.title.trim()) return

    setLoading(true)
    const result = await addRitual(newRitual)
    
    if (result.error) {
      alert('Error al añadir ritual: ' + result.error)
    } else {
      setNewRitual({ title: '', icon: '📝', subtasks: [] })
      setShowAddForm(false)
    }
    setLoading(false)
  }

  const handleUpdateRitual = async (ritualId, updates) => {
    setLoading(true)
    const result = await updateRitual(ritualId, updates)
    
    if (result.error) {
      alert('Error al actualizar ritual: ' + result.error)
    } else {
      setEditingRitual(null)
    }
    setLoading(false)
  }

  const handleDeleteRitual = async (ritualId, isDefault) => {
    if (isDefault) {
      alert('No puedes eliminar rituales por defecto')
      return
    }

    if (confirm('¿Estás seguro de que quieres eliminar este ritual?')) {
      setLoading(true)
      const result = await deleteRitual(ritualId)
      
      if (result.error) {
        alert('Error al eliminar ritual: ' + result.error)
      }
      setLoading(false)
    }
  }

  const handleResetRituals = async () => {
    if (confirm('¿Estás seguro de que quieres resetear todos los rituales de hoy?')) {
      setLoading(true)
      const result = await resetRituals()
      
      if (result.error) {
        alert('Error al resetear rituales: ' + result.error)
      }
      setLoading(false)
    }
  }

  const handleRestoreDefaults = async () => {
    if (confirm('¿Estás seguro de que quieres restaurar los rituales por defecto? Esto eliminará todos tus rituales personalizados.')) {
      setLoading(true)
      const result = await restoreDefaultRituals()
      
      if (result.error) {
        alert('Error al restaurar rituales por defecto: ' + result.error)
      } else {
        alert('Rituales por defecto restaurados exitosamente')
      }
      setLoading(false)
    }
  }

  const addSubtask = (ritualData, setRitualData) => {
    const newSubtask = {
      id: `subtask_${Date.now()}`,
      text: '',
      completed: false
    }
    setRitualData({
      ...ritualData,
      subtasks: [...(ritualData.subtasks || []), newSubtask]
    })
  }

  const updateSubtask = (ritualData, setRitualData, subtaskId, text) => {
    setRitualData({
      ...ritualData,
      subtasks: ritualData.subtasks.map(st => 
        st.id === subtaskId ? { ...st, text } : st
      )
    })
  }

  const removeSubtask = (ritualData, setRitualData, subtaskId) => {
    setRitualData({
      ...ritualData,
      subtasks: ritualData.subtasks.filter(st => st.id !== subtaskId)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Configuración de Rituales</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreDefaults}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 inline mr-1" />
              Restaurar por defecto
            </button>
            <button
              onClick={handleResetRituals}
              disabled={loading}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 inline mr-1" />
              Reset hoy
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Add New Ritual */}
          <div className="mb-6">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Añadir ritual personalizado
              </button>
            ) : (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Nuevo Ritual</h4>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Emoji"
                    value={newRitual.icon}
                    onChange={(e) => setNewRitual({ ...newRitual, icon: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-center"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    placeholder="Título del ritual"
                    value={newRitual.title}
                    onChange={(e) => setNewRitual({ ...newRitual, title: e.target.value })}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Subtasks */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtareas (opcional)
                  </label>
                  {newRitual.subtasks.map((subtask, index) => (
                    <div key={subtask.id} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Subtarea..."
                        value={subtask.text || subtask.title || ''}
                        onChange={(e) => updateSubtask(newRitual, setNewRitual, subtask.id, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                      <button
                        onClick={() => removeSubtask(newRitual, setNewRitual, subtask.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSubtask(newRitual, setNewRitual)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Añadir subtarea
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setNewRitual({ title: '', icon: '📝', subtasks: [] })
                    }}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddRitual}
                    disabled={!newRitual.title.trim() || loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Rituals */}
          <div className="space-y-3">
            {rituals.map((ritual) => (
              <div key={ritual.id} className="border border-gray-200 rounded-lg p-4">
                {editingRitual === ritual.id ? (
                  <EditRitualForm
                    ritual={ritual}
                    onSave={(updates) => handleUpdateRitual(ritual.id, updates)}
                    onCancel={() => setEditingRitual(null)}
                    loading={loading}
                  />
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{ritual.icon}</span>
                        <span className="font-medium text-gray-900">{ritual.title}</span>
                        {ritual.is_default && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            Por defecto
                          </span>
                        )}
                      </div>
                      
                      {ritual.subtasks && ritual.subtasks.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {ritual.subtasks.map((subtask) => (
                            <div key={subtask.id} className="text-sm text-gray-600">
                              • {subtask.text || subtask.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingRitual(ritual.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {!ritual.is_default && (
                        <button
                          onClick={() => handleDeleteRitual(ritual.id, ritual.is_default)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{rituals.length} rituales configurados</span>
              <span>Reset automático a las 6:00 AM</span>
            </div>
            <div className="text-xs text-gray-500">
              💡 Los nuevos usuarios reciben automáticamente los 5 rituales por defecto basados en GTD
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const EditRitualForm = ({ ritual, onSave, onCancel, loading }) => {
  const [editData, setEditData] = useState({
    title: ritual.title,
    icon: ritual.icon,
    subtasks: ritual.subtasks || []
  })

  const addSubtask = () => {
    const newSubtask = {
      id: `subtask_${Date.now()}`,
      text: '',
      completed: false
    }
    setEditData({
      ...editData,
      subtasks: [...editData.subtasks, newSubtask]
    })
  }

  const updateSubtask = (subtaskId, text) => {
    setEditData({
      ...editData,
      subtasks: editData.subtasks.map(st => 
        st.id === subtaskId ? { ...st, text } : st
      )
    })
  }

  const removeSubtask = (subtaskId) => {
    setEditData({
      ...editData,
      subtasks: editData.subtasks.filter(st => st.id !== subtaskId)
    })
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <input
          type="text"
          value={editData.icon}
          onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-center"
          maxLength={2}
        />
        <input
          type="text"
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Subtasks */}
      <div className="mb-3">
        {editData.subtasks.map((subtask) => (
          <div key={subtask.id} className="flex gap-2 mb-2">
            <input
              type="text"
              value={subtask.text || subtask.title || ''}
              onChange={(e) => updateSubtask(subtask.id, e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
            <button
              onClick={() => removeSubtask(subtask.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={addSubtask}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Añadir subtarea
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(editData)}
          disabled={!editData.title.trim() || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

export default RitualsConfig