import React, { useState } from 'react'
import BaseCard from '../ui/BaseCard'
import BaseButton from '../ui/BaseButton'
import { Calendar, Image as ImageIcon, FileText, Link, User, StickyNote, Euro, MapPin, ArrowLeft } from 'lucide-react'

const SmartAttachmentsPanel = ({ 
  isOpen, 
  onClose, 
  onAttach, 
  onDeadlineSet,
  taskText = "",
  existingAttachments = []
}) => {
  const [activeType, setActiveType] = useState(null)
  const [attachmentData, setAttachmentData] = useState({})
  
  const attachmentTypes = [
    { id: 'deadline', label: 'Fecha límite', icon: Calendar, color: 'orange' },
    { id: 'image', label: 'Imagen', icon: ImageIcon, color: 'pink' },
    { id: 'document', label: 'Documento', icon: FileText, color: 'blue' },
    { id: 'link', label: 'URL', icon: Link, color: 'blue' },
    { id: 'contact', label: 'Contacto', icon: User, color: 'indigo' },
    { id: 'note', label: 'Nota', icon: StickyNote, color: 'purple' },
    { id: 'amount', label: 'Importe', icon: Euro, color: 'green' },
    { id: 'location', label: 'Ubicación', icon: MapPin, color: 'red' }
  ]

  const renderAttachmentForm = (type, data, setData, onAttach) => {
    switch (type) {
      case 'deadline':
        return (
          <div className="space-y-4">
            <input
              type="date"
              value={data.deadline || ''}
              onChange={(e) => setData({...data, deadline: e.target.value})}
              className="w-full px-4 py-3 min-h-[48px] border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base font-medium text-orange-700 touch-manipulation"
              style={{
                colorScheme: 'light',
                accentColor: '#ea580c'
              }}
            />
            {data.deadline && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Para fecha límite usar onDeadlineSet
                    if (onDeadlineSet) {
                      onDeadlineSet(new Date(data.deadline))
                    }
                    setActiveType(null)
                    setData({})
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Añadir
                </button>
                <button
                  onClick={() => {
                    setActiveType(null)
                    setAttachmentData({})
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm border border-gray-300"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )

      case 'image':
        return (
          <div className="space-y-4">
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
              className="w-full px-4 py-4 min-h-[48px] rounded-lg focus:outline-none text-sm touch-manipulation cursor-pointer file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200"
            />
            {data.image && (
              <>
                <div className="space-y-2">
                  <img 
                    src={data.image} 
                    alt="Preview" 
                    className="max-w-full h-32 object-cover rounded-lg border border-pink-200"
                  />
                  <p className="text-xs text-pink-600">{data.fileName}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (data.file) {
                        onAttach({ file: data.file })
                        setActiveType(null)
                        setData({})
                      } else {
                        console.error('No file selected for image')
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Añadir
                  </button>
                  <button
                    onClick={() => setActiveType(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm border border-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )

      case 'document':
        return (
          <div className="space-y-4">
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
              className="w-full px-4 py-4 min-h-[48px] rounded-lg focus:outline-none text-sm touch-manipulation cursor-pointer file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
            {data.document && (
              <>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700">{data.fileName}</p>
                    <p className="text-xs text-blue-600">{(data.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (data.file) {
                        onAttach({ file: data.file })
                        setActiveType(null)
                        setData({})
                      } else {
                        console.error('No file selected for document')
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Añadir
                  </button>
                  <button
                    onClick={() => {
                      setActiveType(null)
                      setAttachmentData({})
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm border border-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
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
            {data.link && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onAttach({
                      type: 'link', 
                      content: data.link, 
                      title: data.linkTitle || data.link
                    })
                    setActiveType(null)
                    setData({})
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Añadir
                </button>
                <button
                  onClick={() => {
                    setActiveType(null)
                    setAttachmentData({})
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm border border-gray-300"
                >
                  Cancelar
                </button>
              </div>
            )}
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
            {data.contactName && (
              <div className="flex gap-2">
                <button
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
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Añadir
                </button>
                <button
                  onClick={() => {
                    setActiveType(null)
                    setAttachmentData({})
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm border border-gray-300"
                >
                  Cancelar
                </button>
              </div>
            )}
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
            {data.note && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onAttach({
                      type: 'note',
                      content: data.note,
                      title: data.note.length > 30 ? data.note.substring(0, 30) + '...' : data.note
                    })
                    setActiveType(null)
                    setAttachmentData({})
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Añadir
                </button>
                <button
                  onClick={() => {
                    setActiveType(null)
                    setAttachmentData({})
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm border border-gray-300"
                >
                  Cancelar
                </button>
              </div>
            )}
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
            {data.amount && (
              <div className="flex gap-2">
                <button
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
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Añadir
                </button>
                <button
                  onClick={() => {
                    setActiveType(null)
                    setAttachmentData({})
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm border border-gray-300"
                >
                  Cancelar
                </button>
              </div>
            )}
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
            {data.locationName && (
              <div className="flex gap-2">
                <button
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
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Añadir
                </button>
                <button
                  onClick={() => {
                    setActiveType(null)
                    setAttachmentData({})
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm border border-gray-300"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className={`${isOpen ? 'mt-3' : ''} space-y-3`}>

      {!activeType ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {attachmentTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <button 
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`flex items-center justify-center gap-1 px-1 sm:px-2 py-2 rounded-lg text-xs sm:text-sm transition-all min-h-[44px] touch-manipulation bg-white hover:bg-${type.color}-50 border border-${type.color}-200 text-${type.color}-700`}
              >
                <IconComponent size={14} className={`text-${type.color}-600 flex-shrink-0`} />
                <span className="font-medium truncate">{type.label}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-4">
            {(() => {
              const type = attachmentTypes.find(t => t.id === activeType)
              const IconComponent = type?.icon
              return (
                <>
                  <button 
                    onClick={() => {
                      setActiveType(null)
                      setAttachmentData({})
                    }}
                    className={`mr-2 text-${type?.color}-500 hover:text-${type?.color}-700 p-1`}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <h4 className={`font-medium text-${type?.color}-700 flex items-center gap-2 text-base`}>
                    {IconComponent && <IconComponent size={16} className={`text-${type?.color}-600`} />}
                    Añadir {type?.label}
                  </h4>
                </>
              )
            })()}
          </div>
          {renderAttachmentForm(activeType, attachmentData, setAttachmentData, onAttach)}
        </div>
      )}
    </div>
  )
}

export default SmartAttachmentsPanel