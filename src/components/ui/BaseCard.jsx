import React from 'react'

const BaseCard = ({ 
  children, 
  variant = 'default', 
  onClick, 
  className = '',
  ...props 
}) => {
  const baseClasses = 'border border-gray-200 rounded-xl shadow-sm'
  
  const variants = {
    default: `bg-white ${baseClasses}`,
    transparent: `bg-transparent border-0 shadow-none ${baseClasses}`, 
    interactive: `bg-white ${baseClasses} hover:shadow-md hover:border-purple-200 transition-all cursor-pointer`,
    ritual: `bg-white ${baseClasses} hover:border-purple-200 transition-all`,
    // Nuevo variant para tasks
    task: `bg-transparent border-0 shadow-none rounded-xl hover:bg-gray-50/30 transition-all`
  }

  const finalClassName = `${variants[variant]} ${className}`

  if (onClick) {
    return (
      <div 
        className={finalClassName}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div className={finalClassName} {...props}>
      {children}
    </div>
  )
}

export default BaseCard