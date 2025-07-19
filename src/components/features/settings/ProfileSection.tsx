'use client'

import { useState } from 'react'
import { User, Mail, Calendar, MapPin, Edit3, Save, X } from 'lucide-react'

export default function ProfileSection() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: 'Marina Moreno',
    email: 'marina@example.com',
    timezone: 'Europe/Madrid',
    location: 'Madrid, España',
    joinDate: '2024-01-15',
    avatar: ''
  })

  const [editProfile, setEditProfile] = useState(profile)

  const handleSave = () => {
    setProfile(editProfile)
    setIsEditing(false)
    // TODO: Guardar en la base de datos
  }

  const handleCancel = () => {
    setEditProfile(profile)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      
      {/* Profile Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Información del Perfil
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit3 size={16} />
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Save size={16} />
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X size={16} />
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Avatar */}
          <div className="md:col-span-2 flex items-center gap-4">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{profile.name}</h4>
              <p className="text-gray-600">{profile.email}</p>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                Cambiar foto
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editProfile.name}
                onChange={(e) => setEditProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <User size={16} className="text-gray-500" />
                <span>{profile.name}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editProfile.email}
                onChange={(e) => setEditProfile(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <Mail size={16} className="text-gray-500" />
                <span>{profile.email}</span>
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editProfile.location}
                onChange={(e) => setEditProfile(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <MapPin size={16} className="text-gray-500" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {/* Join Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Miembro desde
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Calendar size={16} className="text-gray-500" />
              <span>{new Date(profile.joinDate).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Account Stats */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Estadísticas de la Cuenta
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">127</div>
            <div className="text-sm text-gray-600">Tareas completadas</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">15</div>
            <div className="text-sm text-gray-600">Días activos</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">3</div>
            <div className="text-sm text-gray-600">Proyectos activos</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">89%</div>
            <div className="text-sm text-gray-600">Tasa de éxito</div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
        <h3 className="text-lg font-semibold text-red-900 mb-4">
          Zona de Peligro
        </h3>
        <div className="space-y-3">
          <button className="w-full px-4 py-2 text-left text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
            Eliminar todos los datos
          </button>
          <button className="w-full px-4 py-2 text-left text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
            Desactivar cuenta
          </button>
        </div>
      </div>

    </div>
  )
}