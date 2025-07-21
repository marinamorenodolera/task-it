'use client'

import { useEffect } from 'react'
import TaskItApp from '@/components/TaskItApp'

export default function DailyPage() {
  console.log('🏠 Daily page - INICIO DE CARGA')
  console.log('📊 Estado actual - Timestamp:', new Date().toISOString())
  
  useEffect(() => {
    console.log('🔄 Daily page - useEffect ejecutado')
    console.log('=== DEBUG DAILY PAGE ===')
    console.log('URL actual:', window.location.href)
    console.log('Referrer:', document.referrer)
    console.log('User agent:', navigator.userAgent.substring(0, 50) + '...')
    console.log('Timestamp:', new Date().toISOString())
    console.log('========================')

    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      console.log(`⏱️ Daily page estuvo montada por ${endTime - startTime}ms`)
    }
  }, [])

  console.log('🎨 Daily page - RENDERIZANDO sin AuthProvider (ahora está en root)')
  
  return <TaskItApp />
}