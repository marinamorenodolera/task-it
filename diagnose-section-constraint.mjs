import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ikkfxffdqulxvcowtesp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra2Z4ZmZkcXVseHZjb3d0ZXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzExNzMsImV4cCI6MjA2ODM0NzE3M30.up7fhEpRJ1v3aIJXPBWJ3gfLWgGubuSRfi7TiKneUd4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseSectionConstraint() {
  console.log('🔍 DIAGNOSING SECTION CONSTRAINT ISSUE\n')
  
  // 1. Authenticate first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword123'
  })
  
  if (authError) {
    console.log('❌ Authentication failed:', authError.message)
    return
  }
  
  console.log('✅ Authenticated as:', authData.user?.email)
  
  // 2. Test each section value individually
  const sectionsToTest = [
    'inbox',
    'daily', 
    'weekly',
    'monthly',
    'shopping',
    'devoluciones',
    'someday',
    'waiting',
    'reference'
  ]
  
  console.log('\n📋 TESTING SECTION VALUES:')
  console.log('-'.repeat(50))
  
  for (const section of sectionsToTest) {
    const testTask = {
      title: `Test task for section: ${section}`,
      section: section,
      user_id: authData.user.id
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([testTask])
      .select()
    
    if (error) {
      console.log(`❌ ${section}: FAILED - ${error.message}`)
      if (error.code) console.log(`   Code: ${error.code}`)
      if (error.details) console.log(`   Details: ${error.details}`)
      if (error.hint) console.log(`   Hint: ${error.hint}`)
    } else {
      console.log(`✅ ${section}: SUCCESS`)
      // Clean up successful inserts
      if (data && data[0]) {
        await supabase.from('tasks').delete().eq('id', data[0].id)
      }
    }
  }
  
  // 3. Try to get the actual constraint definition
  console.log('\n🔍 ATTEMPTING TO QUERY CONSTRAINT INFORMATION:')
  console.log('-'.repeat(50))
  
  try {
    // This might fail due to permissions, but worth trying
    const { data: constraints, error: constraintError } = await supabase
      .rpc('get_table_constraints', { table_name: 'tasks' })
    
    if (constraintError) {
      console.log('❌ Cannot query constraints directly:', constraintError.message)
    } else {
      console.log('✅ Constraints found:', constraints)
    }
  } catch (err) {
    console.log('❌ RPC call failed:', err.message)
  }
  
  // 4. Check existing tasks to see what section values are actually in use
  console.log('\n📊 CHECKING EXISTING TASK SECTIONS:')
  console.log('-'.repeat(50))
  
  const { data: existingTasks, error: queryError } = await supabase
    .from('tasks')
    .select('section')
    .limit(100)
  
  if (queryError) {
    console.log('❌ Cannot query existing tasks:', queryError.message)
  } else {
    const sectionCounts = {}
    existingTasks.forEach(task => {
      const section = task.section || 'null'
      sectionCounts[section] = (sectionCounts[section] || 0) + 1
    })
    
    console.log('Existing sections in database:')
    Object.entries(sectionCounts).forEach(([section, count]) => {
      console.log(`  - ${section}: ${count} tasks`)
    })
  }
  
  await supabase.auth.signOut()
  console.log('\n🏁 DIAGNOSIS COMPLETE')
}

diagnoseSectionConstraint().catch(console.error)