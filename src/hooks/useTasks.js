import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { attachmentService } from '@/services/attachments'

export const useTasks = () => {
  const { user, authState } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Debug logs only on state changes, not every render
  if (process.env.NODE_ENV === 'development') {
    // Only log significant state changes
    if (authState === 'authenticated' && user && !loading && tasks.length === 0) {
      console.debug('📋 Usuario autenticado sin tareas - puede ser normal')
    }
  }

  // DIAGNÓSTICO: Verificar estructura de tabla tasks
  const diagnoseTasks = async () => {
    if (!user?.id) return

    try {
      console.log('🔍 DIAGNÓSTICO: Verificando estructura de tabla tasks...')
      
      // Intentar obtener una tarea para ver qué campos devuelve
      const { data: sampleTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)

      if (error) {
        console.error('🔍 Error obteniendo muestra:', error)
        return
      }

      if (sampleTasks && sampleTasks.length > 0) {
        const sampleTask = sampleTasks[0]
        console.log('🔍 CAMPOS DISPONIBLES EN TABLA TASKS:')
        console.log('  - Campos encontrados:', Object.keys(sampleTask))
        console.log('  - Tiene campo "status":', 'status' in sampleTask)
        console.log('  - Valor actual status:', sampleTask.status)
        console.log('  - Tipo de status:', typeof sampleTask.status)
        console.log('  - Tarea completa de muestra:', sampleTask)
      } else {
        console.log('🔍 No hay tareas para diagnosticar estructura')
      }
    } catch (err) {
      console.error('🔍 Error en diagnóstico:', err)
    }
  }

  // Load tasks
  const loadTasks = async () => {
    if (!user?.id) {
      console.debug('📋 User not available in loadTasks')
      return
    }

    try {
      setLoading(true)
      
      // EJECUTAR DIAGNÓSTICO EN PRIMERA CARGA (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        await diagnoseTasks()
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Map database fields to component expected format and load attachments
      const mappedTasks = await Promise.all(
        data.map(async (task) => {
          // Load attachments for each task
          const { data: attachments } = await attachmentService.getTaskAttachments(task.id)
          
          return {
            id: task.id,
            text: task.title, // TaskDetailScreen usa 'text'
            title: task.title,
            description: task.description,
            notes: task.description, // alias for compatibility
            completed: task.completed,
            important: task.is_big_3_today, // Map Big 3 to important
            status: task.status || 'inbox', // Map status with default
            addedAt: new Date(task.created_at),
            deadline: task.deadline ? new Date(task.deadline) : null,
            amount: task.amount,
            link: task.link,
            created_at: task.created_at,
            updated_at: task.updated_at,
            attachments: attachments || []
          }
        })
      )

      setTasks(mappedTasks)
      setError(null)
      
      // Log successful load only once
      if (process.env.NODE_ENV === 'development' && mappedTasks.length > 0) {
        console.debug('📋 Tasks loaded:', mappedTasks.length)
      }
    } catch (err) {
      console.error('📋 Error loading tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add task
  const addTask = async (taskData) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

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
        updated_at: data.updated_at,
        attachments: []
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
    if (!user?.id) return { error: 'Usuario no autenticado' }

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
      if (updates.status !== undefined) dbUpdates.status = updates.status

      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        // Log detailed error information
        console.error('❌ updateTask error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          updates: updates,
          dbUpdates: dbUpdates
        })
        throw error
      }

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
      console.error('❌ updateTask failed:', err.message || err)
      return { data: null, error: err.message || err.toString() || 'Error desconocido en updateTask' }
    }
  }

  // Toggle completion
  const toggleComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) {
      return { error: 'Tarea no encontrada' }
    }

    // 1. Optimistic update - cambio inmediato
    const newCompletedState = !task.completed
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, completed: newCompletedState, justCompleted: newCompletedState } 
        : t
    ))

    try {
      // 2. Actualizar en base de datos
      const result = await updateTask(taskId, { completed: newCompletedState })
      
      if (result.error) {
        // Revertir si hay error
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...task } : t
        ))
        return result
      }
      
      // 3. Mostrar tarea tachada por 3 segundos
      setTimeout(() => {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, justCompleted: false } : t
        ))
      }, 3000)

      return result
    } catch (error) {
      // Revertir si hay error
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...task } : t
      ))
      return { error: error.message }
    }
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

  // Toggle waiting status (inbox <-> pending)
  const toggleWaitingStatus = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return { error: 'Tarea no encontrada' }

    console.log('🔄 toggleWaitingStatus - Task completa:', task)
    console.log('🔄 toggleWaitingStatus - Status actual:', task.status)
    console.log('🔄 toggleWaitingStatus - Task ID:', taskId)
    
    const newStatus = task.status === 'pending' ? 'inbox' : 'pending'
    console.log('🔄 toggleWaitingStatus - Nuevo status:', newStatus)
    
    // Optimistic update - similar a toggleBig3
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))
    
    try {
      const result = await updateTask(taskId, { status: newStatus })
      console.log('🔄 toggleWaitingStatus - Resultado Supabase:', result)
      
      if (result.error) {
        // Revertir si hay error
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: task.status } : t
        ))
      }
      
      return result
    } catch (error) {
      console.error('🔄 Error en toggleWaitingStatus:', error)
      // Revertir cambio
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: task.status } : t
      ))
      return { error: error.message }
    }
  }

  // Delete task
  const deleteTask = async (taskId) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      // First delete all attachments
      await attachmentService.deleteTaskAttachments(taskId)

      // Then delete the task
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
    if (!user?.id) return { error: 'Usuario no autenticado' }

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
    if (authState === 'authenticated' && user?.id) {
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
    } else {
      setTasks([])
      setLoading(false)
    }
  }, [authState, user?.id])

  // Add attachment to task
  const addAttachment = async (taskId, attachmentData) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      const result = await attachmentService.processAndCreateAttachment(
        attachmentData, 
        user.id, 
        taskId
      )

      if (result.error) {
        return { data: null, error: result.error }
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, attachments: [...(task.attachments || []), result.data] }
          : task
      ))

      return { data: result.data, error: null }
    } catch (err) {
      console.error('Error adding attachment:', err)
      return { data: null, error: err.message }
    }
  }

  // Delete attachment
  const deleteAttachment = async (taskId, attachmentId) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      const result = await attachmentService.deleteAttachment(attachmentId)
      
      if (result.error) {
        return { error: result.error }
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              attachments: (task.attachments || []).filter(att => att.id !== attachmentId) 
            }
          : task
      ))

      return { error: null }
    } catch (err) {
      console.error('Error deleting attachment:', err)
      return { error: err.message }
    }
  }

  // Reload task attachments
  const reloadTaskAttachments = async (taskId) => {
    try {
      const { data: attachments } = await attachmentService.getTaskAttachments(taskId)
      
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, attachments: attachments || [] }
          : task
      ))

      return { error: null }
    } catch (err) {
      console.error('Error reloading task attachments:', err)
      return { error: err.message }
    }
  }

  // Computed values
  const importantTasks = tasks.filter(task => task.important && !task.completed && task.status !== 'pending')
  const routineTasks = tasks.filter(task => !task.important && !task.completed && task.status !== 'pending')
  const waitingTasks = tasks.filter(task => task.status === 'pending' && !task.completed)
  const completedTasks = tasks.filter(task => task.completed)
  const big3Count = importantTasks.length

  return {
    tasks,
    loading,
    error,
    importantTasks,
    routineTasks,
    waitingTasks,
    completedTasks,
    big3Count,
    addTask,
    updateTask,
    toggleComplete,
    toggleBig3,
    toggleWaitingStatus,
    deleteTask,
    setBig3Tasks,
    loadTasks,
    addAttachment,
    deleteAttachment,
    reloadTaskAttachments
  }
}