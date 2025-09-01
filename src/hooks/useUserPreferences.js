import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

const DEFAULT_SECTION_ORDER = [
  { id: 'big_three', name: 'Big 3', icon: 'star', visible: true, order: 0, isCustom: false },
  { id: 'urgent', name: 'Urgente', icon: 'flame', visible: true, order: 1, isCustom: false },
  { id: 'en_espera', name: 'En Espera', icon: 'clock', visible: true, order: 2, isCustom: false },
  { id: 'otras_tareas', name: 'Otras Tareas', icon: 'folder', visible: true, order: 3, isCustom: false },
  { id: 'rituals', name: 'Daily Rituals', icon: 'zap', visible: true, order: 4, isCustom: false },
  { id: 'completadas', name: 'Completadas', icon: 'check-circle', visible: true, order: 5, isCustom: false }
]

// Configuración de permisos por sección
const SECTION_PERMISSIONS = {
  'big_three': { canEdit: false, canDelete: false, canReorder: true },
  'rituals': { canEdit: false, canDelete: false, canReorder: true },
  'urgent': { canEdit: false, canDelete: false, canReorder: true },
  'en_espera': { canEdit: false, canDelete: false, canReorder: true },
  'otras_tareas': { canEdit: false, canDelete: false, canReorder: true },
  'completadas': { canEdit: false, canDelete: false, canReorder: true }
}

