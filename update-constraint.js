// Script para actualizar constraint de base de datos
const { createClient } = require('@supabase/supabase-js')

async function updateConstraint() {
  console.log('🔧 Iniciando actualización de constraint...')
  
  // Crear cliente de Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno no encontradas')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('🗄️ Eliminando constraint existente...')
    
    // Eliminar constraint existente
    const { error: dropError } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_section;
        ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_section_check;
      `
    })
    
    if (dropError && !dropError.message.includes('does not exist')) {
      throw dropError
    }
    
    console.log('✅ Constraint anterior eliminada')
    
    console.log('🔧 Creando nueva constraint...')
    
    // Crear nueva constraint con todos los valores permitidos
    const { error: createError } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE tasks ADD CONSTRAINT check_section 
        CHECK (section IN (
          'big_three',
          'urgent', 
          'en_espera',
          'otras_tareas',
          'completadas',
          'inbox',
          'daily',
          'weekly', 
          'monthly',
          'shopping',
          'devoluciones',
          'someday',
          'waiting',
          'reference',
          'today',
          'next_actions',
          'projects'
        ));
      `
    })
    
    if (createError) {
      throw createError
    }
    
    console.log('✅ Nueva constraint creada exitosamente')
    
    // Verificar que funciona probando actualizar una tarea a devoluciones
    console.log('🧪 Probando constraint con devoluciones...')
    
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1)
    
    if (testData && testData.length > 0) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ section: 'devoluciones' })
        .eq('id', testData[0].id)
      
      if (updateError) {
        console.log('❌ Error al probar devoluciones:', updateError.message)
      } else {
        console.log('✅ Prueba exitosa: devoluciones funciona')
        
        // Revertir cambio de prueba
        await supabase
          .from('tasks')
          .update({ section: 'inbox' })
          .eq('id', testData[0].id)
      }
    }
    
    console.log('🎉 Actualización completada exitosamente')
    
  } catch (error) {
    console.error('❌ Error al actualizar constraint:', error.message)
  }
}

updateConstraint()