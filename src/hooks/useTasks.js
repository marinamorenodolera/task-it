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


  // Load tasks
  const loadTasks = async () => {
    if (!user?.id) {
      console.debug('📋 User not available in loadTasks')
      return
    }

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .is('parent_task_id', null)
        .order('section_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error


      // Map database fields to component expected format and load attachments
      const mappedTasks = await Promise.all(
        data.map(async (task) => {
          // Load attachments for each task - safe loading to prevent blocking
          let attachments = []
          try {
            const result = await attachmentService.getTaskAttachments(task.id)
            attachments = result.data || []
          } catch (err) {
            console.warn('Error loading attachments for task', task.id, ':', err)
            attachments = [] // Continue without attachments
          }
          
          return {
            id: task.id,
            text: task.title, // TaskDetailScreen usa 'text'
            title: task.title,
            description: task.description,
            notes: task.description, // alias for compatibility
            completed: task.completed,
            important: task.is_big_3_today, // Map Big 3 to important
            status: task.status || 'inbox', // Map status with default
            priority: task.priority || 'normal', // Map priority with default
            page: task.page || 'daily', // Map page with default
            section: task.section, // Map section exactly as it comes from DB
            scheduled_date: task.scheduled_date, // IMPORTANTE: Mapear scheduled_date para tareas semanales
            
            // 🆕 CAMPOS DE SUBTAREAS VERIFICADOS EN SUPABASE:
            parent_task_id: task.parent_task_id,
            subtask_order: task.subtask_order || 0,
            section_order: task.section_order || 0,
            is_expanded: task.is_expanded || false,
            
            
            addedAt: new Date(task.created_at),
            deadline: task.deadline ? new Date(task.deadline) : (task.due_date ? new Date(task.due_date) : null),
            amount: task.amount,
            link: task.link,
            created_at: task.created_at,
            updated_at: task.updated_at,
            attachments: attachments || []
          }
        })
      )


      // ✅ DEDUPLICACIÓN PARA PREVENIR DUPLICADOS EN ARRAY BASE
      const uniqueTasks = mappedTasks.filter((task, index, arr) => 
        arr.findIndex(t => t.id === task.id) === index
      )
      
      setTasks(uniqueTasks)
      setError(null)
      
      // Cargar subtareas para todas las tareas principales - temporalmente deshabilitado por error
      // const subtasksPromises = mappedTasks.map(task => loadSubtasks(task.id))
      // await Promise.all(subtasksPromises)
      
      // Log successful load only once
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Tasks loaded:', mappedTasks.length)
        const weeklyTasks = uniqueTasks.filter(t => t.page === 'weekly')
        console.log('📅 Weekly tasks:', weeklyTasks.length, weeklyTasks.map(t => ({
          id: t.id,
          title: t.title,
          page: t.page,
          scheduled_date: t.scheduled_date
        })))
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
    // Prevenir llamadas duplicadas
    if (addTask.isRunning) {
      console.log('⚠️ addTask ya está ejecutándose, ignorando duplicado')
      return { data: null, error: 'Already running' }
    }
    addTask.isRunning = true

    if (!user?.id) {
      console.error('❌ addTask: Usuario no autenticado')
      addTask.isRunning = false
      return { error: 'Usuario no autenticado' }
    }

    // Timeout para prevenir requests colgados
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    })

    // Optimistic update - añadir inmediatamente a la UI
    const optimisticTask = {
      id: 'temp-' + Date.now(),
      title: taskData.title,
      description: taskData.notes || taskData.description || '',
      notes: taskData.notes || taskData.description || '',
      completed: false,
      important: taskData.important || false,
      priority: taskData.priority || 'normal',
      addedAt: new Date(),
      deadline: taskData.deadline || null,
      amount: taskData.amount || null,
      link: taskData.link || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: [],
      parent_task_id: taskData.parent_task_id || null,
      subtask_order: 0,
      section_order: 0,
      is_expanded: false,
      status: taskData.status || 'inbox',
      page: taskData.page || 'daily',
      section: taskData.section || 'inbox_tasks',
      scheduled_date: taskData.scheduled_date || null
    }
    
    setTasks(prev => [optimisticTask, ...prev])

    try {
      // Preparar datos para Supabase - solo campos esenciales para evitar error 400
      const dbData = {
        user_id: user.id,
        title: taskData.title,
        description: taskData.notes || taskData.description || '',
        deadline: taskData.deadline?.toISOString() || null,
        amount: taskData.amount || null,
        link: taskData.link || null,
        is_big_3_today: taskData.important || false,
        completed: false,
        priority: taskData.priority || 'normal',
        status: taskData.status || 'inbox',
        page: taskData.page || 'daily',
        section: taskData.section || 'inbox_tasks',  // Default to inbox_tasks for new tasks
        scheduled_date: taskData.scheduled_date || null  // Importante para tareas semanales
      }
      
      // Solo agregar campos opcionales si están definidos
      if (taskData.parent_task_id) dbData.parent_task_id = taskData.parent_task_id
      
      // 🔍 DEBUG: Log data being sent to Supabase
      console.log('📤 Sending to Supabase:', dbData)

      const { data, error } = await Promise.race([
        supabase.from('tasks').insert(dbData).select().single(),
        timeoutPromise
      ])


      if (error) {
        console.error('Error de Supabase:', error)
        // Rollback optimistic si falla
        setTasks(prev => prev.filter(t => t.id !== optimisticTask.id))
        addTask.isRunning = false
        throw error
      }

      // Reemplazar optimistic con real task
      const newTask = {
        id: data.id,
        title: data.title,
        description: data.description,
        notes: data.description,
        completed: data.completed,
        important: data.is_big_3_today,
        priority: data.priority || 'normal',
        addedAt: new Date(data.created_at),
        deadline: data.deadline ? new Date(data.deadline) : null,
        amount: data.amount,
        link: data.link,
        created_at: data.created_at,
        updated_at: data.updated_at,
        attachments: [],
        
        // Campos opcionales solo si existen
        parent_task_id: data.parent_task_id || null,
        subtask_order: data.subtask_order || 0,
        section_order: data.section_order || 0,
        is_expanded: data.is_expanded || false,
        status: data.status || 'inbox',
        page: data.page || 'daily',
        section: data.section || 'otras_tareas',  // Keep default for new tasks
        scheduled_date: data.scheduled_date || null  // Para tareas semanales
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🆕 Nueva tarea creada:', { id: newTask.id, section: newTask.section })
      }

      // Reemplazar optimistic con real
      setTasks(prev => prev.map(t => 
        t.id === optimisticTask.id ? newTask : t
      ))
      
      addTask.isRunning = false
      return { data: newTask, error: null }
    } catch (err) {
      console.error('Error en addTask:', err)
      // Rollback optimistic si falla
      setTasks(prev => prev.filter(t => t.id !== optimisticTask.id))
      addTask.isRunning = false
      return { data: null, error: err.message }
    }
  }

  // Update task
  const updateTask = async (taskId, updates) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      // FILTRAR solo campos válidos, NO objetos DOM
      const cleanUpdates = {}
      
      // Solo permitir campos primitivos
      const allowedFields = [
        'title', 'description', 'notes', 'completed', 'important', 
        'deadline', 'due_date', 'amount', 'link', 'status', 
        'priority', 'page', 'section', 'scheduled_date', 
        'assigned_day', 'estimated_minutes'
      ]
      
      // Filtrar solo campos permitidos y valores primitivos
      for (const [key, value] of Object.entries(updates || {})) {
        if (allowedFields.includes(key)) {
          // Solo permitir primitivos, null, o Date objects
          if (value === null || value === undefined || 
              typeof value === 'string' || typeof value === 'number' || 
              typeof value === 'boolean' || value instanceof Date) {
            cleanUpdates[key] = value
          }
        }
      }

      // Map component format to database format
      const dbUpdates = {}
      if (cleanUpdates.title !== undefined) dbUpdates.title = cleanUpdates.title
      if (cleanUpdates.description !== undefined) dbUpdates.description = cleanUpdates.description
      if (cleanUpdates.notes !== undefined) dbUpdates.description = cleanUpdates.notes
      if (cleanUpdates.completed !== undefined) dbUpdates.completed = cleanUpdates.completed
      if (cleanUpdates.important !== undefined) dbUpdates.is_big_3_today = cleanUpdates.important
      if (cleanUpdates.deadline !== undefined) dbUpdates.deadline = cleanUpdates.deadline instanceof Date ? cleanUpdates.deadline.toISOString() : cleanUpdates.deadline
      if (cleanUpdates.due_date !== undefined) dbUpdates.deadline = cleanUpdates.due_date
      if (cleanUpdates.amount !== undefined) dbUpdates.amount = cleanUpdates.amount
      if (cleanUpdates.link !== undefined) dbUpdates.link = cleanUpdates.link
      if (cleanUpdates.status !== undefined) dbUpdates.status = cleanUpdates.status
      if (cleanUpdates.priority !== undefined) dbUpdates.priority = cleanUpdates.priority
      if (cleanUpdates.page !== undefined) dbUpdates.page = cleanUpdates.page
      if (cleanUpdates.section !== undefined) dbUpdates.section = cleanUpdates.section
      if (cleanUpdates.scheduled_date !== undefined) dbUpdates.scheduled_date = cleanUpdates.scheduled_date
      if (cleanUpdates.assigned_day !== undefined) dbUpdates.assigned_day = cleanUpdates.assigned_day

      if (process.env.NODE_ENV === 'development') {
        console.log('📝 UpdateTask:', taskId, Object.keys(dbUpdates))
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()

      if (error) {
        // Log detailed error information
        console.error('Error en updateTask:', error.message)
        throw error
      }

      // Si hay múltiples resultados, tomar el primero
      const updatedTask = Array.isArray(data) ? data[0] : data

      // Update local state - con verificaciones seguras
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? {
              ...task,
              ...cleanUpdates,
              deadline: updatedTask?.deadline ? new Date(updatedTask.deadline) : task.deadline,
              updated_at: updatedTask?.updated_at || task.updated_at,
              scheduled_date: updatedTask?.scheduled_date !== undefined ? updatedTask.scheduled_date : task.scheduled_date
            }
          : task
      ))

      return { data: updatedTask || cleanUpdates, error: null }
    } catch (err) {
      console.error('Error en updateTask:', err.message || err)
      return { data: null, error: err.message || err.toString() || 'Error desconocido en updateTask' }
    }
  }

  // Toggle completion
  const toggleComplete = async (taskId) => {
    // Buscar primero en tareas principales
    let task = tasks.find(t => t.id === taskId)
    
    // Si no se encuentra, buscar en cache de subtareas
    if (!task) {
      for (const parentId of Object.keys(subtasksCache)) {
        const subtask = subtasksCache[parentId].find(st => st.id === taskId)
        if (subtask) {
          task = subtask
          break
        }
      }
    }
    
    if (!task) {
      return { error: 'Tarea no encontrada' }
    }

    // 1. Optimistic update - cambio inmediato
    const newCompletedState = !task.completed
    const newSection = task.section === 'completadas' ? 'otras_tareas' : 'completadas'
    
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, completed: newCompletedState, section: newSection, justCompleted: newCompletedState } 
        : t
    ))

    // Actualizar cache de subtareas si es una subtarea
    setSubtasksCache(prev => {
      const updatedCache = { ...prev }
      
      // Buscar en qué parent está esta subtarea y actualizar
      Object.keys(updatedCache).forEach(parentId => {
        updatedCache[parentId] = updatedCache[parentId].map(subtask =>
          subtask.id === taskId 
            ? { ...subtask, completed: newCompletedState }
            : subtask
        )
      })
      
      return updatedCache
    })

    try {
      // 2. Actualizar en base de datos - SOLO section
      const result = await updateTask(taskId, { 
        section: newSection,
        completed: newCompletedState
      })
      
      if (result.error) {
        // Revertir si hay error
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...task } : t
        ))
        // Revertir cache de subtareas también
        setSubtasksCache(prev => {
          const updatedCache = { ...prev }
          Object.keys(updatedCache).forEach(parentId => {
            updatedCache[parentId] = updatedCache[parentId].map(subtask =>
              subtask.id === taskId 
                ? { ...subtask, completed: task.completed }
                : subtask
            )
          })
          return updatedCache
        })
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
      // Revertir cache de subtareas también
      setSubtasksCache(prev => {
        const updatedCache = { ...prev }
        Object.keys(updatedCache).forEach(parentId => {
          updatedCache[parentId] = updatedCache[parentId].map(subtask =>
            subtask.id === taskId 
              ? { ...subtask, completed: task.completed }
              : subtask
          )
        })
        return updatedCache
      })
      return { error: error.message }
    }
  }

  // Toggle Big 3 (important)
  const toggleBig3 = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return { error: 'Tarea no encontrada' }

    // Check Big 3 limit
    const currentBig3Count = tasks.filter(t => t.section === 'big_three' && t.page === 'daily').length
    
    if (task.section !== 'big_three' && currentBig3Count >= 3) {
      return { error: 'Ya tienes 3 tareas Big 3. Completa una antes de añadir otra.' }
    }

    const newSection = task.section === 'big_three' ? 'otras_tareas' : 'big_three'
    return await updateTask(taskId, { section: newSection })
  }

  // Toggle waiting status
  const toggleWaitingStatus = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return { error: 'Tarea no encontrada' }

    const newSection = task.section === 'en_espera' ? 'otras_tareas' : 'en_espera'
    
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, section: newSection } : t
    ))
    
    try {
      const result = await updateTask(taskId, { section: newSection })
      
      if (result.error) {
        // Revertir si hay error
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, section: task.section } : t
        ))
      }
      
      return result
    } catch (error) {
      console.error('Error en toggleWaitingStatus:', error)
      // Revertir cambio
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, section: task.section } : t
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

  // 🆕 FUNCIONES DE SUBTAREAS
  const addSubtask = async (parentTaskId, subtaskData) => {
    // Calcular siguiente orden de subtarea
    const existingSubtasks = tasks.filter(t => t.parent_task_id === parentTaskId)
    const nextOrder = existingSubtasks.length + 1

    const taskDataToCreate = {
      ...subtaskData,
      parent_task_id: parentTaskId,
      subtask_order: nextOrder,
      completed: false
    }
    
    const result = await addTask(taskDataToCreate)
    
    return result
  }

  // Estado para cache de subtareas
  const [subtasksCache, setSubtasksCache] = useState({})

  // Versión síncrona para TaskCard (usa cache local)
  const getSubtasks = (parentTaskId) => {
    return subtasksCache[parentTaskId] || []
  }

  // Versión async para cargar subtareas desde BD
  const loadSubtasks = async (taskId) => {
    if (!taskId) {
      console.log('loadSubtasks: No taskId provided')
      return []
    }

    // Validar que taskId es válido
    if (taskId === 'undefined' || typeof taskId !== 'string') {
      console.warn('loadSubtasks: Invalid taskId provided:', taskId)
      return []
    }

    if (!user?.id) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_task_id', taskId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase error loading subtasks:', error.message || 'Unknown error')
        return []
      }
      
      // Actualizar cache si hay datos
      if (data && data.length > 0) {
        setSubtasksCache(prev => ({
          ...prev,
          [taskId]: data
        }))
      }
      
      return data || []
      
    } catch (err) {
      console.error('Unexpected error in loadSubtasks:', err.message || err)
      return []
    }
  }

  const toggleTaskExpanded = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return { error: 'Tarea no encontrada' }
    
    return await updateTask(taskId, { is_expanded: !task.is_expanded })
  }

  const deleteSubtask = async (subtaskId) => {
    try {
      // ✅ ACTUALIZAR CACHE ANTES del DELETE (optimistic update)
      const originalCache = { ...subtasksCache }
      
      setSubtasksCache(prevCache => {
        const newCache = { ...prevCache }
        
        // Remover subtarea de TODOS los parents en cache
        Object.keys(newCache).forEach(parentId => {
          newCache[parentId] = newCache[parentId].filter(sub => sub.id !== subtaskId)
        })
        
        return newCache
      })
      
      // Ejecutar delete en BD
      const result = await deleteTask(subtaskId)
      
      if (result?.error) {
        // ✅ REVERTIR CACHE si falla el delete
        console.error('Error eliminando subtarea, revirtiendo cache:', result.error)
        setSubtasksCache(originalCache)
        throw new Error(result.error)
      }
      
      return result
    } catch (error) {
      console.error('❌ Error en deleteSubtask hook:', error)
      throw error
    }
  }

  const updateTaskOrder = async (taskId, newOrder) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ section_order: newOrder })
        .eq('id', taskId)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // ✅ NO RECARGAR - UI se actualiza optimísticamente en TaskItApp
      return { error: null }
    } catch (err) {
      console.error('Error updating task order:', err)
      return { error: err.message }
    }
  }

  // ✅ NUEVA FUNCIÓN: Reordenar subtareas
  const updateSubtaskOrder = async (parentTaskId, reorderedSubtasks) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }
    
    try {
      // ✅ OPTIMISTIC UPDATE - actualizar cache inmediatamente
      setSubtasksCache(prev => ({
        ...prev,
        [parentTaskId]: reorderedSubtasks
      }))
      
      // ✅ BATCH UPDATE - actualizar orden de todas las subtareas
      const updates = reorderedSubtasks.map((subtask, index) => 
        supabase
          .from('tasks')
          .update({ subtask_order: index + 1 })
          .eq('id', subtask.id)
          .eq('user_id', user.id)
      )
      
      const results = await Promise.all(updates)
      
      // Verificar si alguna actualización falló
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw new Error(`Error actualizando ${errors.length} subtareas`)
      }
      
      return { error: null }
    } catch (err) {
      console.error('Error updating subtask order:', err)
      
      // ✅ REVERTIR CACHE si falla
      if (loadSubtasks) {
        await loadSubtasks(parentTaskId)
      }
      
      return { error: err.message }
    }
  }

  const moveTaskBetweenSections = async (taskId, sourceSection, targetSection, targetTaskId = null) => {
    try {
      // 1. Obtener la tarea a mover
      const taskToMove = tasks.find(t => t.id === taskId)
      if (!taskToMove) return { error: 'Tarea no encontrada' }
      
      // 2. Calcular nuevo section_order en la sección destino
      const targetSectionTasks = tasks.filter(t => t.section === targetSection && !t.completed)
      let newOrder = targetSectionTasks.length + 1 // Por defecto al final
      
      // Si hay targetTaskId, calcular posición específica
      if (targetTaskId) {
        const targetTask = targetSectionTasks.find(t => t.id === targetTaskId)
        if (targetTask) {
          newOrder = targetTask.section_order
        }
      }
      
      // ✅ ACTUALIZACIÓN OPTIMISTA INMEDIATA
      const updatedTask = {
        ...taskToMove,
        section: targetSection,
        section_order: newOrder,
        updated_at: new Date().toISOString()
      }
      
      // Actualizar estado local inmediatamente
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? updatedTask : task
      )
      setTasks(updatedTasks)
      
      // 3. Actualizar en Supabase en background
      const { error } = await supabase
        .from('tasks')
        .update({ 
          section: targetSection,
          section_order: newOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Error moviendo tarea:', error)
        // Revertir cambio optimista si hay error
        await loadTasks()
        return { error: error.message }
      }
      
      return { success: true }
      
    } catch (error) {
      console.error('Error inesperado:', error)
      // Revertir cambio optimista si hay error crítico
      await loadTasks()
      return { error: error.message }
    }
  }

  // 🆕 BULK OPERATIONS
  const bulkUpdateStatus = async (taskIds, newStatus) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }
    if (!taskIds || taskIds.length === 0) return { error: 'No hay tareas seleccionadas' }

    // 1. Optimistic update
    const originalTasks = [...tasks]
    setTasks(prev => prev.map(task => 
      taskIds.includes(task.id) 
        ? { ...task, status: newStatus }
        : task
    ))

    try {
      // 2. Batch update to Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .in('id', taskIds)
        .eq('user_id', user.id)

      if (error) throw error
      return { error: null }
    } catch (err) {
      // Rollback on error
      setTasks(originalTasks)
      console.error('Error bulk updating status:', err)
      return { error: err.message }
    }
  }

  const bulkToggleImportant = async (taskIds, isImportant) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }
    if (!taskIds || taskIds.length === 0) return { error: 'No hay tareas seleccionadas' }

    // Check Big 3 limit if setting to important
    if (isImportant) {
      const currentBig3Count = tasks.filter(t => t.important && !t.completed).length
      const newBig3Count = taskIds.filter(id => {
        const task = tasks.find(t => t.id === id)
        return task && !task.important && !task.completed
      }).length
      
      if (currentBig3Count + newBig3Count > 3) {
        return { error: `Solo puedes tener 3 tareas Big 3. Actualmente tienes ${currentBig3Count}.` }
      }
    }

    // 1. Optimistic update
    const originalTasks = [...tasks]
    setTasks(prev => prev.map(task => 
      taskIds.includes(task.id) 
        ? { ...task, important: isImportant }
        : task
    ))

    try {
      // 2. Batch update to Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ is_big_3_today: isImportant })
        .in('id', taskIds)
        .eq('user_id', user.id)

      if (error) throw error
      return { error: null }
    } catch (err) {
      // Rollback on error
      setTasks(originalTasks)
      console.error('Error bulk updating important:', err)
      return { error: err.message }
    }
  }

  const bulkDelete = async (taskIds) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }
    if (!taskIds || taskIds.length === 0) return { error: 'No hay tareas seleccionadas' }

    // 1. Optimistic update
    const originalTasks = [...tasks]
    setTasks(prev => prev.filter(task => !taskIds.includes(task.id)))

    try {
      // 2. Delete attachments for all tasks first
      for (const taskId of taskIds) {
        try {
          await attachmentService.deleteTaskAttachments(taskId)
        } catch (err) {
          console.warn(`Error deleting attachments for task ${taskId}:`, err)
        }
      }

      // 3. Batch delete from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', taskIds)
        .eq('user_id', user.id)

      if (error) throw error
      return { error: null }
    } catch (err) {
      // Rollback on error
      setTasks(originalTasks)
      console.error('Error bulk deleting tasks:', err)
      return { error: err.message }
    }
  }

  // Set Big 3 tasks (for task selector)
  const setBig3Tasks = async (taskIds) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      // First, remove Big 3 from all tasks using updateTask for consistency
      const currentBig3Tasks = tasks.filter(t => t.important)
      for (const task of currentBig3Tasks) {
        await updateTask(task.id, { important: false })
      }

      // Then, set Big 3 for selected tasks using updateTask
      for (const taskId of taskIds) {
        await updateTask(taskId, { important: true })
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
            // ✅ PERFORMANCE FIX: Handle real-time updates without full reload
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Real-time task change:', payload.eventType, payload.new?.id)
            }
            
            if (payload.eventType === 'INSERT' && payload.new) {
              // Add new task to state without full reload
              const newTask = {
                id: payload.new.id,
                title: payload.new.title,
                text: payload.new.title,
                description: payload.new.description,
                notes: payload.new.description,
                completed: payload.new.completed,
                important: payload.new.is_big_3_today,
                status: payload.new.status || 'inbox',
                priority: payload.new.priority || 'normal',
                page: payload.new.page || 'daily',
                section: payload.new.section,
                scheduled_date: payload.new.scheduled_date,
                parent_task_id: payload.new.parent_task_id,
                subtask_order: payload.new.subtask_order || 0,
                section_order: payload.new.section_order || 0,
                is_expanded: payload.new.is_expanded || false,
                addedAt: new Date(payload.new.created_at),
                deadline: payload.new.deadline ? new Date(payload.new.deadline) : null,
                amount: payload.new.amount,
                link: payload.new.link,
                created_at: payload.new.created_at,
                updated_at: payload.new.updated_at,
                attachments: []
              }
              
              setTasks(prev => {
                // Check if task already exists (prevent duplicates)
                if (prev.find(t => t.id === newTask.id)) return prev
                return [newTask, ...prev]
              })
            } 
            else if (payload.eventType === 'UPDATE' && payload.new) {
              // Update existing task in state
              setTasks(prev => prev.map(task => 
                task.id === payload.new.id ? {
                  ...task,
                  title: payload.new.title,
                  text: payload.new.title,
                  description: payload.new.description,
                  notes: payload.new.description,
                  completed: payload.new.completed,
                  important: payload.new.is_big_3_today,
                  status: payload.new.status || 'inbox',
                  priority: payload.new.priority || 'normal',
                  page: payload.new.page || 'daily',
                  section: payload.new.section,
                  scheduled_date: payload.new.scheduled_date,
                  section_order: payload.new.section_order || task.section_order,
                  updated_at: payload.new.updated_at
                } : task
              ))
            }
            else if (payload.eventType === 'DELETE' && payload.old) {
              // Remove deleted task from state
              setTasks(prev => prev.filter(task => task.id !== payload.old.id))
            }
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
    if (!taskId || taskId === 'undefined' || typeof taskId !== 'string') {
      console.warn('reloadTaskAttachments: Invalid taskId provided:', taskId)
      return { error: 'Invalid taskId' }
    }

    try {
      const result = await attachmentService.getTaskAttachments(taskId)
      
      if (result.error) {
        console.warn('Error getting attachments for task', taskId, ':', result.error)
        return { error: result.error }
      }
      
      const attachments = result.data || []
      
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, attachments }
          : task
      ))

      return { error: null }
    } catch (err) {
      console.error('Unexpected error reloading task attachments:', err)
      return { error: err.message }
    }
  }

  // Toggle urgent
  const toggleUrgent = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return { error: 'Tarea no encontrada' }

    const newSection = task.section === 'urgent' ? 'otras_tareas' : 'urgent'
    
    return await updateTask(taskId, { section: newSection })
  }

  // 🎯 FILTROS ULTRA SIMPLES - SOLO page/section
  const urgentTasks = tasks
    .filter(task => task.page === 'daily' && task.section === 'urgent')
    .filter((task, index, arr) => arr.findIndex(t => t.id === task.id) === index)
  
  
  // ✅ FILTROS CON DEDUPLICACIÓN PARA PREVENIR KEYS DUPLICADAS
  const importantTasks = tasks
    .filter(task => task.page === 'daily' && task.section === 'big_three')
    .filter((task, index, arr) => arr.findIndex(t => t.id === task.id) === index)
  
  const waitingTasks = tasks
    .filter(task => task.page === 'daily' && task.section === 'en_espera')
    .filter((task, index, arr) => arr.findIndex(t => t.id === task.id) === index)
  
  const routineTasks = tasks
    .filter(task => task.page === 'daily' && task.section === 'otras_tareas')
    .filter((task, index, arr) => arr.findIndex(t => t.id === task.id) === index)
  
  const completedTasks = tasks
    .filter(task => task.page === 'daily' && task.section === 'completadas')
    .filter((task, index, arr) => arr.findIndex(t => t.id === task.id) === index)

  
  const big3Count = importantTasks.length

  return {
    tasks,
    setTasks, // ✅ EXPONER setTasks PARA ACTUALIZACIONES OPTIMISTAS
    loading,
    error,
    importantTasks,
    routineTasks,
    waitingTasks,
    urgentTasks,
    completedTasks,
    big3Count,
    addTask,
    updateTask,
    toggleComplete,
    toggleBig3,
    toggleWaitingStatus,
    toggleUrgent,
    deleteTask,
    setBig3Tasks,
    loadTasks,
    addAttachment,
    deleteAttachment,
    reloadTaskAttachments,
    
    // 🆕 NUEVAS FUNCIONES DE SUBTAREAS
    addSubtask,
    getSubtasks,
    loadSubtasks,
    toggleTaskExpanded,
    deleteSubtask,
    updateSubtaskOrder,
    
    // 🆕 FUNCIÓN DE DRAG AND DROP
    updateTaskOrder,
    moveTaskBetweenSections,
    
    // 🆕 BULK OPERATIONS
    bulkUpdateStatus,
    bulkToggleImportant,
    bulkDelete
  }
}