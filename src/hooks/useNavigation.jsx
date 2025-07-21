'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

const NavigationContext = createContext()

export const NavigationProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('main')
  const [navigationCallbacks, setNavigationCallbacks] = useState({})

  const registerNavigationCallback = useCallback((key, callback) => {
    setNavigationCallbacks(prev => ({
      ...prev,
      [key]: callback
    }))
  }, [])

  const unregisterNavigationCallback = useCallback((key) => {
    setNavigationCallbacks(prev => {
      const { [key]: _, ...rest } = prev
      return rest
    })
  }, [])

  const navigateToDaily = useCallback(() => {
    // Check if there's a specific Daily navigation handler registered
    if (navigationCallbacks.daily) {
      navigationCallbacks.daily()
    } else {
      // Fallback: just update the view state
      setCurrentView('main')
    }
  }, [navigationCallbacks])

  const value = {
    currentView,
    setCurrentView,
    navigateToDaily,
    registerNavigationCallback,
    unregisterNavigationCallback
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}