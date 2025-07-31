export const TASK_SECTIONS = [
  {
    id: 'big3',
    name: 'Big 3',
    icon: 'Star',
    color: 'yellow',
    description: 'Tareas más importantes del día',
    filterFunction: (tasks) => tasks.filter(t => t.is_big_3_today && !t.completed),
    toggleFunction: 'toggleBig3',
    buttonText: 'Quitar de Big 3',
    buttonTextInverse: 'Añadir a Big 3',
    priority: 1,
    showInSelector: true,
    showInDetail: true
  },
  {
    id: 'normal',
    name: 'Otras Tareas',
    icon: 'FileText',
    color: 'blue',
    description: 'Tareas regulares del día',
    filterFunction: (tasks) => tasks.filter(t => !t.is_big_3_today && t.status !== 'pending' && t.priority !== 'urgent' && !t.completed),
    toggleFunction: 'moveToNormal',
    buttonText: 'Mover a Otras Tareas',
    buttonTextInverse: null,
    priority: 2,
    showInSelector: true,
    showInDetail: true
  },
  {
    id: 'waiting',
    name: 'En Espera',
    icon: 'Clock',
    color: 'gray',
    description: 'Esperando respuesta externa',
    filterFunction: (tasks) => tasks.filter(t => t.status === 'pending' && !t.completed),
    toggleFunction: 'toggleWaitingStatus',
    buttonText: 'Normal',
    buttonTextInverse: 'En Espera',
    priority: 3,
    showInSelector: true,
    showInDetail: true
  },
  {
    id: 'urgent',
    name: 'Urgente',
    icon: 'Flame',
    color: 'red',
    description: 'Tareas que requieren atención inmediata',
    filterFunction: (tasks) => tasks.filter(t => t.priority === 'urgent' && !t.completed),
    toggleFunction: 'toggleUrgent',
    buttonText: 'Quitar Urgente',
    buttonTextInverse: 'Marcar Urgente',
    priority: 4,
    showInSelector: true,
    showInDetail: true
  },
  {
    id: 'delete',
    name: 'Eliminar',
    icon: 'Trash2',
    color: 'red',
    description: 'Eliminar tarea permanentemente',
    filterFunction: null,
    toggleFunction: 'deleteTask',
    buttonText: 'Eliminar',
    buttonTextInverse: null,
    priority: 999,
    showInSelector: true,
    showInDetail: false
  }
]

// Función helper para obtener el color CSS de una sección
export const getSectionColorClasses = (color, isActive = false) => {
  const colorMap = {
    yellow: isActive 
      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200'
      : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm',
    gray: isActive
      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200',
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200',
    red: 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
  }
  
  return colorMap[color] || colorMap.blue
}