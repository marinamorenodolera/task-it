import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ikkfxffdqulxvcowtesp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY // Necesitarías la service key para acceso completo

// Por ahora usamos anon key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra2Z4ZmZkcXVseHZjb3d0ZXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzExNzMsImV4cCI6MjA2ODM0NzE3M30.up7fhEpRJ1v3aIJXPBWJ3gfLWgGubuSRfi7TiKneUd4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeDatabase() {
  console.log('🔍 ANÁLISIS COMPLETO DE LA BASE DE DATOS TASK-IT\n')
  console.log('='*60)
  
  // 1. Intentar crear datos de prueba para ver la estructura
  console.log('\n📊 1. CREANDO DATOS DE PRUEBA PARA ANALIZAR ESTRUCTURA:')
  console.log('-'*50)
  
  // Primero intentemos autenticarnos
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword123'
  })
  
  if (authError) {
    console.log('No hay usuario de prueba. Creando uno nuevo...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (signUpError) {
      console.log('Error creando usuario:', signUpError.message)
    } else {
      console.log('Usuario creado:', signUpData.user?.email)
    }
  } else {
    console.log('Usuario autenticado:', authData.user?.email)
  }
  
  // 2. Analizar tabla TASKS con inserción de prueba
  console.log('\n\n📋 2. ESTRUCTURA DE TABLA TASKS:')
  console.log('-'*50)
  
  // Intentar insertar una tarea de prueba
  const testTask = {
    title: 'Tarea de prueba para análisis',
    description: 'Esta es una descripción de prueba',
    completed: false,
    is_big_3_today: true,
    deadline: new Date().toISOString(),
    amount: 100,
    link: 'https://example.com',
    status: 'pending',
    section: 'inbox',
    daily_priority: 'urgent',
    priority_order: 1,
    is_calendar_event: false,
    is_recurring: false,
    show_energy: true,
    show_duration: true,
    show_project: true,
    show_deadline: true,
    show_notes_preview: true
  }
  
  const { data: insertedTask, error: insertError } = await supabase
    .from('tasks')
    .insert([testTask])
    .select()
    .single()
  
  if (insertError) {
    console.log('❌ Error al insertar tarea de prueba:')
    console.log('  Mensaje:', insertError.message)
    console.log('  Código:', insertError.code)
    console.log('  Detalles:', insertError.details)
    console.log('  Hint:', insertError.hint)
    
    // Intentar con campos mínimos
    console.log('\nIntentando con campos mínimos...')
    const minimalTask = {
      title: 'Test mínimo'
    }
    
    const { data: minimalInsert, error: minimalError } = await supabase
      .from('tasks')
      .insert([minimalTask])
      .select()
      .single()
    
    if (minimalError) {
      console.log('❌ Error con tarea mínima:', minimalError.message)
    } else if (minimalInsert) {
      console.log('✅ Tarea mínima insertada!')
      console.log('Campos retornados:', Object.keys(minimalInsert))
      console.log('Datos completos:', minimalInsert)
      
      // Limpiar
      await supabase.from('tasks').delete().eq('id', minimalInsert.id)
    }
  } else if (insertedTask) {
    console.log('✅ Tarea de prueba insertada exitosamente!')
    console.log('\nCAMPOS DISPONIBLES EN TASKS:')
    Object.entries(insertedTask).forEach(([key, value]) => {
      console.log(`  - ${key}: ${typeof value} = ${value}`)
    })
    
    // Limpiar tarea de prueba
    await supabase.from('tasks').delete().eq('id', insertedTask.id)
  }
  
  // 3. Verificar otras tablas
  console.log('\n\n📊 3. VERIFICACIÓN DE OTRAS TABLAS:')
  console.log('-'*50)
  
  const tablesToCheck = [
    'tasks',
    'activities', 
    'projects',
    'users',
    'profiles',
    'auth.users'
  ]
  
  for (const table of tablesToCheck) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (!error) {
      console.log(`✅ ${table}: existe (${count || 0} registros)`)
    } else {
      console.log(`❌ ${table}: ${error.message}`)
    }
  }
  
  // 4. Intentar query SQL directo (solo funciona con service role key)
  console.log('\n\n🔍 4. INFORMACIÓN ADICIONAL:')
  console.log('-'*50)
  console.log('Para un análisis completo del esquema necesitas:')
  console.log('1. Acceder al Dashboard de Supabase')
  console.log('2. Ir a Database -> Tables para ver estructura completa')
  console.log('3. Ir a Authentication -> Policies para ver RLS')
  console.log('4. Ir a Database -> Functions para ver triggers')
  console.log('5. Usar SQL Editor con queries como:')
  console.log('   - SELECT * FROM information_schema.tables;')
  console.log('   - SELECT * FROM information_schema.columns WHERE table_name = \'tasks\';')
  console.log('   - SELECT * FROM pg_policies;')
  
  // 5. Verificar Storage Buckets
  console.log('\n\n📦 5. STORAGE BUCKETS:')
  console.log('-'*50)
  
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (!bucketsError && buckets) {
    console.log('Buckets encontrados:', buckets.map(b => b.name))
  } else {
    console.log('No se pudieron listar los buckets')
  }
  
  // Cleanup
  await supabase.auth.signOut()
}

// Ejecutar
analyzeDatabase().catch(console.error)