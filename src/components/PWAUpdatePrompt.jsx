import React, { useState } from 'react'
import { RefreshCw, Download, X, Wifi, WifiOff } from 'lucide-react'
import { usePWAUpdate } from '@/hooks/usePWAUpdate'

const PWAUpdatePrompt = () => {
  const { 
    updateAvailable, 
    isStale, 
    refreshData, 
    applyUpdate, 
    clearAllCaches,
    isOnline 
  } = usePWAUpdate()
  
  const [dismissed, setDismissed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // No mostrar nada si está dismissed o en development
  if (dismissed || process.env.NODE_ENV === 'development') {
    return null
  }

  const handleRefreshData = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleApplyUpdate = async () => {
    setIsRefreshing(true)
    try {
      await applyUpdate()
    } catch (error) {
      console.error('Error applying update:', error)
      setIsRefreshing(false)
    }
  }

  const handleClearCaches = async () => {
    setIsRefreshing(true)
    try {
      const success = await clearAllCaches()
      if (success) {
        // Recargar después de limpiar caches
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      console.error('Error clearing caches:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Prompt para nueva versión disponible
  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-blue-600 text-white rounded-xl shadow-lg border border-blue-500 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-1">
              <Download size={20} className="text-blue-200" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Nueva versión disponible
              </h3>
              <p className="text-blue-100 text-xs mb-3">
                Una actualización de Task-It está lista para instalar
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyUpdate}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 min-h-[32px]"
                >
                  {isRefreshing ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Prompt para datos stale (necesitan refresh)
  if (isStale) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-orange-600 text-white rounded-xl shadow-lg border border-orange-500 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-1">
              <RefreshCw size={20} className="text-orange-200" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Datos desactualizados
              </h3>
              <p className="text-orange-100 text-xs mb-3">
                Tus tareas podrían no estar actualizadas. Refresca para ver los últimos cambios.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRefreshData}
                  disabled={isRefreshing || !isOnline}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-50 transition-colors disabled:opacity-50 min-h-[32px]"
                >
                  {isRefreshing ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : isOnline ? (
                    <RefreshCw size={14} />
                  ) : (
                    <WifiOff size={14} />
                  )}
                  <span>
                    {isRefreshing 
                      ? 'Refrescando...' 
                      : !isOnline 
                        ? 'Sin conexión' 
                        : 'Refrescar'
                    }
                  </span>
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="p-1.5 text-orange-200 hover:text-white hover:bg-orange-700 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Indicador de estado offline
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-gray-600 text-white rounded-xl shadow-lg border border-gray-500 p-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <WifiOff size={18} className="text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Sin conexión</p>
              <p className="text-gray-300 text-xs">
                Trabajando en modo offline
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center touch-manipulation"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default PWAUpdatePrompt