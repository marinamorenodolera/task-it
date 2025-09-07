/**
 * Custom Sections Utility
 * Manejo seguro de secciones dinámicas SIN afectar las secciones existentes
 */

// 🛡️ FEATURE FLAG - Cambiar a false para rollback inmediato
export const ENABLE_CUSTOM_SECTIONS = true

// 🔒 SECCIONES DEL SISTEMA - NUNCA MODIFICAR
export const DEFAULT_SECTIONS = [
  {
    id: 'monthly',
    name: 'Monthly',
    icon: 'CalendarDays',
    color: 'purple',
    system: true,
    displayOrder: 1
  },
  {
    id: 'shopping', 
    name: 'Shopping',
    icon: 'ShoppingCart',
    color: 'green',
    system: true,
    displayOrder: 2
  },
  {
    id: 'devoluciones',
    name: 'Devoluciones', 
    icon: 'RotateCcw',
    color: 'orange',
    system: true,
    displayOrder: 3
  }
]

// 📦 STORAGE KEY
const STORAGE_KEY = 'inbox_custom_sections'

/**
 * Obtener secciones custom del localStorage
 */
export const getCustomSections = () => {
  if (!ENABLE_CUSTOM_SECTIONS) return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading custom sections:', error)
    return []
  }
}

/**
 * Guardar secciones custom en localStorage
 */
export const saveCustomSections = (sections) => {
  if (!ENABLE_CUSTOM_SECTIONS) return false
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections))
    return true
  } catch (error) {
    console.error('Error saving custom sections:', error)
    return false
  }
}

/**
 * Obtener TODAS las secciones (sistema + custom)
 */
export const getAllSections = () => {
  return [...DEFAULT_SECTIONS, ...getCustomSections()]
}

/**
 * Crear nueva sección custom
 */
export const createCustomSection = (name, icon = 'Folder', color = 'gray') => {
  if (!ENABLE_CUSTOM_SECTIONS) return null
  
  // Validar nombre
  if (!name?.trim()) return null
  
  // Generar ID único
  const id = `custom_${Date.now()}_${name.toLowerCase().replace(/\s+/g, '_')}`
  
  // Verificar que no existe
  const existing = getAllSections()
  if (existing.find(s => s.id === id || s.name.toLowerCase() === name.toLowerCase())) {
    return null
  }
  
  const newSection = {
    id,
    name: name.trim(),
    icon,
    color,
    system: false,
    displayOrder: existing.length + 1,
    createdAt: new Date().toISOString()
  }
  
  // Guardar
  const customSections = getCustomSections()
  customSections.push(newSection)
  
  if (saveCustomSections(customSections)) {
    return newSection
  }
  
  return null
}

/**
 * Eliminar sección custom (SOLO custom, nunca sistema)
 */
export const deleteCustomSection = (sectionId) => {
  if (!ENABLE_CUSTOM_SECTIONS) return false
  
  // PROTECCIÓN: Nunca eliminar secciones del sistema
  if (DEFAULT_SECTIONS.find(s => s.id === sectionId)) {
    console.error('Cannot delete system section:', sectionId)
    return false
  }
  
  const customSections = getCustomSections()
  const filtered = customSections.filter(s => s.id !== sectionId)
  
  return saveCustomSections(filtered)
}

/**
 * Verificar si una sección es válida
 */
export const isValidSection = (sectionId) => {
  return getAllSections().find(s => s.id === sectionId) !== undefined
}

/**
 * Obtener información de una sección
 */
export const getSectionInfo = (sectionId) => {
  return getAllSections().find(s => s.id === sectionId) || null
}

/**
 * Debug: Contar tareas por sección
 */
export const debugSectionCounts = (tasks) => {
  if (process.env.NODE_ENV !== 'development') return
  
  const sections = getAllSections()
  const counts = {}
  
  sections.forEach(section => {
    counts[section.id] = tasks.filter(task => task.section === section.id).length
  })
  
  console.log('🔍 Section task counts:', counts)
  return counts
}