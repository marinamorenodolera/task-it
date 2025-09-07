import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export const useActivities = () => {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [predefinedActivities, setPredefinedActivities] = useState([])

  // Actividades predeterminadas por defecto
  const defaultPredefinedActivities = [
    {
      id: '1',
      type: 'Yoga',
      duration: 50,
      notes: '',
      color: 'purple'
    },
    {
      id: '2', 
      type: 'Pilates',
      duration: 50,
      notes: '',
      color: 'pink'
    },
    {
      id: '3',
      type: 'Incline walk',
      duration: 20,
      notes: '',
      color: 'green'
    },
    {
      id: '4',
      type: 'Weights',
      duration: 20,
      notes: '',
      color: 'blue'
    }
  ]

  // Check and handle daily reset at 6 AM
  const checkDailyReset = () => {
    if (!user?.id) return // Safe check
    
    const lastResetDate = localStorage.getItem(`last_reset_${user?.id}`)
    const today = new Date().toDateString()
    const currentHour = new Date().getHours()
    
    if (lastResetDate !== today && currentHour >= 6) {
      // Limpiar actividades locales del día anterior - formato cache actualizado
      setActivities([])
      const emptyCacheData = {
        data: [],
        timestamp: Date.now()
      }
      localStorage.setItem(`activities_${user.id}`, JSON.stringify(emptyCacheData))
      localStorage.setItem(`last_reset_${user.id}`, today)
      console.log('Daily reset applied at 6 AM')
    }
  }

  // Cargar actividades frescas en background sin afectar UI
  const loadFreshActivitiesInBackground = async () => {
    if (!user?.id) return
    
    try {
      console.log('🔄 Cargando actividades frescas en background...')
      
      // Obtener actividades recientes (últimas 18 horas como en getStats)
      const eighteenHoursAgo = new Date()
      eighteenHoursAgo.setHours(eighteenHoursAgo.getHours() - 18)
      const eighteenHoursAgoISO = eighteenHoursAgo.toISOString()
      
      const { data: freshData, error } = await supabase
        .from('activity_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', eighteenHoursAgoISO)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.warn('Error cargando datos frescos:', error)
        return
      }
      
      // Mapear a formato local
      const mappedActivities = (freshData || []).map(item => ({
        id: item.id.toString(),
        type: item.activity_type,
        date: new Date(item.activity_date).toDateString(),
        time: item.activity_time,
        notes: item.notes || '',
        duration: item.duration_minutes || 0,
        created_at: item.created_at
      }))
      
      // Actualizar cache con timestamp
      const cacheData = {
        data: mappedActivities,
        timestamp: Date.now()
      }
      localStorage.setItem(`activities_${user.id}`, JSON.stringify(cacheData))
      
      // Actualizar estado solo si datos son diferentes
      setActivities(current => {
        const currentIds = current.map(a => a.id).sort()
        const freshIds = mappedActivities.map(a => a.id).sort()
        
        if (JSON.stringify(currentIds) !== JSON.stringify(freshIds)) {
          console.log('✨ Datos frescos detectados, actualizando UI silenciosamente')
          return mappedActivities
        }
        return current
      })
      
    } catch (error) {
      console.error('Error en background refresh:', error)
    }
  }

  // Load activities with daily reset check
  const loadActivities = async () => {
    if (!user?.id) {
      console.warn('User not available in loadActivities')
      return
    }

    try {
      setLoading(true)
      
      // Check for daily reset first
      checkDailyReset()
      
      // VERSIÓN SIMPLIFICADA - Carga directa de Supabase
      console.log('🔄 Cargando actividades desde Supabase...')
      
      // Obtener actividades recientes directamente
      const eighteenHoursAgo = new Date()
      eighteenHoursAgo.setHours(eighteenHoursAgo.getHours() - 18)
      
      const { data: freshData, error: activitiesError } = await supabase
        .from('activity_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', eighteenHoursAgo.toISOString())
        .order('created_at', { ascending: false })
      
      if (activitiesError) {
        console.error('Error loading activities from Supabase:', activitiesError)
        setActivities([])
        setError(activitiesError.message)
        return
      }
      
      // Mapear a formato local
      const userActivities = (freshData || []).map(item => ({
        id: item.id.toString(),
        type: item.activity_type,
        date: new Date(item.activity_date || item.created_at).toDateString(),
        time: item.activity_time || new Date(item.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        notes: item.notes || '',
        duration: item.duration_minutes || 0,
        created_at: item.created_at
      }))

      // Load predefined activities from localStorage or use defaults
      const userPredefined = JSON.parse(localStorage.getItem(`predefined_activities_${user.id}`) || 'null')
      if (userPredefined) {
        setPredefinedActivities(userPredefined)
      } else {
        setPredefinedActivities(defaultPredefinedActivities)
        localStorage.setItem(`predefined_activities_${user.id}`, JSON.stringify(defaultPredefinedActivities))
      }
      
      setActivities(userActivities)
      setError(null)
      console.log('✅ Actividades cargadas:', userActivities.length)
      
    } catch (err) {
      console.error('Error loading activities:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Save activity to Supabase for historical tracking
  const saveToSupabase = async (activityData) => {
    if (!user?.id) {
      console.warn('User not available in saveToSupabase')
      return { data: null, error: 'User not authenticated' }
    }
    
    try {
      const { data, error } = await supabase
        .from('activity_history')
        .insert({
          user_id: user.id,
          activity_type: activityData.type,
          duration_minutes: parseInt(activityData.duration) || 0,
          notes: activityData.notes || '',
          activity_date: activityData.date || new Date().toISOString().split('T')[0],
          activity_time: activityData.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error saving to Supabase:', error)
      return { data: null, error: error.message }
    }
  }


  // Load historical data from Supabase
  const loadHistoryFromSupabase = async (startDate, endDate) => {
    if (!user?.id) {
      console.warn('User not available in loadHistoryFromSupabase')
      return { data: [], error: 'User not authenticated' }
    }
    
    try {
      let query = supabase
        .from('activity_history')
        .select('*')
        .eq('user_id', user.id)
        .order('activity_date', { ascending: false })
        .order('activity_time', { ascending: false })

      if (startDate) query = query.gte('activity_date', startDate)
      if (endDate) query = query.lte('activity_date', endDate)

      const { data, error } = await query

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error loading history from Supabase:', error)
      return { data: [], error: error.message }
    }
  }

  // Get activity statistics by period
  const getActivityStats = async (period = 'week') => {
    try {
      const today = new Date()
      let startDate

      switch (period) {
        case 'day':
          startDate = today.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - 7)
          startDate = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          const monthStart = new Date(today)
          monthStart.setDate(1)
          startDate = monthStart.toISOString().split('T')[0]
          break
        default:
          startDate = null
      }

      const { data: historyData } = await loadHistoryFromSupabase(startDate)
      
      const totalTime = historyData.reduce((sum, activity) => sum + activity.duration_minutes, 0)
      const activityCount = historyData.length
      
      const typeStats = historyData.reduce((acc, activity) => {
        const type = activity.activity_type
        if (!acc[type]) {
          acc[type] = { count: 0, totalTime: 0 }
        }
        acc[type].count++
        acc[type].totalTime += activity.duration_minutes
        return acc
      }, {})

      return {
        totalTime,
        activityCount,
        typeStats,
        period
      }
    } catch (error) {
      console.error('Error getting activity stats:', error)
      return {
        totalTime: 0,
        activityCount: 0,
        typeStats: {},
        period
      }
    }
  }

  // Add activity with dual storage (local + Supabase)
  const addActivity = async (activityData) => {
    if (!user?.id) {
      console.warn('User not available in addActivity')
      return { error: 'Usuario no autenticado' }
    }

    try {
      // Create new activity with local data
      const newActivity = {
        id: Date.now().toString(),
        type: activityData.type,
        date: activityData.date || new Date().toDateString(),
        time: activityData.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        notes: activityData.notes || '',
        duration: parseInt(activityData.duration) || 0,
        created_at: new Date().toISOString()
      }

      // Save to Supabase for historical tracking
      const supabaseResult = await saveToSupabase(activityData)
      if (supabaseResult.error) {
        console.warn('Failed to save to Supabase, continuing with local save:', supabaseResult.error)
      }

      // Add to local state (for today's view)
      setActivities(prev => [newActivity, ...prev])
      
      // Save to localStorage for persistence with cache format
      const cacheKey = `activities_${user.id}`
      const cacheData = JSON.parse(localStorage.getItem(cacheKey) || 'null')
      const currentActivities = cacheData?.data || []

      currentActivities.unshift(newActivity)
      const updatedCacheData = {
        data: currentActivities.slice(0, 50),
        timestamp: Date.now()
      }
      localStorage.setItem(cacheKey, JSON.stringify(updatedCacheData))

      return { data: newActivity, error: null }
    } catch (err) {
      console.error('Error adding activity:', err)
      return { data: null, error: err.message }
    }
  }

  // Update activity
  const updateActivity = async (activityId, updates) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      // Map component format to database format
      const dbUpdates = {}
      if (updates.type !== undefined) dbUpdates.activity_type = updates.type
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes
      if (updates.duration !== undefined) dbUpdates.duration_minutes = parseInt(updates.duration) || 0

      const { data, error } = await supabase
        .from('activities')
        .update(dbUpdates)
        .eq('id', activityId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Update local state
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? {
              ...activity,
              type: data.activity_type,
              notes: data.notes || '',
              duration: data.duration_minutes || 0
            }
          : activity
      ))

      return { data, error: null }
    } catch (err) {
      console.error('Error updating activity:', err)
      return { data: null, error: err.message }
    }
  }

  // Delete activity (with Supabase integration)
  const deleteActivity = async (activityId) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      // Delete from Supabase first (same pattern as deleteTask)
      const { error } = await supabase
        .from('activity_history')
        .delete()
        .eq('id', activityId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      setActivities(prev => prev.filter(activity => activity.id !== activityId))
      
      // Update localStorage
      const userActivities = JSON.parse(localStorage.getItem(`activities_${user.id}`) || '[]')
      const filteredActivities = userActivities.filter(activity => activity.id !== activityId)
      localStorage.setItem(`activities_${user.id}`, JSON.stringify(filteredActivities))

      return { error: null }
    } catch (err) {
      console.error('Error deleting activity:', err)
      return { error: err.message }
    }
  }

  // Get activities statistics
  const getStats = () => {
    const today = new Date().toDateString()
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)

    const todayActivities = activities.filter(a => {
      const activityDate = new Date(a.created_at);
      const now = new Date();
      
      // Solo mostrar actividades de las últimas 18 horas
      const hoursAgo = (now - activityDate) / (1000 * 60 * 60);
      return hoursAgo <= 18;
    });
    const weekActivities = activities.filter(a => new Date(a.created_at) >= thisWeek)

    const totalTimeToday = todayActivities.reduce((total, activity) => total + (parseInt(activity.duration) || 0), 0)
    const totalTimeWeek = weekActivities.reduce((total, activity) => total + (parseInt(activity.duration) || 0), 0)

    const avgDailyTime = weekActivities.length > 0 
      ? Math.round(totalTimeWeek / 7) 
      : 0

    // Group by activity type
    const typeStats = activities.reduce((acc, activity) => {
      const type = activity.type
      if (!acc[type]) {
        acc[type] = { count: 0, totalTime: 0 }
      }
      acc[type].count++
      acc[type].totalTime += (parseInt(activity.duration) || 0)
      return acc
    }, {})

    return {
      totalTimeToday,
      totalTimeWeek,
      avgDailyTime,
      todayCount: todayActivities.length,
      weekCount: weekActivities.length,
      typeStats,
      todayActivities // ✅ Incluimos las actividades filtradas en stats
    }
  }

  // Setup real-time subscription
  useEffect(() => {
    if (!user?.id) return

    loadActivities()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_history',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('🔴 Real-time change detected, refreshing...')
          loadActivities()
        }
      )
      .subscribe()

    // SIMPLIFICADO: Solo real-time de Supabase
    console.log('🔗 Configurando suscripción real-time')

    // Cleanup
    return () => {
      subscription.unsubscribe()
      console.log('🔌 Suscripción cerrada')
    }
  }, [user])

  // Gestión de actividades predeterminadas
  const addPredefinedActivity = (activityTemplate) => {
    if (!user?.id) return { data: null, error: 'Usuario no autenticado' }
    
    const newTemplate = {
      id: Date.now().toString(),
      ...activityTemplate
    }
    const updated = [...predefinedActivities, newTemplate]
    setPredefinedActivities(updated)
    localStorage.setItem(`predefined_activities_${user.id}`, JSON.stringify(updated))
    return { data: newTemplate, error: null }
  }

  const updatePredefinedActivity = (templateId, updates) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }
    
    const updated = predefinedActivities.map(template => 
      template.id === templateId 
        ? { ...template, ...updates }
        : template
    )
    setPredefinedActivities(updated)
    localStorage.setItem(`predefined_activities_${user.id}`, JSON.stringify(updated))
    return { error: null }
  }

  const deletePredefinedActivity = (templateId) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }
    
    const updated = predefinedActivities.filter(template => template.id !== templateId)
    setPredefinedActivities(updated)
    localStorage.setItem(`predefined_activities_${user.id}`, JSON.stringify(updated))
    return { error: null }
  }

  const stats = getStats()

  return {
    activities,
    todayActivities: stats.todayActivities, // ✅ Exponemos las actividades filtradas
    loading,
    error,
    stats,
    predefinedActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    loadActivities,
    addPredefinedActivity,
    updatePredefinedActivity,
    deletePredefinedActivity,
    loadHistoryFromSupabase,
    getActivityStats,
    checkDailyReset
  }
}