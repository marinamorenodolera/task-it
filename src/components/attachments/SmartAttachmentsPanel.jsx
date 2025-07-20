import React, { useState } from 'react'
import BaseCard from '../ui/BaseCard'
import BaseButton from '../ui/BaseButton'
import DeadlinePicker from './DeadlinePicker'

const SmartAttachmentsPanel = ({ 
  isOpen, 
  onClose, 
  onAttach, 
  taskText = "",
  existingAttachments = [],
  onDeadlineSet,
  currentDeadline = ""
}) => {
  const [activeType, setActiveType] = useState(null)
  const [attachmentData, setAttachmentData] = useState({})
  
  const attachmentTypes = [
    { id: 'deadline', label: 'Fecha límite', icon: '📅', color: 'orange' },
    { id: 'link', label: 'Link', icon: '🔗', color: 'blue' },
    { id: 'amount', label: 'Importe', icon: '💰', color: 'green' },
    { id: 'note', label: 'Nota', icon: '📝', color: 'purple' },
    { id: 'image', label: 'Imagen', icon: '🖼️', color: 'pink' },
    { id: 'document', label: 'Documento', icon: '📄', color: 'orange' },
    { id: 'location', label: 'Ubicación', icon: '📍', color: 'red' },
    { id: 'contact', label: 'Contacto', icon: '👤', color: 'indigo' }
  ]

  const renderAttachmentForm = (type, data, setData, onAttach, onDeadlineSet) => {
    switch (type) {
      case 'deadline':
        return <DeadlinePicker onSelect={onDeadlineSet} />
      
      case 'link':
        return (
          <div className="space-y-2">
            <input
              type="url"
              placeholder="https://ejemplo.com"
              value={data.link || ''}
              onChange={(e) => setData({...data, link: e.target.value})}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  onAttach({type: 'link', content: data.link, title: data.link})
                  setActiveType(null)
                  setData({})
                }}
                disabled={!data.link}
                className="flex-1"
              >
                Añadir Link
              </BaseButton>
              <BaseButton variant="ghost" onClick={() => setActiveType(null)}>
                Cancelar
              </BaseButton>
            </div>
          </div>
        )
      
      case 'amount':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="0.00"
                value={data.amount || ''}
                onChange={(e) => setData({...data, amount: e.target.value})}
                className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
              />
              <select
                value={data.currency || 'EUR'}
                onChange={(e) => setData({...data, currency: e.target.value})}
                className="px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
              >
                <option value="EUR">€</option>
                <option value="USD">$</option>
                <option value="GBP">£</option>
              </select>
            </div>
            <BaseButton
              onClick={() => {
                const currency = data.currency || 'EUR'
                const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'
                onAttach({
                  type: 'amount', 
                  content: `${data.amount} ${currency}`, 
                  title: `${data.amount}${currencySymbol}`,
                  amount: parseFloat(data.amount),
                  currency: currency
                })
                setActiveType(null)
                setData({})
              }}
              disabled={!data.amount}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Añadir Importe
            </BaseButton>
          </div>
        )
      
      case 'note':
        return (
          <div className="space-y-2">
            <textarea
              placeholder="Escribe tu nota aquí..."
              value={data.note || ''}
              onChange={(e) => setData({...data, note: e.target.value})}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 resize-none"
            />
            <BaseButton
              onClick={() => {
                onAttach({
                  type: 'note', 
                  content: data.note, 
                  title: data.note.length > 30 ? data.note.substring(0, 30) + '...' : data.note
                })
                setActiveType(null)
                setData({})
              }}
              disabled={!data.note}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Añadir Nota
            </BaseButton>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Dirección o lugar..."
              value={data.location || ''}
              onChange={(e) => setData({...data, location: e.target.value})}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[44px]"
            />
            <BaseButton
              onClick={() => {
                onAttach({
                  type: 'location', 
                  content: data.location, 
                  title: data.location
                })
                setActiveType(null)
                setData({})
              }}
              disabled={!data.location}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Añadir Ubicación
            </BaseButton>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nombre del contacto..."
              value={data.contactName || ''}
              onChange={(e) => setData({...data, contactName: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={data.contactPhone || ''}
              onChange={(e) => setData({...data, contactPhone: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
            <BaseButton
              onClick={() => {
                onAttach({
                  type: 'contact', 
                  content: `${data.contactName}${data.contactPhone ? ` - ${data.contactPhone}` : ''}`, 
                  title: data.contactName,
                  phone: data.contactPhone
                })
                setActiveType(null)
                setData({})
              }}
              disabled={!data.contactName}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Añadir Contacto
            </BaseButton>
          </div>
        )

      default:
        return (
          <div className="text-center py-4 text-gray-500">
            Funcionalidad próximamente...
          </div>
        )
    }
  }

  if (!isOpen) return null

  return (
    <BaseCard className="mt-3 p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">📎</span>
          <span className="font-medium text-blue-900 text-sm sm:text-base">Añadir a tu tarea:</span>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 text-blue-400 hover:text-blue-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
        >
          ✕
        </button>
      </div>

      {/* Botones de tipos de adjunto - Responsive Grid */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        {attachmentTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id)}
            className={`flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation ${
              activeType === type.id
                ? `bg-${type.color}-500 text-white shadow-md`
                : `bg-white text-${type.color}-700 hover:bg-${type.color}-50 border border-${type.color}-200`
            }`}
          >
            <span className="text-base sm:text-sm">{type.icon}</span>
            <span className="hidden xs:inline sm:inline">{type.label}</span>
            <span className="block xs:hidden sm:hidden text-center text-xs mt-1">{type.label}</span>
            {type.id === 'deadline' && currentDeadline && (
              <span className="ml-1 text-xs bg-white/20 px-1 rounded hidden sm:inline">
                {currentDeadline.display || currentDeadline}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Form específico por tipo */}
      {activeType && (
        <div className="space-y-3">
          {renderAttachmentForm(activeType, attachmentData, setAttachmentData, onAttach, onDeadlineSet)}
        </div>
      )}

      {/* Resumen de adjuntos */}
      {existingAttachments.length > 0 && (
        <div className="pt-3 border-t border-blue-200">
          <div className="text-xs font-medium text-blue-700 mb-2">
            Adjuntos añadidos ({existingAttachments.length})
          </div>
          <div className="space-y-1">
            {existingAttachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                <span>{attachmentTypes.find(t => t.id === attachment.type)?.icon || '📎'}</span>
                <span className="truncate">{attachment.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </BaseCard>
  )
}

export default SmartAttachmentsPanel