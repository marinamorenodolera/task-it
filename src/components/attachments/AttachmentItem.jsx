import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'

const AttachmentItem = ({ attachment, onDelete }) => {
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  
  const formatDateWithDay = (dateString) => {
    try {
      const date = new Date(dateString)
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const dayName = days[date.getDay()]
      const formattedDate = date.toLocaleDateString('es-ES')
      return `${dayName}, ${formattedDate}`
    } catch (error) {
      return dateString // Fallback si hay error
    }
  }
  
  const getAttachmentIcon = (type) => {
    const icons = {
      link: '🔗',
      note: '📝',
      image: '🖼️',
      document: '📄',
      amount: '💰',
      location: '📍',
      contact: '👤'
    }
    return icons[type] || '📎'
  }

  const getAttachmentColor = (type) => {
    const colors = {
      link: 'blue',
      note: 'purple', 
      image: 'pink',
      document: 'orange',
      amount: 'green',
      location: 'red',
      contact: 'indigo'
    }
    return colors[type] || 'gray'
  }

  // Determinar tipo basado en displayType o type o file_type
  const attachmentType = attachment.displayType || attachment.type || (attachment.file_type?.startsWith('image/') ? 'image' : 'document')
  const color = getAttachmentColor(attachmentType)
  const icon = getAttachmentIcon(attachmentType)

  return (
    <>
      <div className={`flex items-center gap-3 p-3 bg-${color}-50 border border-${color}-200 rounded-lg min-h-[60px]`}>
        {/* Previsualización de imagen */}
        {attachmentType === 'image' && attachment.fileUrl && (
          <img 
            src={attachment.fileUrl}
            alt={attachment.file_name}
            className="w-12 h-12 object-cover rounded-lg border border-pink-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowImageViewer(true)}
          />
        )}
        
        {/* Icono para otros tipos */}
        {attachmentType !== 'image' && (
          <span className={`text-${color}-600 flex-shrink-0 text-lg`}>
            {icon}
          </span>
        )}
        
        <div className="flex-1 min-w-0">
          {/* Para attachments de texto: mostrar tipo + contenido */}
          {attachment.type && !attachment.file_size ? (
            <>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {attachment.type === 'note' ? 'NOTA' : 
                 attachment.type === 'link' ? 'ENLACE' :
                 attachment.type === 'contact' ? 'CONTACTO' :
                 attachment.type === 'amount' ? 'IMPORTE' :
                 attachment.type === 'location' ? 'UBICACIÓN' : attachment.type}:
              </p>
              <div className={`text-sm font-medium text-${color}-800 line-clamp-2`}>
                {attachment.type === 'deadline' && attachment.content ? 
                  formatDateWithDay(attachment.content) : 
                 attachment.type === 'link' ? (
                   <a 
                     href={attachment.content} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-blue-600 hover:text-blue-800 underline"
                     onClick={(e) => e.stopPropagation()}
                   >
                     {attachment.content}
                   </a>
                 ) : attachment.type === 'location' ? (
                   <div className="whitespace-pre-line">
                     {attachment.content.replace('📍 ', '')}
                   </div>
                 ) : attachment.type === 'amount' ? (
                   attachment.title || attachment.content
                 ) : (attachment.content || attachment.title)
                }
              </div>
            </>
          ) : (
            /* Para archivos: formato original */
            <>
              <p className={`text-sm font-medium text-${color}-800 truncate`}>
                {attachment.file_name}
              </p>
              {attachment.file_size && (
                <p className="text-xs text-gray-500">
                  {attachment.file_type} • {(attachment.file_size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </>
          )}
        </div>
        
        {/* Botones de acción */}
        
        {attachmentType === 'document' && (
          <button
            onClick={() => setShowDocumentViewer(true)}
            className={`text-${color}-600 hover:text-${color}-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors`}
          >
            📖
          </button>
        )}
        
        {/* Botón de descarga para todos los archivos */}
        {attachment.fileUrl && (
          <a
            href={attachment.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.file_name}
            className={`text-${color}-600 hover:text-${color}-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors`}
          >
            ⬇️
          </a>
        )}
        
        {/* Botón para links */}
        {(attachmentType === 'link' || attachment.isClickable) && attachment.displayContent && (
          <a 
            href={attachment.displayContent || attachment.content} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`text-${color}-600 hover:text-${color}-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors`}
            onClick={(e) => e.stopPropagation()}
          >
            ↗️
          </a>
        )}
        
        {/* Botón eliminar con debug */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            console.log('🗑️ Clic en eliminar, attachment:', attachment)  // DEBUG
            console.log('🗑️ onDelete function:', onDelete)                // DEBUG
            
            const confirmDelete = window.confirm('¿Eliminar este adjunto?')
            console.log('🗑️ Usuario confirmó:', confirmDelete)            // DEBUG
            
            if (confirmDelete && onDelete) {
              console.log('🗑️ Llamando onDelete...')                     // DEBUG
              onDelete()
            }
          }}
          className="text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          title="Eliminar adjunto"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Visor de imagen en modal */}
      {showImageViewer && attachment.type === 'image' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageViewer(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={attachment.content}
              alt={attachment.title}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-opacity"
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
              {attachment.title}
            </div>
          </div>
        </div>
      )}

      {/* Visor de documento */}
      {showDocumentViewer && attachment.type === 'document' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDocumentViewer(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Documento</h3>
              <button
                onClick={() => setShowDocumentViewer(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                <span className="text-orange-600 text-2xl">📄</span>
                <div>
                  <p className="font-medium text-gray-900">{attachment.title}</p>
                  <p className="text-sm text-gray-600">
                    {attachment.fileType} • {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <a
                  href={attachment.content}
                  download={attachment.fileName}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-center text-sm font-medium"
                >
                  📥 Descargar
                </a>
                {attachment.fileType === 'application/pdf' && (
                  <button
                    onClick={() => setShowPdfViewer(true)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
                  >
                    👁️ Ver
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor de PDF integrado */}
      {showPdfViewer && attachment.type === 'document' && attachment.fileType === 'application/pdf' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPdfViewer(false)}
        >
          <div 
            className="bg-white rounded-lg w-full h-full max-w-4xl max-h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{attachment.title}</h3>
              <div className="flex gap-2">
                <a
                  href={attachment.content}
                  download={attachment.fileName}
                  className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 transition-colors text-sm"
                >
                  📥 Descargar
                </a>
                <button
                  onClick={() => setShowPdfViewer(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-4">
              <iframe
                src={attachment.content}
                className="w-full h-full border-0 rounded"
                title={attachment.title}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AttachmentItem