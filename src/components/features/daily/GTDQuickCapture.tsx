'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Mic, MicOff, Zap, Brain, Calendar, Clock, MapPin, User, ArrowRight } from 'lucide-react'
import { GTDTask, GTDContext, DEFAULT_GTD_CONTEXTS } from '@/types/gtd.types'

interface GTDQuickCaptureProps {
  onTaskCreate: (task: Partial<GTDTask>) => void
  onAutoOrganize?: () => void
  onVoiceOrganize?: () => void
  isListening?: boolean
  voiceCommand?: string
  className?: string
}

interface ParsedTask {
  title: string
  suggestedContext?: GTDContext
  suggestedPriority?: 'urgent' | 'important' | 'nice' | 'delegate'
  suggestedEnergyLevel?: 'low' | 'medium' | 'high'
  estimatedDuration?: number
  dueDate?: Date
  isDelegated?: boolean
  delegatedTo?: string
  is_two_minute_task?: boolean
}

// GTD Natural Language Processing patterns
const GTD_NLP_PATTERNS = {
  contexts: {
    '@calls': ['llamar', 'call', 'teléfono', 'contactar', 'hablar con'],
    '@computer': ['computadora', 'ordenador', 'email', 'código', 'programar', 'diseñar', 'escribir'],
    '@office': ['oficina', 'reunión', 'presentación', 'meeting', 'imprimir'],
    '@home': ['casa', 'hogar', 'cocina', 'limpieza', 'jardín'],
    '@errands': ['comprar', 'banco', 'farmacia', 'recado', 'tienda', 'mercado'],
    '@waiting': ['esperar', 'pendiente de', 'waiting for', 'follow up']
  },
  priorities: {
    urgent: ['urgente', 'emergency', 'asap', 'ya', 'hoy', 'ahora'],
    important: ['importante', 'crucial', 'key', 'prioridad', 'estratégico'],
    delegate: ['delegar', 'asignar', 'que haga', 'pedirle a']
  },
  energy: {
    high: ['pensar', 'creatividad', 'estrategia', 'planificar', 'diseño'],
    medium: ['organizar', 'revisar', 'meeting', 'email'],
    low: ['archivo', 'limpiar', 'ordenar', 'rutina']
  },
  time: {
    quick: ['rápido', 'quick', '5 min', '10 min', 'breve'],
    medium: ['30 min', '1 hora', 'hora', 'meeting'],
    long: ['2 horas', '3 horas', 'día completo', 'proyecto']
  },
  dates: {
    today: ['hoy', 'today'],
    tomorrow: ['mañana', 'tomorrow'],
    week: ['semana', 'week', 'próxima semana'],
    month: ['mes', 'month', 'próximo mes']
  }
}

// Smart NLP parser for GTD task creation
const parseGTDTask = (input: string): ParsedTask => {
  const inputLower = input.toLowerCase()
  const result: ParsedTask = {
    title: input.trim()
  }

  // Context detection
  for (const [context, keywords] of Object.entries(GTD_NLP_PATTERNS.contexts)) {
    if (keywords.some(keyword => inputLower.includes(keyword))) {
      result.suggestedContext = DEFAULT_GTD_CONTEXTS.find(c => c.name === context)
      break
    }
  }

  // Priority detection
  for (const [priority, keywords] of Object.entries(GTD_NLP_PATTERNS.priorities)) {
    if (keywords.some(keyword => inputLower.includes(keyword))) {
      result.suggestedPriority = priority as any
      break
    }
  }

  // Energy level detection
  for (const [energy, keywords] of Object.entries(GTD_NLP_PATTERNS.energy)) {
    if (keywords.some(keyword => inputLower.includes(keyword))) {
      result.suggestedEnergyLevel = energy as any
      break
    }
  }

  // Time estimation
  if (GTD_NLP_PATTERNS.time.quick.some(keyword => inputLower.includes(keyword))) {
    result.estimatedDuration = 10
    result.is_two_minute_task = true
  } else if (GTD_NLP_PATTERNS.time.medium.some(keyword => inputLower.includes(keyword))) {
    result.estimatedDuration = 30
  } else if (GTD_NLP_PATTERNS.time.long.some(keyword => inputLower.includes(keyword))) {
    result.estimatedDuration = 120
  }

  // Date parsing (simplified)
  const today = new Date()
  if (GTD_NLP_PATTERNS.dates.today.some(keyword => inputLower.includes(keyword))) {
    result.dueDate = today
  } else if (GTD_NLP_PATTERNS.dates.tomorrow.some(keyword => inputLower.includes(keyword))) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    result.dueDate = tomorrow
  }

  // Delegation detection
  if (GTD_NLP_PATTERNS.priorities.delegate.some(keyword => inputLower.includes(keyword))) {
    result.isDelegated = true
    result.suggestedPriority = 'delegate'
  }

  return result
}

