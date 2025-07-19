'use client'

import { useState } from 'react'
import ProfileSection from '@/components/features/settings/ProfileSection'
import PreferencesSection from '@/components/features/settings/PreferencesSection'
import NotificationsSection from '@/components/features/settings/NotificationsSection'
import DataSection from '@/components/features/settings/DataSection'
import { User, Settings, Bell, Database, Info } from 'lucide-react'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'notifications' | 'data' | 'about'>('profile')

  const sections = [
    {
      id: 'profile',
      title: 'Perfil',
      icon: User,
      description: 'Información personal y cuenta'
    },
    {
      id: 'preferences',
      title: 'Preferencias',
      icon: Settings,
      description: 'Personalización y configuración'
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: Bell,
      description: 'Alertas y recordatorios'
    },
    {
      id: 'data',
      title: 'Datos',
      icon: Database,
      description: 'Backup, exportar, importar'
    },
    {
      id: 'about',
      title: 'Acerca de',
      icon: Info,
      description: 'Información de la app'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-4xl">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            ⚙️ Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Personaliza tu experiencia Free to Focus
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <nav className="space-y-1 p-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={20} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {section.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === 'profile' && <ProfileSection />}
            {activeSection === 'preferences' && <PreferencesSection />}
            {activeSection === 'notifications' && <NotificationsSection />}
            {activeSection === 'data' && <DataSection />}
            {activeSection === 'about' && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Acerca de Free to Focus
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                      F2F
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Free to Focus</h4>
                      <p className="text-gray-600">Versión 1.0.0</p>
                      <p className="text-sm text-gray-500">
                        Productividad inteligente con metodología GTD
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Características</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Metodología GTD completa</li>
                      <li>• Matriz de Eisenhower integrada</li>
                      <li>• Revisión semanal estructurada</li>
                      <li>• Gamificación sutil</li>
                      <li>• Sincronización en tiempo real</li>
                      <li>• PWA - Funciona offline</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}