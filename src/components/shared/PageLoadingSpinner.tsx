'use client'

export default function PageLoadingSpinner({ pageName }: { pageName: string }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="relative mb-8">
          {/* Animated logo/icon placeholder */}
          <div className="w-16 h-16 mx-auto">
            <div className="w-full h-full border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          {/* Pulsing background circle */}
          <div className="absolute inset-0 w-16 h-16 mx-auto bg-blue-100 rounded-full animate-ping opacity-20"></div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Cargando {pageName}...
        </h2>
        
        <p className="text-gray-600 text-sm mb-4">
          Preparando tus tareas
        </p>
        
        {/* Progress bar animation */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-blue-500 h-2 rounded-full animate-pulse" 
               style={{ 
                 width: '70%',
                 animation: 'loading-progress 2s ease-in-out infinite'
               }}>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          Optimizando rendimiento...
        </p>
      </div>
      
      <style jsx>{`
        @keyframes loading-progress {
          0% { width: 10%; }
          50% { width: 70%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  )
}