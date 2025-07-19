'use client'

import { useState } from 'react'
import { Moon, Sun, Globe, Clock, Zap, Target } from 'lucide-react'

export default function PreferencesSection() {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'es',
    timezone: 'Europe/Madrid',
    workingHours: {
      start: '09:00',
      end: '18:00'
    },
    focusMode: true,
    autoArchive: true,
    defaultPriority: 'nice',
    weekStart: 'monday',
    notifications: {
      dailyReminder: true,
      weeklyReview: true,
      deadlines: true,
      achievements: false
    }
  })

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
    // TODO: Guardar en la base de datos
  }

  const handleNestedPreferenceChange = (parent: string, key: string, value: any) => {
    setPreferences(prev => {
      const parentData = prev[parent as keyof typeof prev] as any
      
      return {
        ...prev,
        [parent]: {
          ...parentData,
          [key]: value
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      
      {/* Appearance */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎨 Apariencia
        </h3>
        
        <div className="space-y-4">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tema
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handlePreferenceChange('theme', 'light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  preferences.theme === 'light' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Sun size={16} />
                Claro
              </button>
              <button
                onClick={() => handlePreferenceChange('theme', 'dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  preferences.theme === 'dark' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Moon size={16} />
                Oscuro
              </button>
              <button
                onClick={() => handlePreferenceChange('theme', 'system')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  preferences.theme === 'system' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Globe size={16} />
                Sistema
              </button>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Idioma
            </label>
            <select
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Horario de Trabajo
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de inicio
            </label>
            <input
              type="time"
              value={preferences.workingHours.start}
              onChange={(e) => handleNestedPreferenceChange('workingHours', 'start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de fin
            </label>
            <input
              type="time"
              value={preferences.workingHours.end}
              onChange={(e) => handleNestedPreferenceChange('workingHours', 'end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inicio de semana
          </label>
          <select
            value={preferences.weekStart}
            onChange={(e) => handlePreferenceChange('weekStart', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="monday">Lunes</option>
            <option value="sunday">Domingo</option>
            <option value="saturday">Sábado</option>
          </select>
        </div>
      </div>

      {/* Productivity */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={20} className="text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Productividad
          </h3>
        </div>
        
        <div className="space-y-4">
          {/* Focus Mode */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Modo Enfoque</div>
              <div className="text-sm text-gray-500">
                Bloquea distracciones durante las sesiones de trabajo
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.focusMode}
                onChange={(e) => handlePreferenceChange('focusMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Auto Archive */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Auto Archivar</div>
              <div className="text-sm text-gray-500">
                Archiva automáticamente tareas completadas después de 7 días
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.autoArchive}
                onChange={(e) => handlePreferenceChange('autoArchive', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Default Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad por defecto
            </label>
            <select
              value={preferences.defaultPriority}
              onChange={(e) => handlePreferenceChange('defaultPriority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="urgent">🔥 Urgente</option>
              <option value="important">⚡ Importante</option>
              <option value="nice">📝 Nice to Have</option>
              <option value="delegate">🗑️ Delegar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target size={20} className="text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Recordatorios
          </h3>
        </div>
        
        <div className="space-y-4">
          {/* Daily Reminder */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Recordatorio Diario</div>
              <div className="text-sm text-gray-500">
                Recibe un recordatorio para revisar tus tareas del día
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications.dailyReminder}
                onChange={(e) => handleNestedPreferenceChange('notifications', 'dailyReminder', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Weekly Review */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Revisión Semanal</div>
              <div className="text-sm text-gray-500">
                Recordatorio para hacer tu revisión semanal GTD
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications.weeklyReview}
                onChange={(e) => handleNestedPreferenceChange('notifications', 'weeklyReview', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Deadlines */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Fechas Límite</div>
              <div className="text-sm text-gray-500">
                Alertas para tareas que se acercan a su fecha límite
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications.deadlines}
                onChange={(e) => handleNestedPreferenceChange('notifications', 'deadlines', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Achievements */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Logros</div>
              <div className="text-sm text-gray-500">
                Notificaciones cuando desbloquees nuevos logros
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications.achievements}
                onChange={(e) => handleNestedPreferenceChange('notifications', 'achievements', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

    </div>
  )
}