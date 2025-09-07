import { useState, useRef, useEffect } from 'react'

const PullToRefresh = ({ onRefresh, children }) => {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)

  const MAX_PULL = 120
  const TRIGGER_THRESHOLD = 70

  const handleTouchStart = (e) => {
    if (window.scrollY > 0) return // Solo funciona si está en top
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e) => {
    if (window.scrollY > 0 || isRefreshing) return
    
    currentY.current = e.touches[0].clientY
    const pullDistance = Math.max(0, currentY.current - startY.current)
    
    if (pullDistance > 0) {
      e.preventDefault() // Prevenir scroll nativo
      setIsPulling(true)
      setPullDistance(Math.min(pullDistance, MAX_PULL))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > TRIGGER_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      
      try {
        await onRefresh()
        console.log('✅ Pull-to-refresh completado')
      } catch (error) {
        console.error('❌ Error in pull to refresh:', error)
      } finally {
        setTimeout(() => {
          setIsRefreshing(false)
          setIsPulling(false)
          setPullDistance(0)
        }, 500) // Pequeña pausa para mejor UX
      }
    } else {
      setIsPulling(false)
      setPullDistance(0)
    }
  }

  const pullProgress = Math.min(pullDistance / TRIGGER_THRESHOLD, 1)
  const shouldTrigger = pullDistance > TRIGGER_THRESHOLD

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden"
    >
      {/* Indicador de pull-to-refresh */}
      {isPulling && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gradient-to-b from-blue-50 to-transparent transition-all duration-200 ease-out z-10"
          style={{ 
            height: `${pullDistance}px`,
            transform: `translateY(-${pullDistance}px)`
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <div 
              className={`transition-all duration-200 ${
                isRefreshing 
                  ? 'animate-spin' 
                  : shouldTrigger 
                    ? 'rotate-180 scale-110' 
                    : ''
              }`}
            >
              {isRefreshing ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div 
                  className={`text-lg transition-colors duration-200 ${
                    shouldTrigger ? 'text-green-600' : 'text-blue-500'
                  }`}
                  style={{
                    opacity: pullProgress,
                    transform: `scale(${0.5 + pullProgress * 0.5})`
                  }}
                >
                  ↓
                </div>
              )}
            </div>
            
            <div 
              className={`text-xs font-medium transition-colors duration-200 ${
                isRefreshing
                  ? 'text-blue-600'
                  : shouldTrigger 
                    ? 'text-green-600' 
                    : 'text-blue-500'
              }`}
              style={{ opacity: pullProgress * 0.8 }}
            >
              {isRefreshing 
                ? 'Actualizando...' 
                : shouldTrigger 
                  ? 'Suelta para actualizar' 
                  : 'Desliza hacia abajo'
              }
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido principal */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{ 
          transform: isPulling ? `translateY(${pullDistance}px)` : 'translateY(0)' 
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default PullToRefresh