export const useUserPreferences = () => {
  const { user, authState } = useAuth()
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTION_ORDER)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load preferences when user is authenticated
  useEffect(() => {
    if (authState === 'authenticated' && user?.id) {
      loadPreferences()
    } else {
      setSectionOrder(DEFAULT_SECTION_ORDER)
      setLoading(false)
    }
  }, [authState, user?.id])

  const loadPreferences = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('section_preferences')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Usuario no existe, crear perfil
          const { error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              section_preferences: JSON.stringify({ order: DEFAULT_SECTION_ORDER })
            })
          
          if (createError) {
            console.error('Error creating profile:', createError)
          } else {
            setSectionOrder(DEFAULT_SECTION_ORDER)
          }
        } else {
          throw error
        }
      } else if (data?.section_preferences) {
        // Parsear JSON si es string
        const preferences = typeof data.section_preferences === 'string' 
          ? JSON.parse(data.section_preferences)
          : data.section_preferences
          
        if (preferences?.order) {
          setSectionOrder(preferences.order)
        } else {
          setSectionOrder(DEFAULT_SECTION_ORDER)
        }
      } else {
        setSectionOrder(DEFAULT_SECTION_ORDER)
      }

      setError(null)
    } catch (err) {
      console.error('Error loading preferences:', err)
      setSectionOrder(DEFAULT_SECTION_ORDER)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getLocalStorageBackup = () => {
    try {
      const backup = localStorage.getItem(`userPrefs_${user?.id}`)
      return backup ? JSON.parse(backup) : null
    } catch (err) {
      return null
    }
  }

  const saveLocalStorageBackup = (preferences) => {
    try {
      localStorage.setItem(`userPrefs_${user?.id}`, JSON.stringify(preferences))
    } catch (err) {
      // Silent fail for localStorage
    }
  }

  const updateSectionOrder = async (newOrder) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    const originalOrder = [...sectionOrder]
    setSectionOrder(newOrder)

    try {
      if (!Array.isArray(newOrder) || newOrder.length === 0) {
        throw new Error('newOrder debe ser un array válido')
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: user.id,
            section_preferences: JSON.stringify({ order: newOrder })
          },
          { 
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        )
        .select()

      if (error) {
        throw error
      }

      saveLocalStorageBackup(newOrder)
      return { error: null }
    } catch (err) {
      console.error('Error updating section order:', err)
      setSectionOrder(originalOrder)
      return { error: err?.message || 'Error actualizando orden de secciones' }
    }
  }

  const toggleSectionVisibility = async (sectionId) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    const newOrder = sectionOrder.map(section =>
      section.id === sectionId
        ? { ...section, visible: !section.visible }
        : section
    )

    return await updateSectionOrder(newOrder)
  }

  const moveSectionUp = async (sectionId) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    const currentIndex = sectionOrder.findIndex(s => s.id === sectionId)
    if (currentIndex <= 0) return { error: 'No se puede mover más arriba' }

    const newOrder = [...sectionOrder]
    // Swap with previous section
    const temp = newOrder[currentIndex]
    newOrder[currentIndex] = newOrder[currentIndex - 1]
    newOrder[currentIndex - 1] = temp

    // Update order values
    newOrder.forEach((section, index) => {
      section.order = index
    })

    return await updateSectionOrder(newOrder)
  }

  const moveSectionDown = async (sectionId) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    const currentIndex = sectionOrder.findIndex(s => s.id === sectionId)
    if (currentIndex >= sectionOrder.length - 1) return { error: 'No se puede mover más abajo' }

    const newOrder = [...sectionOrder]
    // Swap with next section
    const temp = newOrder[currentIndex]
    newOrder[currentIndex] = newOrder[currentIndex + 1]
    newOrder[currentIndex + 1] = temp

    // Update order values
    newOrder.forEach((section, index) => {
      section.order = index
    })

    return await updateSectionOrder(newOrder)
  }

  const resetToDefault = async () => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    return await updateSectionOrder(DEFAULT_SECTION_ORDER)
  }

  // 🚨 TEMPORAL - RESET COMPLETO SIN ACTIVITIES
  const forceResetNoActivities = async () => {
    if (!user?.id) return { error: 'Usuario no autenticado' }
    
    console.log('🚨 FORCE RESET - Eliminando preferencias y recreando SIN activities')
    
    // Limpiar localStorage
    localStorage.removeItem(`userPrefs_${user.id}`)
    
    // Eliminar preferencias actuales de Supabase
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id)
    
    if (deleteError) {
      console.error('Error eliminando preferencias:', deleteError)
    }
    
    // Aplicar DEFAULT_SECTION_ORDER que NO incluye activities
    setSectionOrder(DEFAULT_SECTION_ORDER)
    return await updateSectionOrder(DEFAULT_SECTION_ORDER)
  }

  // Crear nueva sección personalizada
  const createCustomSection = async (customSection) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      // Validar input
      if (!customSection.name || !customSection.name.trim()) {
        return { error: 'El nombre de la sección es requerido' }
      }

      // Generar ID único para la sección
      const sectionId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newSection = {
        id: sectionId,
        name: customSection.name.trim(),
        icon: customSection.icon || '📋',
        visible: true,
        order: sectionOrder.length, // Añadir al final
        isCustom: true, // Marcar como personalizada
        filterType: customSection.filterType || 'manual', // 'manual', 'priority', 'tag', 'date'
        filterValue: customSection.filterValue || null
      }

      const newOrder = [...sectionOrder, newSection]
      return await updateSectionOrder(newOrder)
    } catch (err) {
      console.error('Error creating custom section:', err)
      return { error: err.message }
    }
  }

  // Editar sección existente
  const editSection = async (sectionId, updates) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      const newOrder = sectionOrder.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates }
          : section
      )

      return await updateSectionOrder(newOrder)
    } catch (err) {
      console.error('Error editing section:', err)
      return { error: err.message }
    }
  }

  // Eliminar sección personalizada
  const deleteCustomSection = async (sectionId) => {
    if (!user?.id) return { error: 'Usuario no autenticado' }

    try {
      const section = sectionOrder.find(s => s.id === sectionId)
      if (!section?.isCustom) {
        return { error: 'Solo se pueden eliminar secciones personalizadas' }
      }

      const newOrder = sectionOrder
        .filter(section => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index }))

      return await updateSectionOrder(newOrder)
    } catch (err) {
      console.error('Error deleting custom section:', err)
      return { error: err.message }
    }
  }

  // Get visible sections sorted by order
  const visibleSections = sectionOrder
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order)

  // 🚨 TEMPORAL - FORZAR RESET COMPLETO PARA ACTUALIZAR IDs Y REMOVER ACTIVITIES
  useEffect(() => {
    if (user?.id && !loading && sectionOrder.length > 0) {
      // Verificar si hay IDs obsoletos o activities section
      const hasOldIds = sectionOrder.some(s => 
        s.id === 'big3' || s.id === 'waiting' || s.id === 'routine' || s.id === 'completed' || s.id === 'activities'
      )
      
      if (hasOldIds) {
        console.log('🚨 DETECTADOS IDs OBSOLETOS O ACTIVITIES - FORZANDO RESET COMPLETO')
        console.log('IDs actuales:', sectionOrder.map(s => s.id))
        forceResetNoActivities()
        return
      }
      
    }
  }, [user?.id, loading, sectionOrder.length])

  return {
    sectionOrder,
    visibleSections,
    loading,
    error,
    updateSectionOrder,
    toggleSectionVisibility,
    moveSectionUp,
    moveSectionDown,
    resetToDefault,
    loadPreferences,
    createCustomSection,
    editSection,
    deleteCustomSection,
    SECTION_PERMISSIONS,
    // 🚨 TEMPORAL:
    forceResetNoActivities
  }
}