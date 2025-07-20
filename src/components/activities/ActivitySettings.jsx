import React, { useState } from 'react'
import { ArrowLeft, Plus, Edit3, Trash2, BarChart3 } from 'lucide-react'
import BaseButton from '../ui/BaseButton'
import BaseCard from '../ui/BaseCard'

const ActivitySettings = ({ 
  predefinedActivities, 
  onBack, 
  onAddPredefined, 
  onUpdatePredefined, 
  onDeletePredefined,
  getActivityStats,
  loadHistoryFromSupabase 
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [statsData, setStatsData] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  
  const [newActivity, setNewActivity] = useState({
    type: '',
    duration: '',
    notes: '',
    color: 'blue'
  })

  const colorOptions = [
    { value: 'blue', label: 'Azul', bg: 'bg-blue-500' },
    { value: 'green', label: 'Verde', bg: 'bg-green-500' },
    { value: 'purple', label: 'Púrpura', bg: 'bg-purple-500' },
    { value: 'orange', label: 'Naranja', bg: 'bg-orange-500' },
    { value: 'red', label: 'Rojo', bg: 'bg-red-500' },
    { value: 'yellow', label: 'Amarillo', bg: 'bg-yellow-500' },
    { value: 'pink', label: 'Rosa', bg: 'bg-pink-500' },
    { value: 'indigo', label: 'Índigo', bg: 'bg-indigo-500' }
  ]

  const handleAdd = () => {
    if (!newActivity.type.trim() || !newActivity.duration) return

    onAddPredefined({
      type: newActivity.type.trim(),
      duration: parseInt(newActivity.duration),
      notes: newActivity.notes.trim(),
      color: newActivity.color
    })

    setNewActivity({ type: '', duration: '', notes: '', color: 'blue' })
    setShowAddForm(false)
  }

  const handleEdit = (activity) => {
    setEditingActivity(activity.id)
    setNewActivity({
      type: activity.type,
      duration: activity.duration.toString(),
      notes: activity.notes || '',
      color: activity.color || 'blue'
    })
    setShowAddForm(true)
  }

  const handleUpdate = () => {
    if (!newActivity.type.trim() || !newActivity.duration) return

    onUpdatePredefined(editingActivity, {
      type: newActivity.type.trim(),
      duration: parseInt(newActivity.duration),
      notes: newActivity.notes.trim(),
      color: newActivity.color
    })

    setNewActivity({ type: '', duration: '', notes: '', color: 'blue' })
    setShowAddForm(false)
    setEditingActivity(null)
  }

  const handleDelete = (activityId) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta actividad predeterminada?')) {
      onDeletePredefined(activityId)
    }
  }

  const loadStats = async (period) => {
    setStatsLoading(true)
    try {
      const stats = await getActivityStats(period)
      setStatsData({ ...stats, period })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Daily Branding */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Configurar Actividades
            </h1>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Ver estadísticas"
          >
            <BarChart3 size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Estadísticas */}
        {showStats && (
          <BaseCard className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Estadísticas de Actividades</h2>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => loadStats('day')}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors min-h-[44px]"
              >
                Hoy
              </button>
              <button
                onClick={() => loadStats('week')}
                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors min-h-[44px]"
              >
                Semana
              </button>
              <button
                onClick={() => loadStats('month')}
                className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors min-h-[44px]"
              >
                Mes
              </button>
            </div>

            {statsLoading && (
              <div className="text-center py-4 text-gray-500">
                Cargando estadísticas...
              </div>
            )}

            {statsData && !statsLoading && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{statsData.totalTime}</div>
                    <div className="text-sm text-gray-600">minutos totales</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{statsData.activityCount}</div>
                    <div className="text-sm text-gray-600">actividades</div>
                  </div>
                </div>

                {Object.keys(statsData.typeStats).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Por tipo de actividad:</h4>
                    <div className="space-y-2">
                      {Object.entries(statsData.typeStats).map(([type, stats]) => (
                        <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{type}</span>
                          <span className="text-sm text-gray-600">{stats.totalTime}min ({stats.count}x)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </BaseCard>
        )}

        {/* Actividades Predeterminadas */}
        <BaseCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">🏃‍♀️ Actividades Predeterminadas</h2>
            <button
              onClick={() => {
                setShowAddForm(true)
                setEditingActivity(null)
                setNewActivity({ type: '', duration: '', notes: '', color: 'blue' })
              }}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors min-h-[44px]"
            >
              <Plus size={16} />
              Añadir
            </button>
          </div>
          
          {/* Lista de actividades */}
          <div className="space-y-3 mb-4">
            {predefinedActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full bg-${activity.color}-500`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{activity.type}</div>
                    <div className="text-sm text-gray-600">{activity.duration} minutos</div>
                    {activity.notes && (
                      <div className="text-xs text-gray-500">{activity.notes}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(activity)}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Formulario para añadir/editar */}
          {showAddForm && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
              <h3 className="font-medium text-blue-900">
                {editingActivity ? 'Editar Actividad' : 'Nueva Actividad Predeterminada'}
              </h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre de la actividad (ej: Pilates, Yoga...)"
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
                
                <input
                  type="number"
                  placeholder="Duración en minutos"
                  value={newActivity.duration}
                  onChange={(e) => setNewActivity({...newActivity, duration: e.target.value})}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
                
                <textarea
                  placeholder="Notas (opcional)"
                  value={newActivity.notes}
                  onChange={(e) => setNewActivity({...newActivity, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
                
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">Color:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewActivity({...newActivity, color: color.value})}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors min-h-[44px] ${
                          newActivity.color === color.value 
                            ? 'border-blue-500 bg-blue-100' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${color.bg}`}></div>
                        <span className="text-xs">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <BaseButton
                  onClick={editingActivity ? handleUpdate : handleAdd}
                  disabled={!newActivity.type.trim() || !newActivity.duration}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingActivity ? 'Actualizar' : 'Añadir'}
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingActivity(null)
                    setNewActivity({ type: '', duration: '', notes: '', color: 'blue' })
                  }}
                >
                  Cancelar
                </BaseButton>
              </div>
            </div>
          )}
        </BaseCard>

        {/* Información sobre el reset diario */}
        <BaseCard className="p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-medium text-yellow-900 mb-2">ℹ️ Sistema de Reset Diario</h3>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>• Las actividades del día se resetean automáticamente a las 6:00 AM</p>
            <p>• Todo el historial se guarda en Supabase para análisis posterior</p>
            <p>• Las actividades predeterminadas nunca se borran</p>
          </div>
        </BaseCard>
      </div>
    </div>
  )
}

export default ActivitySettings