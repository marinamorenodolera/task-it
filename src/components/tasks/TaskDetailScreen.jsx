import React, { useState } from 'react'
import BaseCard from '../ui/BaseCard'
import BaseButton from '../ui/BaseButton'
import AttachmentItem from '../attachments/AttachmentItem'
import { useGestures } from '@/hooks/useGestures'
import { ArrowLeft, Edit3, Save, X, Plus, Trash2 } from 'lucide-react'

const TaskDetailScreen = ({ task, onBack, onEdit, onDelete, onToggleComplete, onUpdate, onToggleImportant, onAddAttachment, onDeleteAttachment, onReloadAttachments }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState(task)
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false)
  const [selectedAttachmentType, setSelectedAttachmentType] = useState(null)
  const [attachmentData, setAttachmentData] = useState({})
  const [taskAttachments, setTaskAttachments] = useState(task.attachments || [])
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useGestures()

  // Actualizar estados cuando cambie la tarea
  React.useEffect(() => {
    setEditedTask(task)
    setTaskAttachments(task.attachments || [])
  }, [task])

  // Recargar attachments cuando cambie la tarea
  React.useEffect(() => {
    if (task.id && onReloadAttachments) {
      onReloadAttachments(task.id)
    }
  }, [task.id, onReloadAttachments])

  const attachmentTypes = [
    { id: 'image', label: 'Imagen', icon: '🖼️', color: 'pink' },
    { id: 'document', label: 'Documento', icon: '📄', color: 'orange' },
    { id: 'link', label: 'URL', icon: '🔗', color: 'blue' },
    { id: 'contact', label: 'Contacto', icon: '👤', color: 'indigo' },
    { id: 'note', label: 'Nota', icon: '📝', color: 'purple' },
    { id: 'amount', label: 'Importe', icon: '💰', color: 'green' },
    { id: 'location', label: 'Ubicación', icon: '📍', color: 'red' }
  ]
  
  const formatTaskDeadline = (deadlineISO) => {
    if (!deadlineISO) return null
    
    const deadlineDate = new Date(deadlineISO)
    const now = new Date()
    const diffTime = deadlineDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `Venció hace ${Math.abs(diffDays)} días`
    } else if (diffDays === 0) {
      return 'Vence hoy'
    } else if (diffDays === 1) {
      return 'Vence mañana'
    } else {
      return `Vence en ${diffDays} días`
    }
  }

  const handleSave = async () => {
    try {
      await onUpdate(editedTask)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleAddAttachment = async (attachmentData) => {
    try {
      const result = await onAddAttachment(task.id, attachmentData)
      if (result && !result.error) {
        setTaskAttachments(prev => [...prev, result.data])
        setShowAttachmentPanel(false)
        setSelectedAttachmentType(null)
        setAttachmentData({})
      }
    } catch (error) {
      console.error('Error adding attachment:', error)
    }
  }

  const renderAttachmentForm = (type) => {
    switch (type) {
      case 'deadline':
        return (
          <div className="space-y-3 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-700 font-medium">
              <span className="text-lg">📅</span>
              <span>Añadir Fecha Límite</span>
            </div>
            <input
              type="datetime-local"
              value={attachmentData.deadline || ''}
              onChange={(e) => setAttachmentData({...attachmentData, deadline: e.target.value})}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({
                  type: 'deadline',
                  title: 'Fecha límite',
                  content: new Date(attachmentData.deadline).toLocaleString('es-ES'),
                  metadata: {
                    deadline: attachmentData.deadline
                  }
                })}
                disabled={!attachmentData.deadline}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                Añadir Fecha Límite
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-3 bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-pink-700 font-medium">
              <span className="text-lg">🖼️</span>
              <span>Añadir Imagen</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    setAttachmentData({
                      ...attachmentData, 
                      image: event.target.result,
                      fileName: file.name,
                      fileSize: file.size,
                      file: file
                    })
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            {attachmentData.image && (
              <div className="space-y-2">
                <img 
                  src={attachmentData.image} 
                  alt="Preview" 
                  className="max-w-full h-32 object-cover rounded-lg border border-pink-200"
                />
                <p className="text-xs text-gray-600">{attachmentData.fileName}</p>
              </div>
            )}
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({ file: attachmentData.file })}
                disabled={!attachmentData.image}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              >
                Añadir Imagen
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'document':
        return (
          <div className="space-y-3 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-700 font-medium">
              <span className="text-lg">📄</span>
              <span>Añadir Documento</span>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setAttachmentData({
                    ...attachmentData,
                    document: file,
                    fileName: file.name,
                    fileSize: file.size,
                    file: file
                  })
                }
              }}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {attachmentData.document && (
              <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
                <p className="text-sm font-medium">{attachmentData.fileName}</p>
                <p className="text-xs text-gray-600">{(attachmentData.fileSize / 1024).toFixed(1)} KB</p>
              </div>
            )}
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({ file: attachmentData.file })}
                disabled={!attachmentData.document}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                Añadir Documento
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'link':
        return (
          <div className="space-y-3 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <span className="text-lg">🔗</span>
              <span>Añadir URL</span>
            </div>
            <input
              type="url"
              placeholder="https://ejemplo.com"
              value={attachmentData.link || ''}
              onChange={(e) => setAttachmentData({...attachmentData, link: e.target.value})}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Título del enlace (opcional)"
              value={attachmentData.linkTitle || ''}
              onChange={(e) => setAttachmentData({...attachmentData, linkTitle: e.target.value})}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({
                  type: 'link', 
                  content: attachmentData.link, 
                  title: attachmentData.linkTitle || attachmentData.link
                })}
                disabled={!attachmentData.link}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Añadir URL
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-3 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-indigo-700 font-medium">
              <span className="text-lg">👤</span>
              <span>Añadir Contacto</span>
            </div>
            <input
              type="text"
              placeholder="Nombre del contacto"
              value={attachmentData.contactName || ''}
              onChange={(e) => setAttachmentData({...attachmentData, contactName: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={attachmentData.phone || ''}
              onChange={(e) => setAttachmentData({...attachmentData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              placeholder="Email (opcional)"
              value={attachmentData.email || ''}
              onChange={(e) => setAttachmentData({...attachmentData, email: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({
                  type: 'contact',
                  title: attachmentData.contactName,
                  content: `${attachmentData.contactName}${attachmentData.phone ? '\n📞 ' + attachmentData.phone : ''}${attachmentData.email ? '\n📧 ' + attachmentData.email : ''}`,
                  metadata: {
                    name: attachmentData.contactName,
                    phone: attachmentData.phone,
                    email: attachmentData.email
                  }
                })}
                disabled={!attachmentData.contactName}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Añadir Contacto
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'note':
        return (
          <div className="space-y-3 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-700 font-medium">
              <span className="text-lg">📝</span>
              <span>Añadir Nota</span>
            </div>
            <textarea
              placeholder="Escribe tu nota aquí..."
              value={attachmentData.note || ''}
              onChange={(e) => setAttachmentData({...attachmentData, note: e.target.value})}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({
                  type: 'note',
                  content: attachmentData.note,
                  title: attachmentData.note.length > 30 ? attachmentData.note.substring(0, 30) + '...' : attachmentData.note
                })}
                disabled={!attachmentData.note}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Añadir Nota
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'amount':
        return (
          <div className="space-y-3 bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <span className="text-lg">💰</span>
              <span>Añadir Importe</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={attachmentData.amount || ''}
                onChange={(e) => setAttachmentData({...attachmentData, amount: e.target.value})}
                className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <select
                value={attachmentData.currency || 'EUR'}
                onChange={(e) => setAttachmentData({...attachmentData, currency: e.target.value})}
                className="px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="EUR">€</option>
                <option value="USD">$</option>
                <option value="GBP">£</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={attachmentData.description || ''}
              onChange={(e) => setAttachmentData({...attachmentData, description: e.target.value})}
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  const currency = attachmentData.currency || 'EUR'
                  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'
                  handleAddAttachment({
                    type: 'amount',
                    title: `${attachmentData.amount}${symbol}${attachmentData.description ? ' - ' + attachmentData.description : ''}`,
                    content: attachmentData.description || `Importe: ${attachmentData.amount} ${currency}`,
                    metadata: {
                      amount: parseFloat(attachmentData.amount),
                      currency: currency,
                      description: attachmentData.description
                    }
                  })
                }}
                disabled={!attachmentData.amount}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Añadir Importe
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-3 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 font-medium">
              <span className="text-lg">📍</span>
              <span>Añadir Ubicación</span>
            </div>
            <input
              type="text"
              placeholder="Nombre del lugar"
              value={attachmentData.locationName || ''}
              onChange={(e) => setAttachmentData({...attachmentData, locationName: e.target.value})}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="text"
              placeholder="Dirección (opcional)"
              value={attachmentData.address || ''}
              onChange={(e) => setAttachmentData({...attachmentData, address: e.target.value})}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => handleAddAttachment({
                  type: 'location',
                  title: attachmentData.locationName,
                  content: `📍 ${attachmentData.locationName}${attachmentData.address ? '\n' + attachmentData.address : ''}`,
                  metadata: {
                    name: attachmentData.locationName,
                    address: attachmentData.address
                  }
                })}
                disabled={!attachmentData.locationName}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Añadir Ubicación
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                onClick={() => {
                  setSelectedAttachmentType(null)
                  setAttachmentData({})
                }}
              >
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const deadline = formatTaskDeadline(editedTask.deadline)

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-600 hover:text-blue-600 rounded-lg transition-colors"
              >
                <Edit3 size={20} />
              </button>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={handleSave}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Save size={20} />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedTask(task)
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <BaseCard className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Task Title and Details */}
          <div className="space-y-3">
            {isEditing ? (
              <input
                type="text"
                value={editedTask.text}
                onChange={(e) => setEditedTask({...editedTask, text: e.target.value})}
                className="w-full text-lg font-semibold bg-transparent border-b-2 border-blue-200 focus:border-blue-500 outline-none pb-2"
                placeholder="Título de la tarea..."
              />
            ) : (
              <h1 className="text-lg font-semibold text-gray-900">{task.text}</h1>
            )}

            {/* Task metadata */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {deadline && (
                <>
                  <span>📅</span>
                  <span>{deadline}</span>
                </>
              )}
            </div>

            {/* Notes (solo si existen) */}
            {(task.notes || isEditing) && (
              <>
                {isEditing ? (
                  <textarea
                    value={editedTask.notes || ''}
                    onChange={(e) => setEditedTask({...editedTask, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none text-sm"
                    placeholder="Añade notas sobre esta tarea..."
                  />
                ) : (
                  <p className="text-gray-600 text-sm leading-relaxed">{task.notes}</p>
                )}
              </>
            )}
          </div>

          {/* Creation date */}
          <div className="text-xs text-gray-500 text-center">
            Creada el {new Date(task.created_at || Date.now()).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pb-6">
            <button
              onClick={() => onToggleComplete(task.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-lg transition-all touch-manipulation ${
                task.completed
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <span className="text-sm">✓</span>
              <span className="text-xs sm:text-sm font-medium">
                {task.completed ? 'Completada' : 'Completar'}
              </span>
            </button>
            <button
              onClick={() => onToggleImportant(task.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-lg transition-all touch-manipulation ${
                task.important
                  ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              <span className="text-sm">⭐</span>
              <span className="text-xs sm:text-sm font-medium">
                {task.important ? 'Importante' : 'Big 3'}
              </span>
            </button>
          </div>

          {/* Attachments */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📎 Adjuntos ({taskAttachments.length})
              </h3>
              <button
                onClick={() => setShowAttachmentPanel(!showAttachmentPanel)}
                className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span>Añadir</span>
              </button>
            </div>

            {/* Attachment Panel que se despliega */}
            {showAttachmentPanel && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm mt-3 p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">📎</span>
                    <span className="font-medium text-blue-900 text-sm sm:text-base">Añadir a tu tarea:</span>
                  </div>
                  <button 
                    onClick={() => setShowAttachmentPanel(false)}
                    className="p-1 text-blue-400 hover:text-blue-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  >
                    ✕
                  </button>
                </div>

                {!selectedAttachmentType ? (
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedAttachmentType('deadline')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-orange-700 hover:bg-orange-50 border border-orange-200"
                    >
                      <span className="text-base sm:text-sm">📅</span>
                      <span className="hidden xs:inline sm:inline">Fecha límite</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Fecha límite</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('link')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
                    >
                      <span className="text-base sm:text-sm">🔗</span>
                      <span className="hidden xs:inline sm:inline">Link</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Link</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('amount')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-green-700 hover:bg-green-50 border border-green-200"
                    >
                      <span className="text-base sm:text-sm">💰</span>
                      <span className="hidden xs:inline sm:inline">Importe</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Importe</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('note')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-purple-700 hover:bg-purple-50 border border-purple-200"
                    >
                      <span className="text-base sm:text-sm">📝</span>
                      <span className="hidden xs:inline sm:inline">Nota</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Nota</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('image')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-pink-700 hover:bg-pink-50 border border-pink-200"
                    >
                      <span className="text-base sm:text-sm">🖼️</span>
                      <span className="hidden xs:inline sm:inline">Imagen</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Imagen</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('document')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-orange-700 hover:bg-orange-50 border border-orange-200"
                    >
                      <span className="text-base sm:text-sm">📄</span>
                      <span className="hidden xs:inline sm:inline">Documento</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Documento</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('location')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-red-700 hover:bg-red-50 border border-red-200"
                    >
                      <span className="text-base sm:text-sm">📍</span>
                      <span className="hidden xs:inline sm:inline">Ubicación</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Ubicación</span>
                    </button>
                    <button 
                      onClick={() => setSelectedAttachmentType('contact')}
                      className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200"
                    >
                      <span className="text-base sm:text-sm">👤</span>
                      <span className="hidden xs:inline sm:inline">Contacto</span>
                      <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Contacto</span>
                    </button>
                  </div>
                ) : (
                  renderAttachmentForm(selectedAttachmentType)
                )}
              </div>
            )}

            {/* Lista de attachments existentes */}
            {taskAttachments.length > 0 && (
              <div className="space-y-2">
                {taskAttachments.map((attachment) => (
                  <AttachmentItem
                    key={attachment.id}
                    attachment={attachment}
                    onDelete={() => onDeleteAttachment(task.id, attachment.id)}
                  />
                ))}
              </div>
            )}

            {taskAttachments.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No hay archivos adjuntos
              </p>
            )}
          </div>
        </BaseCard>
      </div>
    </div>
  )
}

export default TaskDetailScreen