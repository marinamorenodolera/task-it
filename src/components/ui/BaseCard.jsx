import React from 'react'

const BaseCard = ({ 
  children, 
  variant = 'default', 
  onClick, 
  className = '',
  ...props 
}) => {
  const baseClasses = 'bg-white border border-gray-200 rounded-xl shadow-sm'
  
  const variants = {
    default: baseClasses,
    interactive: `${baseClasses} hover:shadow-md hover:border-purple-200 transition-all cursor-pointer`,
    ritual: `${baseClasses} hover:border-purple-200 transition-all`
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