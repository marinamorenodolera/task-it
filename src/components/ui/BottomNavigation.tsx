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
      iconPath: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z",
      secondaryPath: "m22 6-10 7L2 6",
      label: 'Inbox', 
      href: '/inbox',
      description: 'Capturar ideas'
    },
    { 
      id: 'daily', 
      iconPath: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
      label: 'Daily', 
      href: '/daily',
      description: 'Tareas diarias'
    },
    { 
      id: 'weekly', 
      iconPath: "M3 3v16a2 2 0 0 0 2 2h16M7 11l4-4 4 4 4-4",
      label: 'Semanal', 
      href: '/semanal',
      description: 'Revisión semanal'
    },
    { 
      id: 'settings', 
      iconPath: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      label: 'Settings', 
      href: '/settings',
      description: 'Configuración'
    },
  ]

  const getCurrentTab = () => {
    if (pathname.startsWith('/inbox')) return 'inbox'
    if (pathname.startsWith('/daily')) return 'daily'
    if (pathname.startsWith('/semanal')) return 'weekly'
    if (pathname.startsWith('/settings')) return 'settings'
    if (pathname === '/') return 'daily'
    return 'daily'
  }

  const currentTab = getCurrentTab()

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg ${className}`}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="max-w-md mx-auto px-6 py-3">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id
            
            // Daily tab - usar Link normal como Inbox
            if (tab.id === 'daily') {
              return (
                <Link
                  key={tab.id}
                  href="/daily"
                  className={`relative flex flex-col items-center justify-center min-h-[60px] rounded-2xl transition-all duration-200 touch-manipulation group ${
                    isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
                  }`}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth={isActive ? "2.5" : "2"}
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={`mb-1 transition-all duration-200 ${isActive ? 'scale-[1.02]' : 'group-hover:scale-[1.01]'}`}
                  >
                    <path d={tab.iconPath} />
                  </svg>
                  <span className={`text-xs font-medium transition-all duration-200 ${isActive ? 'font-semibold' : ''}`}>
                    {tab.label}
                  </span>
                </Link>
              )
            }

            // Block only settings
            if (tab.id === 'settings') {
              return (
                <button
                  key={tab.id}
                  onClick={() => alert(`${tab.label} estará disponible próximamente 🚧`)}
                  className="relative flex flex-col items-center justify-center min-h-[60px] rounded-2xl opacity-50 cursor-not-allowed touch-manipulation"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mb-1"
                  >
                    <path d={tab.iconPath} />
                  </svg>
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              )
            }
            
            // Normal Link for Inbox
            return (
              <Link
                key={tab.id}
                href={tab.href as any}
                className={`relative flex flex-col items-center justify-center min-h-[60px] rounded-2xl transition-all duration-200 touch-manipulation group ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
                }`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={isActive ? "2.5" : "2"}
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className={`mb-1 transition-all duration-200 ${isActive ? 'scale-[1.02]' : 'group-hover:scale-[1.01]'}`}
                >
                  <path d={tab.iconPath} />
                  {tab.id === 'inbox' && tab.secondaryPath && (
                    <path d={tab.secondaryPath} />
                  )}
                </svg>
                <span className={`text-xs font-medium transition-all duration-200 ${isActive ? 'font-semibold' : ''}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default BottomNavigation