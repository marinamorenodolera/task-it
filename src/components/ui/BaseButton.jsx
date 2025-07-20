import React from 'react'

const BaseButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = 'min-h-[44px] touch-manipulation transition-colors flex items-center justify-center font-medium rounded-xl focus:outline-none focus:ring-2'
  
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500'
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm min-w-[36px]',
    md: 'px-4 py-3 text-base min-w-[44px]',
    lg: 'px-6 py-4 text-lg min-w-[44px]'
  }

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : ''

  const finalClassName = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`

  return (
    <button 
      className={finalClassName}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default BaseButton