export default function GTDQuickCapture({ 
  onTaskCreate, 
  onAutoOrganize, 
  onVoiceOrganize, 
  isListening = false, 
  voiceCommand = '',
  className = ''
}: GTDQuickCaptureProps) {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse input as user types
  useEffect(() => {
    if (input.trim()) {
      const parsed = parseGTDTask(input)
      setParsedTask(parsed)
      setShowSuggestions(true)
    } else {
      setParsedTask(null)
      setShowSuggestions(false)
    }
  }, [input])

  // Handle voice command
  useEffect(() => {
    if (voiceCommand) {
      setInput(voiceCommand)
    }
  }, [voiceCommand])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const parsed = parseGTDTask(input)
    
    // Create GTD task with smart defaults
    const newTask: Partial<GTDTask> = {
      title: parsed.title,
      status: 'inbox',
      is_processed: false,
      is_actionable: true,
      is_next_action: false,
      is_two_minute_task: parsed.is_two_minute_task || false,
      priority: parsed.suggestedPriority || 'nice',
      energy_level: parsed.suggestedEnergyLevel || 'medium',
      estimated_duration: parsed.estimatedDuration || 30,
      due_date: parsed.dueDate,
      context: parsed.suggestedContext,
      waiting_for_person: parsed.isDelegated ? parsed.delegatedTo : undefined,
      created_at: new Date(),
      updated_at: new Date()
    }

    onTaskCreate(newTask)
    setInput('')
    setIsExpanded(false)
    setParsedTask(null)
    setShowSuggestions(false)
  }

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded)
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div className={`bg-white border-b border-gray-200 sticky top-0 z-20 ${className}`}>
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Main Input */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Capturar idea rápida... (ej: 'Llamar a Juan mañana' o 'Revisar emails urgente')"
              className="w-full px-4 py-3 pl-12 pr-16 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 placeholder:text-gray-400"
            />
            
            {/* Input Icon */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Smart Suggestions */}
        {showSuggestions && parsedTask && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Sugerencias inteligentes GTD</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {parsedTask.suggestedContext && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Contexto:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {parsedTask.suggestedContext.icon} {parsedTask.suggestedContext.name}
                  </span>
                </div>
              )}
              
              {parsedTask.suggestedPriority && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Prioridad:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    parsedTask.suggestedPriority === 'urgent' ? 'bg-red-100 text-red-800' :
                    parsedTask.suggestedPriority === 'important' ? 'bg-yellow-100 text-yellow-800' :
                    parsedTask.suggestedPriority === 'delegate' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {parsedTask.suggestedPriority === 'urgent' ? '🔴 Urgente' :
                     parsedTask.suggestedPriority === 'important' ? '🟡 Importante' :
                     parsedTask.suggestedPriority === 'delegate' ? '🟠 Delegar' : '⚪ Normal'}
                  </span>
                </div>
              )}
              
              {parsedTask.estimatedDuration && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Duración:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {parsedTask.estimatedDuration}min
                  </span>
                </div>
              )}
              
              {parsedTask.is_two_minute_task && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Regla 2 min:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    ⚡ Hacer ahora
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onAutoOrganize}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Auto-organizar</span>
            </button>
            
            <button
              onClick={onVoiceOrganize}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                isListening 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isListening ? 'Detener' : 'Voz'}
              </span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>Ctrl+K para captura rápida</span>
          </div>
        </div>

        {/* Voice Command Display */}
        {isListening && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-800">
                {voiceCommand || 'Escuchando...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}