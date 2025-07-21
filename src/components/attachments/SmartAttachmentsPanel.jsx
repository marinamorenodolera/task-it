import React, { useState } from 'react'
import BaseCard from '../ui/BaseCard'
import BaseButton from '../ui/BaseButton'

const SmartAttachmentsPanel = ({ 
  isOpen, 
  onClose, 
  onAttach, 
  taskText = "",
  existingAttachments = []
}) => {
  const [activeType, setActiveType] = useState(null)
  const [attachmentData, setAttachmentData] = useState({})
  
  const attachmentTypes = [
    { id: 'deadline', label: 'Fecha límite', icon: '📅', color: 'orange' },
    { id: 'image', label: 'Imagen', icon: '🖼️', color: 'pink' },
    { id: 'document', label: 'Documento', icon: '📄', color: 'orange' },
    { id: 'link', label: 'URL', icon: '🔗', color: 'blue' },
    { id: 'contact', label: 'Contacto', icon: '👤', color: 'indigo' },
    { id: 'note', label: 'Nota', icon: '📝', color: 'purple' },
    { id: 'amount', label: 'Importe', icon: '💰', color: 'green' },
    { id: 'location', label: 'Ubicación', icon: '📍', color: 'red' }
  ]

  const renderAttachmentForm = (type, data, setData, onAttach) => {
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
              value={data.deadline || ''}
              onChange={(e) => setData({...data, deadline: e.target.value})}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  onAttach({
                    type: 'deadline',
                    title: 'Fecha límite',
                    content: new Date(data.deadline).toLocaleString('es-ES'),
                    metadata: {
                      deadline: data.deadline
                    }
                  })
                  setActiveType(null)
                  setData({})
                }}
                disabled={!data.deadline}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Añadir Fecha Límite
              </BaseButton>
              <BaseButton variant="ghost" onClick={() => setActiveType(null)}>
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    setData({
                      ...data, 
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
            {data.image && (
              <div className="space-y-2">
                <img 
                  src={data.image} 
                  alt="Preview" 
                  className="max-w-full h-32 object-cover rounded-lg border border-pink-200"
                />
                <p className="text-xs text-gray-600">{data.fileName}</p>
              </div>
            )}
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  onAttach({ file: data.file })
                  setActiveType(null)
                  setData({})
                }}
                disabled={!data.image}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                Añadir Imagen
              </BaseButton>
              <BaseButton variant="ghost" onClick={() => setActiveType(null)}>
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'document':
        return (
          <div className="space-y-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setData({
                    ...data,
                    document: file,
                    fileName: file.name,
                    fileSize: file.size,
                    file: file
                  })
                }
              }}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {data.document && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-medium">{data.fileName}</p>
                <p className="text-xs text-gray-600">{(data.fileSize / 1024).toFixed(1)} KB</p>
              </div>
            )}
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  onAttach({ file: data.file })
                  setActiveType(null)
                  setData({})
                }}
                disabled={!data.document}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Añadir Documento
              </BaseButton>
              <BaseButton variant="ghost" onClick={() => setActiveType(null)}>
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'link':
        return (
          <div className="space-y-3">
            <input
              type="url"
              placeholder="https://ejemplo.com"
              value={data.link || ''}
              onChange={(e) => setData({...data, link: e.target.value})}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Título del enlace (opcional)"
              value={data.linkTitle || ''}
              onChange={(e) => setData({...data, linkTitle: e.target.value})}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  onAttach({
                    type: 'link', 
                    content: data.link, 
                    title: data.linkTitle || data.link
                  })
                  setActiveType(null)
                  setData({})
                }}
                disabled={!data.link}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Añadir URL
              </BaseButton>
              <BaseButton variant="ghost" onClick={() => setActiveType(null)}>
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nombre del contacto"
              value={data.contactName || ''}
              onChange={(e) => setData({...data, contactName: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={data.phone || ''}
              onChange={(e) => setData({...data, phone: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              placeholder="Email (opcional)"
              value={data.email || ''}
              onChange={(e) => setData({...data, email: e.target.value})}
              className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  onAttach({
                    type: 'contact',
                    title: data.contactName,
                    content: `${data.contactName}${data.phone ? '\n📞 ' + data.phone : ''}${data.email ? '\n📧 ' + data.email : ''}`,
                    metadata: {
                      name: data.contactName,
                      phone: data.phone,
                      email: data.email
                    }
                  })
                  setActiveType(null)
                  setData({})
                }}
                disabled={!data.contactName}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                Añadir Contacto
              </BaseButton>
              <BaseButton variant="ghost" onClick={() => setActiveType(null)}>
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'note':
        return (
          <div className="space-y-3">
            <textarea
              placeholder="Escribe tu nota aquí..."
              value={data.note || ''}
              onChange={(e) => setData({...data, note: e.target.value})}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
            />
            <div className="flex gap-2">
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
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Añadir Nota
              </BaseButton>
              <BaseButton variant="ghost" onClick={() => setActiveType(null)}>
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'amount':
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={data.amount || ''}
                onChange={(e) => setData({...data, amount: e.target.value})}
                className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <select
                value={data.currency || 'EUR'}
                onChange={(e) => setData({...data, currency: e.target.value})}
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
              value={data.description || ''}
              onChange={(e) => setData({...data, description: e.target.value})}
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  const currency = data.currency || 'EUR'
                  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'
                  onAttach({
                    type: 'amount',
                    title: `${data.amount}${symbol}${data.description ? ' - ' + data.description : ''}`,
                    content: data.description || `Importe: ${data.amount} ${currency}`,
                    metadata: {
                      amount: parseFloat(data.amount),
                      currency: currency,
                      description: data.description
                    }
                  })
                  setActiveType(null)
                  setData({})
                }}
                disabled={!data.amount}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Añadir Importe
              </BaseButton>
              <BaseButton variant="ghost" onClick={() => setActiveType(null)}>
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nombre del lugar"
              value={data.locationName || ''}
              onChange={(e) => setData({...data, locationName: e.target.value})}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="text"
              placeholder="Dirección (opcional)"
              value={data.address || ''}
              onChange={(e) => setData({...data, address: e.target.value})}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <BaseButton
                onClick={() => {
                  onAttach({
                    type: 'location',
                    title: data.locationName,
                    content: `📍 ${data.locationName}${data.address ? '\n' + data.address : ''}`,
                    metadata: {
                      name: data.locationName,
                      address: data.address
                    }
                  })
                  setActiveType(null)
                  setData({})
                }}
                disabled={!data.locationName}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Añadir Ubicación
              </BaseButton>
              <BaseButton variant="ghost" onClick={() => setActiveType(null)}>
                Cancelar
              </BaseButton>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm mt-3 p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
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

      {!activeType ? (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <button 
            onClick={() => setActiveType('deadline')}
            className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-orange-700 hover:bg-orange-50 border border-orange-200"
          >
            <span className="text-base sm:text-sm">📅</span>
            <span className="hidden xs:inline sm:inline">Fecha límite</span>
            <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Fecha límite</span>
          </button>
          <button 
            onClick={() => setActiveType('link')}
            className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
          >
            <span className="text-base sm:text-sm">🔗</span>
            <span className="hidden xs:inline sm:inline">Link</span>
            <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Link</span>
          </button>
          <button 
            onClick={() => setActiveType('amount')}
            className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-green-700 hover:bg-green-50 border border-green-200"
          >
            <span className="text-base sm:text-sm">💰</span>
            <span className="hidden xs:inline sm:inline">Importe</span>
            <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Importe</span>
          </button>
          <button 
            onClick={() => setActiveType('note')}
            className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-purple-700 hover:bg-purple-50 border border-purple-200"
          >
            <span className="text-base sm:text-sm">📝</span>
            <span className="hidden xs:inline sm:inline">Nota</span>
            <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Nota</span>
          </button>
          <button 
            onClick={() => setActiveType('image')}
            className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-pink-700 hover:bg-pink-50 border border-pink-200"
          >
            <span className="text-base sm:text-sm">🖼️</span>
            <span className="hidden xs:inline sm:inline">Imagen</span>
            <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Imagen</span>
          </button>
          <button 
            onClick={() => setActiveType('document')}
            className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-orange-700 hover:bg-orange-50 border border-orange-200"
          >
            <span className="text-base sm:text-sm">📄</span>
            <span className="hidden xs:inline sm:inline">Documento</span>
            <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Documento</span>
          </button>
          <button 
            onClick={() => setActiveType('location')}
            className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-red-700 hover:bg-red-50 border border-red-200"
          >
            <span className="text-base sm:text-sm">📍</span>
            <span className="hidden xs:inline sm:inline">Ubicación</span>
            <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Ubicación</span>
          </button>
          <button 
            onClick={() => setActiveType('contact')}
            className="flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200"
          >
            <span className="text-base sm:text-sm">👤</span>
            <span className="hidden xs:inline sm:inline">Contacto</span>
            <span className="block xs:hidden sm:hidden text-center text-xs mt-1">Contacto</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-4">
            <button 
              onClick={() => setActiveType(null)}
              className="mr-2 text-blue-400 hover:text-blue-600"
            >
              ←
            </button>
            <h4 className="font-medium text-blue-900">
              {attachmentTypes.find(t => t.id === activeType)?.label}
            </h4>
          </div>
          {renderAttachmentForm(activeType, attachmentData, setAttachmentData, onAttach)}
        </div>
      )}
    </div>
  )
}

export default SmartAttachmentsPanel