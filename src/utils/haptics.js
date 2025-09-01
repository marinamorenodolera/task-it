// src/utils/haptics.js
export const triggerHapticFeedback = (type = 'medium') => {
  // Mobile vibration API
  if ('vibrate' in navigator) {
    switch(type) {
      case 'light':
        navigator.vibrate(10)
        break
      case 'medium':
        navigator.vibrate(50)
        break
      case 'heavy':
        navigator.vibrate([50, 25, 50])
        break
      case 'success':
        navigator.vibrate([25, 50, 25])
        break
      default:
        navigator.vibrate(50)
    }
  }
  
  // Console log for desktop testing
  console.log(`Haptic feedback: ${type}`)
}