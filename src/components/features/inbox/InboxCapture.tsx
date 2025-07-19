'use client'

import { useState } from 'react'
import { Plus, Mic, Camera, FileText, Zap, Brain, Clock } from 'lucide-react'

interface InboxCaptureProps {
  onAddItem: (title: string, metadata?: { urgency?: 'low' | 'medium' | 'high', context?: string }) => void
  isLoading: boolean
  className?: string
}

export default function InboxCapture({ onAddItem, isLoading, className = '' }: InboxCaptureProps) {
  const [input, setInput] = useState('')
  const [captureMode, setCaptureMode] = useState<'text' | 'voice' | 'photo' | 'smart'>('text')
  const [smartSuggestions, setSmartSuggestions] = useState<{ context?: string, urgency?: 'low' | 'medium' | 'high', isProject?: boolean }>({})
  const [showSmartCapture, setShowSmartCapture] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    // Smart processing of input
    const metadata = analyzeInput(input.trim())
    onAddItem(input.trim(), metadata)
    setInput('')
    setSmartSuggestions({})
    setShowSmartCapture(false)
  }

  const analyzeInput = (text: string): { urgency?: 'low' | 'medium' | 'high', context?: string } => {
    const metadata: { urgency?: 'low' | 'medium' | 'high', context?: string } = {}
    
    // Urgency detection
    if (text.match(/urgente|asap|ya|ahora|inmediatamente/i)) {
      metadata.urgency = 'high'
    } else if (text.match(/importante|prioridad|esta semana/i)) {
      metadata.urgency = 'medium'
    } else {
      metadata.urgency = 'low'
    }
    
    // Context detection
    if (text.match(/llamar|call|telefono|contactar/i)) {
      metadata.context = '@calls'
    } else if (text.match(/email|correo|escribir|enviar/i)) {
      metadata.context = '@computer'
    } else if (text.match(/comprar|tienda|supermercado|farmacia/i)) {
      metadata.context = '@errands'
    } else if (text.match(/casa|hogar|home/i)) {
      metadata.context = '@home'
    } else if (text.match(/oficina|trabajo|work|office/i)) {
      metadata.context = '@office'
    }
    
    return metadata
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    
    // Smart suggestions on typing
    if (value.length > 3) {
      const suggestions = analyzeInput(value)
      setSmartSuggestions(suggestions)
      setShowSmartCapture(true)
    } else {
      setShowSmartCapture(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <section className={`${className}`}>
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          💭 Captura Rápida
        </h2>
        
        {/* Capture Mode Selector */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setCaptureMode('text')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              captureMode === 'text' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText size={16} />
            Texto
          </button>
          <button
            onClick={() => setCaptureMode('smart')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              captureMode === 'smart' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Brain size={16} />
            Smart
          </button>
          <button
            onClick={() => setCaptureMode('voice')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              captureMode === 'voice' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled // TODO: Implementar captura por voz
          >
            <Mic size={16} />
            Voz
          </button>
          <button
            onClick={() => setCaptureMode('photo')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              captureMode === 'photo' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled // TODO: Implementar captura por foto
          >
            <Camera size={16} />
            Foto
          </button>
        </div>

        {/* Text Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={captureMode === 'smart' ? '🧠 Escribe y obtén sugerencias inteligentes...' : '¿Qué tienes en mente?'}
              className="flex-1 px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`
                px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                min-h-[48px] min-w-[48px] flex items-center justify-center
                transition-colors duration-150
                ${(!input.trim() || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Plus size={20} />
            </button>
          </div>
          
          {/* Smart Suggestions */}
          {showSmartCapture && captureMode === 'smart' && (smartSuggestions.context || smartSuggestions.urgency) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">Sugerencias inteligentes:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {smartSuggestions.context && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    📍 {smartSuggestions.context}
                  </span>
                )}
                {smartSuggestions.urgency && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    smartSuggestions.urgency === 'high' ? 'bg-red-100 text-red-700' :
                    smartSuggestions.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {smartSuggestions.urgency === 'high' ? '🔥' : smartSuggestions.urgency === 'medium' ? '⚡' : '📝'}
                    {smartSuggestions.urgency === 'high' ? 'Urgente' : smartSuggestions.urgency === 'medium' ? 'Importante' : 'Normal'}
                  </span>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Quick Tips */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip GTD:</strong> Captura todo lo que venga a tu mente. 
            No te preocupes por organizarlo ahora, eso lo harás después.
          </p>
        </div>

        {/* Quick Capture Templates */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">⚡ Captura rápida:</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setInput('Llamar a ')}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
            >
              📞 Llamar
            </button>
            <button
              onClick={() => setInput('Comprar ')}
              className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors"
            >
              🛒 Comprar
            </button>
            <button
              onClick={() => setInput('Enviar email a ')}
              className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition-colors"
            >
              📧 Email
            </button>
            <button
              onClick={() => setInput('Revisar ')}
              className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs hover:bg-orange-200 transition-colors"
            >
              📋 Revisar
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}