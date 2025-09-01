'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Calendar, Clock, Filter, BarChart3, Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useActivities } from '@/hooks/useActivities'

const ActivitiesPage = () => {
  const { user } = useAuth()
  const { 
    activities, 
    todayActivities, 
    stats, 
    predefinedActivities,
    addActivity, 
    deleteActivity,
    loadHistoryFromSupabase,
    getActivityStats
  } = useActivities()
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [statsData, setStatsData] = useState<any>(null)
  const [chartView, setChartView] = useState('week')
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  
  const [newActivity, setNewActivity] = useState({
    type: '',
    duration: '',
    notes: ''
  })

  // Load historical data
  useEffect(() => {
    loadHistory()
  }, [selectedPeriod])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const today = new Date()
      let startDate = null
      
      switch (selectedPeriod) {
        case 'today':
          startDate = today.toISOString().split('T')[0]
          break
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(today.getDate() - 7)
          startDate = weekAgo.toISOString().split('T')[0]
          break
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(today.getMonth() - 1)
          startDate = monthAgo.toISOString().split('T')[0]
          break
      }
      
      const { data } = await loadHistoryFromSupabase(startDate)
      setHistoryData(data || [])
      
      const stats = await getActivityStats(selectedPeriod)
      setStatsData(stats)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAddActivity = async () => {
    if (!newActivity.type.trim() || !newActivity.duration) return

    const result = await addActivity({
      type: newActivity.type.trim(),
      duration: parseInt(newActivity.duration),
      notes: newActivity.notes.trim()
    })
    
    if (!result.error) {
      setNewActivity({ type: '', duration: '', notes: '' })
      setShowAddForm(false)
      loadHistory() // Refresh data
    }
  }

  const handleDeleteActivity = async (activityId: any) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
      await deleteActivity(activityId)
      loadHistory() // Refresh data
    }
  }

  const filteredHistory = selectedType === 'all' 
    ? historyData 
    : historyData.filter(activity => activity.activity_type === selectedType)

  const uniqueTypes = [...new Set(historyData.map(a => a.activity_type))]

  // Helper functions for date navigation
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'short' })
  }

  const getWeekDateRange = (offset: number) => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() - (offset * 7))
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    const totalMinutes = getTotalMinutesForPeriod('week', offset)
    return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${getMonthName(startOfWeek)} (${totalMinutes} min)`
  }

  const getMonthRange = (offset: number) => {
    const today = new Date()
    const targetMonth = new Date(today)
    targetMonth.setMonth(today.getMonth() - offset)
    
    const totalMinutes = getTotalMinutesForPeriod('month', offset)
    const avgDaily = Math.round(totalMinutes / 30)
    return `${targetMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} (${totalMinutes} min • ${avgDaily}/día)`
  }

  const getTotalMinutesForPeriod = (period: string, offset: number) => {
    const today = new Date()
    let startDate, endDate
    
    if (period === 'week') {
      startDate = new Date(today)
      startDate.setDate(today.getDate() - today.getDay() - (offset * 7))
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
    } else {
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - offset, 1)
      endDate = new Date(today)
      endDate.setMonth(today.getMonth() - offset + 1, 0)
    }
    
    return historyData
      .filter(a => {
        const activityDate = new Date(a.activity_date)
        return activityDate >= startDate && activityDate <= endDate
      })
      .reduce((sum, a) => sum + a.duration_minutes, 0)
  }

  // Generate chart data with week offset
  const generateChartData = () => {
    const today = new Date()
    const chartData = []
    
    if (chartView === 'week') {
      // Weekly view - show 7 days
      const baseDate = new Date(today.getTime() - (currentWeekOffset * 7 * 24 * 60 * 60 * 1000))
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(baseDate)
        date.setDate(baseDate.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayActivities = historyData.filter(a => a.activity_date === dateStr)
        const totalMinutes = dayActivities.reduce((sum, a) => sum + a.duration_minutes, 0)
        
        chartData.push({
          date: dateStr,
          day: date.getDate(),
          dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
          minutes: totalMinutes,
          isToday: dateStr === today.toISOString().split('T')[0]
        })
      }
    } else {
      // Monthly view - show 4 weeks with weekly totals
      const baseDate = new Date(today.getTime() - (currentWeekOffset * 30 * 24 * 60 * 60 * 1000))
      
      for (let week = 3; week >= 0; week--) {
        const weekStart = new Date(baseDate)
        weekStart.setDate(baseDate.getDate() - (week * 7) - 6)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        let weeklyMinutes = 0
        for (let d = 0; d < 7; d++) {
          const checkDate = new Date(weekStart)
          checkDate.setDate(weekStart.getDate() + d)
          const dateStr = checkDate.toISOString().split('T')[0]
          const dayActivities = historyData.filter(a => a.activity_date === dateStr)
          weeklyMinutes += dayActivities.reduce((sum, a) => sum + a.duration_minutes, 0)
        }
        
        chartData.push({
          date: weekStart.toISOString().split('T')[0],
          day: weekStart.getDate(),
          dayName: `Sem ${4 - week}`,
          weekRange: `${weekStart.getDate()}-${weekEnd.getDate()}`,
          minutes: weeklyMinutes,
          isCurrentWeek: week === 0,
          weekStart,
          weekEnd
        })
      }
    }
    
    return chartData
  }

  const chartData = generateChartData()
  
  // Better maxMinutes calculation for proper scaling
  const dataMinutes = chartData.map(d => d.minutes).filter(m => m > 0)
  const maxDataMinutes = dataMinutes.length > 0 ? Math.max(...dataMinutes) : 0
  
  // Smart scaling: use actual max if reasonable, otherwise use sensible default
  const maxMinutes = maxDataMinutes > 0 
    ? Math.max(maxDataMinutes, Math.min(maxDataMinutes * 1.2, 120)) // Add 20% headroom, cap at 120
    : 60 // Default when no data
    
  // Debug logging
  console.log('📊 Chart Debug:', {
    chartView,
    dataPoints: chartData.length,
    minutes: chartData.map(d => ({ name: d.dayName, minutes: d.minutes })),
    maxDataMinutes,
    finalMaxMinutes: maxMinutes
  })

  if (!user) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity size={20} className="text-orange-600" />
              Actividades
            </h1>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors min-h-[44px]"
          >
            <Plus size={16} />
            Añadir
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Activity Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 size={20} />
              Progreso de Actividad
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setChartView('week')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  chartView === 'week' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setChartView('month')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  chartView === 'month' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Mensual
              </button>
            </div>
          </div>
          
          {/* Navigation Header - Enhanced for mobile */}
          <div className="flex items-center justify-between mb-4 py-2">
            <button 
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center px-2">
              <div className="font-semibold text-gray-900 text-sm sm:text-base">
                {chartView === 'week' ? getWeekDateRange(currentWeekOffset) : getMonthRange(currentWeekOffset)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {chartView === 'week' ? 'Vista semanal' : 'Vista mensual (por semanas)'}
              </div>
            </div>
            
            <button 
              onClick={() => setCurrentWeekOffset(prev => Math.max(0, prev - 1))}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentWeekOffset === 0}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          {/* Chart bars - Improved design with taller container */}
          <div className="px-2 sm:px-4 py-6">
            <div className="flex justify-between items-end h-64 sm:h-72 gap-1 sm:gap-2">
              {chartData.map((day, index) => (
                <div key={day.date} className="flex-1 flex flex-col items-center max-w-[60px]">
                  {/* Spacer for layout - no text above bars */}
                  <div className="h-8 flex items-end mb-1">
                    {/* Empty space - minutes will be inside the bars */}
                  </div>
                  
                  {/* Bar with minutes inside */}
                  <div 
                    className={`w-full max-w-[36px] sm:max-w-[42px] rounded-lg transition-all duration-500 shadow-sm relative flex items-center justify-center ${
                      chartView === 'week'
                        ? (day.isToday 
                            ? 'bg-gradient-to-t from-orange-600 to-orange-400 shadow-lg ring-2 ring-orange-200' 
                            : day.minutes > 0 
                              ? 'bg-gradient-to-t from-orange-500 to-orange-300 hover:shadow-md' 
                              : 'bg-gray-200 hover:bg-gray-300')
                        : (day.isCurrentWeek 
                            ? 'bg-gradient-to-t from-orange-600 to-orange-400 shadow-lg ring-2 ring-orange-200'
                            : day.minutes > 0
                              ? 'bg-gradient-to-t from-orange-500 to-orange-300 hover:shadow-md'
                              : 'bg-gray-200 hover:bg-gray-300')
                    }`}
                    style={(() => {
                      // MUCH MORE PROMINENT height calculation
                      let heightPercent = 0
                      
                      if (day.minutes > 0) {
                        // Use a more aggressive scaling for better visibility
                        const basePercent = (day.minutes / maxMinutes) * 100
                        
                        // Apply exponential scaling for small values to make them more visible
                        // Formula: square root gives more height to smaller values
                        const scaledPercent = Math.sqrt(basePercent / 100) * 100
                        
                        // Much higher minimum for any data - at least 65% of container
                        heightPercent = Math.max(scaledPercent, 65)
                        
                        // Cap at 100% but allow more range
                        heightPercent = Math.min(heightPercent, 100)
                      } else {
                        // No data - keep small
                        heightPercent = 6
                      }
                      
                      // Debug individual bars
                      if (day.minutes > 0) {
                        console.log(`📊 Bar ${day.dayName}:`, {
                          minutes: day.minutes,
                          maxMinutes,
                          baseCalc: (day.minutes / maxMinutes) * 100,
                          scaledCalc: Math.sqrt((day.minutes / maxMinutes)),
                          final: heightPercent
                        })
                      }
                      
                      return {
                        height: `${heightPercent}%`,
                        minHeight: day.minutes > 0 ? '60px' : '8px' // Much bigger minimum - 60px guaranteed
                      }
                    })()} 
                  >
                    {/* Minutes text inside the bar */}
                    {day.minutes > 0 && (
                      <span className="text-xs sm:text-sm font-bold text-white drop-shadow-sm">
                        {day.minutes}
                      </span>
                    )}
                  </div>
                  
                  {/* Day label with better typography */}
                  <div className={`text-xs sm:text-sm mt-2 sm:mt-3 text-center leading-tight ${
                    chartView === 'week'
                      ? (day.isToday ? 'font-bold text-orange-700' : 'text-gray-600')
                      : (day.isCurrentWeek ? 'font-bold text-orange-700' : 'text-gray-600')
                  }`}>
                    {chartView === 'week' ? (
                      <>
                        <div>{day.dayName}</div>
                        <div className="text-[10px] text-gray-500">{day.day}</div>
                      </>
                    ) : (
                      <>
                        <div>{day.dayName}</div>
                        <div className="text-[10px] text-gray-500">{day.weekRange}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {statsData && (
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">{statsData.totalTime}</div>
                <div className="text-sm text-gray-600">minutos totales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{statsData.activityCount}</div>
                <div className="text-sm text-gray-600">actividades</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.totalTimeToday}</div>
                <div className="text-sm text-gray-600">min hoy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.todayCount}</div>
                <div className="text-sm text-gray-600">hoy</div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPeriod('today')}
                className={`px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] ${
                  selectedPeriod === 'today' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] ${
                  selectedPeriod === 'week' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] ${
                  selectedPeriod === 'month' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mes
              </button>
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Todas las actividades</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Activity Form */}
        {showAddForm && (
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">➕ Registrar Nueva Actividad</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tipo de actividad"
                value={newActivity.type}
                onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="number"
                placeholder="Duración (minutos)"
                value={newActivity.duration}
                onChange={(e) => setNewActivity({...newActivity, duration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <textarea
                placeholder="Notas (opcional)"
                value={newActivity.notes}
                onChange={(e) => setNewActivity({...newActivity, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddActivity}
                  disabled={!newActivity.type.trim() || !newActivity.duration}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white text-sm rounded-lg transition-colors min-h-[44px]"
                >
                  Registrar
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors min-h-[44px]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activities History */}
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">📋 Historial de Actividades</h3>
            {loadingHistory && (
              <div className="text-sm text-gray-500">Cargando...</div>
            )}
          </div>

          {filteredHistory.length > 0 ? (
            <div className="space-y-3">
              {filteredHistory.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{activity.activity_type}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(activity.activity_date).toLocaleDateString('es-ES')}
                      <Clock size={14} />
                      {activity.activity_time} • {activity.duration_minutes}min
                    </div>
                    {activity.notes && (
                      <div className="text-sm text-gray-500 mt-1">{activity.notes}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity size={48} className="mx-auto mb-2 text-gray-300" />
              <p>No hay actividades registradas en este período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivitiesPage