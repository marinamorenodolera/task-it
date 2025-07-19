import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export const useTasks = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load tasks
  const loadTasks = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Map database fields to component expected format
      const mappedTasks = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        notes: task.description, // alias for compatibility
        completed: task.completed,
        important: task.is_big_3_today, // Map Big 3 to important
        addedAt: new Date(task.created_at),
        deadline: task.deadline ? new Date(task.deadline) : null,
        amount: task.amount,
        link: task.link,
        created_at: task.created_at,
        updated_at: task.updated_at
      }))

      setTasks(mappedTasks)
      setError(null)
    } catch (err) {
      console.error('Error loading tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add task
  const addTask = async (taskData) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: taskData.title,
          description: taskData.notes || taskData.description || '',
          deadline: taskData.deadline?.toISOString() || null,
          amount: taskData.amount || null,
          link: taskData.link || null,
          is_big_3_today: taskData.important || false,
          completed: false
        })
        .select()
        .single()

      if (error) throw error

      // Map to component format and add to state
      const newTask = {
        id: data.id,
        title: data.title,
        description: data.description,
        notes: data.description,
        completed: data.completed,
        important: data.is_big_3_today,
        addedAt: new Date(data.created_at),
        deadline: data.deadline ? new Date(data.deadline) : null,
        amount: data.amount,
        link: data.link,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      setTasks(prev => [newTask, ...prev])
      return { data: newTask, error: null }
    } catch (err) {
      console.error('Error adding task:', err)
      return { data: null, error: err.message }
    }
  }

  // Update task
  const updateTask = async (taskId, updates) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      // Map component format to database format
      const dbUpdates = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.notes !== undefined) dbUpdates.description = updates.notes
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed
      if (updates.important !== undefined) dbUpdates.is_big_3_today = updates.important
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline?.toISOString() || null
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount
      if (updates.link !== undefined) dbUpdates.link = updates.link

      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? {
              ...task,
              ...updates,
              deadline: data.deadline ? new Date(data.deadline) : null,
              updated_at: data.updated_at
            }
          : task
      ))

      return { data, error: null }
    } catch (err) {
      console.error('Error updating task:', err)
      return { data: null, error: err.message }
    }
  }

  // Toggle completion
  const toggleComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    return await updateTask(taskId, { completed: !task.completed })
  }

  // Toggle Big 3 (important)
  const toggleBig3 = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Check Big 3 limit
    const currentBig3Count = tasks.filter(t => t.important && !t.completed).length
    
    if (!task.important && currentBig3Count >= 3) {
      return { error: 'Ya tienes 3 tareas Big 3. Completa una antes de añadir otra.' }
    }

    return await updateTask(taskId, { important: !task.important })
  }

  // Delete task
  const deleteTask = async (taskId) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) throw error

      setTasks(prev => prev.filter(task => task.id !== taskId))
      return { error: null }
    } catch (err) {
      console.error('Error deleting task:', err)
      return { error: err.message }
    }
  }

  // Set Big 3 tasks (for task selector)
  const setBig3Tasks = async (taskIds) => {
    if (!user) return { error: 'Usuario no autenticado' }

    try {
      // First, remove Big 3 from all tasks
      await supabase
        .from('tasks')
        .update({ is_big_3_today: false })
        .eq('user_id', user.id)

      // Then, set Big 3 for selected tasks
      if (taskIds.length > 0) {
        await supabase
          .from('tasks')
          .update({ is_big_3_today: true })
          .in('id', taskIds)
          .eq('user_id', user.id)
      }

      // Reload tasks to reflect changes
      await loadTasks()
      return { error: null }
    } catch (err) {
      console.error('Error setting Big 3 tasks:', err)
      return { error: err.message }
    }
  }

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return

    loadTasks()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Reload tasks on any change
          loadTasks()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Computed values
  const importantTasks = tasks.filter(task => task.important && !task.completed)
  const routineTasks = tasks.filter(task => !task.important && !task.completed)
  const completedTasks = tasks.filter(task => task.completed)
  const big3Count = importantTasks.length

  return {
    tasks,
    loading,
    error,
    importantTasks,
    routineTasks,
    completedTasks,
    big3Count,
    addTask,
    updateTask,
    toggleComplete,
    toggleBig3,
    deleteTask,
    setBig3Tasks,
    loadTasks
  }
}