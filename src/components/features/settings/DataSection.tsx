'use client'

import { useState } from 'react'
import { Download, Upload, Database, Trash2, Calendar, FileText, Shield, AlertTriangle, CheckCircle } from 'lucide-react'

export default function DataSection() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [lastBackup, setLastBackup] = useState('2024-01-15')
  const [backupStatus, setBackupStatus] = useState<'success' | 'pending' | 'error'>('success')

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true)
    // Simulamos la exportación
    setTimeout(() => {
      setIsExporting(false)
      // Aquí iría la lógica real de exportación
      console.log(`Exportando datos en formato ${format}`)
    }, 2000)
  }

  const handleImport = async (file: File) => {
    setIsImporting(true)
    // Simulamos la importación
    setTimeout(() => {
      setIsImporting(false)
      // Aquí iría la lógica real de importación
      console.log('Importando datos desde archivo:', file.name)
    }, 2000)
  }

  const handleBackup = async () => {
    setBackupStatus('pending')
    // Simulamos el backup
    setTimeout(() => {
      setBackupStatus('success')
      setLastBackup(new Date().toISOString().split('T')[0])
    }, 2000)
  }

  const handleDeleteAllData = () => {
    const confirmed = window.confirm('⚠️ Esta acción eliminará TODOS tus datos permanentemente. ¿Estás seguro?')
    if (confirmed) {
      const doubleConfirmed = window.confirm('Esta acción NO se puede deshacer. ¿Continuar?')
      if (doubleConfirmed) {
        // Aquí iría la lógica real de eliminación
        console.log('Eliminando todos los datos...')
      }
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Backup Status */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database size={20} className="text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Estado del Backup
          </h3>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {backupStatus === 'success' && <CheckCircle className="text-green-500" size={20} />}
            {backupStatus === 'pending' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>}
            {backupStatus === 'error' && <AlertTriangle className="text-red-500" size={20} />}
            
            <div>
              <div className="font-medium text-gray-900">
                {backupStatus === 'success' && 'Backup completado'}
                {backupStatus === 'pending' && 'Creando backup...'}
                {backupStatus === 'error' && 'Error en backup'}
              </div>
              <div className="text-sm text-gray-500">
                Último backup: {new Date(lastBackup).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleBackup}
            disabled={backupStatus === 'pending'}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {backupStatus === 'pending' ? 'Creando...' : 'Crear Backup'}
          </button>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Download size={20} className="text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Exportar Datos
          </h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Descarga una copia de todos tus datos para backup o migración.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-blue-500" />
              <h4 className="font-medium text-gray-900">Formato JSON</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Ideal para backup completo o migración a otra app
            </p>
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isExporting ? 'Exportando...' : 'Exportar JSON'}
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-green-500" />
              <h4 className="font-medium text-gray-900">Formato CSV</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Para abrir en Excel o Google Sheets
            </p>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Import Data */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={20} className="text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Importar Datos
          </h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Restaura datos desde un backup previo o importa desde otra aplicación.
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload size={24} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 mb-2">
            Arrastra un archivo aquí o haz clic para seleccionar
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Formatos soportados: JSON, CSV (máximo 10MB)
          </p>
          
          <input
            type="file"
            accept=".json,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleImport(file)
              }
            }}
            className="hidden"
            id="import-file"
          />
          
          <label
            htmlFor="import-file"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer transition-colors"
          >
            <Upload size={16} />
            {isImporting ? 'Importando...' : 'Seleccionar archivo'}
          </label>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Estadísticas de Datos
          </h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">127</div>
            <div className="text-sm text-gray-600">Tareas totales</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">45</div>
            <div className="text-sm text-gray-600">Proyectos</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">89</div>
            <div className="text-sm text-gray-600">Notas</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">2.5MB</div>
            <div className="text-sm text-gray-600">Tamaño total</div>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} className="text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Privacidad y Seguridad
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Encriptación local</div>
              <div className="text-sm text-gray-500">
                Todos los datos se encriptan antes de enviarse al servidor
              </div>
            </div>
            <div className="text-green-600">
              <CheckCircle size={20} />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Backup automático</div>
              <div className="text-sm text-gray-500">
                Backup diario automático en la nube
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Retención de datos</div>
              <div className="text-sm text-gray-500">
                Los datos eliminados se mantienen 30 días para recuperación
              </div>
            </div>
            <span className="text-sm text-gray-600">30 días</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 size={20} className="text-red-500" />
          <h3 className="text-lg font-semibold text-red-900">
            Zona de Peligro
          </h3>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <div className="font-medium text-red-900">¡Atención!</div>
          </div>
          <p className="text-sm text-red-700">
            Estas acciones son irreversibles. Asegúrate de tener un backup antes de continuar.
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleDeleteAllData}
            className="w-full px-4 py-3 text-left text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            <div>
              <div className="font-medium">Eliminar todos los datos</div>
              <div className="text-sm text-red-500">
                Borra permanentemente todas las tareas, proyectos y configuraciones
              </div>
            </div>
          </button>
          
          <button className="w-full px-4 py-3 text-left text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2">
            <Database size={16} />
            <div>
              <div className="font-medium">Restablecer configuración</div>
              <div className="text-sm text-red-500">
                Vuelve a la configuración por defecto (mantiene datos)
              </div>
            </div>
          </button>
        </div>
      </div>

    </div>
  )
}