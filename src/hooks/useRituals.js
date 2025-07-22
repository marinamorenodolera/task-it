import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isToday } from '@/utils/dateHelpers'

export const useRituals = () => {
  const { user, authState } = useAuth()
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
    if (!user?.id) return

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
    if (!user?.id) {
      console.warn('User not available in loadRituals')
      return
    }

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

      // Simple ritual mapping without completion tracking for now
      const ritualsWithStatus = ritualsData.map(ritual => {
        const subtasks = ritual.subtasks || []

        return {
          id: ritual.id,
          title: ritual.title,
          icon: ritual.icon,
          completed: false, // Reset daily or on page load
          subtasks: subtasks.map(subtask => ({
            id: subtask.id,
            text: subtask.text || subtask.title, // Support both formats
            completed: false // Reset daily or on page load
          })),
          position_order: ritual.position_order,
          is_default: ritual.is_default
        }
      })

      setRituals(ritualsWithStatus)
      setCompletions([])
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
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      // Update local state optimistically first
      setRituals(prev => prev.map(ritual => 
        ritual.id === ritualId 
          ? { ...ritual, completed: !ritual.completed }
          : ritual
      ))

      return { error: null }
    } catch (err) {
      console.error('Error toggling ritual:', err)
      return { error: err.message }
    }
  }

  // Toggle subtask completion
  const toggleSubtask = async (ritualId, subtaskId) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      // Update local state optimistically
      setRituals(prev => prev.map(ritual => 
        ritual.id === ritualId 
          ? {
              ...ritual,
              subtasks: ritual.subtasks.map(subtask =>
                subtask.id === subtaskId 
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
              // Auto-complete ritual if all subtasks are done
              completed: ritual.subtasks.every(s => 
                s.id === subtaskId ? !s.completed : s.completed
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
    if (!user?.id) return { error: 'Usuario no autenticado' }

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
    if (!user?.id) return { error: 'Usuario no autenticado' }

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
    if (!user?.id) return { error: 'Usuario no autenticado' }

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
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      // Simply reload rituals to reset completion status
      await loadRituals()
      return { error: null }
    } catch (err) {
      console.error('Error resetting rituals:', err)
      return { error: err.message }
    }
  }

  // Restore default rituals (user option)
  const restoreDefaultRituals = async () => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

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
    if (!user?.id) return

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
        // Reset all rituals to incomplete
        setRituals(prev => prev.map(ritual => ({
          ...ritual,
          completed: false,
          subtasks: ritual.subtasks.map(subtask => ({
            ...subtask,
            completed: false
          }))
        })))
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
  }, [authState, user?.id])

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