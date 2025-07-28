import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ikkfxffdqulxvcowtesp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra2Z4ZmZkcXVseHZjb3d0ZXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzExNzMsImV4cCI6MjA2ODM0NzE3M30.up7fhEpRJ1v3aIJXPBWJ3gfLWgGubuSRfi7TiKneUd4'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔥 REPORTE COMPLETO DE SUPABASE - TASK-IT V2')
console.log('='*70 + '\n')

// 1. AUTENTICACIÓN PRIMERO
console.log('👤 AUTENTICACIÓN:')
const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
  email: 'marinamorenolp@gmail.com',
  password: 'Marina98-'
})

if (user) {
  console.log('✅ Autenticado como:', user.email)
  console.log('   User ID:', user.id)
  console.log('   Creado:', new Date(user.created_at).toLocaleString())
} else {
  console.log('❌ No autenticado:', authError?.message)
}

// 2. TABLAS EXISTENTES
console.log('\n\n📊 TABLAS EN LA BASE DE DATOS:')
console.log('-'*50)

const tables = ['tasks', 'activities', 'projects', 'rituals', 'attachments', 'users', 'profiles']

for (const table of tables) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  
  if (!error) {
    console.log(`\n✅ Tabla: ${table.toUpperCase()} (${count} registros)`)
    
    // Obtener muestra de datos
    const { data, error: dataError } = await supabase.from(table).select('*').limit(3)
    
    if (!dataError && data && data.length > 0) {
      console.log('   Campos:', Object.keys(data[0]).join(', '))
      console.log('   Ejemplos:')
      data.forEach((item, i) => {
        console.log(`   ${i+1}.`, JSON.stringify(item).substring(0, 100) + '...')
      })
    }
  } else {
    console.log(`\n❌ Tabla ${table}: NO EXISTE`)
  }
}

// 3. ESTRUCTURA DETALLADA DE TASKS
console.log('\n\n📋 ANÁLISIS DETALLADO DE TABLA TASKS:')
console.log('-'*50)

const { data: allTasks, error: tasksError } = await supabase
  .from('tasks')
  .select('*')
  .order('created_at', { ascending: false })

if (!tasksError && allTasks) {
  console.log(`Total de tareas: ${allTasks.length}`)
  
  if (allTasks.length > 0) {
    const sample = allTasks[0]
    console.log('\nCAMPOS DISPONIBLES:')
    Object.entries(sample).forEach(([key, value]) => {
      const type = value === null ? 'null' : typeof value
      console.log(`  - ${key}: ${type}`)
    })
    
    // Estadísticas
    const stats = {
      completed: allTasks.filter(t => t.completed).length,
      pending: allTasks.filter(t => !t.completed).length,
      big3: allTasks.filter(t => t.is_big_3_today).length,
      withDeadline: allTasks.filter(t => t.deadline).length
    }
    
    console.log('\nESTADÍSTICAS:')
    console.log(`  - Completadas: ${stats.completed}`)
    console.log(`  - Pendientes: ${stats.pending}`)
    console.log(`  - Big 3: ${stats.big3}`)
    console.log(`  - Con deadline: ${stats.withDeadline}`)
    
    console.log('\nÚLTIMAS 5 TAREAS:')
    allTasks.slice(0, 5).forEach((task, i) => {
      console.log(`\n  ${i+1}. ${task.title}`)
      console.log(`     ID: ${task.id}`)
      console.log(`     Estado: ${task.completed ? '✅ Completada' : '⏳ Pendiente'}`)
      console.log(`     Big 3: ${task.is_big_3_today ? 'Sí' : 'No'}`)
      console.log(`     Creada: ${new Date(task.created_at).toLocaleString()}`)
    })
  }
}

// 4. ACTIVITIES
console.log('\n\n💪 ANÁLISIS DE ACTIVITIES:')
console.log('-'*50)

const { data: activities } = await supabase
  .from('activities')
  .select('*')
  .order('date', { ascending: false })
  .limit(10)

if (activities && activities.length > 0) {
  console.log('Campos:', Object.keys(activities[0]).join(', '))
  console.log('\nÚltimas actividades:')
  activities.forEach(act => {
    console.log(`  - ${act.type}: ${act.date} ${act.time} (${act.duration}min)`)
  })
}

// 5. PROJECTS
console.log('\n\n📁 PROYECTOS:')
console.log('-'*50)

const { data: projects } = await supabase
  .from('projects')
  .select('*')

if (projects && projects.length > 0) {
  console.log('Total proyectos:', projects.length)
  projects.forEach(proj => {
    console.log(`  - ${proj.name} (${proj.color}) ${proj.is_archived ? '📦 Archivado' : '✅ Activo'}`)
  })
}

// 6. STORAGE BUCKETS
console.log('\n\n📦 STORAGE BUCKETS:')
console.log('-'*50)

const { data: buckets } = await supabase.storage.listBuckets()
if (buckets) {
  console.log('Buckets:', buckets.map(b => b.name).join(', ') || 'Ninguno')
}

// 7. FUNCIONES Y POLÍTICAS (info)
console.log('\n\n🔒 INFORMACIÓN ADICIONAL:')
console.log('-'*50)
console.log('⚠️  Las siguientes features requieren acceso al Dashboard de Supabase:')
console.log('   - Políticas RLS (Row Level Security)')
console.log('   - Triggers y Functions')
console.log('   - Foreign Keys y constraints')
console.log('   - Índices')
console.log('\n📌 URL del proyecto: https://supabase.com/dashboard/project/ikkfxffdqulxvcowtesp')

await supabase.auth.signOut()
console.log('\n✅ Análisis completado')