'use client'

import { useState } from 'react'
import { Clock, ArrowRight, Archive, Trash2, CheckCircle, Brain, Zap, Target, Eye, AlertTriangle } from 'lucide-react'

interface InboxItem {
  id: string
  title: string
  description?: string
  created_at: string
  is_processed: boolean
  suggested_context?: string
  suggested_urgency?: 'low' | 'medium' | 'high'
  is_actionable?: boolean
  priority?: 'low' | 'medium' | 'high'
}

interface InboxListProps {
  items: InboxItem[]
  onProcessItem: (itemId: string, action: string, autoDecision?: any) => void
  isLoading: boolean
  className?: string
}

export default function InboxList({ items, onProcessItem, isLoading, className = '' }: InboxListProps) {
  const [viewMode, setViewMode] = useState<'all' | 'unprocessed' | 'processed'>('unprocessed')
  const [showContextSuggestions, setShowContextSuggestions] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bulkProcessMode, setBulkProcessMode] = useState(false)
  
  const filteredItems = items.filter(item => {
    if (viewMode === 'unprocessed') return !item.is_processed
    if (viewMode === 'processed') return item.is_processed
    return true
  })
  
  const unprocessedCount = items.filter(item => !item.is_processed).length
  const processedCount = items.filter(item => item.is_processed).length
  
  const handleBulkProcess = () => {
    const unprocessedItems = selectedItems.filter(id => {
      const item = items.find(i => i.id === id)
      return item && !item.is_processed
    })
    
    unprocessedItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId)
      if (item) {
        const autoDecision = {
          is_actionable: item.is_actionable ?? true,
          action_type: 'schedule',
          context: item.suggested_context || '@computer',
          priority: item.suggested_urgency || 'medium'
        }
        onProcessItem(itemId, 'gtd_process', autoDecision)
      }
    })
    
    setSelectedItems([])
    setBulkProcessMode(false)
  }
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Hace menos de 1 minuto'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`
  }

  if (items.length === 0) {
    return (
      <section className={`${className}`}>
        <div className="bg-white rounded-xl p-8 sm:p-12 border border-gray-200 shadow-sm text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Inbox Zero!
          </h3>
          <p className="text-gray-600 mb-6">
            Excelente trabajo. Tu inbox está vacío y tu mente libre.
          </p>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700">
              💡 <strong>Mantén el ritmo:</strong> Procesa nuevas ideas tan pronto como las captures.
            </p>
          </div>
        </div>
      </section>
    )
  }
  
  if (filteredItems.length === 0) {
    return (
      <section className={`${className}`}>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                📋 Inbox ({items.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('unprocessed')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'unprocessed' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Sin procesar ({unprocessedCount})
                </button>
                <button
                  onClick={() => setViewMode('processed')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'processed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Procesadas ({processedCount})
                </button>
              </div>
            </div>
          </div>
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {viewMode === 'unprocessed' ? 'No hay tareas sin procesar' : 'No hay tareas procesadas'}
            </h3>
            <p className="text-gray-600">
              {viewMode === 'unprocessed' ? 'Todas las tareas han sido procesadas' : 'Aún no has procesado ninguna tarea'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`${className}`}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              📋 Inbox ({items.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowContextSuggestions(!showContextSuggestions)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  showContextSuggestions ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Eye size={14} />
                Sugerencias
              </button>
              
              {unprocessedCount > 0 && (
                <button
                  onClick={() => setBulkProcessMode(!bulkProcessMode)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    bulkProcessMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Zap size={14} />
                  Bulk Process
                </button>
              )}
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('unprocessed')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'unprocessed' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sin procesar ({unprocessedCount})
            </button>
            <button
              onClick={() => setViewMode('processed')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'processed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Procesadas ({processedCount})
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Todas ({items.length})
            </button>
          </div>
        </div>
        
        {/* Bulk Processing Controls */}
        {bulkProcessMode && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="text-green-600" size={16} />
                <span className="text-sm font-medium text-green-800">
                  Modo procesamiento masivo ({selectedItems.length} seleccionadas)
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkProcess}
                  disabled={selectedItems.length === 0}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Procesar seleccionadas
                </button>
                <button
                  onClick={() => {
                    setBulkProcessMode(false)
                    setSelectedItems([])
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                item.is_processed ? 'bg-green-50' : selectedItems.includes(item.id) ? 'bg-blue-50' : ''
              }`}
            >
              {bulkProcessMode && !item.is_processed && (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(prev => [...prev, item.id])
                      } else {
                        setSelectedItems(prev => prev.filter(id => id !== item.id))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-600">Seleccionar para procesamiento</label>
                </div>
              )}
              
              <div className="flex items-start gap-4">
                
                {/* Item Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Clock size={14} />
                    {formatTimeAgo(item.created_at)}
                    
                    {/* Priority Badge */}
                    {item.priority && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.priority === 'high' ? 'bg-red-100 text-red-800' :
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.priority === 'high' && '🔥'}
                        {item.priority === 'medium' && '⚡'}
                        {item.priority === 'low' && '📝'}
                        {item.priority === 'high' ? 'Urgente' : 
                         item.priority === 'medium' ? 'Importante' : 'Normal'}
                      </span>
                    )}
                  </div>
                  
                  {/* Smart Suggestions */}
                  {showContextSuggestions && !item.is_processed && (item.suggested_context || item.is_actionable !== undefined) && (
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} className="text-blue-500" />
                      <div className="flex gap-1">
                        {item.suggested_context && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                            {item.suggested_context}
                          </span>
                        )}
                        {item.is_actionable === true && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                            ✓ Accionable
                          </span>
                        )}
                        {item.is_actionable === false && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                            ℹ️ Info
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!item.is_processed && (
                  <div className="flex gap-2">
                    {/* GTD Process */}
                    <button
                      onClick={() => onProcessItem(item.id, 'gtd_process')}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      disabled={isLoading}
                    >
                      <Brain size={16} />
                      Procesar GTD
                    </button>
                    
                    {/* Auto Process with Suggestions */}
                    {item.suggested_context && (
                      <button
                        onClick={() => onProcessItem(item.id, 'auto_process', {
                          is_actionable: true,
                          action_type: 'schedule',
                          context: item.suggested_context,
                          priority: item.suggested_urgency || 'medium'
                        })}
                        className="flex items-center gap-1 px-2 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        disabled={isLoading}
                      >
                        <Zap size={14} />
                        Auto
                      </button>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-1">
                      {/* Mark as Done */}
                      <button
                        onClick={() => onProcessItem(item.id, 'mark_done')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        disabled={isLoading}
                        title="Marcar como hecho"
                      >
                        <CheckCircle size={16} />
                      </button>

                      {/* Archive */}
                      <button
                        onClick={() => onProcessItem(item.id, 'archive')}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        disabled={isLoading}
                        title="Archivar"
                      >
                        <Archive size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onProcessItem(item.id, 'delete')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={isLoading}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Processing Stats & Tips */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                🧠 Reglas GTD de Procesamiento
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>¿Es accionable?</strong> Si no, archiva o elimina</li>
                <li>• <strong>¿Toma menos de 2 minutos?</strong> Hazlo ahora</li>
                <li>• <strong>¿Puedes delegarlo?</strong> Asígnalo a alguien más</li>
                <li>• <strong>¿Es para más tarde?</strong> Programa o convierte en tarea</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-900 mb-2">
                📊 Progreso de Procesamiento
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{unprocessedCount}</div>
                  <div className="text-orange-700">Sin procesar</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{processedCount}</div>
                  <div className="text-green-700">Procesadas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {items.length > 0 ? Math.round((processedCount / items.length) * 100) : 0}%
                  </div>
                  <div className="text-blue-700">Completado</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {items.filter(i => i.suggested_context).length}
                  </div>
                  <div className="text-purple-700">Con sugerencias</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}