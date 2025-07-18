// Task-it Task Types
export type TaskPriority = 'urgent' | 'important' | 'nice' | 'delegate' | 'big3' | 'sport'
export type TaskStatus = 'pending' | 'completed' | 'archived'
export type TaskSection = 'inbox' | 'big3_daily' | 'daily_tasks' | 'ritual' | 'sport' | 'done'
export type EnergyLevel = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  user_id: string
  
  // Required fields
  title: string
  description?: string
  
  // Organization and status
  status: TaskStatus
  section: TaskSection
  
  // Daily prioritization
  daily_priority?: TaskPriority
  priority_order: number
  
  // Weekly review categorization
  weekly_category?: 'urgent' | 'important' | 'nice' | 'delegate'
  weekly_priority: number
  
  // Projects and categorization
  project_id?: string
  category?: string
  
  // Timing and scheduling
  due_date?: string
  scheduled_date?: string
  scheduled_time?: string
  completed_at?: string
  
  // Calendar integration
  is_calendar_event: boolean
  calendar_event_id?: string
  event_start_time?: string
  event_end_time?: string
  
  // Recurrence (for rituals)
  is_recurring: boolean
  recurrence_pattern?: RecurrencePattern
  parent_recurring_task_id?: string
  
  // Additional fields
  energy_level?: EnergyLevel
  estimated_duration?: number
  actual_duration?: number
  notes?: string
  links?: string[]
  custom_fields?: Record<string, any>
  
  // Display configuration
  show_energy: boolean
  show_duration: boolean
  show_project: boolean
  show_deadline: boolean
  show_notes_preview: boolean
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  days_of_week?: number[]
  end_date?: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon: string
  is_archived: boolean
  created_at: string
}

// Task-it specific types for forms and UI
export interface TaskFormData {
  title: string
  description?: string
  priority?: TaskPriority
  due_date?: string
  project_id?: string
  energy_level?: EnergyLevel
  estimated_duration?: number
  notes?: string
  links?: string[]
}

export interface TaskCardProps {
  task: Task
  priorityIcon?: string
  showPriority?: boolean
  onComplete?: (taskId: string) => void
  onEdit?: (taskId: string) => void
  onSwipeLeft?: (taskId: string) => void
  onSwipeRight?: (taskId: string) => void
  className?: string
}

export interface QuickCaptureProps {
  onAddTask: (title: string, priority: TaskPriority) => void
  className?: string
}

// Priority configuration for Task-it
export const PRIORITY_CONFIG = {
  urgent: {
    id: 'urgent',
    icon: '🔥',
    label: 'Urgent & Important',
    color: 'text-priority-urgent',
    bgColor: 'bg-priority-urgent/10',
    borderColor: 'border-priority-urgent',
  },
  important: {
    id: 'important',
    icon: '⚡',
    label: 'Important, Not Urgent',
    color: 'text-priority-important',
    bgColor: 'bg-priority-important/10',
    borderColor: 'border-priority-important',
  },
  nice: {
    id: 'nice',
    icon: '📝',
    label: 'Nice to Have',
    color: 'text-priority-nice',
    bgColor: 'bg-priority-nice/10',
    borderColor: 'border-priority-nice',
  },
  delegate: {
    id: 'delegate',
    icon: '🗑️',
    label: 'Delegate',
    color: 'text-priority-delegate',
    bgColor: 'bg-priority-delegate/10',
    borderColor: 'border-priority-delegate',
  },
  big3: {
    id: 'big3',
    icon: '⭐',
    label: 'Big 3',
    color: 'text-priority-big3',
    bgColor: 'bg-priority-big3/10',
    borderColor: 'border-priority-big3',
  },
  sport: {
    id: 'sport',
    icon: '💪',
    label: 'Sport',
    color: 'text-priority-sport',
    bgColor: 'bg-priority-sport/10',
    borderColor: 'border-priority-sport',
  },
} as const