// Task-it Weekly Review Types
export interface WeeklyReview {
  id: string
  user_id: string
  week_start_date: string
  
  // Review completion status
  is_completed: boolean
  current_step: number
  
  // Reflection (Step 1)
  reflection_what_worked?: string
  reflection_what_improve?: string
  reflection_lessons?: string
  
  // Big 3 Weekly (Step 3)
  weekly_big3_task1_id?: string
  weekly_big3_task2_id?: string
  weekly_big3_task3_id?: string
  
  // Weekly goals (Step 4)
  weekly_goals: WeeklyGoal[]
  
  created_at: string
  updated_at: string
}

export interface WeeklyGoal {
  id: string
  title: string
  description?: string
  category: 'personal' | 'work' | 'health' | 'learning' | 'relationships'
  is_completed: boolean
  priority: number
}

export interface WeeklyReviewStep {
  step: number
  title: string
  description: string
  is_completed: boolean
  component: string
}

export interface WeeklyReviewFormData {
  reflection_what_worked?: string
  reflection_what_improve?: string
  reflection_lessons?: string
  weekly_goals: WeeklyGoal[]
  big3_tasks: string[]
}

// Weekly Review Steps Configuration
export const WEEKLY_REVIEW_STEPS: WeeklyReviewStep[] = [
  {
    step: 1,
    title: 'Reflexión Semanal',
    description: 'Analiza qué funcionó bien y qué puedes mejorar',
    is_completed: false,
    component: 'WeeklyReflection',
  },
  {
    step: 2,
    title: 'Organización de Tareas',
    description: 'Clasifica y prioriza las tareas pendientes',
    is_completed: false,
    component: 'WeeklyOrganization',
  },
  {
    step: 3,
    title: 'Big 3 Semanal',
    description: 'Selecciona las 3 tareas más importantes para la semana',
    is_completed: false,
    component: 'WeeklyBig3',
  },
  {
    step: 4,
    title: 'Objetivos Semanales',
    description: 'Define objetivos específicos para la semana',
    is_completed: false,
    component: 'WeeklyGoals',
  },
]

export const GOAL_CATEGORIES = {
  personal: {
    id: 'personal',
    label: 'Personal',
    icon: '👤',
    color: 'text-brand-primary',
  },
  work: {
    id: 'work',
    label: 'Trabajo',
    icon: '💼',
    color: 'text-brand-secondary',
  },
  health: {
    id: 'health',
    label: 'Salud',
    icon: '🏃‍♂️',
    color: 'text-priority-sport',
  },
  learning: {
    id: 'learning',
    label: 'Aprendizaje',
    icon: '📚',
    color: 'text-brand-accent',
  },
  relationships: {
    id: 'relationships',
    label: 'Relaciones',
    icon: '❤️',
    color: 'text-brand-warning',
  },
} as const