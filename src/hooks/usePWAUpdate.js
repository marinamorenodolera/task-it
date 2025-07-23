import { useState, useEffect, useCallback } from 'react'

export const usePWAUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isStale, setIsStale] = useState(false)
  const [registration, setRegistration] = useState(null)
  const [lastCheckTime, setLastCheckTime] = useState(Date.now())

  // Detectar si datos están "stale" (sin refresh >5min)
  const checkStaleData = useCallback(() => {
    const now = Date.now()
    const timeSinceLastCheck = now - lastCheckTime
    const fiveMinutes = 5 * 60 * 1000

    if (timeSinceLastCheck > fiveMinutes) {
      setIsStale(true)
      console.log('📱 PWA: Datos detectados como stale (>5min sin refresh)')
    }
  }, [lastCheckTime])

  // Limpiar todos los caches manualmente
  const clearAllCaches = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys()
        console.log('🧹 PWA: Limpiando caches:', cacheNames)
        
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log(`🧹 Eliminando cache: ${cacheName}`)
            return caches.delete(cacheName)
          })
        )
        
        console.log('✅ PWA: Todos los caches eliminados')
        return true
      }
    } catch (error) {
      console.error('❌ PWA: Error limpiando caches:', error)
      return false
    }
    return false
  }, [])

  // Refrescar datos forzando network
  const refreshData = useCallback(async () => {
    console.log('🔄 PWA: Refrescando datos...')
    
    // Marcar como no stale
    setIsStale(false)
    setLastCheckTime(Date.now())
    
    // Opcional: Limpiar caches específicos de APIs
    try {
      if ('caches' in window) {
        await caches.delete('supabase-api-cache')
        await caches.delete('next-data')
        console.log('🧹 PWA: Caches de API limpiados')
      }
    } catch (error) {
      console.error('❌ PWA: Error limpiando caches de API:', error)
    }

    // Forzar reload de la página para obtener datos frescos
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }, [])

  // Aplicar actualización del service worker
  const applyUpdate = useCallback(async () => {
    if (registration && registration.waiting) {
      console.log('🔄 PWA: Aplicando actualización del service worker...')
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setUpdateAvailable(false)
      
      // Esperar un poco y recargar
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }, [registration])

  // Verificar actualizaciones manualmente
  const checkForUpdates = useCallback(async () => {
    if (registration) {
      console.log('🔍 PWA: Verificando actualizaciones...')
      try {
        await registration.update()
      } catch (error) {
        console.error('❌ PWA: Error verificando actualizaciones:', error)
      }
    }
  }, [registration])

  // Setup service worker listeners
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const handleServiceWorkerUpdate = (reg) => {
      console.log('📱 PWA: Service worker registration:', reg)
      setRegistration(reg)

      // Detectar nueva versión disponible
      if (reg.waiting) {
        console.log('🆕 PWA: Nueva versión disponible')
        setUpdateAvailable(true)
      }

      // Listener para nuevas versiónes
      reg.addEventListener('updatefound', () => {
        console.log('🔍 PWA: Actualización encontrada')
        const newWorker = reg.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✅ PWA: Nueva versión lista')
              setUpdateAvailable(true)
            }
          })
        }
      })
    }

    // Registrar service worker
    navigator.serviceWorker.ready
      .then(handleServiceWorkerUpdate)
      .catch(error => {
        console.error('❌ PWA: Error con service worker:', error)
      })

    // Listener para mensajes del service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('📨 PWA: Service worker actualizado')
        setUpdateAvailable(true)
      }
    })

    // Listener para cambios de conectividad
    const handleOnline = () => {
      console.log('🌐 PWA: Conexión restaurada, verificando actualizaciones...')
      checkForUpdates()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [checkForUpdates])

  // Auto-verificación cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      checkStaleData()
      
      // Solo verificar actualizaciones si está online
      if (navigator.onLine && registration) {
        checkForUpdates()
      }
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [checkStaleData, checkForUpdates, registration])

  // Detectar cuando la página lleva mucho tiempo abierta
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        const timeSinceLastCheck = now - lastCheckTime
        const tenMinutes = 10 * 60 * 1000

        if (timeSinceLastCheck > tenMinutes) {
          console.log('👁️ PWA: Página visible después de >10min, verificando datos...')
          checkStaleData()
          checkForUpdates()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [lastCheckTime, checkStaleData, checkForUpdates])

  return {
    updateAvailable,
    isStale,
    refreshData,
    applyUpdate,
    clearAllCaches,
    checkForUpdates,
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true
  }
}