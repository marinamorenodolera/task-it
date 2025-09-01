import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SubtaskCard from './SubtaskCard'

const SortableSubtask = (props) => {
  // ✅ ID SIMPLE PARA SUBTAREAS (igual que SortableTaskCard)
  const sortableId = `subtask-${props.subtask.id}`
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    // ✅ MOBILE TOUCH OPTIMIZATION EXACTA
    touchAction: 'none',
    userSelect: 'none',
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`
        sortable-item drag-handle
        ${isDragging ? 'shadow-lg' : ''}
      `}
    >
      <SubtaskCard
        {...props}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  )
}

export default SortableSubtask