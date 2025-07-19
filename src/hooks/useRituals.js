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

  // Default rituals configuration
  const getDefaultRituals = () => [
    {
      title: "☀️ Morning review & Big 3",
      icon: "☀️",
      position_order: 0,
      subtasks: [
        { id: "energy", text: "Check energy level" },
        { id: "big3", text: "Select Big 3 for today" },
        { id: "calendar", text: "Review calendar" }
      ]
    },
    {
      title: "📧 Process inbox to zero",
      icon: "📧",
      position_order: 1,
      subtasks: [
        { id: "inbox_zero", text: "Inbox to zero" },
        { id: "urgent_emails", text: "Reply urgent emails" }
      ]
    },
    {
      title: "💪 Physical activity",
      icon: "💪",
      position_order: 2,
      subtasks: [
        { id: "exercise", text: "Complete exercise" },
        { id: "tracker", text: "Log in sport tracker" }
      ]
    },
    {
      title: "📝 Plan tomorrow",
      icon: "📝",
      position_order: 3,
      subtasks: [
        { id: "review_progress", text: "Review today's progress" },
        { id: "set_priorities", text: "Set tomorrow's priorities" }
      ]
    },
    {
      title: "🔒 Workday shutdown",
      icon: "🔒",
      position_order: 4,
      subtasks: [
        { id: "inbox_cero", text: "Inbox a cero" },
        { id: "calendario_revisado", text: "Calendario revisado" },
        { id: "escritorio_ordenado", text: "Escritorio ordenado" }
      ]
    }
  ]

  // Initialize default rituals for new users
  const initializeDefaultRituals = async () => {
    if (!user) return

    try {
      // Check if user already has rituals
      const { data: existingRituals, error: checkError } = await supabase
        .from('daily_rituals')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (checkError) throw checkError

      // If no rituals exist, create defaults
      if (!existingRituals || existingRituals.length === 0) {
        const defaultRituals = getDefaultRituals().map(ritual => ({
          user_id: user.id,
          title: ritual.title,
          icon: ritual.icon,
          subtasks: ritual.subtasks,
          is_active: true,
          is_default: true,
          position_order: ritual.position_order
        }))

        const { error: insertError } = await supabase
          .from('daily_rituals')
          .insert(defaultRituals)

        if (insertError) throw insertError
        
        console.log('✅ Default rituals initialized for user')
      }
    } catch (err) {
      console.error('Error initializing default rituals:', err)
    }
  }

  // Load rituals and today's completions
  const loadRituals = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Initialize defaults if needed
      await initializeDefaultRituals()

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
            id: subtask.id,
            text: subtask.text || subtask.title, // Support both formats
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

  // Restore default rituals (user option)
  const restoreDefaultRituals = async () => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      // Delete existing rituals
      const { error: deleteError } = await supabase
        .from('daily_rituals')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Insert defaults
      const defaultRituals = getDefaultRituals().map(ritual => ({
        user_id: user.id,
        title: ritual.title,
        icon: ritual.icon,
        subtasks: ritual.subtasks,
        is_active: true,
        is_default: true,
        position_order: ritual.position_order
      }))

      const { error: insertError } = await supabase
        .from('daily_rituals')
        .insert(defaultRituals)

      if (insertError) throw insertError

      await loadRituals()
      return { error: null }
    } catch (err) {
      console.error('Error restoring default rituals:', err)
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
    restoreDefaultRituals,
    loadRituals
  }
}