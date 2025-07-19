export interface GTDTask {
  id: string
  title: string
  description?: string
  
  // GTD Core Properties
  is_processed: boolean
  is_actionable: boolean
  is_next_action: boolean
  is_two_minute_task: boolean
  
  // Task States
  status: 'inbox' | 'next_action' | 'waiting_for' | 'someday_maybe' | 'reference' | 'completed' | 'archived'
  
  // Context & Organization
  context?: GTDContext
  project_id?: string
  area_id?: string
  
  // Priority & Energy
  priority: 'urgent' | 'important' | 'nice' | 'delegate'
  energy_level: 'low' | 'medium' | 'high'
  
  // Time Management
  due_date?: Date
  scheduled_date?: Date
  estimated_duration?: number // minutes
  actual_duration?: number // minutes
  
  // Waiting For
  waiting_for_person?: string
  waiting_for_reason?: string
  
  // Dates
  created_at: Date
  updated_at: Date
  completed_at?: Date
  
  // User
  user_id: string
}

export interface GTDContext {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  is_location_based: boolean
  location?: string
  user_id: string
  created_at: Date
}

export interface GTDProject {
  id: string
  name: string
  description?: string
  status: 'active' | 'on_hold' | 'completed' | 'cancelled'
  area_id?: string
  next_action_id?: string
  outcome?: string
  color: string
  icon: string
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface GTDArea {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  user_id: string
  created_at: Date
}

export interface GTDProcessingDecision {
  task_id: string
  decision_type: 'actionable' | 'reference' | 'someday_maybe' | 'trash'
  next_action?: string
  delegate_to?: string
  context_id?: string
  project_id?: string
  area_id?: string
  notes?: string
  timestamp: Date
}

export interface GTDWeeklyReview {
  id: string
  user_id: string
  week_start_date: Date
  
  // Review Steps
  step_1_collect_completed: boolean
  step_2_review_calendar_completed: boolean
  step_3_review_lists_completed: boolean
  step_4_review_projects_completed: boolean
  step_5_review_goals_completed: boolean
  
  // Reflection
  what_worked_well: string
  what_could_improve: string
  lessons_learned: string
  
  // Metrics
  tasks_completed: number
  tasks_processed: number
  projects_advanced: number
  
  // Next Week
  big_3_priorities: string[]
  upcoming_commitments: string[]
  
  is_completed: boolean
  completed_at?: Date
  created_at: Date
}

export interface GTDCapture {
  id: string
  content: string
  capture_type: 'text' | 'voice' | 'photo' | 'email'
  capture_source: 'mobile' | 'desktop' | 'web' | 'email'
  is_processed: boolean
  processed_at?: Date
  processed_into_task_id?: string
  user_id: string
  created_at: Date
}

export interface GTDContextFilter {
  context_id?: string
  energy_level?: 'low' | 'medium' | 'high'
  time_available?: number // minutes
  location?: string
  show_waiting_for?: boolean
  show_someday_maybe?: boolean
}

export interface GTDStats {
  total_tasks: number
  inbox_count: number
  next_actions_count: number
  waiting_for_count: number
  someday_maybe_count: number
  completed_this_week: number
  processed_this_week: number
  contexts_active: number
  projects_active: number
  average_processing_time: number // minutes
}

// Default GTD Contexts
export const DEFAULT_GTD_CONTEXTS: Omit<GTDContext, 'id' | 'user_id' | 'created_at'>[] = [
  {
    name: '@calls',
    icon: '📞',
    color: 'blue',
    description: 'Llamadas telefónicas',
    is_location_based: false
  },
  {
    name: '@computer',
    icon: '💻',
    color: 'purple',
    description: 'Tareas que requieren computadora',
    is_location_based: false
  },
  {
    name: '@office',
    icon: '🏢',
    color: 'green',
    description: 'Tareas en la oficina',
    is_location_based: true,
    location: 'office'
  },
  {
    name: '@home',
    icon: '🏠',
    color: 'orange',
    description: 'Tareas en casa',
    is_location_based: true,
    location: 'home'
  },
  {
    name: '@errands',
    icon: '🚗',
    color: 'red',
    description: 'Recados fuera de casa',
    is_location_based: true,
    location: 'out'
  },
  {
    name: '@waiting',
    icon: '⏳',
    color: 'yellow',
    description: 'Esperando respuesta de otros',
    is_location_based: false
  },
  {
    name: '@someday',
    icon: '🌟',
    color: 'pink',
    description: 'Algún día / Tal vez',
    is_location_based: false
  }
]

// GTD Processing Rules
export const GTD_PROCESSING_RULES = {
  TWO_MINUTE_THRESHOLD: 2, // minutes
  QUICK_CAPTURE_BATCH_SIZE: 20,
  WEEKLY_REVIEW_CHECKLIST: [
    'Recopilar todo el material suelto',
    'Procesar todas las bandejas de entrada',
    'Revisar lista de Próximas Acciones',
    'Revisar lista de Esperando',
    'Revisar lista de Proyectos',
    'Revisar lista de Algún día/Tal vez',
    'Revisar próximas acciones por contexto',
    'Revisar calendario de próximas semanas',
    'Revisar objetivos y visión'
  ]
} as const