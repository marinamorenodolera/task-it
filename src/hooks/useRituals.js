import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isToday } from '@/utils/dateHelpers'

export const useRituals = () => {
  const { user } = useAuth()
  const [rituals, setRituals] = useState([])
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load rituals and today's completions
  const loadRituals = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Load rituals
      const { data: ritualsData, error: ritualsError } = await supabase
        .from('daily_rituals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('position_order', { ascending: true })

      if (ritualsError) throw ritualsError

      // Load today's completions
      const today = new Date().toDateString()
      const { data: completionsData, error: completionsError } = await supabase
        .from('ritual_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', new Date(today).toISOString())
        .lt('completed_at', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString())

      if (completionsError) throw completionsError

      // Merge rituals with completion status
      const ritualsWithStatus = ritualsData.map(ritual => {
        const completion = completionsData.find(c => c.ritual_id === ritual.id)
        const subtasks = ritual.subtasks || []

        // Get completed subtasks from completion record
        const completedSubtasks = completion?.completed_subtasks || []

        return {
          id: ritual.id,
          title: ritual.title,
          icon: ritual.icon,
          completed: completion ? completion.is_completed : false,
          subtasks: subtasks.map(subtask => ({
            ...subtask,
            completed: completedSubtasks.includes(subtask.id)
          })),
          position_order: ritual.position_order,
          is_default: ritual.is_default
        }
      })

      setRituals(ritualsWithStatus)
      setCompletions(completionsData)
      setError(null)
    } catch (err) {
      console.error('Error loading rituals:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle ritual completion
  const toggleRitual = async (ritualId) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      const result = await supabase.rpc('toggle_ritual_completion', {
        p_user_id: user.id,
        p_ritual_id: ritualId
      })

      if (result.error) throw result.error

      // Reload to get updated status
      await loadRituals()
      return { error: null }
    } catch (err) {
      console.error('Error toggling ritual:', err)
      return { error: err.message }
    }
  }

  // Toggle subtask completion
  const toggleSubtask = async (ritualId, subtaskId) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      const result = await supabase.rpc('toggle_ritual_subtask', {
        p_user_id: user.id,
        p_ritual_id: ritualId,
        p_subtask_id: subtaskId
      })

      if (result.error) throw result.error

      // Update local state optimistically
      setRituals(prev => prev.map(ritual => 
        ritual.id === ritualId 
          ? {
              ...ritual,
              subtasks: ritual.subtasks.map(subtask =>
                subtask.id === subtaskId 
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              )
            }
          : ritual
      ))

      return { error: null }
    } catch (err) {
      console.error('Error toggling subtask:', err)
      return { error: err.message }
    }
  }

  // Add custom ritual
  const addRitual = async (ritualData) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      const { data, error } = await supabase
        .from('daily_rituals')
        .insert({
          user_id: user.id,
          title: ritualData.title,
          icon: ritualData.icon || '📝',
          subtasks: ritualData.subtasks || [],
          is_active: true,
          is_default: false,
          position_order: rituals.length
        })
        .select()
        .single()

      if (error) throw error

      await loadRituals()
      return { data, error: null }
    } catch (err) {
      console.error('Error adding ritual:', err)
      return { data: null, error: err.message }
    }
  }

  // Update ritual
  const updateRitual = async (ritualId, updates) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      const { data, error } = await supabase
        .from('daily_rituals')
        .update(updates)
        .eq('id', ritualId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      await loadRituals()
      return { data, error: null }
    } catch (err) {
      console.error('Error updating ritual:', err)
      return { data: null, error: err.message }
    }
  }

  // Delete ritual (only non-default)
  const deleteRitual = async (ritualId) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      const { error } = await supabase
        .from('daily_rituals')
        .delete()
        .eq('id', ritualId)
        .eq('user_id', user.id)
        .eq('is_default', false) // Only allow deletion of custom rituals

      if (error) throw error

      await loadRituals()
      return { error: null }
    } catch (err) {
      console.error('Error deleting ritual:', err)
      return { error: err.message }
    }
  }

  // Reset rituals (for new day)
  const resetRituals = async () => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      // This will be called at 6:00 AM or manually
      // Remove today's completions
      const today = new Date().toDateString()
      await supabase
        .from('ritual_completions')
        .delete()
        .eq('user_id', user.id)
        .gte('completed_at', new Date(today).toISOString())

      await loadRituals()
      return { error: null }
    } catch (err) {
      console.error('Error resetting rituals:', err)
      return { error: err.message }
    }
  }

  // Setup real-time subscription and auto-reset
  useEffect(() => {
    if (!user) return

    loadRituals()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('rituals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ritual_completions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadRituals()
        }
      )
      .subscribe()

    // Check for auto-reset at 6:00 AM
    const checkAutoReset = () => {
      const now = new Date()
      const lastReset = localStorage.getItem('lastRitualReset')
      const today = now.toDateString()

      if (lastReset !== today && now.getHours() >= 6) {
        resetRituals()
        localStorage.setItem('lastRitualReset', today)
      }
    }

    // Check every minute
    const resetInterval = setInterval(checkAutoReset, 60000)
    checkAutoReset() // Check immediately

    return () => {
      subscription.unsubscribe()
      clearInterval(resetInterval)
    }
  }, [user])

  // Computed values
  const completedRituals = rituals.filter(ritual => ritual.completed)
  const completedCount = completedRituals.length
  const totalCount = rituals.length

  return {
    rituals,
    completions,
    loading,
    error,
    completedCount,
    totalCount,
    toggleRitual,
    toggleSubtask,
    addRitual,
    updateRitual,
    deleteRitual,
    resetRituals,
    loadRituals
  }
}