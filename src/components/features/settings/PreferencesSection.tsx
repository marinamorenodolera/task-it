'use client'

import { useState } from 'react'
import { 
  Moon, Sun, Globe, Clock, Zap, Target, LayoutList, ChevronUp, ChevronDown, Plus, Edit2, Trash2, X,
  // NUEVOS ICONOS:
  Folder, Flame, Calendar, Lightbulb, 
  Rocket, BarChart, Star, Briefcase, Home, Palette,
  Heart, Shield, Trophy, Users, Settings
} from 'lucide-react'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { ICON_OPTIONS } from '@/utils/sectionIcons'

export default function PreferencesSection() {
  const { 
    sectionOrder, 
    moveSectionUp, 
    moveSectionDown, 
    toggleSectionVisibility, 
    resetToDefault, 
    loading: prefsLoading,
    createCustomSection,
    editSection,
    deleteCustomSection
  } = useUserPreferences()
  
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

  // Estados para el modal de nueva sección
  const [showNewSectionModal, setShowNewSectionModal] = useState(false)
  const [newSectionData, setNewSectionData] = useState({
    name: '',
    icon: 'folder',
    filterType: 'manual'
  })
  const [editingSectionId, setEditingSectionId] = useState(null)

  // FUNCIÓN renderIcon ACTUALIZADA
  const renderIcon = (iconName, size = 20, className = '') => {
    const iconData = ICON_OPTIONS.find(opt => opt.name === iconName)
    if (!iconData) {
      return <Folder size={size} className={`text-gray-500 ${className}`} />
    }
    
    const IconComponent = iconData.icon
    return <IconComponent size={size} className={`${iconData.color} ${className}`} />
  }

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

      {/* Section Organization */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <LayoutList size={20} className="text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Organización de Secciones
          </h3>
        </div>
        
        <div className="space-y-3">
          {sectionOrder.map((section, index) => (
            <div key={section.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{renderIcon(section.icon)}</span>
                <span className="font-medium text-gray-900">{section.name}</span>
                {!section.visible && (
                  <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                    Oculta
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveSectionUp(section.id)}
                  disabled={index === 0 || prefsLoading}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => moveSectionDown(section.id)}
                  disabled={index === sectionOrder.length - 1 || prefsLoading}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown size={16} />
                </button>
                
                {/* NUEVOS: Botones editar/eliminar (solo para secciones custom) */}
                {section.isCustom && (
                  <>
                    <button
                      onClick={() => {
                        setEditingSectionId(section.id)
                        setNewSectionData({
                          name: section.name,
                          icon: section.icon,
                          filterType: section.filterType || 'manual'
                        })
                        setShowNewSectionModal(true)
                      }}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={14} />
                    </button>
                    
                    <button
                      onClick={() => deleteCustomSection(section.id)}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                
                <label className="relative inline-flex items-center cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={section.visible}
                    onChange={() => toggleSectionVisibility(section.id)}
                    disabled={prefsLoading}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
        
        {/* Botón para añadir nueva sección */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowNewSectionModal(true)}
            disabled={prefsLoading}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Añadir sección personalizada</span>
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={resetToDefault}
            disabled={prefsLoading}
            className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {prefsLoading ? 'Restaurando...' : 'Restaurar orden por defecto'}
          </button>
        </div>
        
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Vista previa del orden:</div>
            <div className="text-xs text-blue-600">
              {sectionOrder.filter(s => s.visible).map(s => s.name).join(' → ')}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nueva/Editar Sección */}
      {showNewSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingSectionId ? 'Editar Sección' : 'Nueva Sección'}
              </h3>
              <button 
                onClick={() => {
                  setShowNewSectionModal(false)
                  setEditingSectionId(null)
                  setNewSectionData({ name: '', icon: 'folder', filterType: 'manual' })
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la sección
                </label>
                <input
                  type="text"
                  value={newSectionData.name}
                  onChange={(e) => setNewSectionData(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Proyectos Urgentes"
                  maxLength={30}
                />
              </div>
              
              {/* Icono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icono
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map(({ icon: IconComponent, name, color }) => (
                    <button
                      key={name}
                      onClick={() => setNewSectionData(prev => ({...prev, icon: name}))}
                      className={`p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors ${
                        newSectionData.icon === name ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <IconComponent size={20} className={color} />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewSectionModal(false)
                    setEditingSectionId(null)
                    setNewSectionData({ name: '', icon: 'folder', filterType: 'manual' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (editingSectionId) {
                      await editSection(editingSectionId, {
                        name: newSectionData.name,
                        icon: newSectionData.icon
                      })
                    } else {
                      await createCustomSection(newSectionData)
                    }
                    setShowNewSectionModal(false)
                    setEditingSectionId(null)
                    setNewSectionData({ name: '', icon: 'folder', filterType: 'manual' })
                  }}
                  disabled={!newSectionData.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingSectionId ? 'Guardar Cambios' : 'Crear Sección'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}