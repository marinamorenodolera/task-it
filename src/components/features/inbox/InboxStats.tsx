'use client'

interface InboxStatsProps {
  totalItems: number
  processedToday: number
  className?: string
}

export default function InboxStats({ totalItems, processedToday, className = '' }: InboxStatsProps) {
  const processingRate = totalItems > 0 ? Math.round((processedToday / totalItems) * 100) : 0
  
  return (
    <section className={`${className}`}>
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          
          {/* Items to Process */}
          <div className="p-4">
            <div className="text-2xl sm:text-3xl font-bold text-orange-500 mb-1">
              {totalItems}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Por procesar
            </div>
          </div>

          {/* Processed Today */}
          <div className="p-4">
            <div className="text-2xl sm:text-3xl font-bold text-green-500 mb-1">
              {processedToday}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Procesadas hoy
            </div>
          </div>

          {/* Processing Rate */}
          <div className="p-4">
            <div className="text-2xl sm:text-3xl font-bold text-blue-500 mb-1">
              {processingRate}%
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Tasa procesamiento
            </div>
          </div>

          {/* Inbox Zero Status */}
          <div className="p-4">
            <div className="text-2xl sm:text-3xl font-bold text-purple-500 mb-1">
              {totalItems === 0 ? '🎉' : '⏳'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {totalItems === 0 ? 'Inbox Zero!' : 'En proceso'}
            </div>
          </div>

        </div>

        {/* Progress Bar */}
        {totalItems > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progreso de procesamiento</span>
              <span>{processingRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingRate}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}