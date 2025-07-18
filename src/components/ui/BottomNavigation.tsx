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
    return 'daily' // default
  }

  const currentTab = getCurrentTab()

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 h-16 md:hidden ${className}`}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-4 h-full">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          
          return (
            <Link
              key={tab.id}
              href={tab.href as any}
              className={`
                flex flex-col items-center justify-center min-h-[44px] transition-colors duration-200
                ${isActive 
                  ? 'text-blue-500' 
                  : 'text-gray-500 hover:text-blue-500'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
              `}
              aria-label={`${tab.label} - ${tab.description}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span 
                className="text-xl mb-1"
                role="img"
                aria-hidden="true"
              >
                {tab.icon}
              </span>
              <span className="text-xs font-medium">
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