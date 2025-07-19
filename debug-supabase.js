// 🔧 SCRIPT DE DEBUGGING PARA SUPABASE
// Ejecutar con: node debug-supabase.js

require('dotenv').config({ path: '.env.local' })

console.log('🔍 Environment Variables Debug:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY prefix:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...')

// Test básico de conexión
const { createClient } = require('@supabase/supabase-js')

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  console.log('✅ Supabase client created successfully')
  
  // Test de conexión
  supabase.from('user_profiles').select('count').limit(1)
    .then(result => {
      console.log('🏥 Database connection test result:', result)
    })
    .catch(error => {
      console.error('💀 Database connection error:', error)
    })
} else {
  console.error('❌ Missing environment variables')
}