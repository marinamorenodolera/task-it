import React from 'react'
import { CalendarDays, ShoppingCart, RotateCcw, Folder, Star, Clock, Flame, Target, Users, Settings, Heart, Shield } from 'lucide-react'
import SortableTaskCard from '@/components/tasks/SortableTaskCard'

// Mapeo de iconos disponibles
const ICON_MAP = {
  CalendarDays,
  ShoppingCart, 
  RotateCcw,
  Folder,
  Star,
  Clock,
  Flame,
  Target,
  Users,
  Settings,
  Heart,
  Shield
}

// Mapeo de colores disponibles
const COLOR_MAP = {
  purple: 'text-purple-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  blue: 'text-blue-500',
  red: 'text-red-500',
  yellow: 'text-yellow-500',
  pink: 'text-pink-500',
  indigo: 'text-indigo-500',
  gray: 'text-gray-500'
}

/**
 * Componente para renderizar secciones dinámicas
 * Mantiene el MISMO patrón que las secciones existentes
 */
const DynamicSection = ({ 
  section, 
  tasks, 
  selectionMode = false, 
  selectedTasks = [], 
  onTaskSelection, 
  onTaskClick, 
  onComplete, 
  getSubtasks = () => [] 
}: {
  section: any,
  tasks: any[],
  selectionMode?: boolean,
  selectedTasks?: string[],
  onTaskSelection?: (taskId: string) => void,
  onTaskClick?: (task: any) => void,
  onComplete?: (taskId: string) => void,
  getSubtasks?: () => any[]
}) => {
  // Obtener icono
  const IconComponent = (ICON_MAP as any)[section.icon] || Folder
  const iconColor = (COLOR_MAP as any)[section.color] || COLOR_MAP.gray
  
  // Contar tareas
  const taskCount = tasks?.length || 0
  
  return (
    <div>
      {/* Header - MISMO formato que secciones existentes */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <IconComponent size={20} className={iconColor} />
        {section.name} ({taskCount})
      </h2>
      
      {/* Divider - MISMO que secciones existentes */}
      <div className="border-b border-gray-200/30 mx-0 my-3"></div>
      
      {/* Content - MISMO patrón que secciones existentes */}
      {taskCount === 0 ? (
        <div></div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <SortableTaskCard
              key={`${section.id}-${task.id}`}
              task={task}
              sectionId={section.id}
              onClick={selectionMode ? () => onTaskSelection?.(task.id) : () => onTaskClick?.(task)}
              onComplete={onComplete}
              expandedTasks={[]}
              onToggleExpanded={() => {}}
              onToggleTaskComplete={onComplete}
              getSubtasks={getSubtasks}
              selectionMode={selectionMode}
              isSelected={selectedTasks.includes(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DynamicSection