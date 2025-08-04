import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'

const SortableTaskCard = (props) => {
  const sortableId = `${props.sectionId}-${props.task.id}`
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
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`
        sortable-item drag-handle
        ${isDragging ? 'shadow-2xl' : ''}
      `}
    >
      <TaskCard
        {...props}
        sectionId={props.sectionId}
        onMoveBetweenSections={props.onMoveBetweenSections}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  )
}

export default SortableTaskCard