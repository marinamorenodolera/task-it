import { useRef, useCallback } from 'react'

export const useGestures = () => {
  const touchStart = useRef(null)
  const touchEnd = useRef(null)
  const longPressTimer = useRef(null)
  const isLongPress = useRef(false)

  const handleTouchStart = useCallback((e, onLongPress) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    }
    touchEnd.current = null
    isLongPress.current = false

    // Set long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true
        onLongPress()
      }, 250) // 250ms for long press (Best Practice: 200-300ms)
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!touchStart.current) return

    const currentTouch = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }

    // If moved too much, cancel long press
    const deltaX = Math.abs(currentTouch.x - touchStart.current.x)
    const deltaY = Math.abs(currentTouch.y - touchStart.current.y)
    
    if (deltaY > 15 || (deltaX > 10 && deltaY > 5)) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    touchEnd.current = currentTouch
  }, [])

  const handleTouchEnd = useCallback((e, onSwipeRight, onSwipeLeft, onTap) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (!touchStart.current || !touchEnd.current) {
      // Simple tap
      if (!isLongPress.current && onTap) {
        onTap()
      }
      return
    }

    const deltaX = touchEnd.current.x - touchStart.current.x
    const deltaY = touchEnd.current.y - touchStart.current.y
    const deltaTime = Date.now() - touchStart.current.time

    // Don't trigger swipe if it was a long press
    if (isLongPress.current) return

    // Check for horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && deltaTime < 300) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      // Tap
      if (onTap) {
        onTap()
      }
    }

    touchStart.current = null
    touchEnd.current = null
  }, [])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}