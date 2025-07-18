// Task-it Settings Types
export interface UserSettings {
  user_id: string
  
  // Task behavior
  delete_on_complete: boolean
  enable_gestures: boolean
  
  // Default field visibility in task lists
  default_show_deadline: boolean
  default_show_project: boolean
  default_show_energy: boolean
  default_show_link_indicator: boolean
  default_show_estimated_time: boolean
  default_show_notes_preview: boolean
  
  // Custom fields configuration
  custom_fields: CustomField[]
  
  // App configuration
  theme: 'auto' | 'light' | 'dark'
  daily_reset_time: string
  calendar_sync_enabled: boolean
  notifications_level: 'all' | 'important' | 'none'
  weekly_review_day: string
  
  updated_at: string
}

export interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox'
  options?: string[]
  is_required: boolean
  show_in_list: boolean
  order: number
}

export interface SettingsSection {
  id: string
  title: string
  description?: string
  icon: string
  component: string
}

export interface FieldToggle {
  id: keyof Pick<UserSettings, 
    'default_show_deadline' | 
    'default_show_project' | 
    'default_show_energy' | 
    'default_show_link_indicator' | 
    'default_show_estimated_time' | 
    'default_show_notes_preview'
  >
  label: string
  description: string
  icon: string
}

export interface BehaviorToggle {
  id: keyof Pick<UserSettings, 'delete_on_complete' | 'enable_gestures'>
  label: string
  description: string
  icon: string
}

export interface AppSetting {
  id: keyof Pick<UserSettings, 
    'theme' | 
    'daily_reset_time' | 
    'calendar_sync_enabled' | 
    'notifications_level' | 
    'weekly_review_day'
  >
  label: string
  description: string
  type: 'select' | 'time' | 'toggle'
  options?: { value: string; label: string }[]
  icon: string
}

// Settings configuration for Task-it
export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'fields',
    title: 'Campos Visibles',
    description: 'Configura qué información mostrar en las listas de tareas',
    icon: '👁️',
    component: 'FieldSettings',
  },
  {
    id: 'behavior',
    title: 'Comportamiento',
    description: 'Personaliza cómo funciona la aplicación',
    icon: '⚙️',
    component: 'BehaviorSettings',
  },
  {
    id: 'app',
    title: 'Configuración de App',
    description: 'Ajustes generales y sincronización',
    icon: '📱',
    component: 'AppSettings',
  },
  {
    id: 'custom',
    title: 'Campos Personalizados',
    description: 'Crea campos adicionales para tus tareas',
    icon: '🎛️',
    component: 'CustomFieldSettings',
  },
]

export const FIELD_TOGGLES: FieldToggle[] = [
  {
    id: 'default_show_deadline',
    label: 'Fecha límite',
    description: 'Mostrar fechas de vencimiento en las tareas',
    icon: '📅',
  },
  {
    id: 'default_show_project',
    label: 'Proyecto',
    description: 'Mostrar el proyecto al que pertenece la tarea',
    icon: '📁',
  },
  {
    id: 'default_show_energy',
    label: 'Nivel de energía',
    description: 'Mostrar el nivel de energía requerido',
    icon: '⚡',
  },
  {
    id: 'default_show_link_indicator',
    label: 'Indicador de enlaces',
    description: 'Mostrar si la tarea tiene enlaces adjuntos',
    icon: '🔗',
  },
  {
    id: 'default_show_estimated_time',
    label: 'Tiempo estimado',
    description: 'Mostrar la duración estimada de la tarea',
    icon: '⏱️',
  },
  {
    id: 'default_show_notes_preview',
    label: 'Vista previa de notas',
    description: 'Mostrar un resumen de las notas de la tarea',
    icon: '📝',
  },
]

export const BEHAVIOR_TOGGLES: BehaviorToggle[] = [
  {
    id: 'delete_on_complete',
    label: 'Eliminar al completar',
    description: 'Eliminar automáticamente las tareas cuando se completen',
    icon: '🗑️',
  },
  {
    id: 'enable_gestures',
    label: 'Habilitar gestos',
    description: 'Permitir gestos de deslizar para acciones rápidas',
    icon: '👆',
  },
]

export const APP_SETTINGS: AppSetting[] = [
  {
    id: 'theme',
    label: 'Tema',
    description: 'Apariencia de la aplicación',
    type: 'select',
    icon: '🎨',
    options: [
      { value: 'auto', label: 'Automático' },
      { value: 'light', label: 'Claro' },
      { value: 'dark', label: 'Oscuro' },
    ],
  },
  {
    id: 'daily_reset_time',
    label: 'Hora de reinicio diario',
    description: 'Hora a la que se reinicia el día de trabajo',
    type: 'time',
    icon: '🌅',
  },
  {
    id: 'calendar_sync_enabled',
    label: 'Sincronización de calendario',
    description: 'Sincronizar con el calendario del sistema',
    type: 'toggle',
    icon: '📆',
  },
  {
    id: 'notifications_level',
    label: 'Nivel de notificaciones',
    description: 'Qué notificaciones recibir',
    type: 'select',
    icon: '🔔',
    options: [
      { value: 'all', label: 'Todas' },
      { value: 'important', label: 'Solo importantes' },
      { value: 'none', label: 'Ninguna' },
    ],
  },
  {
    id: 'weekly_review_day',
    label: 'Día de revisión semanal',
    description: 'Día preferido para hacer la revisión semanal',
    type: 'select',
    icon: '📊',
    options: [
      { value: 'sunday', label: 'Domingo' },
      { value: 'monday', label: 'Lunes' },
      { value: 'tuesday', label: 'Martes' },
      { value: 'wednesday', label: 'Miércoles' },
      { value: 'thursday', label: 'Jueves' },
      { value: 'friday', label: 'Viernes' },
      { value: 'saturday', label: 'Sábado' },
    ],
  },
]