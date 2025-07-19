'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavigationProps {
  className?: string
}

const BottomNavigation = ({ className = '' }: BottomNavigationProps) => {
  const pathname = usePathname()

  const tabs = [
    { 
      id: 'inbox', 
      icon: '📥', 
      label: 'Inbox', 
      href: '/inbox',
      description: 'Capturar ideas'
    },
    { 
      id: 'daily', 
      icon: '📅', 
      label: 'Daily', 
      href: '/daily',
      description: 'Tareas diarias'
    },
    { 
      id: 'weekly', 
      icon: '📊', 
      label: 'Semanal', 
      href: '/weekly',
      description: 'Revisión semanal'
    },
    { 
      id: 'settings', 
      icon: '⚙️', 
      label: 'Settings', 
      href: '/settings',
      description: 'Configuración'
    },
  ]

  const getCurrentTab = () => {
    if (pathname.startsWith('/inbox')) return 'inbox'
    if (pathname.startsWith('/daily')) return 'daily'
    if (pathname.startsWith('/weekly')) return 'weekly'
    if (pathname.startsWith('/settings')) return 'settings'
    if (pathname === '/') return 'daily' // Root redirects to daily
    return 'daily' // default
  }

  const currentTab = getCurrentTab()

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 h-20 md:hidden bottom-nav ${className}`}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-4 h-full max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          
          return (
            <Link
              key={tab.id}
              href={tab.href as any}
              className={`
                flex flex-col items-center justify-center 
                touch-target h-full mobile-optimized
                transition-all duration-200 ease-in-out relative
                ${isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-blue-500 active:scale-95'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                touch-manipulation
              `}
              aria-label={`${tab.label} - ${tab.description}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full" />
              )}
              
              <span 
                className={`text-xl mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                role="img"
                aria-hidden="true"
              >
                {tab.icon}
              </span>
              <span className={`text-xs font-medium transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation