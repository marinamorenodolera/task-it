import React from 'react'

const AttachmentItem = ({ attachment }) => {
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

  const color = getAttachmentColor(attachment.type)
  const icon = getAttachmentIcon(attachment.type)

  return (
    <div className={`flex items-center gap-3 p-3 bg-${color}-50 border border-${color}-200 rounded-lg min-h-[60px]`}>
      <span className={`text-${color}-600 flex-shrink-0 text-lg`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-${color}-800 truncate`}>
          {attachment.title}
        </p>
        {attachment.type === 'image' && attachment.file_size && (
          <p className="text-xs text-gray-500">
            {(attachment.file_size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
        {attachment.type === 'document' && (
          <p className="text-xs text-gray-500">Documento</p>
        )}
        {attachment.type === 'contact' && attachment.phone && (
          <p className="text-xs text-gray-500">{attachment.phone}</p>
        )}
        {attachment.type === 'amount' && (
          <p className="text-xs text-gray-500">{attachment.content}</p>
        )}
      </div>
      {attachment.type === 'link' && (
        <a 
          href={attachment.content} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`text-${color}-600 hover:text-${color}-800 min-h-[44px] min-w-[44px] flex items-center justify-center`}
          onClick={(e) => e.stopPropagation()}
        >
          🔗
        </a>
      )}
    </div>
  )
}

export default AttachmentItem