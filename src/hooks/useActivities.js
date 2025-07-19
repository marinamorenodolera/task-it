import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export const useActivities = () => {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load activities
  const loadActivities = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50) // Limit to recent activities

      if (error) throw error

      // Map to component format
      const mappedActivities = data.map(activity => ({
        id: activity.id,
        type: activity.activity_type,
        date: new Date(activity.created_at).toDateString(),
        notes: activity.notes || '',
        duration: activity.duration_minutes || 0,
        created_at: activity.created_at
      }))

      setActivities(mappedActivities)
      setError(null)
    } catch (err) {
      console.error('Error loading activities:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add activity
  const addActivity = async (activityData) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          activity_type: activityData.type,
          notes: activityData.notes || '',
          duration_minutes: parseInt(activityData.duration) || 0
        })
        .select()
        .single()

      if (error) throw error

      // Map to component format and add to state
      const newActivity = {
        id: data.id,
        type: data.activity_type,
        date: new Date(data.created_at).toDateString(),
        notes: data.notes || '',
        duration: data.duration_minutes || 0,
        created_at: data.created_at
      }

      setActivities(prev => [newActivity, ...prev])
      return { data: newActivity, error: null }
    } catch (err) {
      console.error('Error adding activity:', err)
      return { data: null, error: err.message }
    }
  }

  // Update activity
  const updateActivity = async (activityId, updates) => {
    if (!user) return { error: 'Usuario no autenticado' }

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

  // Delete activity
  const deleteActivity = async (activityId) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', user.id)

      if (error) throw error

      setActivities(prev => prev.filter(activity => activity.id !== activityId))
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

    const todayActivities = activities.filter(a => a.date === today)
    const weekActivities = activities.filter(a => new Date(a.created_at) >= thisWeek)

    const totalTimeToday = todayActivities.reduce((total, activity) => total + activity.duration, 0)
    const totalTimeWeek = weekActivities.reduce((total, activity) => total + activity.duration, 0)

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
      acc[type].totalTime += activity.duration
      return acc
    }, {})

    return {
      totalTimeToday,
      totalTimeWeek,
      avgDailyTime,
      todayCount: todayActivities.length,
      weekCount: weekActivities.length,
      typeStats
    }
  }

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return

    loadActivities()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadActivities()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const stats = getStats()

  return {
    activities,
    loading,
    error,
    stats,
    addActivity,
    updateActivity,
    deleteActivity,
    loadActivities
  }
}