import React, { useState } from 'react'
import { X, Plus, Clock, BarChart3 } from 'lucide-react'
import BaseButton from '../ui/BaseButton'
import BaseCard from '../ui/BaseCard'

const ActivityModal = ({ 
  isOpen, 
  onClose, 
  predefinedActivities, 
  todayActivities,
  stats,
  onAddActivity 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [quickDuration, setQuickDuration] = useState(null)
  const [customActivity, setCustomActivity] = useState({
    type: '',
    duration: '',
    notes: ''
  })
  const [showCustomForm, setShowCustomForm] = useState(false)

  if (!isOpen) return null

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    setQuickDuration(template.duration)
  }

  const handleConfirmQuickLog = async () => {
    if (!selectedTemplate || !quickDuration) return

    const activityData = {
      type: selectedTemplate.type,
      duration: quickDuration,
      notes: selectedTemplate.notes || ''
    }
    
    const result = await onAddActivity(activityData)
    if (!result.error) {
      setSelectedTemplate(null)
      setQuickDuration(null)
      onClose()
    }
  }

  const adjustDuration = (increment) => {
    setQuickDuration(prev => Math.max(5, prev + increment))
  }

  const handleAddCustom = async () => {
    if (!customActivity.type.trim() || !customActivity.duration) return

    const result = await onAddActivity({
      type: customActivity.type.trim(),
      duration: parseInt(customActivity.duration),
      notes: customActivity.notes.trim()
    })
    
    if (!result.error) {
      setCustomActivity({ type: '', duration: '', notes: '' })
      setShowCustomForm(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">🏃‍♀️ Actividades</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <button
            onClick={() => {
              onClose()
              window.location.href = '/activities'
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            Ver todas las actividades →
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Quick stats */}
          <div className="px-4 py-3 bg-orange-50 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalTimeToday} min</div>
            <div className="text-sm text-gray-600">registrado hoy</div>
          </div>

          {/* Actividades rápidas */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">⚡ Log rápido</h3>
            
            {!selectedTemplate ? (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {predefinedActivities.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center"
                  >
                    <div className="font-medium text-gray-900 text-sm">{template.type}</div>
                    <div className="text-xs text-gray-600">{template.duration}min</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-900 mb-1">{selectedTemplate.type}</div>
                  <div className="text-sm text-orange-700">Ajusta la duración</div>
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => adjustDuration(-5)}
                    className="w-10 h-10 flex items-center justify-center bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-600 font-bold text-lg transition-all"
                  >
                    −
                  </button>
                  <div className="px-4 py-2 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 text-center min-w-[70px]">
                      {quickDuration}
                    </div>
                    <div className="text-xs text-orange-700 text-center">minutos</div>
                  </div>
                  <button
                    onClick={() => adjustDuration(5)}
                    className="w-10 h-10 flex items-center justify-center bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-600 font-bold text-lg transition-all"
                  >
                    +
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmQuickLog}
                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px]"
                  >
                    Registrar {quickDuration}min
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null)
                      setQuickDuration(null)
                    }}
                    className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm border border-gray-300 min-h-[44px]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Actividad personalizada */}
            {!showCustomForm ? (
              <button
                onClick={() => setShowCustomForm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                <Plus size={16} />
                <span>Actividad personalizada</span>
              </button>
            ) : (
              <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <input
                  type="text"
                  placeholder="Tipo de actividad"
                  value={customActivity.type}
                  onChange={(e) => setCustomActivity({...customActivity, type: e.target.value})}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  placeholder="Duración (min)"
                  value={customActivity.duration}
                  onChange={(e) => setCustomActivity({...customActivity, duration: e.target.value})}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <textarea
                  placeholder="Notas (opcional)"
                  value={customActivity.notes}
                  onChange={(e) => setCustomActivity({...customActivity, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="2"
                />
                <div className="flex gap-2">
                  <BaseButton
                    onClick={handleAddCustom}
                    disabled={!customActivity.type.trim() || !customActivity.duration}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Añadir
                  </BaseButton>
                  <BaseButton
                    variant="ghost"
                    onClick={() => {
                      setShowCustomForm(false)
                      setCustomActivity({ type: '', duration: '', notes: '' })
                    }}
                  >
                    Cancelar
                  </BaseButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityModal