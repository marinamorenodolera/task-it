'use client'

import { useState } from 'react'
import { Bell, Clock, Calendar, Target, Award, AlertCircle } from 'lucide-react'

export default function NotificationsSection() {
  const [notifications, setNotifications] = useState({
    push: {
      enabled: true,
      dailyReminder: { enabled: true, time: '09:00' },
      weeklyReview: { enabled: true, day: 'friday', time: '17:00' },
      deadlines: { enabled: true, advance: 24 },
      achievements: { enabled: false }
    },
    email: {
      enabled: false,
      weeklyDigest: { enabled: false, day: 'sunday' },
      monthlyReport: { enabled: false }
    }
  })

  const handleNotificationChange = (category: string, key: string, value: any) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
  }

  const handleNestedChange = (category: string, parent: string, key: string, value: any) => {
    setNotifications(prev => {
      const categoryData = prev[category as keyof typeof prev] as any
      const parentData = categoryData[parent] as any
      
      return {
        ...prev,
        [category]: {
          ...categoryData,
          [parent]: {
            ...parentData,
            [key]: value
          }
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      
      {/* Push Notifications */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={20} className="text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Notificaciones Push
          </h3>
        </div>
        
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
          <div>
            <div className="font-medium text-gray-900">Habilitar notificaciones push</div>
            <div className="text-sm text-gray-500">
              Controla todas las notificaciones en tu dispositivo
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.push.enabled}
              onChange={(e) => handleNotificationChange('push', 'enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className={`space-y-6 ${!notifications.push.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Daily Reminder */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-orange-500" />
              <div>
                <div className="font-medium text-gray-900">Recordatorio diario</div>
                <div className="text-sm text-gray-500">
                  Planifica tu día cada mañana
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={notifications.push.dailyReminder.time}
                onChange={(e) => handleNestedChange('push', 'dailyReminder', 'time', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={!notifications.push.dailyReminder.enabled}
              />
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.push.dailyReminder.enabled}
                  onChange={(e) => handleNestedChange('push', 'dailyReminder', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Weekly Review */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-purple-500" />
              <div>
                <div className="font-medium text-gray-900">Revisión semanal</div>
                <div className="text-sm text-gray-500">
                  Recordatorio para hacer tu revisión GTD
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={notifications.push.weeklyReview.day}
                onChange={(e) => handleNestedChange('push', 'weeklyReview', 'day', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={!notifications.push.weeklyReview.enabled}
              >
                <option value="monday">Lunes</option>
                <option value="tuesday">Martes</option>
                <option value="wednesday">Miércoles</option>
                <option value="thursday">Jueves</option>
                <option value="friday">Viernes</option>
                <option value="saturday">Sábado</option>
                <option value="sunday">Domingo</option>
              </select>
              <input
                type="time"
                value={notifications.push.weeklyReview.time}
                onChange={(e) => handleNestedChange('push', 'weeklyReview', 'time', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={!notifications.push.weeklyReview.enabled}
              />
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.push.weeklyReview.enabled}
                  onChange={(e) => handleNestedChange('push', 'weeklyReview', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Deadlines */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className="text-red-500" />
              <div>
                <div className="font-medium text-gray-900">Fechas límite</div>
                <div className="text-sm text-gray-500">
                  Alertas para tareas próximas a vencer
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={notifications.push.deadlines.advance}
                onChange={(e) => handleNestedChange('push', 'deadlines', 'advance', Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={!notifications.push.deadlines.enabled}
              >
                <option value={1}>1 hora antes</option>
                <option value={4}>4 horas antes</option>
                <option value={24}>1 día antes</option>
                <option value={48}>2 días antes</option>
                <option value={168}>1 semana antes</option>
              </select>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.push.deadlines.enabled}
                  onChange={(e) => handleNestedChange('push', 'deadlines', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Achievements */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award size={16} className="text-yellow-500" />
              <div>
                <div className="font-medium text-gray-900">Logros</div>
                <div className="text-sm text-gray-500">
                  Celebra tus éxitos y milestones
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.push.achievements.enabled}
                onChange={(e) => handleNestedChange('push', 'achievements', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={20} className="text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Notificaciones por Email
          </h3>
        </div>
        
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
          <div>
            <div className="font-medium text-gray-900">Habilitar emails</div>
            <div className="text-sm text-gray-500">
              Recibe resúmenes y reportes por email
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.email.enabled}
              onChange={(e) => handleNotificationChange('email', 'enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className={`space-y-6 ${!notifications.email.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Weekly Digest */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Resumen semanal</div>
              <div className="text-sm text-gray-500">
                Estadísticas y logros de la semana
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={notifications.email.weeklyDigest.day}
                onChange={(e) => handleNestedChange('email', 'weeklyDigest', 'day', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={!notifications.email.weeklyDigest.enabled}
              >
                <option value="sunday">Domingo</option>
                <option value="monday">Lunes</option>
                <option value="saturday">Sábado</option>
              </select>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.email.weeklyDigest.enabled}
                  onChange={(e) => handleNestedChange('email', 'weeklyDigest', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Monthly Report */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Reporte mensual</div>
              <div className="text-sm text-gray-500">
                Análisis detallado de productividad
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email.monthlyReport.enabled}
                onChange={(e) => handleNestedChange('email', 'monthlyReport', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

        </div>
      </div>

      {/* Test Notifications */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Probar Notificaciones
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Probar notificación push
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            Probar email
          </button>
        </div>
      </div>

    </div>
  )
}