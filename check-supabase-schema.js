import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ikkfxffdqulxvcowtesp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra2Z4ZmZkcXVseHZjb3d0ZXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzExNzMsImV4cCI6MjA2ODM0NzE3M30.up7fhEpRJ1v3aIJXPBWJ3gfLWgGubuSRfi7TiKneUd4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getCompleteSchema() {
  console.log('🔍 ANÁLISIS COMPLETO DEL ESQUEMA DE SUPABASE\n')
  console.log('='*50)
  
  try {
    // 1. OBTENER TODAS LAS TABLAS
    console.log('\n📊 1. TODAS LAS TABLAS:')
    console.log('-'*30)
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
    
    if (tablesError) {
      // Intentar método alternativo
      console.log('Intentando método alternativo...')
      
      // Obtener lista de tablas conocidas
      const knownTables = ['tasks', 'rituals', 'activities', 'predefined_activities', 'projects', 'attachments']
      
      for (const tableName of knownTables) {
        console.log(`\n📋 Tabla: ${tableName}`)
        
        // Intentar query simple para ver estructura
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error && data && data.length > 0) {
          console.log('Campos encontrados:', Object.keys(data[0]))
          console.log('Ejemplo de datos:', data[0])
        } else if (error) {
          console.log(`❌ Error con tabla ${tableName}:`, error.message)
        } else {
          console.log(`⚠️ Tabla ${tableName} existe pero está vacía`)
        }
      }
    }
    
    // 2. ANALIZAR ESTRUCTURA DE TABLA TASKS
    console.log('\n\n📋 2. ESTRUCTURA DETALLADA DE TABLA TASKS:')
    console.log('-'*30)
    
    const { data: tasksSample, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5)
    
    if (!tasksError && tasksSample && tasksSample.length > 0) {
      const sampleTask = tasksSample[0]
      console.log('\nCAMPOS DE LA TABLA TASKS:')
      for (const [key, value] of Object.entries(sampleTask)) {
        console.log(`  - ${key}: ${typeof value} ${value === null ? '(nullable)' : ''}`)
      }
      
      console.log('\n5 TAREAS DE EJEMPLO:')
      tasksSample.forEach((task, index) => {
        console.log(`\nTarea ${index + 1}:`)
        console.log(`  - ID: ${task.id}`)
        console.log(`  - Title: ${task.title}`)
        console.log(`  - Status: ${task.status || task.completed ? 'completed' : 'pending'}`)
        console.log(`  - Section: ${task.section || 'N/A'}`)
        console.log(`  - Priority: ${task.daily_priority || task.is_big_3_today ? 'big3' : 'normal'}`)
      })
    }
    
    // 3. CONTAR REGISTROS POR TABLA
    console.log('\n\n📊 3. CONTEO DE REGISTROS:')
    console.log('-'*30)
    
    const tableCounts = {
      tasks: await supabase.from('tasks').select('id', { count: 'exact', head: true }),
      rituals: await supabase.from('rituals').select('id', { count: 'exact', head: true }),
      activities: await supabase.from('activities').select('id', { count: 'exact', head: true }),
      attachments: await supabase.from('attachments').select('id', { count: 'exact', head: true })
    }
    
    for (const [table, result] of Object.entries(tableCounts)) {
      if (!result.error) {
        console.log(`${table}: ${result.count || 0} registros`)
      }
    }
    
    // 4. VERIFICAR USUARIOS
    console.log('\n\n👥 4. USUARIOS DE PRUEBA:')
    console.log('-'*30)
    
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      console.log('Usuario actual:', userData.user.email)
      console.log('User ID:', userData.user.id)
    }
    
    // 5. VERIFICAR POLÍTICAS RLS
    console.log('\n\n🔒 5. POLÍTICAS RLS:')
    console.log('-'*30)
    console.log('Las políticas RLS no son accesibles via cliente.')
    console.log('Verificar en Supabase Dashboard -> Authentication -> Policies')
    
    // 6. ATTACHMENTS Y STORAGE
    console.log('\n\n📎 6. ATTACHMENTS Y STORAGE:')
    console.log('-'*30)
    
    const { data: attachments } = await supabase
      .from('attachments')
      .select('*')
      .limit(5)
    
    if (attachments && attachments.length > 0) {
      console.log('Estructura de attachments:', Object.keys(attachments[0]))
      console.log('Ejemplos:', attachments)
    }
    
  } catch (error) {
    console.error('Error general:', error)
  }
}

// Ejecutar análisis
getCompleteSchema()