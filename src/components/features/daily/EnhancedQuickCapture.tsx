'use client'

import { useState } from 'react'
import { Plus, Mic, MicOff, Zap, X, Link, Euro, Calendar, Edit3, Image, Clock } from 'lucide-react'

interface QuickCaptureProps {
  onAddTask: (task: string, metadata?: any) => void
  onAutoOrganize: () => void
  onVoiceOrganize: () => void
  isListening?: boolean
  voiceCommand?: string
  className?: string
}

export default function EnhancedQuickCapture({
  onAddTask,
  onAutoOrganize,
  onVoiceOrganize,
  isListening = false,
  voiceCommand = '',
  className = ''
}: QuickCaptureProps) {
  const [quickCapture, setQuickCapture] = useState('')
  const [showQuickOptions, setShowQuickOptions] = useState(false)
  const [lastAddedTask, setLastAddedTask] = useState<string | null>(null)

  const handleAddTask = () => {
    if (quickCapture.trim()) {
      // Parse natural language (simplified)
      const metadata = parseNaturalLanguage(quickCapture)
      
      onAddTask(quickCapture, metadata)
      setLastAddedTask(quickCapture)
      setQuickCapture('')
      setShowQuickOptions(true)
      
      // Hide options after 8 seconds
      setTimeout(() => {
        setShowQuickOptions(false)
        setLastAddedTask(null)
      }, 8000)
    }
  }

  const parseNaturalLanguage = (text: string) => {
    // Simple parsing for demo - can be enhanced
    const metadata: any = {}
    
    // Check for amounts
    const amountMatch = text.match(/(\d+)\s*€/)
    if (amountMatch) {
      metadata.amount = parseInt(amountMatch[1])
    }
    
    // Check for urgency keywords
    const urgentKeywords = ['urgent', 'asap', 'importante', 'prioridad']
    if (urgentKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      metadata.priority = 'urgent'
    }
    
    return metadata
  }

  const addQuickOption = (type: string, value: any) => {
    // TODO: Update the last added task with this metadata
    console.log('Adding quick option:', type, value)
    setShowQuickOptions(false)
    setLastAddedTask(null)
  }

  return (
    <div className={`bg-white border-b border-gray-200 p-4 sticky top-0 z-10 ${className}`}>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Free to Focus</h1>
      
      {/* Enhanced Quick Capture */}
      <div className="space-y-3">
        {/* Main Input + Plus Button */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ej: Llamar María jueves 15:00 proyecto..."
            value={quickCapture}
            onChange={(e) => setQuickCapture(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            className="flex-1 px-4 py-3 text-base border-2 border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-colors mobile-optimized"
            autoFocus
          />
          <button
            onClick={handleAddTask}
            className="px-4 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors shadow-md touch-target"
            title="Agregar tarea"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Expandable Quick Options */}
        {showQuickOptions && lastAddedTask && (
          <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200 transition-all duration-300 ease-out">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-blue-900">Añadir a tu última tarea:</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuickOptions(false)}
                  className="text-xs px-3 py-1 bg-blue-200 text-blue-700 rounded-lg hover:bg-blue-300 transition-colors"
                >
                  Luego
                </button>
                <button
                  onClick={() => setShowQuickOptions(false)}
                  className="p-1 text-blue-400 hover:text-blue-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Quick Options Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const url = prompt('URL del enlace:')
                  if (url) addQuickOption('link', url)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white text-blue-700 rounded-xl text-sm hover:bg-blue-100 transition-colors border border-blue-200 touch-target"
              >
                <Link size={16} /> 
                <span>Link</span>
              </button>
              
              <button
                onClick={() => {
                  const amount = prompt('Importe en €:')
                  if (amount) addQuickOption('amount', parseInt(amount))
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white text-blue-700 rounded-xl text-sm hover:bg-blue-100 transition-colors border border-blue-200 touch-target"
              >
                <Euro size={16} /> 
                <span>Importe</span>
              </button>
              
              <button
                onClick={() => {
                  const deadline = prompt('Fecha límite (ej: mañana, viernes):')
                  if (deadline) addQuickOption('deadline', deadline)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white text-blue-700 rounded-xl text-sm hover:bg-blue-100 transition-colors border border-blue-200 touch-target"
              >
                <Calendar size={16} /> 
                <span>Fecha</span>
              </button>
              
              <button
                onClick={() => {
                  const notes = prompt('Notas adicionales:')
                  if (notes) addQuickOption('notes', notes)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white text-blue-700 rounded-xl text-sm hover:bg-blue-100 transition-colors border border-blue-200 touch-target"
              >
                <Edit3 size={16} /> 
                <span>Notas</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auto-organize & Voice */}
      <div className="flex gap-3 mt-3">
        <button
          onClick={onAutoOrganize}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-2xl hover:bg-green-200 transition-colors touch-target"
        >
          <Zap size={18} />
          <span className="text-sm font-medium">Auto-organizar</span>
        </button>
        
        <button
          onClick={onVoiceOrganize}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all touch-target ${
            isListening 
              ? 'bg-red-100 text-red-700 animate-pulse' 
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          <span className="text-sm font-medium">
            {isListening ? 'Escuchando...' : 'Voz'}
          </span>
        </button>
      </div>

      {/* Voice Command Feedback */}
      {voiceCommand && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Mic size={16} />
            <span className="text-sm font-medium">Comando procesado:</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">"{voiceCommand}"</p>
          <div className="mt-2 text-xs text-blue-500">Reorganizando tareas...</div>
        </div>
      )}
    </div>
  )
}